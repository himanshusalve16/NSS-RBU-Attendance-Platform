# Password Setup Guide

## Simple Password Configuration

The system now uses a simple password from environment variable (no hashing, no file storage).

## How to Set Password

### Method 1: Environment Variable (Recommended)

Set the `ADMIN_PASSWORD` environment variable:

**Windows (PowerShell):**
```powershell
$env:ADMIN_PASSWORD="YourPassword123"
```

**Windows (Command Prompt):**
```cmd
set ADMIN_PASSWORD=YourPassword123
```

**Linux/Mac:**
```bash
export ADMIN_PASSWORD="YourPassword123"
```

**For Production (Railway/Render):**
1. Go to your platform dashboard
2. Navigate to Environment Variables
3. Add: `ADMIN_PASSWORD` = `YourSecurePassword`
4. Redeploy

### Method 2: Default Password

If `ADMIN_PASSWORD` is not set, the default password is: **`admin123`**

## Changing Password

Simply update the `ADMIN_PASSWORD` environment variable and restart the server.

**Local Development:**
1. Stop the server
2. Set new `ADMIN_PASSWORD` value
3. Start the server

**Production:**
1. Update `ADMIN_PASSWORD` in your platform's environment variables
2. Redeploy the service

## Security Note

⚠️ **For production, always set a strong password using the `ADMIN_PASSWORD` environment variable!**

The default password `admin123` is only for development and should never be used in production.

