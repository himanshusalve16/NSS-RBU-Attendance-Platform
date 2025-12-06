# 🚀 Quick Deploy to Vercel

## Step 1: Deploy Frontend (5 minutes)

### Option A: Vercel Dashboard (Easiest)

1. **Go to**: https://vercel.com
2. **Sign up/Login** with GitHub
3. **Click**: "Add New Project"
4. **Import** your GitHub repository
5. **Configure**:
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Add Environment Variable**:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-url.com` (update after Step 2)
7. **Click**: "Deploy"
8. **Copy** your Vercel URL (e.g., `https://your-app.vercel.app`)

### Option B: Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel login
vercel
# Follow prompts, then add VITE_API_URL in dashboard
```

---

## Step 2: Deploy Backend (5 minutes)

### Railway (Recommended - Free)

1. **Go to**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → **Deploy from GitHub**
4. **Select** your repository
5. **Settings**:
   - Root Directory: `backend`
   - Start Command: `npm start`
6. **Variables** tab, add:
   ```
   PORT=5000
   NODE_ENV=production
   SECRET_KEY=<generate-random-string>
   ADMIN_PASSWORD=<your-password>
   FRONTEND_URL=<your-vercel-url>
   ```
7. **Settings** → **Networking** → **Generate Domain**
8. **Copy** Railway URL (e.g., `https://your-app.railway.app`)

### Render (Alternative)

1. **Go to**: https://render.com
2. **New** → **Web Service**
3. **Connect** GitHub repo
4. **Configure**:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
5. **Add** same environment variables as above
6. **Deploy** and get URL

---

## Step 3: Connect Frontend to Backend

1. **Go to** Vercel Dashboard
2. **Settings** → **Environment Variables**
3. **Update** `VITE_API_URL` with your Railway/Render backend URL
4. **Redeploy** frontend

---

## ✅ Done!

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-backend.railway.app`

Test your app:
1. Visit frontend URL
2. Login as admin
3. Create a session
4. Scan QR code

---

## 🔐 Generate SECRET_KEY

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 🆘 Troubleshooting

**CORS Error?**
- Update `FRONTEND_URL` in backend with your Vercel URL
- Redeploy backend

**Can't connect?**
- Check `VITE_API_URL` is set correctly
- Check backend is running (visit backend URL/health)
- Check browser console for errors

