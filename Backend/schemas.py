from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime


# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


class UserOnboarding(BaseModel):
    categories: List[str] = Field(default=[])  # Category names (not IDs)
    budget_range: Union[List[int], str] = Field(default="")  # Can be [min, max] or "$100 - $1000"
    interests: List[str] = Field(default=[], max_items=20)  # Shopping preferences


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    onboarding_completed: bool = False
    is_admin: bool = False
    preferences: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True
        populate_by_name = True


# Product Schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    category_id: int = Field(..., gt=0)
    brand: Optional[str] = Field(None, max_length=100)
    image_url: Optional[str] = None
    stock: int = Field(default=0, ge=0)
    tags: List[str] = Field(default=[], max_items=20)
    features: Dict[str, Any] = Field(default={})
    
    @validator('price')
    def price_not_too_large(cls, v):
        if v > 1000000:
            raise ValueError('Price must be reasonable')
        return v


class ProductCreate(ProductBase):
    pass


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    category_id: int
    brand: Optional[str]
    image_url: Optional[str]
    stock: int
    tags: List[str]
    features: Dict[str, Any]
    view_count: int
    purchase_count: int
    rating: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductWithRecommendationReason(ProductResponse):
    recommendation_reason: Optional[str] = None
    relevance_score: Optional[float] = None


# Category Schemas
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    
    class Config:
        from_attributes = True


# Interaction Schemas
class InteractionCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    interaction_type: str  # "view", "click", "add_to_cart", "wishlist", "purchase"
    duration_seconds: Optional[int] = Field(None, ge=0)
    source: Optional[str] = None
    
    @validator('interaction_type')
    def valid_interaction_type(cls, v):
        valid_types = ['view', 'click', 'add_to_cart', 'wishlist', 'purchase']
        if v not in valid_types:
            raise ValueError(f'Interaction type must be one of: {", ".join(valid_types)}')
        return v


class InteractionResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    interaction_type: str
    timestamp: datetime
    
    class Config:
        from_attributes = True


# Cart Schemas
class CartItemAdd(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(default=1, ge=1, le=1000)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    added_at: datetime
    product: ProductResponse
    
    class Config:
        from_attributes = True


# Wishlist Schemas
class WishlistAdd(BaseModel):
    product_id: int


class WishlistResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    added_at: datetime
    product: ProductResponse
    
    class Config:
        from_attributes = True


# Purchase Schemas
class PurchaseCreate(BaseModel):
    items: List[Dict[str, int]]  # [{"product_id": 1, "quantity": 2}]


class PurchaseResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    price_paid: float
    purchased_at: datetime
    
    class Config:
        from_attributes = True


# Recommendation Schemas
class RecommendationRequest(BaseModel):
    limit: int = Field(default=10, ge=1, le=50)
    exclude_viewed: bool = True
    category_id: Optional[int] = None


class RecommendationResponse(BaseModel):
    recommendations: List[ProductWithRecommendationReason]
    strategy_used: str
    personalization_level: str  # "cold_start", "warming_up", "personalized"


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
