"""
Seed script to populate the database with sample data
"""
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from models import Category, Product, User, UserProfile
from auth import get_password_hash
import random


def seed_database():
    """Populate database with sample data"""
    
    db: Session = SessionLocal()
    
    try:
        # Initialize database
        init_db()
        
        print("🌱 Seeding database...")
        
        # Create categories
        categories_data = [
            {"name": "Electronics", "description": "Electronic devices and gadgets"},
            {"name": "Clothing", "description": "Fashion and apparel"},
            {"name": "Home & Kitchen", "description": "Home appliances and kitchenware"},
            {"name": "Books", "description": "Books and literature"},
            {"name": "Sports & Outdoors", "description": "Sports equipment and outdoor gear"},
            {"name": "Beauty", "description": "Beauty and personal care products"},
            {"name": "Toys & Games", "description": "Toys and gaming products"},
            {"name": "Automotive", "description": "Automotive parts and accessories"},
        ]
        
        categories = []
        for cat_data in categories_data:
            existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing:
                category = Category(**cat_data)
                db.add(category)
                categories.append(category)
            else:
                categories.append(existing)
        
        db.commit()
        print(f"✅ Created {len(categories)} categories")
        
        # Refresh to get IDs
        for cat in categories:
            db.refresh(cat)
        
        # Create products
        products_data = [
            # Electronics
            {
                "name": "Wireless Noise-Cancelling Headphones",
                "description": "Premium over-ear headphones with active noise cancellation and 30-hour battery life",
                "price": 299.99,
                "category_id": categories[0].id,
                "brand": "SoundPro",
                "stock": 50,
                "tags": ["wireless", "bluetooth", "noise-cancelling", "premium", "audio"],
                "features": {"color": "black", "battery": "30hrs", "wireless": True},
                "rating": 4.5
            },
            {
                "name": "4K Smart TV 55-inch",
                "description": "Ultra HD smart television with HDR and built-in streaming apps",
                "price": 599.99,
                "category_id": categories[0].id,
                "brand": "VisionTech",
                "stock": 25,
                "tags": ["tv", "4k", "smart", "hdr", "entertainment"],
                "features": {"size": "55-inch", "resolution": "4K", "smart": True},
                "rating": 4.3
            },
            {
                "name": "Smartphone Pro Max",
                "description": "Latest flagship smartphone with advanced camera system and 5G",
                "price": 1099.99,
                "category_id": categories[0].id,
                "brand": "TechPhone",
                "stock": 100,
                "tags": ["smartphone", "5g", "camera", "flagship", "mobile"],
                "features": {"storage": "256GB", "camera": "triple", "5g": True},
                "rating": 4.7
            },
            {
                "name": "Laptop Ultrabook 13-inch",
                "description": "Lightweight laptop with powerful performance and all-day battery",
                "price": 899.99,
                "category_id": categories[0].id,
                "brand": "CompuMax",
                "stock": 40,
                "tags": ["laptop", "ultrabook", "portable", "productivity"],
                "features": {"ram": "16GB", "storage": "512GB SSD", "weight": "1.2kg"},
                "rating": 4.6
            },
            {
                "name": "Wireless Gaming Mouse",
                "description": "Precision gaming mouse with customizable RGB lighting",
                "price": 79.99,
                "category_id": categories[0].id,
                "brand": "GameGear",
                "stock": 150,
                "tags": ["gaming", "mouse", "wireless", "rgb"],
                "features": {"dpi": "16000", "wireless": True, "rgb": True},
                "rating": 4.4
            },
            
            # Clothing
            {
                "name": "Premium Cotton T-Shirt",
                "description": "Comfortable 100% organic cotton t-shirt",
                "price": 29.99,
                "category_id": categories[1].id,
                "brand": "EcoWear",
                "stock": 200,
                "tags": ["clothing", "casual", "organic", "comfortable"],
                "features": {"material": "organic cotton", "fit": "regular"},
                "rating": 4.2
            },
            {
                "name": "Denim Jeans Classic Fit",
                "description": "Timeless denim jeans with classic fit",
                "price": 69.99,
                "category_id": categories[1].id,
                "brand": "DenimCo",
                "stock": 120,
                "tags": ["jeans", "denim", "casual", "classic"],
                "features": {"material": "denim", "fit": "classic"},
                "rating": 4.3
            },
            {
                "name": "Winter Jacket Waterproof",
                "description": "Insulated waterproof jacket for cold weather",
                "price": 149.99,
                "category_id": categories[1].id,
                "brand": "OutdoorPro",
                "stock": 60,
                "tags": ["jacket", "winter", "waterproof", "warm"],
                "features": {"waterproof": True, "insulated": True},
                "rating": 4.6
            },
            {
                "name": "Running Shoes Performance",
                "description": "Lightweight running shoes with responsive cushioning",
                "price": 119.99,
                "category_id": categories[1].id,
                "brand": "RunFast",
                "stock": 80,
                "tags": ["shoes", "running", "athletic", "performance"],
                "features": {"cushioning": "responsive", "weight": "lightweight"},
                "rating": 4.5
            },
            
            # Home & Kitchen
            {
                "name": "Coffee Maker Automatic",
                "description": "Programmable coffee maker with thermal carafe",
                "price": 89.99,
                "category_id": categories[2].id,
                "brand": "BrewMaster",
                "stock": 70,
                "tags": ["coffee", "kitchen", "appliance", "automatic"],
                "features": {"capacity": "12 cups", "programmable": True},
                "rating": 4.3
            },
            {
                "name": "Blender High-Speed",
                "description": "Professional-grade blender for smoothies and more",
                "price": 129.99,
                "category_id": categories[2].id,
                "brand": "BlendPro",
                "stock": 55,
                "tags": ["blender", "kitchen", "smoothie", "appliance"],
                "features": {"power": "1500W", "speed": "high"},
                "rating": 4.4
            },
            {
                "name": "Non-Stick Cookware Set",
                "description": "10-piece non-stick cookware set with lids",
                "price": 199.99,
                "category_id": categories[2].id,
                "brand": "ChefPro",
                "stock": 40,
                "tags": ["cookware", "kitchen", "non-stick", "set"],
                "features": {"pieces": 10, "non-stick": True},
                "rating": 4.5
            },
            {
                "name": "Robot Vacuum Cleaner",
                "description": "Smart robot vacuum with app control and scheduling",
                "price": 299.99,
                "category_id": categories[2].id,
                "brand": "CleanBot",
                "stock": 35,
                "tags": ["vacuum", "robot", "smart", "cleaning"],
                "features": {"smart": True, "app-control": True},
                "rating": 4.6
            },
            
            # Books
            {
                "name": "The Art of Programming",
                "description": "Comprehensive guide to software development",
                "price": 49.99,
                "category_id": categories[3].id,
                "brand": "TechBooks",
                "stock": 100,
                "tags": ["book", "programming", "education", "software"],
                "features": {"pages": 800, "format": "hardcover"},
                "rating": 4.7
            },
            {
                "name": "Mystery Novel Collection",
                "description": "Bestselling mystery novels box set",
                "price": 39.99,
                "category_id": categories[3].id,
                "brand": "ReadWell",
                "stock": 150,
                "tags": ["book", "fiction", "mystery", "collection"],
                "features": {"books": 5, "format": "paperback"},
                "rating": 4.4
            },
            
            # Sports & Outdoors
            {
                "name": "Yoga Mat Premium",
                "description": "Extra thick yoga mat with carrying strap",
                "price": 39.99,
                "category_id": categories[4].id,
                "brand": "YogaPro",
                "stock": 90,
                "tags": ["yoga", "fitness", "exercise", "mat"],
                "features": {"thickness": "6mm", "non-slip": True},
                "rating": 4.5
            },
            {
                "name": "Camping Tent 4-Person",
                "description": "Waterproof camping tent with easy setup",
                "price": 179.99,
                "category_id": categories[4].id,
                "brand": "CampMaster",
                "stock": 30,
                "tags": ["camping", "tent", "outdoor", "waterproof"],
                "features": {"capacity": "4-person", "waterproof": True},
                "rating": 4.4
            },
            {
                "name": "Mountain Bike 27.5-inch",
                "description": "Durable mountain bike with suspension",
                "price": 499.99,
                "category_id": categories[4].id,
                "brand": "RidePro",
                "stock": 25,
                "tags": ["bike", "cycling", "mountain", "outdoor"],
                "features": {"wheel-size": "27.5-inch", "suspension": True},
                "rating": 4.6
            },
            
            # Beauty
            {
                "name": "Skincare Set Complete",
                "description": "Complete skincare routine with cleanser, toner, and moisturizer",
                "price": 89.99,
                "category_id": categories[5].id,
                "brand": "GlowBeauty",
                "stock": 100,
                "tags": ["skincare", "beauty", "set", "organic"],
                "features": {"products": 5, "organic": True},
                "rating": 4.5
            },
            {
                "name": "Hair Dryer Professional",
                "description": "Ionic hair dryer with multiple heat settings",
                "price": 79.99,
                "category_id": categories[5].id,
                "brand": "StylePro",
                "stock": 60,
                "tags": ["hair", "dryer", "beauty", "professional"],
                "features": {"ionic": True, "power": "1875W"},
                "rating": 4.3
            },
            
            # Toys & Games
            {
                "name": "Board Game Strategy",
                "description": "Award-winning strategy board game for family fun",
                "price": 44.99,
                "category_id": categories[6].id,
                "brand": "GameNight",
                "stock": 80,
                "tags": ["board-game", "strategy", "family", "entertainment"],
                "features": {"players": "2-4", "age": "10+"},
                "rating": 4.7
            },
            {
                "name": "Building Blocks Creative Set",
                "description": "Educational building blocks for creative play",
                "price": 59.99,
                "category_id": categories[6].id,
                "brand": "BuildFun",
                "stock": 120,
                "tags": ["toys", "building", "educational", "creative"],
                "features": {"pieces": 500, "age": "5+"},
                "rating": 4.6
            },
            
            # Automotive
            {
                "name": "Car Phone Mount Magnetic",
                "description": "Strong magnetic phone mount for car dashboard",
                "price": 24.99,
                "category_id": categories[7].id,
                "brand": "AutoGear",
                "stock": 200,
                "tags": ["automotive", "phone", "mount", "accessory"],
                "features": {"magnetic": True, "360-rotation": True},
                "rating": 4.3
            },
            {
                "name": "Dash Cam HD",
                "description": "High-definition dash camera with night vision",
                "price": 129.99,
                "category_id": categories[7].id,
                "brand": "DriveSafe",
                "stock": 45,
                "tags": ["dashcam", "automotive", "camera", "safety"],
                "features": {"resolution": "1080p", "night-vision": True},
                "rating": 4.5
            },
            
            # Additional Electronics
            {
                "name": "Smart Watch Pro",
                "description": "Advanced smartwatch with health monitoring and GPS",
                "price": 349.99,
                "category_id": categories[0].id,
                "brand": "TechWear",
                "stock": 60,
                "tags": ["smartwatch", "fitness", "gps", "health"],
                "features": {"gps": True, "waterproof": True, "heart-rate": True},
                "rating": 4.6
            },
            {
                "name": "Wireless Earbuds Pro",
                "description": "True wireless earbuds with active noise cancellation",
                "price": 199.99,
                "category_id": categories[0].id,
                "brand": "SoundPro",
                "stock": 120,
                "tags": ["earbuds", "wireless", "noise-cancelling", "audio"],
                "features": {"noise-cancelling": True, "battery": "24hrs", "waterproof": True},
                "rating": 4.5
            },
            {
                "name": "Tablet 10-inch HD",
                "description": "Versatile tablet for work and entertainment",
                "price": 449.99,
                "category_id": categories[0].id,
                "brand": "TabTech",
                "stock": 45,
                "tags": ["tablet", "portable", "entertainment", "work"],
                "features": {"screen": "10-inch", "storage": "128GB", "stylus": True},
                "rating": 4.4
            },
            {
                "name": "Mechanical Keyboard RGB",
                "description": "Premium mechanical keyboard with customizable RGB",
                "price": 149.99,
                "category_id": categories[0].id,
                "brand": "KeyMaster",
                "stock": 80,
                "tags": ["keyboard", "mechanical", "gaming", "rgb"],
                "features": {"switches": "Cherry MX", "rgb": True, "wireless": True},
                "rating": 4.7
            },
            
            # Additional Clothing
            {
                "name": "Hoodie Premium Cotton",
                "description": "Comfortable premium cotton hoodie with kangaroo pocket",
                "price": 59.99,
                "category_id": categories[1].id,
                "brand": "ComfortWear",
                "stock": 150,
                "tags": ["hoodie", "casual", "comfortable", "cotton"],
                "features": {"material": "premium cotton", "pocket": True},
                "rating": 4.4
            },
            {
                "name": "Polo Shirt Classic",
                "description": "Classic polo shirt for casual and semi-formal wear",
                "price": 39.99,
                "category_id": categories[1].id,
                "brand": "StyleCo",
                "stock": 180,
                "tags": ["polo", "casual", "classic", "shirt"],
                "features": {"material": "cotton blend", "collar": "classic"},
                "rating": 4.3
            },
            {
                "name": "Sneakers Urban",
                "description": "Stylish urban sneakers for everyday wear",
                "price": 89.99,
                "category_id": categories[1].id,
                "brand": "UrbanStep",
                "stock": 95,
                "tags": ["sneakers", "casual", "urban", "comfortable"],
                "features": {"material": "canvas", "sole": "rubber"},
                "rating": 4.5
            },
            
            # Additional Home & Kitchen
            {
                "name": "Air Fryer Digital",
                "description": "Digital air fryer for healthy cooking",
                "price": 149.99,
                "category_id": categories[2].id,
                "brand": "HealthyChef",
                "stock": 55,
                "tags": ["air-fryer", "kitchen", "appliance", "healthy"],
                "features": {"capacity": "5.5L", "digital": True, "timer": True},
                "rating": 4.6
            },
            {
                "name": "Electric Kettle 1.7L",
                "description": "Fast boiling electric kettle with auto shut-off",
                "price": 49.99,
                "category_id": categories[2].id,
                "brand": "BoilMaster",
                "stock": 100,
                "tags": ["kettle", "kitchen", "appliance", "electric"],
                "features": {"capacity": "1.7L", "auto-shutoff": True},
                "rating": 4.4
            },
            {
                "name": "Food Processor 12-Cup",
                "description": "Powerful food processor for meal prep",
                "price": 179.99,
                "category_id": categories[2].id,
                "brand": "PrepPro",
                "stock": 40,
                "tags": ["food-processor", "kitchen", "appliance", "prep"],
                "features": {"capacity": "12 cups", "power": "1000W"},
                "rating": 4.5
            },
            
            # Additional Books
            {
                "name": "Science Fiction Trilogy",
                "description": "Epic science fiction trilogy collection",
                "price": 34.99,
                "category_id": categories[3].id,
                "brand": "SciFiBooks",
                "stock": 80,
                "tags": ["book", "fiction", "sci-fi", "trilogy"],
                "features": {"books": 3, "format": "paperback"},
                "rating": 4.8
            },
            {
                "name": "Self-Help Guide",
                "description": "Comprehensive guide to personal development",
                "price": 24.99,
                "category_id": categories[3].id,
                "brand": "GrowthBooks",
                "stock": 120,
                "tags": ["book", "self-help", "development", "motivation"],
                "features": {"pages": 350, "format": "paperback"},
                "rating": 4.5
            },
            
            # Additional Sports & Outdoors
            {
                "name": "Dumbbell Set 20kg",
                "description": "Adjustable dumbbell set for home fitness",
                "price": 89.99,
                "category_id": categories[4].id,
                "brand": "FitGear",
                "stock": 50,
                "tags": ["dumbbells", "fitness", "weights", "home-gym"],
                "features": {"weight": "20kg", "adjustable": True},
                "rating": 4.6
            },
            {
                "name": "Tennis Racket Pro",
                "description": "Professional tennis racket for advanced players",
                "price": 159.99,
                "category_id": categories[4].id,
                "brand": "TennisPro",
                "stock": 35,
                "tags": ["tennis", "racket", "sports", "professional"],
                "features": {"weight": "300g", "balance": "head-light"},
                "rating": 4.7
            },
            {
                "name": "Fishing Rod Complete Set",
                "description": "Complete fishing rod set with reel and tackle",
                "price": 79.99,
                "category_id": categories[4].id,
                "brand": "FishMaster",
                "stock": 45,
                "tags": ["fishing", "rod", "outdoor", "sports"],
                "features": {"length": "7ft", "reel": "included"},
                "rating": 4.4
            },
            
            # Additional Beauty
            {
                "name": "Makeup Palette Professional",
                "description": "Professional makeup palette with 36 shades",
                "price": 49.99,
                "category_id": categories[5].id,
                "brand": "GlamBeauty",
                "stock": 90,
                "tags": ["makeup", "palette", "beauty", "professional"],
                "features": {"shades": 36, "matte": True, "shimmer": True},
                "rating": 4.6
            },
            {
                "name": "Perfume Luxury",
                "description": "Long-lasting luxury fragrance",
                "price": 129.99,
                "category_id": categories[5].id,
                "brand": "ScentLux",
                "stock": 40,
                "tags": ["perfume", "fragrance", "beauty", "luxury"],
                "features": {"volume": "100ml", "long-lasting": True},
                "rating": 4.7
            },
            
            # Additional Toys & Games
            {
                "name": "Remote Control Car",
                "description": "High-speed remote control car for all ages",
                "price": 69.99,
                "category_id": categories[6].id,
                "brand": "RCEnterprise",
                "stock": 70,
                "tags": ["rc-car", "toy", "remote-control", "outdoor"],
                "features": {"speed": "25km/h", "battery": "rechargeable"},
                "rating": 4.5
            },
            {
                "name": "Puzzle 1000 Pieces",
                "description": "Challenging 1000-piece jigsaw puzzle",
                "price": 24.99,
                "category_id": categories[6].id,
                "brand": "PuzzleMaster",
                "stock": 100,
                "tags": ["puzzle", "jigsaw", "game", "educational"],
                "features": {"pieces": 1000, "difficulty": "hard"},
                "rating": 4.4
            },
            
            # Additional Automotive
            {
                "name": "Car Vacuum Cleaner Portable",
                "description": "Portable car vacuum cleaner for quick cleanups",
                "price": 39.99,
                "category_id": categories[7].id,
                "brand": "AutoClean",
                "stock": 85,
                "tags": ["vacuum", "automotive", "cleaner", "portable"],
                "features": {"power": "100W", "cordless": True},
                "rating": 4.3
            },
            {
                "name": "LED Car Interior Lights",
                "description": "LED interior light kit for cars",
                "price": 29.99,
                "category_id": categories[7].id,
                "brand": "AutoGlow",
                "stock": 150,
                "tags": ["led", "automotive", "lights", "interior"],
                "features": {"rgb": True, "remote": True},
                "rating": 4.4
            },
        ]
        
        products = []
        for prod_data in products_data:
            existing = db.query(Product).filter(Product.name == prod_data["name"]).first()
            if not existing:
                product = Product(**prod_data)
                # Add some random view and purchase counts
                product.view_count = random.randint(10, 500)
                product.purchase_count = random.randint(0, 50)
                db.add(product)
                products.append(product)
            else:
                products.append(existing)
        
        db.commit()
        print(f"✅ Created {len(products)} products")
        
        # Create a demo user
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            demo_user = User(
                email="demo@example.com",
                username="demo",
                hashed_password=get_password_hash("demo123"),
                preferred_categories=[categories[0].id, categories[4].id],  # Electronics, Sports
                budget_range="medium",
                shopping_intent="casual",
                interests=["wireless", "fitness", "outdoor", "tech"]
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            
            # Create profile
            profile = UserProfile(user_id=demo_user.id)
            db.add(profile)
            db.commit()
            
            print("✅ Created demo user (username: demo, password: demo123)")
        
        # Create an admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@example.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_admin=True,
                preferred_categories=[categories[0].id, categories[1].id, categories[2].id],  # All main categories
                budget_range="high",
                shopping_intent="casual",
                interests=["electronics", "fashion", "home", "tech"]
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            
            # Create profile
            profile = UserProfile(user_id=admin_user.id)
            db.add(profile)
            db.commit()
            
            print("✅ Created admin user (username: admin, password: admin123)")
        
        print("🎉 Database seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
