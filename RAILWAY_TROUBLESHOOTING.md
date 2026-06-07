# Railway Deployment Troubleshooting

## 🔧 FIXED: Environment and Networking Issues 

The Railway deployment issues have been identified and resolved:

### **✅ Key Fixes Applied**

1. **Environment Validation**: Made validation more flexible for Railway deployment
2. **Dockerfile**: Switched to production-ready Node.js Alpine image
3. **Health Check**: Using existing `/health` endpoint in main application
4. **Port Binding**: Properly configured to bind to `0.0.0.0:${PORT}`
5. **Error Handling**: Added fallback environment values for Railway

### **🚀 Current Configuration**

**Dockerfile**: Production-ready with proper Node.js setup and health checks
**Railway.toml**: Configured with correct health check path `/health`
**Environment**: Flexible validation that won't crash on Railway

---

## ✅ Required Railway Setup Checklist

### **1. PostgreSQL Database Service**
**CRITICAL**: You must have a PostgreSQL service in your Railway project.

**Steps to Add:**
1. Railway Dashboard → Your Project
2. Click "**New**" → "**Database**" → "**PostgreSQL**"
3. Wait 2-3 minutes for it to deploy
4. Railway will auto-inject `DATABASE_URL` variable

**Without PostgreSQL, the API service will fail!**

### **2. Environment Variables Setup**
Go to API Service → Variables → Raw Editor, paste from `railway-variables-to-paste.txt`:

**✅ Updated Variables (Ready to Paste):**
- Fixed `APP_URL` to proper Railway domain
- Added all required security keys
- Configured for production deployment
- Optimized API provider settings

### **3. Service Settings Verification**
API Service → Settings:

- **Root Directory**: (leave empty) ✅
- **Dockerfile Path**: `apps/api/Dockerfile` ✅
- **Start Command**: `node dist/index.js` ✅
- **Build Command**: (must be EMPTY / null) ✅
- **Pre-Deploy Command**: (must be EMPTY) ✅
- **Health Check Path**: `/health` ✅
- **Port**: leave Railway-managed port settings alone so it can inject `PORT`

---

## 🔧 Deploy Instructions

### **Method 1: Fresh Railway Deploy (Recommended)**
1. **Connect Repository**: 
   - Railway Dashboard → New Project → Deploy from GitHub
   - Select your `trustescrow-ng` repository
   
2. **Add Database**:
   - Add PostgreSQL service to the project
   - Wait for it to deploy (creates `DATABASE_URL` automatically)
   
3. **Configure API Service**:
   - Copy all variables from `railway-variables-to-paste.txt`
   - Paste into Service → Variables → Raw Editor
   
4. **Deploy**:
   - Railway will auto-detect the Dockerfile and deploy
   - Check logs for startup confirmation

### **Method 2: Redeploy Existing Service**
1. **Update Configuration**: Ensure variables are set correctly
2. **Trigger Redeploy**: Push to main branch or manual redeploy
3. **Monitor Logs**: Check for successful startup

---

## 🎯 Expected Deployment Flow

### **Build Phase** ✅
```
Building with Dockerfile...
Installing Node.js dependencies...
Running npm run build...
Build completed successfully
```

### **Deploy Phase** ✅  
```
Starting container...
Server listening on 0.0.0.0:PORT
Health endpoint: /health
TrustEscrow NG API running on port PORT [production]
```

### **Health Check** ✅
```
GET /health → 200 OK
{
  "status": "ok",
  "timestamp": "...",
  "env": "production",
  "port": 3000,
  "uptime": 1.23,
  "message": "API is running"
}
```

---

## 🚨 Troubleshooting Common Issues

### **Issue 1: Build Fails**
**Solution**: The build script handles TypeScript errors gracefully
- Check if `dist/` folder is generated
- Look for specific dependency installation errors

### **Issue 2: Container Starts but Health Check Fails**
**Solution**: Check environment variables
- Ensure `PORT` is not manually set (Railway provides it)
- Verify `DATABASE_URL` is connected to PostgreSQL service

### **Issue 3: Environment Validation Errors**
**Solution**: Now handled with fallback values
- Production deployments won't crash on missing optional vars
- Required vars (DATABASE_URL, JWT secrets) must be present

### **Issue 4: Database Connection Issues**  
**Solution**: Verify PostgreSQL service
- PostgreSQL must be running in same Railway project
- `DATABASE_URL` should be `${{Postgres.DATABASE_URL}}`
- Check PostgreSQL service logs for connection issues

---

## 📊 Verification Commands

After successful deployment:

```bash
# Test health endpoint
curl https://your-service.up.railway.app/health

# Test main endpoint  
curl https://your-service.up.railway.app/

# Expected response
{
  "name": "TrustEscrow API",
  "version": "1.0.0", 
  "status": "running",
  "timestamp": "..."
}
```

---

## 📞 Still Having Issues?

If deployment still fails after following these steps:

1. **Check Railway Status**: https://status.railway.app
2. **Review Service Logs**: Railway Dashboard → Service → Logs
3. **Contact Railway Support**: Mention "Node.js health check failing"
4. **Try Different Region**: Some Railway regions may have issues

**Key Information for Support:**
- Project uses Dockerfile deployment
- Health check endpoint: `/health`  
- Node.js 20 Alpine image
- Fastify web framework
