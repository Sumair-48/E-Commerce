# ShopAI - Personalized E-Commerce Platform

A full-stack e-commerce application with intelligent product recommendations powered by a hybrid recommendation engine.

## Features

### Backend (FastAPI)
- **Authentication**: JWT-based auth with OAuth2
- **Recommendation Engine**: Hybrid approach combining:
  - Cold-start (content-based using user preferences)
  - Behavioral (interaction history with time decay)
  - Collaborative filtering (similar users)
  - Content-based (TF-IDF and cosine similarity)
  - Trending/popular items
- **User Analytics**: Track interactions, purchases, and provide insights
- **Product Management**: Full CRUD for products and categories
- **Shopping Cart**: Persistent cart with local storage sync

### Frontend (React + TypeScript)
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Design**: Warm minimalist aesthetic with amber accents
- **Pages**:
  - Home with personalized recommendations
  - Product listing with advanced filters
  - Product detail with similar products
  - Shopping cart
  - User profile with purchase history and insights
  - Authentication (Login/Register)
  - User onboarding for preference collection

## Tech Stack

### Backend
- **Framework**: FastAPI 0.109.0
- **Database**: SQLite with SQLAlchemy ORM
- **Auth**: JWT (python-jose) + OAuth2PasswordBearer
- **ML/Recommendations**: scikit-learn, numpy, pandas
- **Password Hashing**: passlib with pbkdf2_sha256

### Frontend
- **Framework**: React with Vite
- **Routing**: Wouter
- **UI Components**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: React Context (Auth, Cart, Theme)
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- pnpm

### Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database with seed data:
```bash
python seed.py
```

5. Start the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

API documentation: `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Frontend/client
```

2. Create environment file:
```bash
cp .env.example .env
```

Edit `.env` and set:
```
VITE_API_URL=http://localhost:8000
```

3. Install dependencies:
```bash
pnpm install
```

4. Start the development server:
```bash
pnpm dev
```

The frontend will be available at `http://localhost:5173`

## Demo Account

After running the seed script, you can use:
- **Username**: `demo`
- **Password**: `demo123`

## Project Structure

### Backend
```
Backend/
├── main.py              # FastAPI application and routes
├── auth.py              # Authentication utilities
├── database.py          # Database connection and session
├── models.py            # SQLAlchemy ORM models
├── schemas.py           # Pydantic schemas
├── recommendation_engine.py  # Hybrid recommendation logic
├── seed.py              # Database seeding script
├── requirements.txt     # Python dependencies
└── ecommerce.db         # SQLite database (created after seed)
```

### Frontend
```
Frontend/
├── client/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Cart.tsx
│   │   │   └── Profile.tsx
│   │   ├── components/      # Reusable components
│   │   │   ├── Layout.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/        # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── CartContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── lib/             # Utilities and API client
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx          # Main app component
│   │   └── index.css        # Global styles
│   ├── package.json
│   └── vite.config.ts
└── ideas.md               # Design philosophy
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get token
- `POST /auth/onboarding` - Submit user preferences
- `GET /auth/me` - Get current user

### Products
- `GET /products` - List products with filters
- `GET /products/{id}` - Get product details
- `GET /products/{id}/similar` - Get similar products

### Recommendations
- `POST /recommendations` - Get personalized recommendations

### Cart
- `GET /cart` - Get user's cart
- `POST /cart` - Add item to cart
- `DELETE /cart/{item_id}` - Remove item from cart

### Purchases
- `GET /purchases/history` - Get purchase history
- `POST /purchases` - Create purchase

### Analytics
- `GET /analytics/user-insights` - Get user shopping insights

## Design Philosophy

The frontend follows a "Modern Minimalist with Warm Accents" approach:
- **Primary Color**: Warm Amber (#d97706)
- **Secondary**: Slate Gray
- **Accent**: Soft Cream
- **Typography**: Poppins (headings), Inter (body)
- **Layout**: Generous whitespace, clear hierarchy
- **Interactions**: Subtle animations, responsive feedback

See `Frontend/ideas.md` for more details.

## Future Enhancements

- [ ] Add checkout/payment integration
- [ ] Implement wishlist functionality
- [ ] Add product reviews and ratings
- [ ] Implement search with autocomplete
- [ ] Add email notifications for order updates
- [ ] Deploy to production (Vercel + Railway/Render)
- [ ] Add Redis caching for recommendations
- [ ] Implement A/B testing for recommendation strategies

## License

MIT
