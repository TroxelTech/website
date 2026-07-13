# TroxelTech Website

Professional website for TroxelTech — an AI Accelerator consulting firm.

## Repository Structure

- `index.html` — Main site (single-page, Tailwind)
- `contact.html` — Contact form page
- `functions/api/contact.js` — Serverless form handler (Pages Functions)
- `.github/workflows/deploy.yml` — GitHub Actions deployment workflow

## Deployment Workflow

This repo uses **manual + approval-based** deployments to Cloudflare Pages.

### Automatic Deployments
- Every push to `main` automatically deploys to **Staging**
- Staging URL: https://troxel-tech-dev.pages.dev

### Production Deployments (Requires Approval)
- Production deployments require manual approval in GitHub
- Production URL: https://troxel.tech (once custom domain is connected)

### How to Deploy

#### 1. Normal development flow
```bash
git checkout -b feature/something
# make changes
git push origin feature/something
# Open a PR or merge to main when ready
```

Once merged to `main`, the site will automatically deploy to staging.

#### 2. Deploying to Production

1. Go to the **Actions** tab in this repo
2. Select the latest workflow run
3. Click **Review deployments**
4. Approve the `production` environment

Only approved deployments will go live on `troxel.tech`.

## Contact Form

The site now includes a dedicated contact page at `/contact` (or `contact.html`).

- Form collects: name, email, company (optional), area of interest, and message.
- Protected with **Cloudflare Turnstile** (widget "troxel.tech contact form" in the Cloudflare dashboard).
- Submissions are delivered by the **`troxel-contact-mailer` Worker** (`workers/contact-mailer/`) through **Cloudflare Email Routing** — 100% Cloudflare, no third-party email vendor.

### Architecture

1. `contact.html` renders the form + Turnstile widget and POSTs to `/api/contact`.
2. `functions/api/contact.js` (Pages Function) validates input and verifies the Turnstile token (`TURNSTILE_SECRET_KEY` env var).
3. It then calls the private `troxel-contact-mailer` Worker via the `MAILER` service binding.
4. The Worker sends the email via its Email Routing `send_email` binding to the verified hello@ destination addresses. Recipients must be verified Email Routing destinations; edit `RECIPIENTS` in `workers/contact-mailer/src/index.js` to change them.

The mailer Worker is deliberately private: no routes, no workers.dev subdomain. It is reachable only through the service binding.

### Deploying the mailer Worker

```bash
cd workers/contact-mailer
npm install
npx wrangler deploy   # needs CLOUDFLARE_EMAIL + CLOUDFLARE_API_KEY (or api token) + CLOUDFLARE_ACCOUNT_ID
```

The site's Pages deploy (GitHub Actions) does NOT deploy the Worker — redeploy it manually after changing `workers/contact-mailer/`.

## Required Secrets & Environment Variables

### GitHub Repository Secret
| Secret Name            | Description                                      |
|------------------------|--------------------------------------------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages:Edit permission  |

### Cloudflare Pages project settings (per project, Preview + Production)

| Setting                          | Type            | Value                                            |
|----------------------------------|-----------------|--------------------------------------------------|
| `TURNSTILE_SECRET_KEY`           | secret env var  | Turnstile widget secret (Cloudflare → Turnstile) |
| `MAILER`                         | service binding | → Worker `troxel-contact-mailer` (production)    |

> The Turnstile *site key* (public) is committed in `contact.html`. The secret stays server-side only. Settings changes only apply to the **next** deployment — re-run the deploy workflow after changing them.

## Local Development

- Static pages: just open `index.html` or `contact.html` in a browser.
- To test the form handler locally: `npx wrangler pages dev .` (requires Wrangler and the env vars set locally via `.dev.vars` or `--env`).

## Tech Stack

- Static HTML + Tailwind CSS (via CDN)
- Cloudflare Pages + Pages Functions (form handler) + a private Worker for email
- Cloudflare Email Routing for outbound contact-form delivery
- Cloudflare Turnstile for bot protection
- Hosted on Cloudflare Pages
- Deployments managed via GitHub Actions

## Contact

For questions about the site or deployments, reach out to the maintainers.

Live site: https://troxel.tech/contact (or the staging equivalent)