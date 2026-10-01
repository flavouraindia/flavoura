# Flavoura — static storefront

Pure HTML/CSS/JS. No build step, no backend. Deploy on Vercel straight from GitHub.

```
flavoura/
├── index.html        Storefront: highlights, hero, catalogue, reviews, FAQ
├── privacy.html      Privacy Policy        (next turn)
├── terms.html        Terms of Service      (next turn)
├── refunds.html      Refund & Cancellation (next turn)
├── style.css         Unified stylesheet (CSS variables, Flexbox/Grid)
├── script.js         Cart, checkout, Discord webhook, WhatsApp, stories, FAQ
├── vercel.json       Clean URLs, security + cache headers
├── robots.txt / sitemap.xml
└── assets/
    ├── angaara-hero.webp
    ├── highlights/   gold story icons (recipes, reviews, faqs, ordering, products)
    └── stories/      faq/ (7), reviews/ (11), product/ (1) — 720×1280 webp
```

## Where to edit
- Products, prices, ingredients, heat levels: `PRODUCTS` in `script.js`
- Story highlights and slides: `STORIES` in `script.js`
- WhatsApp number, webhook, storage keys: `CONFIG` in `script.js`
- Colours and fonts: `:root` in `style.css`
- Add a story image: drop a 9:16 `.webp` in `assets/stories/…` and add it to the matching slides array.

## Deploy
1. Push this folder to a GitHub repo.
2. In Vercel: Add New Project → import the repo → Framework preset "Other" → Deploy.
