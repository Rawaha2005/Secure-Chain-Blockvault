from app.core.database import engine, Base, SessionLocal
from app.db.models import User, FileRecord, Block
from app.db.custody_model import CustodyLog
from app.services.auth_service import hash_password
from app.services.blockchain_service import load_chain_from_db, verify_chain, blockchain

print('Creating tables in PostgreSQL (if not existing)...')
Base.metadata.create_all(bind=engine)
print('Tables created/verified successfully!')

db = SessionLocal()

# Seed default test users if not present
test_users = [
    {'username': 'Rawaha', 'email': 'rawaha@securechain.io', 'role': 'admin'},
    {'username': 'nafeesa', 'email': 'nafeesa@securechain.io', 'role': 'officer'},
    {'username': 'investigator1', 'email': 'investigator@securechain.io', 'role': 'investigator'},
    {'username': 'auditor1', 'email': 'auditor@securechain.io', 'role': 'auditor'},
]

for u in test_users:
    existing = db.query(User).filter(User.username == u['username']).first()
    if not existing:
        new_u = User(
            username=u['username'],
            email=u['email'],
            password_hash=hash_password('123'),
            role=u['role'],
            is_active=True
        )
        db.add(new_u)
        print(f"Created user: {u['username']} ({u['role']})")
    else:
        print(f"User already exists: {u['username']} ({existing.role})")

db.commit()

# Ensure blockchain is initialized from DB
load_chain_from_db(db)
is_valid = verify_chain(db)
print(f"Blockchain initialized with {len(blockchain.chain)} blocks. Integrity Valid: {is_valid}")

db.close()
print('Local database setup and verification complete!')
