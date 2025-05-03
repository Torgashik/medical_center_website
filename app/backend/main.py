from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import sqlite3
import jwt
from datetime import datetime, timedelta
import hashlib
import os

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# Database initialization
def init_db():
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create default admin user if not exists
    admin_password = hashlib.sha256("admin123".encode()).hexdigest()
    cursor.execute('''
    INSERT OR IGNORE INTO users (first_name, last_name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', ("Admin", "Admin", "admin@clinic.com", "+79999999999", admin_password, "admin"))
    
    conn.commit()
    conn.close()

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# Pydantic models
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    role: str
    created_at: str

# Helper functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {
        "id": user[0],
        "first_name": user[1],
        "last_name": user[2],
        "email": user[3],
        "phone": user[4],
        "role": user[6],
        "created_at": user[7]
    }

# Routes
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.get("/users", response_model=list[User])
async def get_users(role: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    if role:
        cursor.execute("SELECT * FROM users WHERE role = ?", (role,))
    else:
        cursor.execute("SELECT * FROM users")
    
    users = cursor.fetchall()
    conn.close()
    
    return [{
        "id": user[0],
        "first_name": user[1],
        "last_name": user[2],
        "email": user[3],
        "phone": user[4],
        "role": user[6],
        "created_at": user[7]
    } for user in users]

@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
    if cursor.fetchone():
        conn.close()
        return JSONResponse(
            status_code=400,
            content={"detail": "Email already registered"}
        )
    
    # Hash password
    password_hash = hashlib.sha256(user.password.encode()).hexdigest()
    
    # Insert new user with role based on email
    role = "admin" if user.email == "admin@clinic.com" else "patient"
    cursor.execute('''
    INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (user.first_name, user.last_name, user.email, user.phone, password_hash, role))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Create access token
    access_token = create_access_token({"sub": str(user_id), "role": role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    # Get user
    cursor.execute("SELECT id, password_hash, role FROM users WHERE email = ?", (user.email,))
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid credentials"}
        )
    
    user_id, password_hash, role = result
    
    if not verify_password(user.password, password_hash):
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid credentials"}
        )
    
    # Create access token
    access_token = create_access_token({"sub": str(user_id), "role": role})
    return {"access_token": access_token, "token_type": "bearer"} 