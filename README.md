# Einkaufsliste Sender (JTL)

A small Express service that collects article names and quantities posted to it during the day and emails one summary per day as a purchasing list ("Einkaufsliste"). Built in 2024 for a small business that uses JTL-Wawi; the repo name suggests JTL-Wawi is the sender, but nothing in this repo shows how it posts.

## What it does

- Accepts a POST on any path (port 3000). The body must contain `artikel`, a list of `[name, count]` pairs; entries that are not a two-element array with a non-empty name and a numeric count are ignored.
- Keeps the accepted entries in memory.
- Every day at 09:00 (server local time, node-cron `0 9 * * *`) it adds up the counts per article name and sends a plain-text email: subject `Summary for <date>: <n> unique articles`, body one `name: total` line per article.
- If there is nothing collected it sends nothing. After a successful send the list is cleared; if sending fails, the entries stay for the next run.

## How it works

Everything is in `Server.mjs`: a `POST *` handler (body-parser for JSON and URL-encoded bodies), a nodemailer SMTP transport (IONOS, port 465, TLS), and the cron job. The collected list lives only in process memory, so a restart loses anything not yet emailed.

Example request:

```
curl -X POST http://localhost:3000/ \
  -H 'Content-Type: application/json' \
  -d '{"artikel": [["Example article", 3], ["Another article", "2"]]}'
```

## Tech

Node.js 22+ (ES modules), Express ^4.22, body-parser ^1.20, node-cron ^4.6, nodemailer ^10.3. `xml2js` is listed in `package.json` but not used.

## Configuration

Copy `.env.example` to `.env` (git-ignored) and fill it in:

- `SMTP_HOST`, `SMTP_PORT` - the mail server (port 465 uses TLS)
- `SMTP_USER`, `SMTP_PASS` - the mailbox that sends the summary
- `MAIL_TO` - recipient, defaults to `SMTP_USER`
- `PORT` - HTTP port, defaults to 3000

## Run it

```
npm install
npm start        # node --env-file-if-exists=.env Server.mjs
```
