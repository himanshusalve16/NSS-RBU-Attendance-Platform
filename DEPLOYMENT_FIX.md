# Fix: "vite: command not found" Error

## Problem
Vercel is trying to build from the root directory, but `vite` is installed in the `frontend` directory.

## Solution 1: Configure Root Directory in Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click **Settings**
3. Go to **General** section
4. Find **Root Directory**
5. Click **Edit**
6. Set to: `frontend`
7. Click **Save**
8. Go to **Deployments** and **Redeploy**

## Solution 2: Use Root-Level vercel.json

I've created a `vercel.json` in the root that should work. If it doesn't:

1. Delete the root `vercel.json`
2. Use Solution 1 (set root directory in dashboard)

## Solution 3: Manual Build Settings

In Vercel Dashboard → Settings → Build & Development Settings:

- **Framework Preset**: Other
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Verify

After fixing, the build should:
1. Install dependencies in `frontend/node_modules`
2. Run `vite build` successfully
3. Output to `frontend/dist`

If you still get errors, check the build logs in Vercel dashboard for more details.

