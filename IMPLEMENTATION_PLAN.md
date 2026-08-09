# Implementation Plan: Marketplace Features
## Adding Buyers, Sellers & Earning Models

---

## 🎯 Goal
Transform the current simulation app into a full marketplace where users can:
1. **Buy hens** from platform and other users
2. **Sell hens** on marketplace
3. **Earn commissions** through referrals
4. **Trade actively** for profit

---

## 📋 Current State Analysis

### ✅ What We Already Have
- User authentication (login/register)
- Virtual wallet system
- Hen packages (Basic, Silver, Gold, Platinum)
- Egg income mechanism
- Transaction history
- Notification system
- Farm management (active hens view)

### ❌ What's Missing
- Marketplace listing creation
- Peer-to-peer trading
- Seller dashboard
- Referral system
- Commission tracking
- Rating/review system
- Search & filters

---

## 🚀 Implementation Phases

## Phase 1: Marketplace Core (Week 1-2)

### 1.1 New Types & Models

Create `constants/marketplace-types.ts`:
```typescript
export interface MarketplaceListing {
  id: string;
  henId: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  
  // Hen details
  tier: 'basic' | 'silver' | 'gold' | 'platinum';
  eggsPerDay: number;
  remainingLifespanDays: number;
  totalEggsCollected: number;
  
  // Pricing
  originalPrice: number;
  listingPrice: number;
  discount?: number; // percentage
  
  // Status
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  listedAt: string;
  expiresAt?: string;
  
  // Additional
  description?: string;
  featured?: boolean;
}

export interface MarketplaceFilter {
  tier?: string[];
  priceMin?: number;
  priceMax?: number;
  eggsPerDayMin?: number;
  sortBy: 'price-low' | 'price-high' | 'eggs-high' | 'newest';
}

export interface SellerProfile {
  userId: string;
  userName: string;
  rating: number; // 1-5
  totalSales: number;
  joinedAt: string;
  badges: ('verified' | 'trusted' | 'top-seller')[];
  activeListings: number;
}
```

### 1.2 Update SimulationContext

Add to `contexts/SimulationContext.tsx`:
```typescript
// New state
const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

// New functions
const createListing = (henId: string, price: number, description?: string) => {
  // Create marketplace listing from user's hen
};

const buyFromMarketplace = (listingId: string) => {
  // Purchase hen from another user
};

const cancelListing = (listingId: string) => {
  // Remove listing and return hen to farm
};
```

### 1.3 Create Marketplace Tab

Add new tab in `app/(tabs)/_layout.tsx`:
```typescript
<Tabs.Screen
  name="marketplace"
  options={{
    title: 'Market',
    tabBarIcon: ({ color }) => (
      <Ionicons name="storefront-outline" size={22} color={color} />
    ),
  }}
/>
```

### 1.4 Marketplace Screen

Create `app/(tabs)/marketplace.tsx`:
```typescript
export default function MarketplaceScreen() {
  // Components:
  // - Search bar
  // - Filter chips (tier, price range)
  // - Listing cards (show hen details, price, seller)
  // - Sort dropdown
  // - "My Listings" quick link
}
```

---

## Phase 2: Selling Features (Week 2-3)

### 2.1 Seller Dashboard

Create `app/seller-dashboard.tsx`:
```typescript
export default function SellerDashboard() {
  // Sections:
  // - Seller stats (total sales, revenue, rating)
  // - Active listings management
  // - Sales history
  // - Create new listing button
  // - Performance analytics
}
```

### 2.2 Create Listing Flow

Create `app/create-listing.tsx`:
```typescript
export default function CreateListingScreen() {
  // Form fields:
  // - Select hen from farm (dropdown)
  // - Set price (input with suggested price)
  // - Add description (optional text)
  // - Preview card
  // - Submit button
}
```

### 2.3 Listing Management

Features:
- View my active listings
- Edit price
- Cancel listing
- View listing analytics (views, favorites)

---

## Phase 3: Referral System (Week 3-4)

### 3.1 Referral Types

