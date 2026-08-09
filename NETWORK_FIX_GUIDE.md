# 🔧 Network & MongoDB Fix Guide

## ✅ What I Fixed

Updated the mobile app API URL from `localhost` to your network IP: **192.168.100.5**

This is needed because:
- On **web browser**: `localhost` works ✅
- On **Android/iOS device**: `localhost` points to the device itself, not your computer ❌

---

## ⚠️ Current Issue: MongoDB Not Connected

Your API server is running on port 3000 but **MongoDB Atlas connection is failing**.

### Error:
```
ECONNREFUSED querySrv _mongodb._tcp.auto-wheels.m4wrf.mongodb.net
```

### Possible Causes:
1. ❌ Network/Firewall blocking connection
2. ❌ MongoDB Atlas cluster is paused
3. ❌ IP address not whitelisted
4. ❌ Incorrect connection string

---

## 🎯 SOLUTION OPTIONS

### Option 1: Fix MongoDB Atlas (Recommended for Production) ✅

1. **Go to MongoDB Atlas**
   - Visit: https://cloud.mongodb.com
   - Login with your account

2. **Check Cluster Status**
   - Make sure cluster is ACTIVE (not paused)
   - If paused, click "Resume"

3. **Whitelist Your IP**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access From Anywhere" (0.0.0.0/0)
   - Or add your specific IP

4. **Verify Connection String**
   - Go to "Database" → "Connect"
   - Copy the connection string
   - Update `.env` file if needed

5. **Restart API Server**
   ```powershell
   cd artifacts/api-server
   $env:PORT=3000
   $env:MONGODB_URI="mongodb+srv://..."
   node dist/index.mjs
   ```

---

### Option 2: Use Local MongoDB (Quick Testing) 🚀

If you have MongoDB installed locally:

1. **Start Local MongoDB**
   ```powershell
   mongod
   ```

2. **Update .env file**
   ```
   MONGODB_URI=mongodb://localhost:27017/henform
   ```

3. **Restart API Server**

---

### Option 3: Test UI Without Backend (Current Option) 📱

**Good News**: The app UI works without backend!

You can:
- ✅ See all screens
- ✅ Test navigation
- ✅ View design/layout
- ✅ Check responsiveness
- ❌ Can't login (needs DB)
- ❌ Can't create real data (needs DB)

---

## 🔍 How to Test Right Now

### Testing on Web Browser:
The API URL **`http://192.168.100.5:3000/api`** will work if:
- API server is running ✅
- MongoDB is connected ❌ (Currently failing)

### Testing on Phone:
Make sure:
- Phone is on same WiFi (192.168.100.x network)
- Scan QR code from Expo terminal
- App will try to connect to 192.168.100.5:3000

---

## 📱 Current Setup

### Mobile App:
- **Running on**: Port 8081
- **API URL**: http://192.168.100.5:3000/api ✅ (Fixed)
- **Status**: Ready to test UI

### API Server:
- **Running on**: Port 3000
- **MongoDB**: Not connected ❌
- **Status**: Running but can't process requests

---

## 🎯 Next Steps

### Immediate (Test UI Now):
1. Open app in browser (Press 'w' in Expo terminal)
2. Explore screens and navigation
3. Test design without logging in

### To Fix Backend:
1. Fix MongoDB Atlas connection (see Option 1 above)
2. Once MongoDB is connected, run setup-users.js
3. Test login with Shan/Ali accounts

---

## 🚨 Quick MongoDB Atlas Fix Checklist

If you want to fix MongoDB right now:

- [ ] Go to cloud.mongodb.com
- [ ] Login to your account
- [ ] Check if cluster "auto-wheels" is ACTIVE
- [ ] Go to Network Access
- [ ] Add IP 0.0.0.0/0 (allow all)
- [ ] Wait 2 minutes
- [ ] Restart API server
- [ ] Test connection

---

## ✅ What Works Now

**Without MongoDB:**
- Mobile app loads ✅
- Navigation works ✅
- UI visible ✅
- All screens accessible ✅

**Needs MongoDB:**
- Login/Register ❌
- Create orders ❌
- Buy hens ❌
- Real data ❌

---

## 📞 Need Help?

If MongoDB Atlas is not working:
1. Check if cluster is paused
2. Check if your internet can reach MongoDB Atlas
3. Try using a VPN if firewall is blocking
4. Consider using local MongoDB for testing

---

## 🎉 Good News!

✅ Context error FIXED
✅ API URL FIXED (now uses network IP)
✅ App loads successfully
✅ Ready to test UI

**Just need to fix MongoDB connection for full functionality!**
