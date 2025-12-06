# Quick Deployment Guide

## 🚀 Deploy to Vercel (Frontend)

### Method 1: Using Vercel Dashboard (Easiest)

1. **Push your code to GitHub** (if not already)
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign up/Login with GitHub

3. **Import Project**
   - Click **Add New Project**
   - Select your GitHub repository
   - Click **Import**

4. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variable**
   - Click **Environment Variables**
   - Add:
     - **Name**: `VITE_API_URL`
     - **Value**: `https://your-backend-url.com` (you'll update this after deploying backend)
   - Select all environments (Production, Preview, Development)
   - Click **Save**

6. **Deploy**
   - Click **Deploy**
   - Wait for build to complete
   - Your frontend will be live at `https://your-app.vercel.app`

### Method 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Navigate to frontend
cd frontend

# Deploy
vercel

# Follow prompts, then set environment variable in dashboard
```

---

## 🔧 Deploy Backend (Railway - Recommended)

### Why Railway?
- Free tier available
- Easy deployment
- Persistent file storage (works with JSON files)
- Automatic HTTPS

### Steps:

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Configure Service**:
   - Click on the service
   - Go to **Settings**
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
6. **Set Environment Variables**:
   - Go to **Variables** tab
   - Add:
     ```
     PORT=5000
     NODE_ENV=production
     SECRET_KEY=your-random-secret-key-here
     ADMIN_PASSWORD=your-secure-password
     FRONTEND_URL=https://your-app.vercel.app
     ```
7. **Get Public URL**:
   - Go to **Settings** → **Networking**
   - Click **Generate Domain**
   - Copy the URL (e.g., `https://your-app.railway.app`)
8. **Update Frontend**:
   - Go back to Vercel dashboard
   - Update `VITE_API_URL` to your Railway backend URL
   - Redeploy frontend

---

## 🔧 Alternative: Deploy Backend on Render

1. **Go to Render**: https://render.com
2. **Sign up/Login**
3. **New** → **Web Service**
4. **Connect GitHub** and select repository
5. **Configure**:
   - **Name**: `qr-attendance-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Environment Variables**:
   ```
   PORT=5000
   NODE_ENV=production
   SECRET_KEY=your-random-secret-key
   ADMIN_PASSWORD=your-secure-password
   FRONTEND_URL=https://your-app.vercel.app
   ```
7. **Deploy** and get your backend URL
8. **Update** `VITE_API_URL` in Vercel

---

## ✅ Final Checklist

After deployment:

- [ ] Frontend is accessible at Vercel URL
- [ ] Backend is accessible at Railway/Render URL
- [ ] `VITE_API_URL` points to backend URL
- [ ] Backend `FRONTEND_URL` points to frontend URL
- [ ] Test admin login
- [ ] Test creating a session
- [ ] Test scanning QR code
- [ ] Test marking attendance

---

## 🔐 Generate Secure SECRET_KEY

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 📱 Access Your App

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.railway.app`

Students can access the frontend URL to scan QR codes!

---

## 🆘 Need Help?

- Check browser console for errors
- Check backend logs in Railway/Render dashboard
- Verify all environment variables are set correctly
- Ensure CORS is configured properly

