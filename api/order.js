// Vercel serverless function: receives an order from the site and posts it to Discord.
// The webhook URL lives ONLY in the Vercel environment variable DISCORD_WEBHOOK_URL.

const clip = (v, max) => String(v == null ? '' : v).slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return res.status(500).json({ ok: false, error: 'not configured' });

  const b = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});

  const name = clip(b.name, 100).trim();
  const phone = clip(b.phone, 10).trim();
  const address = clip(b.address, 500).trim();
  const items = clip(b.itemsSummary, 1000).trim();

  // Reject junk so strangers can't spam your Discord
  if (!name || !address || !items || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ ok: false, error: 'invalid order' });
  }

  const free = Number(b.free) || 0;
  const payload = {
    username: 'Spice Bot',
    allowed_mentions: { parse: [] }, // never let customer text ping @everyone
    embeds: [{
      title: `🛒 NEW FLAVOURA ${clip(b.orderLabel, 80) || 'ORDER REQUEST'}`,
      color: 12068138,
      fields: [
        { name: 'Customer Name', value: name, inline: true },
        { name: 'Phone Number', value: `+91 ${phone}`, inline: true },
        { name: 'Delivery Address', value: address },
        { name: 'Items Ordered', value: items },
        ...(free > 0 ? [{ name: '🎁 Free Mystery Trial Pack', value: `${free} to add when packing (our choice of flavour, customer does not know)` }] : []),
        { name: 'Total Packs', value: `${Number(b.totalQty) || 0} packs${free > 0 ? ` (+${free} free)` : ''}`, inline: true },
        { name: 'Subtotal', value: `₹${Number(b.total) || 0}`, inline: true }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
  } catch (err) {
    return res.status(502).json({ ok: false });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch (e) { return {}; } }
