import sqlite3
import os

# Point to the REAL database in AppData
appdata = os.environ.get('APPDATA')
db_name = os.path.join(appdata, 'DenimGym', 'database', 'denimgym.db')

print(f"\nLooking for database at: {db_name}")

# Check if database exists
if not os.path.exists(db_name):
    print(f"Database not found!\n")
    exit()

print("Database found!")

# Connect to database
conn = sqlite3.connect(db_name)
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print(f"\n=== Database: denimgym.db ===\n")

if tables:
    print("Tables found:")
    for table in tables:
        table_name = table[0]
        print(f"\n--- Table: {table_name} ---")
        
        # Get table data
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col[1] for col in cursor.fetchall()]
        
        print("Columns:", ", ".join(columns))
        print(f"Rows: {len(rows)}")
        
        # Display first 3 rows
        for row in rows[:3]:
            print(row)
        
        if len(rows) > 3:
            print(f"... and {len(rows) - 3} more rows")
else:
    print("No tables found. Database is empty.")

conn.close()