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
- Protected with **Cloudflare Turnstile**.
- Submissions are emailed via **Resend**.
- Future: Google Chat webhook can be added to the same handler in `functions/api/contact.js`.

### Setting up the form (one-time)

1. **Resend**
   - Sign up at https://resend.com
   - Verify your sending domain (e.g. `troxel.tech` or a subdomain). This usually requires adding DNS records (SPF + DKIM) in your DNS provider.
   - Create an API key (start with full access, then restrict later).
   - Add the key as `RESEND_API_KEY` environment variable in both Cloudflare Pages projects.
   - Update the `from` address in `functions/api/contact.js` if you prefer a different sender (must be on a verified domain).

2. **Cloudflare Turnstile**
   - Go to Cloudflare dashboard → Turnstile → Add Site.
   - Add your domains (including `*.pages.dev` for staging).
   - Copy the **site key** into `contact.html` (replace `YOUR_TURNSTILE_SITE_KEY`).
   - Copy the **secret key** into the `TURNSTILE_SECRET_KEY` Pages environment variable.

3. **Test**
   - Push to `main` → check staging at https://troxel-tech-dev.pages.dev/contact
   - Submit the form (use the real keys).
   - Confirm the email arrives.

The form handler lives at `/api/contact` and is implemented with Cloudflare Pages Functions. No additional backend service is required.

## Required Secrets & Environment Variables

### GitHub Repository Secret
| Secret Name            | Description                                      |
|------------------------|--------------------------------------------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages:Edit permission  |

### Cloudflare Pages Environment Variables (per project)
These are set in the Cloudflare dashboard under your Pages project → Settings → Environment variables. Configure them for both **Preview** (staging) and **Production**.

| Variable                  | Description                                                                 | Where to get it                              |
|---------------------------|-----------------------------------------------------------------------------|----------------------------------------------|
| `RESEND_API_KEY`          | API key for sending emails via Resend                                       | resend.com → API Keys                        |
| `TURNSTILE_SECRET_KEY`    | Secret key for Cloudflare Turnstile (spam protection)                       | Cloudflare dashboard → Turnstile             |

> **Note:** The Turnstile *site key* (public) goes directly into `contact.html` (replace `YOUR_TURNSTILE_SITE_KEY`). The secret stays server-side only.

## Local Development

- Static pages: just open `index.html` or `contact.html` in a browser.
- To test the form handler locally: `npx wrangler pages dev .` (requires Wrangler and the env vars set locally via `.dev.vars` or `--env`).

## Tech Stack

- Static HTML + Tailwind CSS (via CDN)
- Cloudflare Pages + Pages Functions (for the contact form)
- Resend for transactional email
- Cloudflare Turnstile for bot protection
- Hosted on Cloudflare Pages
- Deployments managed via GitHub Actions

## Contact

For questions about the site or deployments, reach out to the maintainers.

Live site: https://troxel.tech/contact (or the staging equivalent)