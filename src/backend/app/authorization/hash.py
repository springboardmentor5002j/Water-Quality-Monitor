from passlib.context import CryptContext

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    # Ensure the password is a plain string and max 72 chars for bcrypt
    password = str(password)[:72]
    return pwd_ctx.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_ctx.verify(plain_password, hashed_password)