Add to `constants/types.ts`:
```typescript
export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referredUserName: string;
  code: string;
  status: 'pending' | 'active' | 'inactive';
  createdAt: string;
  firstPurchaseAmount?: number;
  lifetimeEarnings: number;
}

export interface ReferralEarnings {
  totalReferrals: number;
  activeReferrals: number;
  totalCommissionEarned: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  commissionRate: number;
  lifetimeRate: number;
}
```

### 3.2 Referral Screen

Create `app/referrals.tsx`:
```typescript
export default function ReferralsScreen() {
  // Components:
  // - Your referral code (shareable)
  // - Tier badge & commission rates
  // - Total earnings card
  // - Referral list (with earnings per referral)
  // - Share button (WhatsApp, SMS, etc.)
  // - How it works section
}
```

### 3.3 Commission Tracking

Add to SimulationContext:
```typescript
const calculateReferralCommission = (
  referralTier: string,
  amount: number,
  isFirstPurchase: boolean
) => {
  // Apply commission rates based on tier
};

const trackReferralEarning = (referralId: string, amount: number) => {
  // Update referral earnings
  // Credit to referrer's wallet
};
```

---

## Phase 4: Enhanced Features (Week 4-5)

### 4.1 Rating & Review System

```typescript
export interface Review {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}
```

Create review modal after purchase completion.

### 4.2 Search & Filters

Implement advanced filtering:
```typescript
const filterListings = (
  listings: MarketplaceListing[],
  filters: MarketplaceFilter
) => {
  // Filter by tier
  // Filter by price range
  // Filter by eggs per day
  // Sort by selected criteria
};
```

### 4.3 Favorites/Watchlist

```typescript
export interface Watchlist {
  userId: string;
  listingIds: string[];
}
```

Users can save interesting listings.

### 4.4 Price History & Analytics

Track price trends for each tier:
```typescript
export interface PriceHistory {
  tier: string;
  date: string;
  avgPrice: number;
  lowestPrice: number;
  highestPrice: number;
}
```

Show in Charts tab.

---

## Phase 5: Earning Models (Week 5-6)

### 5.1 Commission Structure

Update `contexts/SimulationContext.tsx`:
```typescript
const PLATFORM_FEES = {
  basicSeller: 0.10,      // 10% fee
  premiumSeller: 0.05,    // 5% fee (subscription)
  withdrawalFees: {
    '100-1000': 10,
    '1001-5000': 25,
    '5001-20000': 50,
    '20000+': 100,
  }
};

const REFERRAL_TIERS = {
  bronze: { minReferrals: 0, firstPurchase: 0.10, lifetime: 0.02 },
  silver: { minReferrals: 10, firstPurchase: 0.12, lifetime: 0.03 },
  gold: { minReferrals: 50, firstPurchase: 0.15, lifetime: 0.04 },
  platinum: { minReferrals: 100, firstPurchase: 0.20, lifetime: 0.05 },
};
```

### 5.2 Earnings Dashboard

Create `app/earnings.tsx`:
```typescript
export default function EarningsScreen() {
  // Sections:
  // - Total earnings breakdown (eggs, sales, referrals)
  // - Daily/weekly/monthly chart
  // - Top earning sources
  // - Withdrawal history
  // - Tax information (if applicable)
}
```

### 5.3 Seller Subscription

```typescript
export interface SellerSubscription {
  userId: string;
  plan: 'basic' | 'premium';
  startedAt: string;
  expiresAt?: string;
  price: number;
  benefits: string[];
}
```

Premium benefits:
- Lower platform fees (5% vs 10%)
- Featured listings
- Priority support
- Analytics dashboard

---

## 🎨 UI Components to Create

### 1. `components/MarketplaceListingCard.tsx`
```typescript
interface Props {
  listing: MarketplaceListing;
  onPress: () => void;
  onFavorite?: () => void;
}
```

Shows:
- Hen tier badge
- Price (with discount if applicable)
- Eggs per day
- Remaining lifespan
- Seller name & rating
- Buy button

### 2. `components/SellerBadge.tsx`
Show seller verification status

