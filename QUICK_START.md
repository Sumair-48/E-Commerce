# ShopAI - Quick Start Guide

Get ShopAI running locally in 5 minutes!

## Prerequisites
- Python 3.8+
- Node.js 18+ (with pnpm or npm)
- Git

## One-Command Setup (Recommended)

### Windows
```batch
:: Backend Setup
cd Backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python seed.py

:: Frontend Setup (in new terminal)
cd ..\Frontend\client
copy .env.example .env
pnpm install
```

### Mac/Linux
```bash
# Backend Setup
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed.py

# Frontend Setup (in new terminal)
cd Frontend/client
cp .env.example .env
pnpm install
```

## Running the Application

### Terminal 1 - Backend
```bash
cd Backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

Backend: http://localhost:8000
Docs: http://localhost:8000/docs

### Terminal 2 - Frontend
```bash
cd Frontend/client
pnpm dev
```

Frontend: http://localhost:5173

## Testing the Full Flow

### 1. Landing Page
- ✅ Visit http://localhost:5173
- ✅ See beautiful landing page with blobs animation
- ✅ Click "Start Shopping Now" or "Sign In"

### 2. Registration
- ✅ Create new account with:
  - Email: yourname@example.com
  - Username: yourname
  - Password: (at least 6 chars)
- ✅ Click "Create Account"

### 3. Onboarding
- ✅ Select preferred categories
- ✅ Choose budget range (low/medium/high)
- ✅ Set shopping intent (casual/specific/gifting)
- ✅ Add interests (tags)
- ✅ Click "Save Preferences"

### 4. Home Page
- ✅ Welcome greeting with your username
- ✅ "Recommended For You" section (cold-start recommendations)
- ✅ "Trending Now" section with popular products
- ✅ Quick action cards (Wishlist, Cart, Profile)

### 5. Browse Products
- ✅ Click "Shop" in navigation
- ✅ Use filters: category, price range, brand
- ✅ Sort by: relevance, price, rating, popular
- ✅ Search for products
- ✅ Click product card to view details

### 6. Product Details
- ✅ See product info, price, rating
- ✅ Add to cart or wishlist
- ✅ See similar products below

### 7. Shopping Cart
- ✅ Click cart icon (top right)
- ✅ See items in cart
- ✅ Adjust quantities
- ✅ Remove items

### 8. Wishlist
- ✅ Click your profile menu
- ✅ Go to Wishlist
- ✅ See saved items
- ✅ Move to cart or remove

### 9. Profile
- ✅ View your profile info
- ✅ See purchase history
- ✅ View shopping preferences

## Testing Recommendations

### Debug Recommendations
1. Get your auth token from localStorage
2. Use the debug endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/debug/recommendations
```

Response shows:
- User profile info
- Interaction count and personalization level
- Recent interactions
- Generated recommendations
- Strategy used

### Simulate More Interactions
1. Add products to cart
2. View different products
3. Add to wishlist
4. Refresh home page to see updated recommendations

## Demo Credentials

Already in database from `seed.py`:
- **Username**: `demo`
- **Password**: `demo123`

## Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use different port
uvicorn main:app --port 8001
```

### Frontend won't start
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Recommendations not showing
- Check debug endpoint for error messages
- Ensure you completed onboarding
- Try viewing more products first (needs interactions)

### Database issues
```bash
# Reset database and reseed
cd Backend
rm ecommerce.db
python seed.py
```

## Project Features Working ✅

- ✅ Landing page with hero section
- ✅ User registration and login
- ✅ User preferences onboarding
- ✅ Cold-start recommendations
- ✅ Hybrid recommendation engine
- ✅ Product browsing with filters
- ✅ Shopping cart management
- ✅ Wishlist management
- ✅ User profile with history
- ✅ Responsive design
- ✅ Error handling and validation
- ✅ Loading states and skeletons

## What's New in This Version

1. **Premium Landing Page** - Modern hero with animations
2. **Improved Home Page** - Only shows authenticated content
3. **Better Navigation** - Clear flow from landing to authenticated area
4. **Enhanced UI/UX** - Gradients, animations, better spacing
5. **Better Error Handling** - Informative messages and validation
6. **Debug Endpoint** - Verify recommendations working
7. **Input Validation** - Comprehensive backend validation
8. **Responsive Design** - Works great on mobile and desktop

## Next Steps

1. Try different filter combinations
2. Add products to cart and see recommendations change
3. Use admin tools to add more products
4. Check API docs at http://localhost:8000/docs
5. Review IMPROVEMENTS_GUIDE.md for architectural details

## Support

- Backend logs: `Backend/logs/`
- Browser console: F12 → Console tab
- Debug endpoint: `/debug/recommendations`
- API documentation: http://localhost:8000/docs

---

**Happy Shopping! 🛍️**
