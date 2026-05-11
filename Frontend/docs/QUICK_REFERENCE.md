# Quick Reference Guide

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     NEW USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

  HOME (/)
    ↓
    └─→ [Not logged in] → Click "Create Account"
         ↓
    REGISTER (/register)
         ↓ [Submit form]
    ✓ Account created
         ↓
    ONBOARDING (/onboarding)
         ↓ [4 steps]
         Step 1: Welcome
         Step 2: Select Categories (Electronics, Fashion, etc.)
         Step 3: Budget Range ($10-$5,000)
         Step 4: Shopping Interests (Eco-friendly, Deals, etc.)
         ↓ [Complete]
    ✓ Onboarding complete
         ↓
    DASHBOARD (/dashboard)
         ├─→ Quick Stats (Cart, Wishlist, Budget, Categories)
         ├─→ Personalization Profile
         └─→ AI Recommendations (Recommended For You, Trending)
         ↓
    PRODUCTS (/products)
         ├─→ Search & Filter
         ├─→ Browse Products
         └─→ Add to Cart / Wishlist
         ↓
    PRODUCT DETAIL (/products/[id])
         ├─→ Full Information
         └─→ Add to Cart / Wishlist
         ↓
    CART (drawer)
         ├─→ Review Items
         ├─→ Adjust Quantities
         └─→ Click Checkout
         ↓
    CHECKOUT (/checkout)
         ├─→ Review Order
         ├─→ Enter Shipping Address
         ├─→ Enter Payment Details
         └─→ Place Order
         ↓
    ✓ Order Confirmed
         ↓
    DASHBOARD (/dashboard)
         └─→ View Analytics, Wishlist, etc.

```

## Admin Panel Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                              │
└─────────────────────────────────────────────────────────────────┘

ADMIN (/admin)
  │
  ├─→ DASHBOARD (/admin/dashboard)
  │   └─→ KPI Cards: Users, Orders, Revenue, Products
  │   └─→ Charts: Revenue Trends, Category Distribution
  │   └─→ Alerts: Low Stock, Pending Orders
  │
  ├─→ PRODUCTS (/admin/products)
  │   └─→ Search Products
  │   └─→ View Stock Levels
  │   └─→ Edit / Delete Products
  │   └─→ Add New Product
  │
  ├─→ ORDERS (/admin/orders)
  │   └─→ Search Orders (ID, Customer)
  │   └─→ View Order Status
  │   └─→ Filter by Status (Completed, Pending, Processing, Cancelled)
  │   └─→ View Order Details
  │
  ├─→ USERS (/admin/users)
  │   └─→ Search Users
  │   └─→ View User Status (Active/Inactive)
  │   └─→ Track User Spending & Orders
  │   └─→ Delete Users
  │
  └─→ ANALYTICS (/admin/analytics)
      └─→ User Growth Chart
      └─→ Weekly Interactions Chart
      └─→ Top Search Terms
      └─→ KPI Metrics
```

## Route Map

| Route | Type | Requires Auth | Requires Onboarding | Purpose |
|-------|------|---------------|---------------------|---------|
| `/` | Public | ❌ | ❌ | Landing Page |
| `/login` | Public | ❌ | ❌ | User Login |
| `/register` | Public | ❌ | ❌ | User Registration |
| `/onboarding` | Protected | ✅ | ❌ | Personalization Setup |
| `/dashboard` | Protected | ✅ | ✅ | User Dashboard |
| `/products` | Protected | ✅ | ✅ | Product Browsing |
| `/products/[id]` | Protected | ✅ | ✅ | Product Details |
| `/wishlist` | Protected | ✅ | ✅ | Wishlist |
| `/checkout` | Protected | ✅ | ✅ | Checkout |
| `/analytics` | Protected | ✅ | ✅ | User Analytics |
| `/admin/*` | Protected | ✅ | ❌ | Admin Panel |

## Cookie System