### 3. `components/PriceInput.tsx`
Custom input with suggested price indicator

### 4. `components/FilterSheet.tsx`
Bottom sheet for marketplace filters

### 5. `components/ReferralCard.tsx`
Display individual referral with earnings

### 6. `components/EarningsChart.tsx`
Visual chart for earnings over time

---

## 📱 Navigation Updates

Update navigation structure:
```
Root
├── (auth)
│   ├── login
│   ├── register
│   └── otp
├── (tabs)
│   ├── index (Home/Dashboard)
│   ├── farm (My Hens)
│   ├── marketplace (NEW)
│   ├── wallet
│   ├── learn
│   └── charts
├── seller-dashboard (NEW)
├── create-listing (NEW)
├── listing-detail (NEW)
├── referrals (NEW)
├── earnings (NEW)
└── profile
```

---

## 🗄️ Data Persistence

Update AsyncStorage keys:
```typescript
'@henapp/marketplace-listings'
'@henapp/my-listings'
'@henapp/seller-profile'
'@henapp/referrals'
'@henapp/referral-earnings'
'@henapp/watchlist'
'@henapp/reviews'
'@henapp/subscription'
```

---

## 🔐 Security Considerations

1. **Transaction Validation**
   - Verify user owns the hen before listing
   - Verify buyer has sufficient balance
   - Prevent duplicate purchases

2. **Anti-Fraud**
   - Rate limiting on listings
   - Suspicious pattern detection
   - Review spam prevention

3. **Data Integrity**
   - Atomic transactions (wallet + inventory)
   - Optimistic updates with rollback
   - Transaction logs

---

## 🧪 Testing Checklist

- [ ] User can create marketplace listing
- [ ] User can browse marketplace
- [ ] User can buy from marketplace
- [ ] Seller receives payment (minus fees)
- [ ] Hen transfers to buyer
- [ ] Transaction recorded in history
- [ ] Referral code works
- [ ] Commission calculated correctly
- [ ] Rating system functions
- [ ] Filters work properly
- [ ] Search returns relevant results
- [ ] Edge cases (insufficient balance, sold items, etc.)

---

## 📊 Success Metrics

Track these KPIs:
1. Daily Active Users (DAU)
2. Marketplace transaction volume
3. Average listing price
4. Referral conversion rate
5. Seller retention rate
6. User earnings (avg per user)
7. Platform revenue

---

## 🚀 Quick Start Guide

### For Development Team:

**Step 1: Create new types**
```bash
# Create new file
touch artifacts/mobile/constants/marketplace-types.ts
```

**Step 2: Update SimulationContext**
Add marketplace state and functions

**Step 3: Create marketplace tab**
Add new screen and navigation

**Step 4: Implement listing creation**
Build seller flow

**Step 5: Add referral system**
Implement commission tracking

**Step 6: Test thoroughly**
Ensure all flows work correctly

---

## 💡 Best Practices

1. **Keep simulation disclaimer**: Remind users this is virtual
2. **Progressive disclosure**: Don't overwhelm new users
3. **Clear earning breakdown**: Show exactly where money comes from
4. **Transparent fees**: Always show platform fees upfront
5. **Educational content**: Teach users how to trade effectively

---

## 🎯 Priority Order

**Must Have (MVP)**:
1. ✅ Marketplace listing creation
2. ✅ Browse and buy from marketplace
3. ✅ Basic seller dashboard
4. ✅ Transaction fees
5. ✅ Referral code system

**Should Have**:
6. ⭐ Rating/review system
7. ⭐ Advanced filters
8. ⭐ Seller subscription
9. ⭐ Earnings analytics

**Nice to Have**:
10. 🌟 Auction system
11. 🌟 Breeding mechanism
12. 🌟 Social features
13. 🌟 Price alerts

---

## 📝 Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize features** based on resources
3. **Create technical specs** for each feature
4. **Set up project board** (Trello/Jira)
5. **Start with Phase 1** - Marketplace Core
6. **Iterate based on feedback**

---

**Ready to start implementation?** Let me know which phase you want to begin with!
