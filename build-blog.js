#!/usr/bin/env node
/* ==========================================================================
   FLAVOURA BLOG BUILDER
   --------------------------------------------------------------------------
   Runs automatically on every Vercel deploy (see vercel.json). You never
   need to run it yourself, and you never edit posts.json or sitemap.xml again.

   It reads every post in /blog (any .html file whose name does not start
   with "_") and then:
     1. rewrites blog/posts.json
     2. rewrites sitemap.xml  (home, blog, and every published post)
     3. fills the article cards into blog.html so Google can see them
     4. adds the Vercel analytics line to blog pages that do not have it
     5. prints a check-up list of anything that looks wrong in your posts

   DRAFT RULE: a post that still has  <meta name="robots" content="noindex...">
   is a draft. It is skipped everywhere above. To publish, change that line to
   <meta name="robots" content="index, follow, max-image-preview:large">

   Nothing here can break your live site: if a post is odd, it is skipped and
   reported. Your posts are never rewritten except for the analytics line.

   Optional (only if you have Node installed):
     node build-blog.js            run it locally
     node build-blog.js --check    just print the check-up, change nothing
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- settings ---------- */
const SITE = 'https://myflavoura.in';           // no trailing slash
const GA_ID = 'G-BYQPF2LLGG';                    // warn if a post forgot it
const EXTRA_URLS = [];                           // other pages for the sitemap, e.g. '/about'
const ROOT = __dirname;
const BLOG_DIR = path.join(ROOT, 'blog');
const BLOG_PAGE = path.join(ROOT, 'blog.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const POSTS_JSON = path.join(BLOG_DIR, 'posts.json');
const CHECK_ONLY = process.argv.includes('--check');

/* phrases that should no longer appear (your site now says 15 minutes) */
const STALE_PHRASES = [
  { re: /(?<![\d\u2013-])\b(10|30)[ -]?min/i, msg: 'mentions "10" or "30" minutes (your site says 15)' }
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const VERCEL_SNIPPET =
  '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script>' +
  '<script defer src="/_vercel/insights/script.js"></script>';

/* ---------- helpers ---------- */
const read = f => fs.readFileSync(f, 'utf8');
function write(f, content) {
  if (fs.existsSync(f) && read(f) === content) return false;
  if (!CHECK_ONLY) fs.writeFileSync(f, content);
  return true;
}
const decode = s => String(s)
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0*39;|&#x27;|&apos;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const text = html => decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const warnings = [];
const tips = [];
const notes = [];
const warn = (slug, msg) => warnings.push(`${slug}: ${msg}`);
const tip = (slug, msg) => tips.push(`${slug}: ${msg}`);

function attr(tag, name) {
  const m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*"([^"]*)"', 'i'));
  return m ? decode(m[1]) : '';
}
function metaContent(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const t of tags) {
    if (attr(t, 'name').toLowerCase() === key || attr(t, 'property').toLowerCase() === key) return attr(t, 'content');
  }
  return '';
}

/* ---------- read one post ---------- */
function parsePost(file) {
  const slug = path.basename(file, '.html');
  const html = read(file);
  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]).trim();
  const h1 = text((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ''])[1]);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const desc = metaContent(html, 'description');
  const robots = metaContent(html, 'robots').toLowerCase();
  const canonicalTag = (html.match(/<link\b[^>]*rel="canonical"[^>]*>/i) || [''])[0];
  const canonical = attr(canonicalTag, 'href');
  const ogUrl = metaContent(html, 'og:url');
  const article = (html.match(/<article\b[\s\S]*?<\/article>/i) || [''])[0];
  const tagHtml = (article.match(/<span class="tag">([\s\S]*?)<\/span>/i) || [, ''])[1];
  const tag = text(tagHtml) || 'Blog';
  const pub = metaContent(html, 'article:published_time') ||
              (html.match(/<time[^>]*datetime="([^"]+)"/i) || [, ''])[1];
  const mod = (html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})/) || [, ''])[1];
  const bylineMatch = (article.match(/<div class="byline">([\s\S]*?)<\/div>/i) || [, ''])[1].match(/(\d+)\s*min read/i);
  const words = text(article).split(' ').filter(Boolean).length;
  return { slug, file, html, title, h1, h1Count, desc, robots, canonical, ogUrl, tag, pub, mod,
           bylineRead: bylineMatch ? +bylineMatch[1] : null, words, isDraft: /noindex/.test(robots) };
}

