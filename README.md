# Canopy Inventory - Acme Construction

A mobile-first PWA for warehouse workers on phones and tablets. For each canopy they enter their name and take or upload three photos (canopy ID, width, length). The app sends everything to n8n, which saves it to Airtable.

Plain HTML/CSS/vanilla JS, no frameworks, no build step, no auth, no offline queue.

## Project layout

| File | Purpose |
|---|---|
| `index.html` | The whole app (HTML, CSS, JS) |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA install support (no caching) |
| `api/submit.js` | Tiny Vercel function that forwards the form to n8n. Keeps the webhook URL out of the browser. |
| `vercel.json` | Function timeout and service worker header |
| `n8n/canopy-submission-workflow.json` | The n8n workflow to import |

## How it works

- The worker name is saved in `localStorage` on submit and pre-filled next visit.
- Photos are downscaled in the browser (max 1600px, JPEG 80%) and sent as raw base64 (no `data:` prefix) to `/api/submit`, which forwards the JSON to the n8n webhook:

```json
{
  "worker_name": "string",
  "submitted_at": "ISO timestamp",
  "canopy_id_photo": "base64 string",
  "width_photo": "base64 string",
  "length_photo": "base64 string"
}
```

- On success the three photos are cleared and the name stays. On any error or timeout nothing is cleared.
- n8n stamps the submission time itself in Oklahoma (Central) time, e.g. `7/1/2026 12:19am`.

## Environment variable

```
N8N_WEBHOOK_URL=
```

Set it in Vercel (Project Settings -> Environment Variables). It is read only by `api/submit.js` on the server. For local use, copy `.env.example` to `.env`; `.env` is gitignored.

## Airtable table

Create these fields (names must match exactly):

| Field | Type |
|---|---|
| Worker Name | Single line text (primary field) |
| Submitted At | Single line text (filled by n8n, e.g. `7/1/2026 12:19am`) |
| Canopy ID Photo | Attachment |
| Width Photo | Attachment |
| Length Photo | Attachment |

## n8n workflow

1. In n8n choose **Import from file** and select [n8n/canopy-submission-workflow.json](n8n/canopy-submission-workflow.json). In each of the four HTTP Request nodes pick your Airtable credential, and replace the base ID (`appAKZswA7WRzjVl2`) and table ID (`tblvYdjqwYyIF6S8f`) in the URLs if you use a different base. The credential must be allowed to be used in HTTP Request nodes.
2. Activate the workflow and copy the **Production URL** of the Webhook node (ends in `/webhook/canopy-submit`). That is your `N8N_WEBHOOK_URL`.

Flow: Webhook -> Create Airtable Record -> Upload Canopy ID / Width / Length photos -> Respond to Webhook (`{"success": true}`).

Airtable only accepts base64 files through its *upload attachment* endpoint, which needs an existing record ID. So the workflow creates the record first, then uploads each photo to it. If any step fails, n8n returns an error and the app shows "Something went wrong."

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework preset: **Other**, no build command, no output directory).
2. Add `N8N_WEBHOOK_URL` in Project Settings -> Environment Variables.
3. Deploy. Changing the variable needs a redeploy.

Request size: Vercel functions accept bodies up to 4.5 MB. Resized photos are a few hundred KB each, so three fit comfortably.

## Run locally

```
npx vercel dev
```

This serves the page and `api/submit.js` together, reading `.env`. Opening `index.html` directly will not work because there is no `/api/submit`. Camera capture needs HTTPS (or localhost).

## Install on a phone or tablet

- **Android (Chrome):** menu -> *Install app* / *Add to Home screen*.
- **iPhone/iPad (Safari):** Share -> *Add to Home Screen*.

It then opens full screen with no browser chrome.
