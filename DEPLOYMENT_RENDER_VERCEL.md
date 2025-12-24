# 🚀 Deployment Guide: Render (Backend) + Vercel (Frontend)

This guide will help you deploy the QR Attendance System with:
- **Backend** on Render (free tier available)
- **Frontend** on Vercel (free tier available)

---

## 📋 Prerequisites

1. GitHub account
2. Render account (sign up at https://render.com)
3. Vercel account (sign up at https://vercel.com)
4. Your code pushed to a GitHub repository

---

## 🔧 Step 1: Deploy Backend to Render

### Option A: Using render.yaml (Recommended)

1. **Push your code to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign up/Login with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will detect `render.yaml` automatically

4. **Configure Service** (if not auto-detected):
   - **Name**: `attendance-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or choose paid for better performance)

5. **Set Environment Variables** in Render Dashboard:
   - Go to your service → **Environment** tab
   - Add the following variables:
     ```
     NODE_ENV=production
     PORT=10000
     SECRET_KEY=<generate-a-random-string-here>
     ADMIN_PASSWORD=<your-secure-admin-password>
     FRONTEND_URL=<will-be-set-after-frontend-deployment>
     ```
   
   **Generate SECRET_KEY:**
   ```bash
   # On Linux/Mac
   openssl rand -hex 32
   
   # Or use online generator: https://randomkeygen.com/
   ```

6. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (usually 2-5 minutes)
   - Copy your Render URL (e.g., `https://attendance-backend.onrender.com`)

### Option B: Manual Configuration (Without render.yaml)

1. **Go to Render Dashboard** → "New +" → "Web Service"
2. **Connect GitHub repository**
3. **Configure manually**:
   - **Name**: `attendance-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
4. **Add Environment Variables** (same as Option A)
5. **Deploy**

---

## 🎨 Step 2: Deploy Frontend to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com
   - Sign up/Login with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Set Environment Variables**:
   - Go to **Environment Variables** section
   - Add:
     ```
     VITE_API_URL=https://your-render-backend-url.onrender.com
     ```
   - Replace `your-render-backend-url.onrender.com` with your actual Render backend URL

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment (usually 1-2 minutes)
   - Copy your Vercel URL (e.g., `https://attendance-app.vercel.app`)

### Option B: Using Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel
# Follow prompts:
# - Link to existing project? No
# - Project name: attendance-frontend
# - Directory: ./
# - Override settings? No
```

Then add environment variable:
```bash
vercel env add VITE_API_URL
# Enter: https://your-render-backend-url.onrender.com
```

---

## 🔗 Step 3: Connect Frontend to Backend

1. **Update Render Backend Environment Variable**:
   - Go to Render Dashboard → Your Backend Service → **Environment**
   - Update `FRONTEND_URL` with your Vercel URL:
     ```
     FRONTEND_URL=https://your-app.vercel.app
     ```
   - Render will automatically redeploy

2. **Verify CORS Configuration**:
   - The backend is already configured to accept requests from Vercel domains
   - CORS will automatically allow `*.vercel.app` domains

---

## ✅ Step 4: Verify Deployment

1. **Test Backend**:
   - Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status":"ok",...}`

2. **Test Frontend**:
   - Visit: `https://your-app.vercel.app`
   - Should load the attendance system homepage

3. **Test Login**:
   - Click "Show Login" on the homepage
   - Enter your `ADMIN_PASSWORD` (set in Render)
   - Should successfully log in

---

## 🔄 Updating Deployments

### Backend Updates (Render)
- Push changes to GitHub
- Render automatically detects changes and redeploys
- Or manually trigger redeploy from Render dashboard

### Frontend Updates (Vercel)
- Push changes to GitHub
- Vercel automatically detects changes and redeploys
- Or manually trigger redeploy from Vercel dashboard

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend not starting
- **Solution**: Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure `SECRET_KEY` is set (required in production)

**Problem**: CORS errors
- **Solution**: 
  - Verify `FRONTEND_URL` in Render matches your Vercel URL exactly
  - Check that Vercel URL includes `https://`
  - Backend automatically allows `*.vercel.app` domains

**Problem**: Data not persisting
- **Solution**: 
  - Render free tier spins down after inactivity
  - Data persists in JSON files but service may be slow on first request
  - Consider upgrading to paid plan for always-on service

### Frontend Issues

**Problem**: Cannot connect to backend
- **Solution**: 
  - Verify `VITE_API_URL` is set correctly in Vercel
  - Check that backend URL includes `https://`
  - Ensure backend is running (check Render dashboard)

**Problem**: Environment variable not working
- **Solution**: 
  - Vite requires `VITE_` prefix for environment variables
  - After adding env var in Vercel, trigger a new deployment
  - Check browser console for API errors

**Problem**: Build fails
- **Solution**: 
  - Check Vercel build logs
  - Ensure all dependencies are in `package.json`
  - Verify Node.js version compatibility

---

## 📝 Environment Variables Summary

### Render (Backend)
```
NODE_ENV=production
PORT=10000
SECRET_KEY=<random-32-char-string>
ADMIN_PASSWORD=<your-secure-password>
FRONTEND_URL=https://your-app.vercel.app
```

### Vercel (Frontend)
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## 💰 Cost Estimate

- **Render Free Tier**: 
  - Free for 750 hours/month
  - Service spins down after 15 minutes of inactivity
  - First request after spin-down may take 30-60 seconds
  
- **Vercel Free Tier**:
  - Free for personal projects
  - Unlimited deployments
  - 100GB bandwidth/month

**Total Cost**: $0/month (free tier) ✅

---

## 🔒 Security Checklist

- [ ] Changed `ADMIN_PASSWORD` from default
- [ ] Generated strong `SECRET_KEY` (32+ characters)
- [ ] Set `NODE_ENV=production` in Render
- [ ] Verified HTTPS is enabled (both services)
- [ ] CORS is properly configured
- [ ] Environment variables are set securely (not in code)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## 🎉 You're Done!

Your QR Attendance System is now live:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.onrender.com`

Share the frontend URL with your users to start tracking attendance!

---

**Note**: On Render free tier, the backend may take 30-60 seconds to respond on the first request after inactivity. This is normal and expected behavior. Consider upgrading to a paid plan for always-on service.

