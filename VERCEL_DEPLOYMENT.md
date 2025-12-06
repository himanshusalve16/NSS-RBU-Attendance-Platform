# Vercel Deployment Guide

This guide will help you deploy the QR Attendance System on Vercel.

## ⚠️ Important Note

**Vercel's serverless functions have a read-only file system** (except `/tmp` which is temporary). Since this app uses JSON file storage, you have two options:

### Option 1: Frontend on Vercel + Backend on Railway/Render (Recommended)
- Deploy frontend on Vercel (free, fast)
- Deploy backend on Railway or Render (free tiers available)

### Option 2: Full Stack on Vercel (Requires Code Changes)
- Convert file storage to a database (MongoDB Atlas, Supabase, etc.)
- Or use Vercel KV for data storage

---

## 🚀 Option 1: Frontend on Vercel + Backend Separately (Recommended)

### Step 1: Deploy Frontend on Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

4. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked "Set up and deploy?", choose **Yes**
   - When asked "Which scope?", select your account
   - When asked "Link to existing project?", choose **No** (first time)
   - When asked "Project name?", press Enter for default or enter a name
   - When asked "Directory?", press Enter (it should detect `frontend`)
   - When asked "Override settings?", choose **No**

5. **Set Environment Variable**:
   - Go to your Vercel project dashboard
   - Navigate to **Settings** → **Environment Variables**
   - Add a new variable:
     - **Name**: `VITE_API_URL`
     - **Value**: Your backend URL (e.g., `https://your-backend.railway.app` or `https://your-backend.onrender.com`)
   - **Environment**: Production, Preview, Development (select all)
   - Click **Save**

6. **Redeploy**:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### Step 2: Deploy Backend on Railway

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with GitHub
3. **Create New Project** → **Deploy from GitHub repo**
4. **Select your repository**
5. **Configure**:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`
   - **Build Command**: (leave empty)

6. **Set Environment Variables** in Railway:
   - `PORT` = `5000` (or leave default)
   - `NODE_ENV` = `production`
   - `SECRET_KEY` = (generate a random string)
   - `ADMIN_PASSWORD` = (your secure password)
   - `FRONTEND_URL` = (your Vercel frontend URL, e.g., `https://your-app.vercel.app`)

7. **Get Backend URL**:
   - Railway will provide a URL like `https://your-app.railway.app`
   - Update the `VITE_API_URL` in Vercel with this URL

### Alternative: Deploy Backend on Render

1. **Go to Render**: https://render.com
2. **Sign up/Login**
3. **New** → **Web Service**
4. **Connect your GitHub repository**
5. **Configure**:
   - **Name**: `qr-attendance-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

6. **Set Environment Variables**:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `SECRET_KEY` = (generate a random string)
   - `ADMIN_PASSWORD` = (your secure password)
   - `FRONTEND_URL` = (your Vercel frontend URL)

7. **Deploy** and get your backend URL

---

## 🔧 Option 2: Full Stack on Vercel (Advanced)

This requires converting the file storage to a database. Here's a quick guide:

### Prerequisites
- MongoDB Atlas account (free tier) OR
- Supabase account (free tier)

### Steps

1. **Install MongoDB driver**:
   ```bash
   cd backend
   npm install mongoose
   ```

2. **Create database models** (students, attendance, sessions)

3. **Update jsonHelper.js** to use MongoDB instead of file system

4. **Deploy both frontend and backend** on Vercel

---

## 📝 Quick Deploy Commands

### Frontend Only (Vercel)
```bash
cd frontend
vercel
```

### Using Vercel Dashboard
1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variable: `VITE_API_URL`
6. Deploy!

---

## 🔐 Environment Variables Checklist

### Frontend (Vercel)
- `VITE_API_URL` - Your backend API URL

### Backend (Railway/Render)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - `production`
- `SECRET_KEY` - Random secure string (for JWT/signatures)
- `ADMIN_PASSWORD` - Your admin password (hashed automatically)
- `FRONTEND_URL` - Your Vercel frontend URL (for CORS)

---

## ✅ Post-Deployment Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway/Render
- [ ] Environment variables set correctly
- [ ] Frontend can connect to backend (check browser console)
- [ ] Admin login works
- [ ] QR code generation works
- [ ] Attendance marking works

---

## 🐛 Troubleshooting

### Frontend can't connect to backend
- Check `VITE_API_URL` is set correctly in Vercel
- Check backend CORS settings allow your Vercel domain
- Check backend is running and accessible

### CORS errors
- Update `FRONTEND_URL` in backend environment variables
- Ensure backend CORS allows your Vercel domain

### File storage issues
- Vercel serverless functions can't write to file system
- Use Railway/Render for backend OR convert to database

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

---

## 🎉 Success!

Once deployed, your app will be available at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.railway.app` (or Render URL)

Share the frontend URL with students and teachers!