/* ---------- checks ---------- */
function checkPost(p) {
  const url = `${SITE}/blog/${p.slug}`;
  const blockers = [];   /* problems serious enough to keep the post off the blog until fixed */
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) blockers.push('file name must be lowercase words joined by hyphens (no spaces, capitals or underscores)');
  if (!p.title) warn(p.slug, 'missing <title>');
  else if (p.title.length > 60) tip(p.slug, `title is ${p.title.length} characters (Google shows about 60)`);
  if (!p.desc) warn(p.slug, 'missing meta description');
  else if (p.desc.length > 160) tip(p.slug, `description is ${p.desc.length} characters (aim for under 155)`);
  else if (p.desc.length < 70) tip(p.slug, `description is only ${p.desc.length} characters (aim for 100 to 155)`);
  if (!p.canonical) warn(p.slug, 'missing canonical link');
  else if (p.canonical.replace(/\/$/, '') !== url) warn(p.slug, `canonical is ${p.canonical} but should be ${url}`);
  if (p.ogUrl && p.ogUrl.replace(/\/$/, '') !== url) warn(p.slug, `og:url is ${p.ogUrl} but should be ${url}`);
  if (p.h1Count > 1) warn(p.slug, `has ${p.h1Count} main headings (<h1>); it should have exactly 1`);
  if (/^\d{4}-\d{2}-\d{2}/.test(p.pub) && p.pub.startsWith('2026-01-01')) warn(p.slug, 'published date is still the template placeholder (2026-01-01)');
  if (/YOUR POST|YOUR-POST-SLUG|YOUR DESCRIPTION/.test(p.html)) blockers.push('still contains template placeholder text (YOUR POST / YOUR-POST-SLUG / YOUR DESCRIPTION)');
  if (p.tag === 'Category') warn(p.slug, 'category label is still "Category"');
  if (!p.html.includes(GA_ID)) warn(p.slug, 'Google Analytics tag is missing, visits will not be counted');
  STALE_PHRASES.forEach(s => { if (s.re.test(text(p.html))) warn(p.slug, s.msg); });
  if (p.words < 300) tip(p.slug, `only ${p.words} words; longer posts (400+) tend to rank better`);
  const computed = Math.max(1, Math.round(p.words / 200));
  if (p.bylineRead && Math.abs(p.bylineRead - computed) > 1) tip(p.slug, `says "${p.bylineRead} min read" but the text is about ${computed} min`);
  if (!p.h1) blockers.push('has no main heading (<h1>)');
  if (!/^\d{4}-\d{2}-\d{2}/.test(p.pub)) blockers.push('has no valid published date');
  return blockers;
}

