# Canopy Inventory - Acme Construction

A mobile-first PWA for warehouse workers. For each canopy they enter their name and take three photos (canopy ID, width, length). The app posts everything to an n8n webhook, which saves it to Airtable.

Plain HTML/CSS/vanilla JS in a single file ([src/index.html](src/index.html)). No frameworks, no auth, no offline queue.

## How it works

- The worker name is saved in `localStorage` on submit and pre-filled next visit.
- Photos are downscaled in the browser (max 1600px, JPEG 80%) and sent as raw base64 (no `data:` prefix), keeping each request small and under Airtable's 5 MB attachment limit.
- On success the three photos are cleared and the name stays. On any error or a 60s timeout nothing is cleared.

Request body:

```json
{
  "worker_name": "string",
  "submitted_at": "ISO timestamp",
  "canopy_id_photo": "base64 string",
  "width_photo": "base64 string",
  "length_photo": "base64 string"
}
```

## Environment variables

### App (Vercel / local `.env`)

```
N8N_WEBHOOK_URL=
```

Copy `.env.example` to `.env` for local use. `build.js` injects this value into `dist/index.html` at build time. Because the app is static, the URL is visible in the page source; that is inherent to calling a webhook straight from the browser.

### n8n

No environment variables are needed on n8n. The workflow uses an n8n Airtable OAuth2 credential, and the Airtable base ID and table ID are set in the HTTP Request nodes. The credential must allow use in HTTP Request nodes (credential settings -> allowed domains: all, or at least api.airtable.com and content.airtable.com).

## Airtable table

Create a table with these fields (names must match exactly):

| Field | Type |
|---|---|
| Worker Name | Single line text |
| Submitted At | Single line text (filled by n8n in Oklahoma time, e.g. `7/1/2026 12:19am`) |
| Canopy ID Photo | Attachment |
| Width Photo | Attachment |
| Length Photo | Attachment |

## n8n workflow

1. In n8n choose **Import from file** and select [n8n/canopy-submission-workflow.json](n8n/canopy-submission-workflow.json). In each of the four HTTP Request nodes pick your Airtable credential, and replace the base ID (`appAKZswA7WRzjVl2`) and table ID (`tblvYdjqwYyIF6S8f`) in the URLs if you use a different base.
2. Activate the workflow and copy the **Production URL** of the Webhook node (ends in `/webhook/canopy-submit`). That is your `N8N_WEBHOOK_URL`.

Flow: Webhook -> Create Airtable Record -> Upload Canopy ID / Width / Length photos -> Respond to Webhook (`{"success": true}`).

Note: Airtable can only accept base64 files through its *upload attachment* endpoint, which needs an existing record ID. So the workflow creates the record first, then uploads each photo to it, rather than uploading before creating. The Webhook node has CORS set to allow all origins; you can restrict `allowedOrigins` to your Vercel domain once deployed. If any step fails, n8n returns an error and the app shows "Something went wrong."

## Run locally

```
cp .env.example .env     # then fill in N8N_WEBHOOK_URL
npm start                # builds and serves dist/
```

Camera capture requires HTTPS (or localhost).

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework preset: **Other**).
2. Add the environment variable `N8N_WEBHOOK_URL` in Project Settings -> Environment Variables.
3. Deploy. `vercel.json` already sets build command `node build.js` and output directory `dist`.
4. Changing the variable requires a redeploy.

## Install on a phone

- **Android (Chrome):** menu -> *Install app* / *Add to Home screen*.
- **iPhone (Safari):** Share -> *Add to Home Screen*.

It then opens full screen with no browser chrome.
