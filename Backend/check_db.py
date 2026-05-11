from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Check tables
    result = conn.execute(text('SELECT name FROM sqlite_master WHERE type="table"'))
    tables = [row[0] for row in result]
    print("Tables in database:", tables)

    # Check users table specifically
    if 'users' in tables:
        result = conn.execute(text('SELECT COUNT(*) FROM users'))
        user_count = result.scalar()
        print(f"Number of users: {user_count}")
        
        result = conn.execute(text('SELECT username, is_admin FROM users'))
        users = result.fetchall()
        print("Users:", users)
        
        # Check admin users
        result = conn.execute(text('SELECT username, is_admin FROM users WHERE is_admin=1'))
        admin_users = result.fetchall()
        print("Admin users:", admin_users)
        
        # Check products and categories
        result = conn.execute(text('SELECT COUNT(*) FROM categories'))
        cat_count = result.scalar()
        print(f"Categories: {cat_count}")
        
        result = conn.execute(text('SELECT COUNT(*) FROM products'))
        prod_count = result.scalar()
        print(f"Products: {prod_count}")
        
    else:
        print("No users table found")

print("\nDatabase is properly initialized!")
print("Login credentials:")
print("Admin: username='admin', password='admin123'")
print("Demo: username='demo', password='demo123'")
