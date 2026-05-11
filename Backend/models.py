from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Boolean, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Onboarding preferences for cold start
    preferred_categories = Column(JSON, default=list)  # List of category IDs
    budget_range = Column(JSON, nullable=True)  # [min, max] or "low", "medium", "high"
    shopping_intent = Column(String, nullable=True)  # "casual", "specific", "gifting"
    interests = Column(JSON, default=list)  # Tags/keywords
    
    # Profile
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    interactions = relationship("UserInteraction", back_populates="user", cascade="all, delete-orphan")
    purchases = relationship("Purchase", back_populates="user", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    wishlist_items = relationship("Wishlist", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # Derived behavioral profile
    favorite_categories = Column(JSON, default=list)  # Calculated from behavior
    favorite_brands = Column(JSON, default=list)
    price_sensitivity = Column(Float, default=0.5)  # 0-1 scale
    activity_score = Column(Float, default=0.0)  # Overall engagement
    last_active = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    
    products = relationship("Product", back_populates="category")
    parent = relationship("Category", remote_side=[id], backref="subcategories")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    brand = Column(String, nullable=True, index=True)
    image_url = Column(String, nullable=True)
    stock = Column(Integer, default=0)
    
    # Features for content-based filtering
    tags = Column(JSON, default=list)  # ["wireless", "bluetooth", "noise-cancelling"]
    features = Column(JSON, default=dict)  # {"color": "black", "size": "medium"}
    
    # Popularity metrics
    view_count = Column(Integer, default=0)
    purchase_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("Category", back_populates="products")
    interactions = relationship("UserInteraction", back_populates="product", cascade="all, delete-orphan")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_product_category_price', 'category_id', 'price'),
        Index('idx_product_brand', 'brand'),
    )


class UserInteraction(Base):
    __tablename__ = "user_interactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    interaction_type = Column(String, nullable=False)  # "view", "click", "add_to_cart", "purchase"
    interaction_score = Column(Float, default=1.0)  # Weight: view=1, cart=3, purchase=5
    
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    session_id = Column(String, nullable=True)
    
    # Context
    duration_seconds = Column(Integer, nullable=True)  # Time spent viewing
    source = Column(String, nullable=True)  # "search", "recommendation", "browse"
    
    user = relationship("User", back_populates="interactions")
    product = relationship("Product", back_populates="interactions")
    
    __table_args__ = (
        Index('idx_user_interactions', 'user_id', 'timestamp'),
        Index('idx_product_interactions', 'product_id', 'timestamp'),
    )


class Purchase(Base):
    __tablename__ = "purchases"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, default=1)
    price_paid = Column(Float, nullable=False)
    
    purchased_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="purchases")


class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    quantity = Column(Integer, default=1)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")
    
    __table_args__ = (
        Index('idx_user_cart', 'user_id'),
    )


class Wishlist(Base):
    __tablename__ = "wishlists"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    added_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="wishlist_items")
    product = relationship("Product")
    
    __table_args__ = (
        Index('idx_user_wishlist', 'user_id'),
        Index('idx_unique_wishlist_item', 'user_id', 'product_id', unique=True),
    )