### auth-token
- **Purpose:** Store user authentication token
- **Set On:** Login/Register success
- **Cleared On:** Logout
- **Used By:** Middleware, API calls

### onboarding-completed
- **Purpose:** Track if user completed onboarding
- **Set On:** Onboarding completion
- **Cleared On:** Register, Logout
- **Used By:** Middleware for route protection

## State Management (Zustand Stores)

### Auth Store (`lib/store/auth.ts`)
- `user`: Current user object
- `token`: Auth token
- `isAuthenticated`: Boolean flag
- Methods: `setUser()`, `setToken()`, `logout()`

### Cart Store (`lib/store/cart.ts`)
- `items[]`: Array of cart items
- `getTotal()`: Calculate cart total
- Methods: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`

### Wishlist Store (`lib/store/wishlist.ts`)
- `items[]`: Array of wishlist item IDs
- `isInWishlist()`: Check if item in wishlist
- Methods: `addItem()`, `removeItem()`

## Key Features Checklist

### User Features
- ✅ Authentication (Register/Login)
- ✅ Multi-step Onboarding
- ✅ Product Browsing & Filtering
- ✅ Search Functionality
- ✅ Product Details
- ✅ Cart Management
- ✅ Wishlist Management
- ✅ Checkout Process
- ✅ Order Confirmation
- ✅ Analytics Dashboard
- ✅ User Profile
- ✅ Logout

### Admin Features
- ✅ Admin Dashboard (KPIs)
- ✅ User Management
- ✅ Product Management
- ✅ Order Management
- ✅ Analytics Dashboard
- ✅ Search & Filter across all sections

### Technical Features
- ✅ Route Protection (Middleware)
- ✅ Analytics Tracking
- ✅ Form Validation (Zod)
- ✅ Error Handling
- ✅ Toast Notifications
- ✅ Framer Motion Animations
- ✅ Responsive Design
- ✅ React Query Caching
- ✅ Zustand State Management
- ✅ API Integration Ready

## Environment Variables Required

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend API URL
```

## How to Access Different Sections

### As a New User
1. Go to `/` (home page)
2. Click "Create Account"
3. Fill registration form
4. Complete 4-step onboarding
5. Access dashboard and all features

### As Existing User
1. Go to `/login`
2. Enter credentials
3. Redirected to dashboard (if onboarded) or onboarding (if not)

### As Admin
1. Login normally
2. Navigate to `/admin/dashboard`
3. Access admin features from navbar

### Access Patterns
- **Public Routes:** Accessible without login
- **Protected Routes:** Require login + onboarding
- **Admin Routes:** Require login (onboarding not required)

## API Integration Checklist

### Ready to Connect
- ✅ Auth APIs (Register, Login, Profile, Onboarding)
- ✅ Product APIs (List, Detail, Search, Categories)
- ✅ Recommendation APIs (Personalized, Trending, Session)
- ✅ Analytics/Events API (Track user interactions)

### Configuration
- Set `NEXT_PUBLIC_API_URL` environment variable
- All API calls will use Axios client with auth interceptors
- Tokens automatically appended to requests
- 401 errors trigger automatic logout

## Testing Checklist

### User Flow
- [ ] Create new account
- [ ] Complete onboarding (all 4 steps)
- [ ] Browse products
- [ ] Add to cart
- [ ] Add to wishlist
- [ ] Proceed to checkout
- [ ] Complete order
- [ ] Logout

### Admin Flow
- [ ] Login as admin
- [ ] Navigate to `/admin/dashboard`
- [ ] View all admin pages
- [ ] Verify charts and data
- [ ] Test search functionality

### Route Protection
- [ ] Try accessing `/dashboard` without login → should redirect to `/login`
- [ ] Login but skip onboarding → try accessing `/dashboard` → should redirect to `/onboarding`
- [ ] Complete onboarding → try accessing `/onboarding` again → should redirect to `/dashboard`
