from sqlalchemy import inspect
from app.database import Base, engine, SessionLocal
from app.models import User

def test_database_tables_created():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    assert "users" in tables  # adjust table name if different

def test_database_user_insert(db):
    new_user = User(
        email="testuser@example.com",
        password="hashedpassword123"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    assert new_user.id is not None
