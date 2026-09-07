from app.core.database import engine

try:
    connection = engine.connect()
    print("SUCCESS: PostgreSQL Connected")
    connection.close()

except Exception as e:
    print("ERROR:", e)