from dotenv import load_dotenv
import os

load_dotenv()  


DATABASE_URL = os.getenv("DATABASE_URL")
print(f"settings.py: {DATABASE_URL}")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
