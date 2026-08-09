# Add Seller: Shan

## Quick Setup

### Option 1: Using MongoDB Shell

```bash
mongosh "mongodb+srv://auto-wheel-apps:AutoWheels123@auto-wheels.m4wrf.mongodb.net/henform" add-seller-shan.js
```

### Option 2: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Open Mongosh tab (bottom of screen)
4. Copy-paste the script below and run

---

## MongoDB Script

```javascript
// Add Seller: Shan
db.users.insertOne({
  name: "Shan",
  email: "shanmaqbool12345@gmail.com",
  phone: "03069829158",
  password: "Shan7426@",
  balance: 0,
  totalInvested: 0,
  lifetimeEarnings: 0,
  referralCode: "SHAN001",
  referralEarnings: 0,
  totalReferrals: 0,
  location: "Pakistan",
  rating: 5.0,
  verified: true,
  easyPaisaAccount: "03069829158",
  jazzCashAccount: "03069829158",
  bankName: "",
  bankAccountNumber: "",
  bankAccountTitle: "Shan",
  whatsappNumber: "+923069829158",
  availableEggs: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Get seller ID
var seller = db.users.findOne({ email: "shanmaqbool12345@gmail.com" });
print("Seller ID: " + seller._id);

// Add 10 batches of 1,000 hens each (10,000 total)
for (let i = 1; i <= 10; i++) {
  db.henbatches.insertOne({
    userId: seller._id,
    henCount: 1000,
    pricePerHen: 900,
    totalInvestment: 900000,
    totalEarnings: 0,
    dailyEarningRate: 35,
    purchaseDate: new Date(Date.now() - (i * 10 * 24 * 60 * 60 * 1000)),
    cycleEndDate: new Date(Date.now() + (90 - i * 10) * 24 * 60 * 60 * 1000),
    status: "active",
    daysCompleted: i * 10,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

print("✅ Seller Shan created with 10,000 hens!");
```

---

## Seller Details

**Name:** Shan  
**Email:** shanmaqbool12345@gmail.com  
**Password:** Shan7426@  
**Phone:** 03069829158  

**Payment Methods:**
- EasyPaisa: 03069829158
- JazzCash: 03069829158
- WhatsApp: +923069829158

**Hens Available:** 10,000 hens  
**Price:** Rs 900 per hen  
**Verified:** ✅ Yes  
**Rating:** ⭐⭐⭐⭐⭐ (5.0)

---

## Test After Adding

### 1. Check in Database
```javascript
db.users.findOne({ email: "shanmaqbool12345@gmail.com" })
db.henbatches.countDocuments({ userId: ObjectId("seller_id_here") })
```

### 2. Test API
```bash
curl http://localhost:3000/api/marketplace/sellers
```

Should return:
```json
{
  "success": true,
  "sellers": [
    {
      "userId": "...",
      "userName": "Shan",
      "location": "Pakistan",
      "totalHens": 10000,
      "pricePerHen": 900,
      "rating": 5.0,
      "verified": true,
      "easyPaisaAccount": "03069829158",
      "jazzCashAccount": "03069829158",
      "whatsappNumber": "+923069829158"
    }
  ]
}
```

### 3. Test in Mobile App
1. Open app
2. Go to Marketplace tab
3. Should see "Shan" with 10,000 hens
4. Click "Buy Hens"
5. See payment details:
   - EasyPaisa: 03069829158
   - JazzCash: 03069829158
   - WhatsApp: +923069829158

---

## Login as Shan (Seller)

**Email:** shanmaqbool12345@gmail.com  
**Password:** Shan7426@

After login:
- Can see pending orders in "Orders" tab
- Can approve/reject orders
- Will receive payments after approving orders

---

## Notes

⚠️ **Password is not hashed!** In production, you should:
1. Hash password with bcrypt
2. Use proper authentication
3. Never store plain text passwords

✅ **For testing:** This setup is perfect!

---

## Done! ✅

Shan is now:
- ✅ Registered as seller
- ✅ Has 10,000 hens available
- ✅ Verified seller badge
- ✅ 5-star rating
- ✅ Payment details configured
- ✅ Ready to sell hens!

Users can now buy hens from Shan in the Marketplace! 🎉
