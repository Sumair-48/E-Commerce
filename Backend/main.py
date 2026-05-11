import os
import shutil
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session, load_only
from sqlalchemy import func, and_, desc, or_, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

from database import get_db, init_db
from models import User, Product, Category, UserInteraction, Purchase, CartItem, UserProfile, Wishlist
from schemas import (
    UserCreate, UserResponse, UserOnboarding,
    ProductCreate, ProductResponse, ProductWithRecommendationReason,
    CategoryCreate, CategoryResponse,
    InteractionCreate, InteractionResponse,
    CartItemAdd, CartItemResponse,
    PurchaseCreate, PurchaseResponse,
    RecommendationRequest, RecommendationResponse,
    WishlistAdd, WishlistResponse,
    Token
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin_user
)
from recommendation_engine import RecommendationEngine
from logger_config import logger

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="Personalized E-Commerce API",
    description="Advanced intelligent product recommendation engine with adaptive personalization",
    version="2.0.0"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS configuration - allow all for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Session tracking middleware helper
def get_session_id(x_session_id: Optional[str] = Header(None)) -> str:
    """Get or create session ID from header"""
    if x_session_id:
        return x_session_id
    return str(uuid.uuid4())


# Startup event
@app.on_event("startup")
async def startup_event():
    init_db()
    # Normalize malformed legacy JSON values so auth queries do not crash.
    db = next(get_db())
    try:
        db.execute(text("""
            UPDATE users
            SET preferred_categories = '[]'
            WHERE preferred_categories IS NULL
               OR TRIM(CAST(preferred_categories AS TEXT)) = ''
               OR json_valid(preferred_categories) = 0
        """))
        db.execute(text("""
            UPDATE users
            SET interests = '[]'
            WHERE interests IS NULL
               OR TRIM(CAST(interests AS TEXT)) = ''
               OR json_valid(interests) = 0
        """))
        db.execute(text("""
            UPDATE users
            SET budget_range = '"medium"'
            WHERE budget_range IS NOT NULL
              AND (TRIM(CAST(budget_range AS TEXT)) = '' OR json_valid(budget_range) = 0)
        """))
        db.commit()
    finally:
        db.close()


# Health check
@app.get("/")
async def root():
    return {
        "message": "Personalized E-Commerce API v2.0",
        "status": "running",
        "version": "2.0.0",
        "features": [
            "Advanced hybrid recommendations",
            "Time-decay scoring",
            "Collaborative filtering (Matrix Factorization)",
            "Session-based recommendations",
            "Diversity enforcement",
            "Serendipity injection",
            "Real-time analytics"
        ]
    }


# ==================== AUTHENTICATION ====================

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user"""

    logger.info(f"New user registration attempt: {user_data.name}")
    logger.info(f"Registration data: email={user_data.email}, name={user_data.name}")
    
    # Check if user exists by email
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()
    
    if existing_user:
        logger.warning(f"Registration failed - email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.name,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create user profile
    profile = UserProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()
    
    logger.info(f"User registered successfully: {new_user.email} (ID: {new_user.id})")
    
    return {
        'id': new_user.id,
        'email': new_user.email,
        'username': new_user.username,
        'onboarding_completed': False,
        'is_admin': new_user.is_admin,
        'preferences': None
    }


@app.post("/auth/login", response_model=Token)
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    
    logger.info(f"Login attempt: {form_data.username}")
    
    # Check by email or username
    user = db.query(User).options(
        load_only(User.id, User.email, User.username, User.hashed_password, User.is_admin)
    ).filter(
        or_(User.email == form_data.username, User.username == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Failed login attempt: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last active
    if user.profile:
        user.profile.last_active = datetime.utcnow()
        db.commit()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    logger.info(f"User logged in successfully: {user.email} (ID: {user.id})")
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    db.refresh(current_user)
    return {
        'id': current_user.id,
        'email': current_user.email,
        'username': current_user.username,
        'onboarding_completed': bool(current_user.preferred_categories or current_user.interests),
        'is_admin': current_user.is_admin,
        'preferences': {
            'categories': current_user.preferred_categories or [],
            'budget_range': current_user.budget_range or [100, 1000],
            'interests': current_user.interests or []
        }
    }


@app.post("/auth/onboarding", response_model=UserResponse)
async def onboarding(
    onboarding_data: UserOnboarding,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user onboarding with initial preferences"""
    
    # Store preferences from frontend
    current_user.preferred_categories = onboarding_data.categories  # Store category names as JSON
    
    # Handle budget_range - store as list for JSON serialization
    if isinstance(onboarding_data.budget_range, list):
        current_user.budget_range = onboarding_data.budget_range
    else:
        current_user.budget_range = onboarding_data.budget_range
    
    current_user.interests = onboarding_data.interests  # Store interests/shopping preferences
    
    db.commit()
    db.refresh(current_user)
    
    logger.info(f"User onboarding completed: {current_user.email} (ID: {current_user.id})")
    
    return {
        'id': current_user.id,
        'email': current_user.email,
        'username': current_user.username,
        'onboarding_completed': True,
        'is_admin': current_user.is_admin,
        'preferences': {
            'categories': current_user.preferred_categories,
            'budget_range': current_user.budget_range,
            'interests': current_user.interests
        }
    }