/* ---------- main ---------- */
function main() {
  if (!fs.existsSync(BLOG_DIR)) { console.error('No /blog folder found next to build-blog.js'); process.exit(1); }

  const files = fs.readdirSync(BLOG_DIR)
    .filter(f => f.endsWith('.html') && !f.startsWith('_'))
    .map(f => path.join(BLOG_DIR, f)).sort();

  let previousOrder = {};
  try { JSON.parse(read(POSTS_JSON)).forEach((p, i) => { previousOrder[p.slug] = i; }); } catch (e) { /* first run */ }

  const published = [];
  const drafts = [];
  files.forEach(file => {
    let p;
    try { p = parsePost(file); } catch (e) { warn(path.basename(file), 'could not be read: ' + e.message); return; }
    if (p.isDraft) { drafts.push(p.slug); return; }
    const blockers = checkPost(p);
    if (blockers.length) { blockers.forEach(b => warn(p.slug, b)); warn(p.slug, 'NOT PUBLISHED: kept out of the blog list and sitemap until the problem above is fixed'); return; }
    published.push(p);
  });

  /* newest first; same-day posts keep the order they had, brand-new ones go on top */
  const prev = s => (s in previousOrder ? previousOrder[s] : -1);
  published.sort((a, b) => b.pub.localeCompare(a.pub) || prev(a.slug) - prev(b.slug));

  const list = published.map(p => {
    const [y, m, d] = p.pub.slice(0, 10).split('-').map(Number);
    let excerpt = p.desc || '';
    if (excerpt.length > 170) excerpt = excerpt.slice(0, 167).replace(/\s+\S*$/, '') + '\u2026';
    return {
      slug: p.slug,
      title: p.h1,
      tag: p.tag,
      date: p.pub.slice(0, 10),
      date_h: `${d} ${MONTHS[m - 1]} ${y}`,
      read: `${p.bylineRead || Math.max(1, Math.round(p.words / 200))} min read`,
      excerpt
    };
  });

  /* 1. posts.json */
  const changed = [];
  if (write(POSTS_JSON, JSON.stringify(list, null, 2) + '\n')) changed.push('blog/posts.json');

  /* 2. sitemap.xml */
  const urls = [`${SITE}/`, `${SITE}/blog`].concat(EXTRA_URLS.map(u => SITE + u));
  const lines = urls.map(u => `  <url><loc>${esc(u)}</loc></url>`);
  published.forEach(p => lines.push(`  <url><loc>${esc(SITE + '/blog/' + p.slug)}</loc><lastmod>${(p.mod || p.pub).slice(0, 10)}</lastmod></url>`));
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + lines.join('\n') + '\n</urlset>\n';
  if (write(SITEMAP, sitemap)) changed.push('sitemap.xml');

  /* 3. article cards inside blog.html */
  if (!fs.existsSync(BLOG_PAGE)) {
    warn('blog.html', 'file not found, article list not updated');
  } else {
    const page = read(BLOG_PAGE);
    if (!/<!--POSTS:START-->[\s\S]*?<!--POSTS:END-->/.test(page)) {
      warn('blog.html', 'the <!--POSTS:START--> ... <!--POSTS:END--> markers are missing, article list not updated');
    } else {
      const cards = list.map(p =>
        `<a class="card" href="/blog/${esc(p.slug)}"><span class="tag">${esc(p.tag)}</span><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p><span class="meta">${esc(p.date_h)} · ${esc(p.read)}</span><span class="more">Read article →</span></a>`
      ).join('\n');
      const next = page.replace(/<!--POSTS:START-->[\s\S]*?<!--POSTS:END-->/, () => `<!--POSTS:START-->\n${cards}\n<!--POSTS:END-->`);
      if (write(BLOG_PAGE, next)) changed.push('blog.html');
    }
  }

  /* 4. analytics on every blog page */
  let analyticsAdded = 0;
  [BLOG_PAGE].concat(fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.html')).map(f => path.join(BLOG_DIR, f)))
    .filter(f => fs.existsSync(f)).forEach(f => {
      const html = read(f);
      if (html.includes('_vercel/insights') || !/<\/head>/i.test(html)) return;
      if (write(f, html.replace(/<\/head>/i, () => VERCEL_SNIPPET + '\n</head>'))) analyticsAdded++;
    });

  /* ---------- report ---------- */
  const bar = '------------------------------------------------------------';
  console.log(bar);
  console.log('FLAVOURA BLOG BUILD' + (CHECK_ONLY ? '  (check only, nothing written)' : ''));
  console.log(bar);
  console.log(`Published posts: ${published.length}`);
  published.forEach(p => console.log(`   + ${p.slug}  (${p.pub.slice(0, 10)})`));
  if (drafts.length) { console.log(`Drafts skipped (still marked noindex): ${drafts.length}`); drafts.forEach(s => console.log(`   . ${s}`)); }
  console.log('Updated: ' + (changed.length ? changed.join(', ') : 'nothing needed changing'));
  if (analyticsAdded) console.log(`Vercel analytics line added to ${analyticsAdded} page(s)`);
  if (warnings.length) { console.log(`\nNEEDS FIXING (${warnings.length}):`); warnings.forEach(w => console.log('   ! ' + w)); }
  if (tips.length) { console.log(`\nNICE TO FIX (${tips.length}):`); tips.forEach(t => console.log('   - ' + t)); }
  if (!warnings.length) console.log('\nNo problems found.');
  console.log(bar);
}

try { main(); } catch (e) {
  console.error('BLOG BUILD ERROR: ' + (e && e.stack || e));
  process.exit(1);
}
