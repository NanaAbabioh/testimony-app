This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AH Testimony Library
Professional testimony library application with advanced filtering and cloud sync capabilities.

## Git Repository Information

**IMPORTANT**: This project uses the following repository structure:

### Frontend (This Repository)
- **Repository**: `NanaAbabioh/testimony-app`
- **URL**: https://github.com/NanaAbabioh/testimony-app.git
- **Contains**: Next.js frontend application
- **Vercel Deployment**: Connected to this repository

### Backend (Separate Repository)
- **Repository**: Backend is in a separate location
- **Contains**: Backend API services

### Development Workflow
1. All frontend changes should be committed and pushed to `NanaAbabioh/testimony-app`
2. Environment variables are configured in Vercel for the `testimony-app` project
3. Do NOT use the old `ah-testimony-library` repository

### Commands
```bash
# Check current remote
git remote -v

# Push changes (should go to testimony-app)
git push origin main
```
