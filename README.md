# TroxelTech Website

Professional website for TroxelTech — an AI Accelerator consulting firm.

## Repository Structure

- `index.html` — Main site (single-page, Tailwind)
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

## Required Secrets

The following secret must be configured in the repository:

| Secret Name            | Description                          |
|------------------------|--------------------------------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages:Edit permission |

## Local Development

Just open `index.html` in a browser. No build step required.

## Tech Stack

- Static HTML + Tailwind CSS (via CDN)
- Hosted on Cloudflare Pages
- Deployments managed via GitHub Actions

## Contact

For questions about the site or deployments, reach out to the maintainers.