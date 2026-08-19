# Gunshy Fix

Website for [gunshyfix.com](https://www.gunshyfix.com).

Open `index.html` in a browser to preview, or run a local static server so `/api/subscribe` and `/free-guide` work.

Core pages: Home, Program, Firework Shy, How It Works, Learn, Videos, Contact, Free Guide.

## Lead magnet (MailerLite)

The free guide lives at `/free-guide`. Signups POST to `/api/subscribe`, which adds the email to MailerLite group **Gunshy Fix — 5 Mistakes Guide**. The PDF is a static file at `/guides/5-gun-introduction-mistakes.pdf`.

Do not put the MailerLite API token in frontend code.

In Vercel, set:

- `MAILERLITE_API_TOKEN`
- `MAILERLITE_GROUP_ID`

To create the group and custom fields:

```bash
MAILERLITE_API_TOKEN=... node scripts/setup-mailerlite.mjs
```

Then add the printed group ID to Vercel.

Do not change MX records, Bandzoogle, or `support@gunshyfix.com` as part of this funnel. Authenticate MailerLite sending separately before turning on the email sequence.
