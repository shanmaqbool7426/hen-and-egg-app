# 🔐 LOGIN CREDENTIALS - READY TO TEST

## ✅ BOTH SERVERS RUNNING

### 📱 Mobile App
- **Status**: ✅ RUNNING on port 8081
- **URL**: http://localhost:8081
- **Press**: `w` to open in web browser

### 🔧 API Server  
- **Status**: ✅ RUNNING on port 3000
- **URL**: http://192.168.100.5:3000/api
- **MongoDB**: Not connected (using in-memory test users)

---

## 👥 TEST USERS

### 🛒 Buyer Account (Ali)
```
Email: ali@mailinator.com
Password: Shan7426@
Balance: Rs 50,000
Role: Can buy hens and sell eggs
```

### 🏪 Seller Account (Shan)
```
Email: shanmaqbool12345@gmail.com
Password: Shan7426@
Hens: 10,000 available
Balance: Rs 500,000
JazzCash: 03069829158
EasyPaisa: 03069829158
Bank: Meezan Bank (0123456789012)
WhatsApp: +923069829158
Role: Can sell hens and buy eggs
```

---

## 🎯 HOW TO TEST

### Open the App:
1. In Expo terminal, press **`w`**
2. Or open: http://localhost:8081
3. Or scan QR code with Expo Go app

### Login:
1. Go to login screen
2. Enter: **ali@mailinator.com**
3. Password: **Shan7426@**
4. Click "Sign In"

### Expected Result:
- ✅ Loading indicator should show
- ✅ Login successful
- ✅ Navigate to home screen
- ✅ See Ali's balance: Rs 50,000

---

## ⚠️ CURRENT NETWORK ISSUE

Mobile app shows "Network request failed" because:
- App is trying to connect to: `http://192.168.100.5:3000/api`
- But connection is failing

### Possible Solutions:

#### 1. Test on Web Browser First
```
Press 'w' in Expo terminal
Open http://localhost:8081
Try login there
```

#### 2. Check Firewall
```powershell
# Allow port 3000 through firewall
New-NetFirewallRule -DisplayName "Node API 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

#### 3. Test API Direct
Open browser and go to:
```
http://localhost:3000/api/health
```

Should show: `{"success":true}`

---

## 🔍 WHAT'S WORKING

✅ **Backend:**
- Server listening on port 3000
- Login endpoint: `/api/auth/login`
- Register endpoint: `/api/auth/register`
- Test users loaded in memory
- Password validation works

✅ **Frontend:**
- Mobile app running
- Login screen displays
- Email/password inputs
- Context updated with login() function

---

## 🚀 QUICK TEST COMMANDS

### Test API Health:
```powershell
curl http://localhost:3000/api/health
```

### Test Login API:
```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"ali@mailinator.com","password":"Shan7426@"}'
```

### Expected Response:
```json
{
  "success": true,
  "user": {
    "_id": "67890ali1234567890",
    "name": "Ali",
    "email": "ali@mailinator.com",
    "balance": 50000,
    ...
  }
}
```

---

## 📱 TESTING FLOW

### 1. Login as Buyer (Ali)
- Email: ali@mailinator.com
- Password: Shan7426@
- View: Balance Rs 50,000

### 2. Browse Marketplace
- See sellers
- View Shan's hens (10,000 available)
- Check payment details

### 3. Buy Hens
- Select hen package
- Create order
- Contact Shan on WhatsApp
- Wait for approval

### 4. Login as Seller (Shan)
- Email: shanmaqbool12345@gmail.com
- Password: Shan7426@
- Go to "Pending Approvals"
- Approve Ali's order

### 5. Verify Transfer
- Login back as Ali
- Check "My Hens" tab
- Should see new hens!

---

## ✅ EVERYTHING IS READY!

Just need to fix the network connection issue, then you can test the complete P2P marketplace flow!

**Press `w` in Expo terminal to open app in browser and try login!** 🚀
