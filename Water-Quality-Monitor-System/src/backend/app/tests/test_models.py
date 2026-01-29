from app.models import User

def test_user_model_fields():
    user = User(
        name="User",
        email="a@a.com",
        password="hashed",
        role="admin",
        location="Hyderabad"
    )

    assert user.email == "a@a.com"
    assert user.role == "admin"