@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    db.refresh(current_user)
    return {
        'id': current_user.id,
        'email': current_user.email,
        'username': current_user.username,
        'onboarding_completed': bool(current_user.preferred_categories or current_user.interests),
        'is_admin': current_user.is_admin,
        'preferences': {
            'categories': current_user.preferred_categories or [],
            'budget_range': current_user.budget_range or [100, 1000],
            'interests': current_user.interests or []
        } if (current_user.preferred_categories or current_user.interests or current_user.budget_range) else None
    }


# ==================== ADMIN ENDPOINTS ====================

@app.get("/admin/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for admin"""
    
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_orders = db.query(Purchase).count()
    
    # Calculate total revenue
    total_revenue = db.query(func.sum(Purchase.price_paid)).scalar() or 0
    
    # Revenue by category
    revenue_by_category = db.query(
        Category.name,
        func.count(Purchase.id).label('order_count'),
        func.sum(Purchase.price_paid).label('revenue')
    ).join(Product, Category.id == Product.category_id)\
     .join(Purchase, Product.id == Purchase.product_id)\
     .group_by(Category.id, Category.name)\
     .all()
    
    revenue_by_category_data = [
        {
            'name': cat[0],
            'order_count': cat[1],
            'revenue': float(cat[2] or 0)
        }
        for cat in revenue_by_category
    ]
    
    # Recent orders
    recent_orders = db.query(Purchase).order_by(
        Purchase.purchased_at.desc()
    ).limit(10).all()
    
    recent_orders_data = [
        {
            'id': order.id,
            'user_id': order.user_id,
            'product_id': order.product_id,
            'quantity': order.quantity,
            'price_paid': float(order.price_paid),
            'purchased_at': order.purchased_at.isoformat()
        }
        for order in recent_orders
    ]
    
    return {
        'total_users': total_users,
        'total_products': total_products,
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'revenue_by_category': revenue_by_category_data,
        'recent_orders': recent_orders_data
    }


@app.get("/admin/users")
async def get_all_users(
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users for admin management"""
    
    users = db.query(User).limit(limit).all()
    
    users_data = []
    for user in users:
        users_data.append({
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'onboarding_completed': bool(user.preferred_categories or user.interests),
            'preferences': {
                'categories': user.preferred_categories or [],
                'budget_range': user.budget_range or [100, 1000],
                'interests': user.interests or []
            } if user.preferred_categories or user.interests else None
        })
    
    return users_data


@app.get("/admin/products")
async def get_all_products_admin(
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all products for admin management"""
    
    products = db.query(Product).limit(limit).all()
    
    products_data = []
    for product in products:
        products_data.append({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'price': float(product.price),
            'category_id': product.category_id,
            'brand': product.brand,
            'stock': product.stock,
            'image_url': product.image_url,
            'rating': float(product.rating),
            'purchase_count': product.purchase_count
        })
    
    return products_data


@app.get("/admin/orders")
async def get_all_orders(
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all orders for admin management"""
    
    orders = db.query(Purchase).order_by(
        Purchase.purchased_at.desc()
    ).limit(limit).all()
    
    orders_data = []
    for order in orders:
        orders_data.append({
            'id': order.id,
            'user_id': order.user_id,
            'product_id': order.product_id,
            'quantity': order.quantity,
            'price_paid': float(order.price_paid),
            'purchased_at': order.purchased_at.isoformat()
        })
    
    return orders_data


# ==================== CATEGORIES ====================

@app.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_category(
    request: Request,
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new category (admin endpoint)"""
    
    category = Category(**category_data.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return category


@app.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: Session = Depends(get_db)):
    """Get all categories"""
    
    categories = db.query(Category).all()
    return categories


# ==================== PRODUCTS ====================

@app.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def create_product(
    request: Request,
    product_data: ProductCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new product (admin endpoint)"""
    
    product = Product(**product_data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return product


@app.get("/products", response_model=List[ProductResponse])
async def get_products(
    skip: int = 0,
    limit: int = 20,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    brand: Optional[str] = None,
    sort_by: Optional[str] = "relevance",
    db: Session = Depends(get_db)
):
    """Get products with filtering and sorting options"""
    
    query = db.query(Product)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%")
            )
        )
    
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    
    if brand:
        query = query.filter(Product.brand == brand)
    
    # Sorting
    if sort_by == "price_low":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_high":
        query = query.order_by(Product.price.desc())
    elif sort_by == "rating":
        query = query.order_by(desc(Product.rating))
    elif sort_by == "popular":
        query = query.order_by(desc(Product.purchase_count))
    elif sort_by == "newest":
        query = query.order_by(desc(Product.created_at))
    else:  # relevance or default
        query = query.order_by(desc(Product.rating), desc(Product.purchase_count))
    
    products = query.offset(skip).limit(limit).all()
    return products


@app.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a specific product"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@app.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a product (admin endpoint)"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete related interactions and purchases first
    db.query(UserInteraction).filter(UserInteraction.product_id == product_id).delete()
    db.query(Purchase).filter(Purchase.product_id == product_id).delete()
    db.query(CartItem).filter(CartItem.product_id == product_id).delete()
    
    # Delete the product
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}


@app.post("/products/{product_id}/upload-image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Upload an image for a product"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"product_{product_id}_{int(datetime.utcnow().timestamp())}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update product image_url
    image_url = f"/uploads/{filename}"
    product.image_url = image_url
    db.commit()
    
    return {"image_url": image_url}


# ==================== ENHANCED RECOMMENDATIONS ====================

@app.get("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    limit: int = 10,
    exclude_viewed: bool = True,
    category_id: Optional[int] = None,
    session_id: str = Depends(get_session_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized product recommendations with advanced hybrid engine
    
    Features:
    - Time-decay scoring for recent interactions
    - Collaborative filtering with matrix factorization
    - Session-based recommendations
    - Diversity enforcement
    - Serendipity injection for exploration
    
    The engine adapts based on user maturity:
    - New users: Content-based using onboarding preferences
    - Warming up: Hybrid behavioral + content
    - Mature users: Full hybrid with collaborative filtering
    """
    
    # Get session context (products viewed in current session)
    session_context = []
    recent_interactions = db.query(UserInteraction.product_id)\
        .filter(
            and_(
                UserInteraction.user_id == current_user.id,
                UserInteraction.timestamp >= datetime.utcnow() - timedelta(hours=2)
            )
        )\
        .order_by(desc(UserInteraction.timestamp))\
        .limit(5)\
        .all()
    
    if recent_interactions:
        session_context = [pid[0] for pid in recent_interactions]
    
    engine = RecommendationEngine(db)
    recommendations, strategy, personalization_level = engine.get_recommendations(
        user=current_user,
        limit=limit,
        exclude_viewed=exclude_viewed,
        category_id=category_id,
        session_context=session_context
    )
    
    return RecommendationResponse(
        recommendations=recommendations,
        strategy_used=strategy,
        personalization_level=personalization_level
    )


@app.get("/recommendations/personalized", response_model=List[ProductResponse])
async def get_personalized_recommendations(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized product recommendations for the current user"""
    
    # Get all products and return as list (simple version)
    products = db.query(Product).limit(limit).all()
    
    return products


@app.get("/recommendations/trending", response_model=List[ProductResponse])
async def get_trending_recommendations(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get trending products based on recent interactions"""
    
    # Get most interacted products
    trending = db.query(Product)\
        .order_by(desc(Product.view_count))\
        .limit(limit)\
        .all()
    
    return trending


@app.get("/recommendations/similar/{product_id}", response_model=List[ProductWithRecommendationReason])
async def get_similar_products(
    product_id: int,
    limit: int = 6,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get products similar to a specific product
    Uses content-based similarity and collaborative filtering
    """
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Use recommendation engine for better similar product detection
    engine = RecommendationEngine(db)
    
    # Get content-based similar products
    excluded_ids = {product_id}
    if current_user:
        excluded_ids.update(engine._get_user_viewed_products(current_user.id))
    
    # Create a temporary user profile based on this product
    class TempUser:
        def __init__(self, product):
            self.id = -1
            self.preferred_categories = [product.category_id]
            self.interests = product.tags or []
            self.budget_range = "medium"
    
    temp_user = TempUser(product)
    
    # Get recommendations based on this product
    similar_products = engine._content_based_recommendations(
        temp_user,
        excluded_ids,
        limit
    )
    
    # Also add products from same category
    category_products = db.query(Product)\
        .filter(
            and_(
                Product.category_id == product.category_id,
                Product.id != product_id,
                Product.id.notin_(excluded_ids)
            )
        )\
        .order_by(desc(Product.rating))\
        .limit(limit // 2)\
        .all()
    
    results = []
    
    # Add content-based recommendations
    for prod, score, reason in similar_products:
        product_dict = engine._product_to_dict(prod)
        product_dict["recommendation_reason"] = reason
        product_dict["relevance_score"] = score
        results.append(ProductWithRecommendationReason(**product_dict))
    
    # Add category-based products if needed
    existing_ids = {r.id for r in results}
    for p in category_products:
        if p.id not in existing_ids and len(results) < limit:
            product_dict = engine._product_to_dict(p)
            product_dict["recommendation_reason"] = f"Also in {p.category.name}"
            product_dict["relevance_score"] = 0.7
            results.append(ProductWithRecommendationReason(**product_dict))
    
    return results[:limit]


@app.get("/recommendations/complementary/{product_id}", response_model=List[ProductResponse])
async def get_complementary_products(
    product_id: int,
    limit: int = 6,
    db: Session = Depends(get_db)
):
    """Get products that complement a specific product"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get products from related categories or brands
    complementary = db.query(Product)\
        .filter(
            and_(
                Product.id != product_id,
                Product.stock > 0
            )
        )\
        .order_by(desc(Product.rating))\
        .limit(limit)\
        .all()
    
    return complementary


@app.get("/recommendations/category/{category}", response_model=List[ProductResponse])
async def get_category_products(
    category: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get products from a specific category"""
    
    # Find category by name
    cat = db.query(Category).filter(Category.name.ilike(f"%{category}%")).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    products = db.query(Product)\
        .filter(Product.category_id == cat.id)\
        .order_by(desc(Product.rating))\
        .limit(limit)\
        .all()
    
    return products


@app.get("/recommendations/recently-viewed", response_model=List[ProductResponse])
async def get_recently_viewed(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recently viewed products by the current user"""
    
    viewed = db.query(Product)\
        .join(UserInteraction, UserInteraction.product_id == Product.id)\
        .filter(UserInteraction.user_id == current_user.id)\
        .order_by(desc(UserInteraction.timestamp))\
        .limit(limit)\
        .all()
    
    return viewed


@app.get("/recommendations/session-based", response_model=List[ProductWithRecommendationReason])
async def get_session_based_recommendations(
    product_id: int,
    limit: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get 'people who viewed this also viewed' recommendations
    Based on co-occurrence patterns in user sessions
    """
    
    engine = RecommendationEngine(db)
    excluded_ids = engine._get_user_viewed_products(current_user.id)
    
    session_recs = engine._get_session_based_recommendations(
        product_id,
        current_user,
        excluded_ids,
        limit
    )
    
    results = []
    for product, score, reason in session_recs:
        product_dict = engine._product_to_dict(product)
        product_dict["recommendation_reason"] = reason
        product_dict["relevance_score"] = score
        results.append(ProductWithRecommendationReason(**product_dict))
    
    return results


@app.post("/recommendations/feedback")
async def track_recommendation_feedback(
    product_id: int,
    position: int,
    clicked: bool,
    strategy_used: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track user feedback on recommendations (CTR tracking)
    This helps optimize recommendation strategies over time
    
    Args:
        product_id: Product that was recommended
        position: Position in the recommendation list (0-indexed)
        clicked: Whether the user clicked on this recommendation
        strategy_used: The recommendation strategy that generated this
    """
    
    engine = RecommendationEngine(db)
    engine.track_recommendation_feedback(
        user_id=current_user.id,
        product_id=product_id,
        position=position,
        clicked=clicked,
        strategy_used=strategy_used
    )
    
    return {"message": "Feedback recorded successfully"}


@app.get("/recommendations/performance")
async def get_recommendation_performance(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get recommendation engine performance metrics
    Shows CTR and effectiveness of different strategies
    """
    
    engine = RecommendationEngine(db)
    metrics = engine.get_recommendation_performance_metrics(days)
    
    return metrics


@app.get("/debug/recommendations")
async def debug_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Debug endpoint to verify recommendation system is working
    Returns detailed information about the user and recommendations
    """
    
    try:
        # Get user interaction count
        interaction_count = db.query(func.count(UserInteraction.id))\
            .filter(UserInteraction.user_id == current_user.id).scalar()
        
        purchase_count = db.query(func.count(Purchase.id))\
            .filter(Purchase.user_id == current_user.id).scalar()
        
        # Get recent interactions
        recent_interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == current_user.id
        ).order_by(desc(UserInteraction.timestamp)).limit(5).all()
        
        # Get recommendations
        engine = RecommendationEngine(db)
        recommendations, strategy, personalization_level = engine.get_recommendations(
            user=current_user,
            limit=5,
            exclude_viewed=True
        )
        
        return {
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
                "preferred_categories": current_user.preferred_categories,
                "budget_range": current_user.budget_range,
                "shopping_intent": current_user.shopping_intent,
                "interests": current_user.interests
            },
            "stats": {
                "interaction_count": interaction_count,
                "purchase_count": purchase_count,
                "personalization_level": personalization_level
            },
            "recent_interactions": [
                {
                    "product_id": i.product_id,
                    "interaction_type": i.interaction_type,
                    "timestamp": i.timestamp.isoformat()
                }
                for i in recent_interactions
            ],
            "recommendations": [
                {
                    "id": r.id,
                    "name": r.name,
                    "price": r.price,
                    "recommendation_reason": r.recommendation_reason,
                    "relevance_score": r.relevance_score
                }
                for r in recommendations
            ],
            "strategy_used": strategy
        }
    except Exception as e:
        logger.error(f"Debug recommendations error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating debug info: {str(e)}"
        )


# ==================== USER INTERACTIONS ====================

@app.post("/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def track_interaction(
    interaction_data: InteractionCreate,
    session_id: str = Depends(get_session_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Track user interaction with a product
    Supports: view, click, add_to_cart, wishlist
    """
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == interaction_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Calculate interaction score
    score_map = {
        "view": 1.0,
        "click": 2.0,
        "add_to_cart": 3.5,
        "wishlist": 2.5,
        "purchase": 5.0
    }
    score = score_map.get(interaction_data.interaction_type, 1.0)
    
    # Create interaction with session tracking
    interaction = UserInteraction(
        user_id=current_user.id,
        product_id=interaction_data.product_id,
        interaction_type=interaction_data.interaction_type,
        interaction_score=score,
        duration_seconds=interaction_data.duration_seconds,
        source=interaction_data.source,
        session_id=session_id  # Track session for session-based recommendations
    )
    
    db.add(interaction)
    
    # Update product view count
    if interaction_data.interaction_type == "view":
        product.view_count += 1
    
    # Update user profile activity
    if current_user.profile:
        current_user.profile.last_active = datetime.utcnow()
        current_user.profile.activity_score += score
    
    db.commit()
    db.refresh(interaction)
    
    return interaction


@app.get("/interactions/history", response_model=List[InteractionResponse])
async def get_interaction_history(
    limit: int = 50,
    interaction_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's interaction history with optional filtering"""
    
    query = db.query(UserInteraction)\
        .filter(UserInteraction.user_id == current_user.id)
    
    if interaction_type:
        query = query.filter(UserInteraction.interaction_type == interaction_type)
    
    interactions = query\
        .order_by(desc(UserInteraction.timestamp))\
        .limit(limit)\
        .all()
    
    return interactions


@app.get("/interactions/stats")
async def get_interaction_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's interaction statistics"""
    
    # Count by interaction type
    interaction_counts = db.query(
        UserInteraction.interaction_type,
        func.count(UserInteraction.id).label('count')
    )\
        .filter(UserInteraction.user_id == current_user.id)\
        .group_by(UserInteraction.interaction_type)\
        .all()
    
    # Recent activity (last 7 days)
    recent_date = datetime.utcnow() - timedelta(days=7)
    recent_count = db.query(func.count(UserInteraction.id))\
        .filter(
            and_(
                UserInteraction.user_id == current_user.id,
                UserInteraction.timestamp >= recent_date
            )
        )\
        .scalar()
    
    return {
        "interaction_counts": {itype: count for itype, count in interaction_counts},
        "recent_activity_count": recent_count,
        "total_interactions": sum(count for _, count in interaction_counts)
    }


# ==================== CART ====================

@app.post("/cart", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_data: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add item to cart"""
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == item_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check stock availability
    if product.stock < item_data.quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient stock. Available: {product.stock}"
        )
    
    # Check if item already in cart
    existing_item = db.query(CartItem).filter(
        and_(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_data.product_id
        )
    ).first()
    
    if existing_item:
        existing_item.quantity += item_data.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    
    # Create new cart item
    cart_item = CartItem(
        user_id=current_user.id,
        product_id=item_data.product_id,
        quantity=item_data.quantity
    )
    
    db.add(cart_item)
    
    # Track interaction
    interaction = UserInteraction(
        user_id=current_user.id,
        product_id=item_data.product_id,
        interaction_type="add_to_cart",
        interaction_score=3.5
    )
    db.add(interaction)
    
    db.commit()
    db.refresh(cart_item)
    
    return cart_item


@app.get("/cart", response_model=List[CartItemResponse])
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's cart items"""
    
    cart_items = db.query(CartItem)\
        .filter(CartItem.user_id == current_user.id)\
        .all()
    
    return cart_items


@app.get("/cart/recommendations", response_model=List[ProductWithRecommendationReason])
async def get_cart_recommendations(
    limit: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recommendations based on current cart contents
    'Complete your purchase' or 'Frequently bought together' suggestions
    """
    
    # Get cart items
    cart_items = db.query(CartItem)\
        .filter(CartItem.user_id == current_user.id)\
        .all()
    
    if not cart_items:
        return []
    
    cart_product_ids = [item.product_id for item in cart_items]
    
    # Find products frequently purchased together
    co_purchased = db.query(
        Product,
        func.count(Purchase.user_id.distinct()).label('co_purchase_count')
    )\
        .join(Purchase)\
        .filter(
            and_(
                Purchase.user_id.in_(
                    db.query(Purchase.user_id)
                    .filter(Purchase.product_id.in_(cart_product_ids))
                ),
                Product.id.notin_(cart_product_ids)
            )
        )\
        .group_by(Product.id)\
        .order_by(desc('co_purchase_count'))\
        .limit(limit)\
        .all()
    
    engine = RecommendationEngine(db)
    results = []
    
    for product, count in co_purchased:
        product_dict = engine._product_to_dict(product)
        product_dict["recommendation_reason"] = "Frequently bought together"
        product_dict["relevance_score"] = min(count / 10.0, 1.0)
        results.append(ProductWithRecommendationReason(**product_dict))
    
    return results


@app.delete("/cart/{item_id}")
async def remove_from_cart(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove item from cart"""
    
    cart_item = db.query(CartItem).filter(
        and_(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id
        )
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    db.delete(cart_item)
    db.commit()
    
    return {"message": "Item removed from cart"}


@app.put("/cart/{item_id}")
async def update_cart_item(
    item_id: int,
    quantity: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update cart item quantity"""
    
    cart_item = db.query(CartItem).filter(
        and_(
            CartItem.id == item_id,
            CartItem.user_id == current_user.id
        )
    ).first()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if quantity <= 0:
        db.delete(cart_item)
    else:
        # Check stock
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        if product and product.stock < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {product.stock}"
            )
        cart_item.quantity = quantity
    
    db.commit()
    
    if quantity > 0:
        db.refresh(cart_item)
        return cart_item
    else:
        return {"message": "Item removed from cart"}


@app.delete("/cart")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all items from cart"""
    
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    
    return {"message": "Cart cleared"}


# ==================== WISHLIST ====================

@app.post("/wishlist", response_model=WishlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    item_data: WishlistAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add item to wishlist"""
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == item_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if item already in wishlist
    existing_item = db.query(Wishlist).filter(
        and_(
            Wishlist.user_id == current_user.id,
            Wishlist.product_id == item_data.product_id
        )
    ).first()
    
    if existing_item:
        raise HTTPException(status_code=400, detail="Product already in wishlist")
    
    # Create new wishlist item
    wishlist_item = Wishlist(
        user_id=current_user.id,
        product_id=item_data.product_id
    )
    
    db.add(wishlist_item)
    
    # Track interaction
    interaction = UserInteraction(
        user_id=current_user.id,
        product_id=item_data.product_id,
        interaction_type="wishlist",
        interaction_score=2.5
    )
    db.add(interaction)
    
    db.commit()
    db.refresh(wishlist_item)
    
    return wishlist_item


@app.get("/wishlist", response_model=List[WishlistResponse])
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's wishlist items"""
    
    wishlist_items = db.query(Wishlist)\
        .filter(Wishlist.user_id == current_user.id)\
        .order_by(desc(Wishlist.added_at))\
        .all()
    
    return wishlist_items


@app.delete("/wishlist/{item_id}")
async def remove_from_wishlist(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove item from wishlist"""
    
    wishlist_item = db.query(Wishlist).filter(
        and_(
            Wishlist.id == item_id,
            Wishlist.user_id == current_user.id
        )
    ).first()
    
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
    
    db.delete(wishlist_item)
    db.commit()
    
    return {"message": "Item removed from wishlist"}


@app.delete("/wishlist/product/{product_id}")
async def remove_product_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove product from wishlist by product ID"""
    
    wishlist_item = db.query(Wishlist).filter(
        and_(
            Wishlist.product_id == product_id,
            Wishlist.user_id == current_user.id
        )
    ).first()
    
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Product not in wishlist")
    
    db.delete(wishlist_item)
    db.commit()
    
    return {"message": "Item removed from wishlist"}


# ==================== PURCHASES ====================

@app.post("/purchases/checkout", response_model=List[PurchaseResponse], status_code=status.HTTP_201_CREATED)
async def checkout_purchase(
    purchase_data: PurchaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete a purchase checkout"""
    
    purchases = []
    
    for item in purchase_data.items:
        product = db.query(Product).filter(Product.id == item["product_id"]).first()
        if not product:
            continue
        
        # Check stock
        if product.stock < item["quantity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}. Available: {product.stock}"
            )
        
        # Create purchase record
        purchase = Purchase(
            user_id=current_user.id,
            product_id=product.id,
            quantity=item["quantity"],
            price_paid=product.price * item["quantity"]
        )
        db.add(purchase)
        
        # Update product stats and stock
        product.purchase_count += item["quantity"]
        product.stock -= item["quantity"]
        
        # Track interaction
        interaction = UserInteraction(
            user_id=current_user.id,
            product_id=product.id,
            interaction_type="purchase",
            interaction_score=5.0
        )
        db.add(interaction)
        
        purchases.append(purchase)
    
    # Clear cart after purchase
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    
    db.commit()
    
    for purchase in purchases:
        db.refresh(purchase)
    
    return purchases


@app.post("/purchases", response_model=List[PurchaseResponse], status_code=status.HTTP_201_CREATED)
async def create_purchase(
    purchase_data: PurchaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete a purchase (alternative to checkout)"""
    return await checkout_purchase(purchase_data, current_user, db)


@app.get("/purchases/history", response_model=List[PurchaseResponse])
async def get_purchase_history(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's purchase history"""
    
    purchases = db.query(Purchase)\
        .filter(Purchase.user_id == current_user.id)\
        .order_by(desc(Purchase.purchased_at))\
        .limit(limit)\
        .all()
    
    return purchases


@app.get("/purchases/stats")
async def get_purchase_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's purchase statistics"""
    
    total_purchases = db.query(func.count(Purchase.id))\
        .filter(Purchase.user_id == current_user.id)\
        .scalar()
    
    total_spent = db.query(func.sum(Purchase.price_paid))\
        .filter(Purchase.user_id == current_user.id)\
        .scalar() or 0
    
    avg_order_value = total_spent / total_purchases if total_purchases > 0 else 0
    
    # Recent purchases (last 30 days)
    recent_date = datetime.utcnow() - timedelta(days=30)
    recent_purchases = db.query(func.count(Purchase.id))\
        .filter(
            and_(
                Purchase.user_id == current_user.id,
                Purchase.purchased_at >= recent_date
            )
        )\
        .scalar()
    
    # Favorite categories
    favorite_categories = db.query(
        Category.name,
        func.count(Purchase.id).label('count')
    )\
        .join(Product)\
        .join(Purchase)\
        .filter(Purchase.user_id == current_user.id)\
        .group_by(Category.name)\
        .order_by(desc('count'))\
        .limit(5)\
        .all()
    
    return {
        "total_purchases": total_purchases,
        "total_spent": float(total_spent),
        "average_order_value": float(avg_order_value),
        "recent_purchases_30d": recent_purchases,
        "favorite_categories": [{"name": cat, "count": count} for cat, count in favorite_categories]
    }


# ==================== ANALYTICS ====================

@app.get("/analytics/trending")
async def get_trending_products(
    limit: int = 10,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """Get trending products based on recent activity"""
    
    recent_date = datetime.utcnow() - timedelta(days=days)
    
    trending = db.query(
        Product,
        func.count(UserInteraction.id).label('interaction_count'),
        func.avg(UserInteraction.interaction_score).label('avg_score')
    )\
        .join(UserInteraction)\
        .filter(UserInteraction.timestamp >= recent_date)\
        .group_by(Product.id)\
        .order_by(desc('interaction_count'), desc('avg_score'))\
        .limit(limit)\
        .all()
    
    results = []
    for product, count, avg_score in trending:
        product_dict = {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "image_url": product.image_url,
            "rating": product.rating,
            "interaction_count": count,
            "trend_score": float(avg_score or 0)
        }
        results.append(product_dict)
    
    return results


@app.get("/analytics/user-insights")
async def get_user_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized user insights and analytics"""
    
    # Calculate statistics
    total_interactions = db.query(func.count(UserInteraction.id))\
        .filter(UserInteraction.user_id == current_user.id).scalar()
    
    total_purchases = db.query(func.count(Purchase.id))\
        .filter(Purchase.user_id == current_user.id).scalar()
    
    total_spent = db.query(func.sum(Purchase.price_paid))\
        .filter(Purchase.user_id == current_user.id).scalar() or 0
    
    # Favorite categories
    favorite_categories = db.query(
        Category.name,
        func.count(UserInteraction.id).label('count')
    )\
        .join(Product)\
        .join(UserInteraction)\
        .filter(UserInteraction.user_id == current_user.id)\
        .group_by(Category.name)\
        .order_by(desc('count'))\
        .limit(5)\
        .all()
    
    # Activity level
    recent_date = datetime.utcnow() - timedelta(days=7)
    recent_activity = db.query(func.count(UserInteraction.id))\
        .filter(
            and_(
                UserInteraction.user_id == current_user.id,
                UserInteraction.timestamp >= recent_date
            )
        )\
        .scalar()
    
    return {
        "total_interactions": total_interactions,
        "total_purchases": total_purchases,
        "total_spent": float(total_spent),
        "recent_activity_7d": recent_activity,
        "favorite_categories": [{"name": cat, "count": count} for cat, count in favorite_categories],
        "personalization_level": (
            "personalized" if total_interactions > 20 
            else "warming_up" if total_interactions > 3 
            else "cold_start"
        ),
        "engagement_score": min(total_interactions / 50.0, 1.0) * 100
    }


@app.get("/analytics/popular-brands")
async def get_popular_brands(
    limit: int = 10,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get popular brands based on purchases and interactions"""
    
    recent_date = datetime.utcnow() - timedelta(days=days)
    
    popular_brands = db.query(
        Product.brand,
        func.count(Purchase.id).label('purchase_count'),
        func.sum(Purchase.price_paid).label('revenue')
    )\
        .join(Purchase)\
        .filter(
            and_(
                Product.brand.isnot(None),
                Purchase.purchased_at >= recent_date
            )
        )\
        .group_by(Product.brand)\
        .order_by(desc('purchase_count'))\
        .limit(limit)\
        .all()
    
    return [
        {
            "brand": brand,
            "purchase_count": count,
            "revenue": float(revenue or 0)
        }
        for brand, count, revenue in popular_brands
    ]


@app.post("/analytics/events")
async def ingest_analytics_events(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Backward-compatible analytics ingestion endpoint.
    Accepts legacy frontend batched events and maps product events
    into interaction records used by recommendation logic.
    """
    events = payload.get("events", [])
    if not isinstance(events, list):
        return {"message": "No events processed", "processed_count": 0}

    type_map = {
        "product_view": "view",
        "product_click": "click",
        "add_to_cart": "add_to_cart",
        "add_to_wishlist": "wishlist",
        "purchase": "purchase",
    }

    processed_count = 0
    for event in events:
        event_type = event.get("event_type")
        interaction_type = type_map.get(event_type)
        product_id = event.get("product_id")

        if not interaction_type or not product_id:
            continue

        try:
            product_id = int(product_id)
        except (TypeError, ValueError):
            continue

        product_exists = db.query(Product.id).filter(Product.id == product_id).first()
        if not product_exists:
            continue

        score_map = {
            "view": 1.0,
            "click": 2.0,
            "add_to_cart": 3.5,
            "wishlist": 2.5,
            "purchase": 5.0
        }

        db.add(UserInteraction(
            user_id=current_user.id,
            product_id=product_id,
            interaction_type=interaction_type,
            interaction_score=score_map.get(interaction_type, 1.0),
            source="analytics_events"
        ))
        processed_count += 1

    if processed_count:
        db.commit()

    return {"message": "Events processed", "processed_count": processed_count}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


# ==================== ADMIN ENDPOINTS ====================

@app.get("/admin/users", response_model=List[UserResponse])
@limiter.limit("20/minute")
async def get_all_users(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return [
        {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'onboarding_completed': bool(user.preferred_categories or user.interests),
            'preferences': {
                'categories': user.preferred_categories or [],
                'budget_range': user.budget_range or [100, 1000],
                'interests': user.interests or []
            }
        }
        for user in users
    ]


@app.get("/admin/dashboard-stats")
@limiter.limit("20/minute")
async def get_admin_dashboard_stats(
    request: Request,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    
    total_users = db.query(func.count(User.id)).scalar()
    total_products = db.query(func.count(Product.id)).scalar()
    total_orders = db.query(func.count(Purchase.id)).scalar()
    total_revenue = db.query(func.sum(Purchase.price_paid)).scalar() or 0
    
    # Revenue by category
    revenue_by_category = db.query(
        Category.name,
        func.count(Purchase.id).label('order_count'),
        func.sum(Purchase.price_paid).label('revenue')
    ).join(Product).join(Purchase).group_by(Category.name).all()
    
    # Recent orders
    recent_orders = db.query(Purchase).order_by(desc(Purchase.purchased_at)).limit(10).all()
    
    return {
        'total_users': total_users,
        'total_products': total_products,
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'revenue_by_category': [
            {
                'name': cat,
                'order_count': count,
                'revenue': float(revenue or 0)
            }
            for cat, count, revenue in revenue_by_category
        ],
        'recent_orders': [
            {
                'id': order.id,
                'user_id': order.user_id,
                'product_id': order.product_id,
                'quantity': order.quantity,
                'price_paid': order.price_paid,
                'purchased_at': order.purchased_at.isoformat()
            }
            for order in recent_orders
        ]
    }


@app.get("/admin/products", response_model=List[ProductResponse])
@limiter.limit("20/minute")
async def get_admin_products(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all products for admin management"""
    products = db.query(Product).offset(skip).limit(limit).all()
    return products


@app.get("/admin/orders", response_model=List[PurchaseResponse])
@limiter.limit("20/minute")
async def get_admin_orders(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all orders (admin only)"""
    orders = db.query(Purchase).order_by(desc(Purchase.purchased_at)).offset(skip).limit(limit).all()
    return orders


@app.get("/admin/analytics")
@limiter.limit("20/minute")
async def get_admin_analytics(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get admin analytics"""
    
    recent_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily revenue
    daily_revenue = db.query(
        func.date(Purchase.purchased_at).label('date'),
        func.count(Purchase.id).label('orders'),
        func.sum(Purchase.price_paid).label('revenue')
    ).filter(Purchase.purchased_at >= recent_date).group_by(
        func.date(Purchase.purchased_at)
    ).order_by('date').all()
    
    # Top products
    top_products = db.query(
        Product.id,
        Product.name,
        func.count(Purchase.id).label('purchase_count'),
        func.sum(Purchase.price_paid).label('revenue')
    ).join(Purchase).filter(
        Purchase.purchased_at >= recent_date
    ).group_by(Product.id, Product.name).order_by(desc('purchase_count')).limit(10).all()
    
    return {
        'daily_revenue': [
            {
                'date': str(date),
                'orders': orders,
                'revenue': float(revenue or 0)
            }
            for date, orders, revenue in daily_revenue
        ],
        'top_products': [
            {
                'id': prod_id,
                'name': name,
                'purchase_count': count,
                'revenue': float(revenue or 0)
            }
            for prod_id, name, count, revenue in top_products
        ]
    }
