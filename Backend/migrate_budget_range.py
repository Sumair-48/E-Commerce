"""
Migration script to update budget_range column from String to JSON type
Run this script to update existing database records
"""

import sqlite3
import json
from database import DATABASE_URL

def migrate_budget_range():
    """Migrate budget_range from string to JSON format"""
    
    # Parse database URL
    if DATABASE_URL.startswith('sqlite:///'):
        db_path = DATABASE_URL.replace('sqlite:///', '')
    else:
        db_path = DATABASE_URL
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current schema
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        
        print("Current users table schema:")
        for col in columns:
            print(f"  {col[1]}: {col[2]}")
        
        # Get all users with budget_range
        cursor.execute("SELECT id, budget_range FROM users WHERE budget_range IS NOT NULL")
        users = cursor.fetchall()
        
        print(f"\nFound {len(users)} users with budget_range")
        
        # Update each user's budget_range to JSON format
        updated_count = 0
        for user_id, budget_range in users:
            try:
                # If it's already a JSON string, parse and re-serialize
                if budget_range:
                    if isinstance(budget_range, str):
                        # Try to parse as JSON
                        try:
                            parsed = json.loads(budget_range)
                            if isinstance(parsed, list):
                                # It's already a list format
                                cursor.execute(
                                    "UPDATE users SET budget_range = ? WHERE id = ?",
                                    (json.dumps(parsed), user_id)
                                )
                            else:
                                # Convert to default range
                                cursor.execute(
                                    "UPDATE users SET budget_range = ? WHERE id = ?",
                                    (json.dumps([100, 1000]), user_id)
                                )
                            updated_count += 1
                        except json.JSONDecodeError:
                            # Not valid JSON, set to default
                            cursor.execute(
                                "UPDATE users SET budget_range = ? WHERE id = ?",
                                (json.dumps([100, 1000]), user_id)
                            )
                            updated_count += 1
            except Exception as e:
                print(f"Error updating user {user_id}: {e}")
        
        conn.commit()
        print(f"\nMigration completed. Updated {updated_count} users.")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_budget_range()
