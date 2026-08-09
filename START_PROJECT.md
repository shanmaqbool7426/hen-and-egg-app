# 🚀 Complete Project Start Commands

## 📋 You Need 2 Terminals

### Terminal 1: Backend (API Server)
### Terminal 2: Frontend (Mobile App)

---

## 🔧 Terminal 1 - Backend

```powershell
# Navigate to backend folder
cd d:\personal-projects\hen-and-egg-app\artifacts\api-server

# Set port and run
$env:PORT="3000"
node dist/index.mjs
```

### Expected Output:
```
{"msg":"Server listening"}
{"port":3000}
MongoDB Connection Failed  ← This is OK! In-memory users work
```

---

## 📱 Terminal 2 - Mobile App

```powershell
# Navigate to mobile folder
cd d:\personal-projects\hen-and-egg-app\artifacts\mobile

# Start Expo
npx expo start
```

### Expected Output:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go
› Press w │ open web
```

---

## ✅ Complete Start Script (Both at Once)

If you want to start both in one command:

### Open PowerShell and run:

```powershell
# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\personal-projects\hen-and-egg-app\artifacts\api-server; `$env:PORT='3000'; node dist/index.mjs"

# Wait 2 seconds
Start-Sleep -Seconds 2

# Start frontend
cd d:\personal-projects\hen-and-egg-app\artifacts\mobile
npx expo start
```

---

## 🎯 Step-by-Step Manual Start

### 1️⃣ Start Backend First:

Open Terminal 1:
```powershell
cd d:\personal-projects\hen-and-egg-app\artifacts\api-server
$env:PORT="3000"
node dist/index.mjs
```

Wait for: `Server listening`

### 2️⃣ Start Frontend:

Open Terminal 2 (new terminal):
```powershell
cd d:\personal-projects\hen-and-egg-app\artifacts\mobile
npx expo start
```

Wait for QR code to appear

### 3️⃣ Open App:

- Press `w` for web browser
- Or scan QR with phone

---

## 🔐 Login Credentials:

```
Email: ali@mailinator.com
Password: Shan7426@
```

---

## 🛑 Stop Project

### Stop Backend:
- Go to Terminal 1
- Press `Ctrl + C`

### Stop Frontend:
- Go to Terminal 2
- Press `Ctrl + C`

---

## ⚡ Quick Start (Fastest Way)

### Backend:
```powershell
cd d:\personal-projects\hen-and-egg-app\artifacts\api-server && $env:PORT="3000" && node dist/index.mjs
```

### Frontend (in new terminal):
```powershell
cd d:\personal-projects\hen-and-egg-app\artifacts\mobile && npx expo start
```

---

## 📝 Summary:

| Component | Command | Port |
|-----------|---------|------|
| Backend API | `node dist/index.mjs` | 3000 |
| Frontend | `npx expo start` | 8081 |

---

## ✅ Both are ALREADY RUNNING NOW!

I've already started both for you:
- ✅ Backend on port 3000
- ✅ Frontend on port 8081

Just open your mobile app and test!

---

**Ready to test! Login karo aur dekho!** 🚀
