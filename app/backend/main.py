from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import sqlite3
import jwt
from datetime import datetime, timedelta
import hashlib
import os
import shutil
from pathlib import Path
from sqlalchemy.orm import Session

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:50998",
    "http://127.0.0.1:50998",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add middleware to log CORS headers
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = request.headers.get("origin", "*")
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Expose-Headers"] = "*"
    return response

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
DEFAULT_PHOTO = "default_doctor.png"

# Mount static files directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Add cache control headers for static files
@app.middleware("http")
async def add_cache_control(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/uploads/"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

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
        photo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Check if photo column exists, if not add it
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'photo' not in columns:
        print("Adding photo column to users table")
        cursor.execute("ALTER TABLE users ADD COLUMN photo TEXT")
    
    # Check if admin user exists
    cursor.execute("SELECT id FROM users WHERE email = ? AND role = ?", ("admin@clinic.com", "admin"))
    admin_exists = cursor.fetchone()
    
    if not admin_exists:
        print("Admin user not found, creating new admin account")
        admin_password = hashlib.sha256("admin123".encode()).hexdigest()
        cursor.execute('''
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', ("Admin", "Admin", "admin@clinic.com", "+79999999999", admin_password, "admin"))
        print("Admin user created successfully")
    
    # Create doctors table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        photo TEXT,
        position TEXT NOT NULL,
        qualification TEXT NOT NULL,
        age INTEGER NOT NULL,
        experience INTEGER NOT NULL,
        specializations TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    ''')
    
    # Log table structure
    cursor.execute("PRAGMA table_info(doctors)")
    columns = cursor.fetchall()
    print("Doctors table structure:")
    for col in columns:
        print(f"Column: {col[1]}, Type: {col[2]}, Nullable: {col[3]}")
    
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

    class Config:
        from_attributes = True

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
    created_at: Optional[str] = None
    photo: Optional[str] = None

class DoctorCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    password: str
    position: str
    qualification: str
    age: int
    experience: int
    specializations: list[str]

class Doctor(BaseModel):
    id: int
    user_id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    photo: Optional[str]
    position: str
    qualification: str
    age: int
    experience: int
    specializations: list[str]

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
        print("\n=== START GET CURRENT USER ===")
        print(f"Received credentials: {credentials.credentials}")
        
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        print(f"Decoded user_id: {user_id}")
        
        if user_id is None:
            print("No user_id in token")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
            
        conn = sqlite3.connect('clinic.db')
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        if user is None:
            print(f"User with ID {user_id} not found in database")
            raise HTTPException(status_code=401, detail="User not found")
        
        print(f"Found user: {user}")
        print("=== END GET CURRENT USER ===\n")
        
        return {
            "id": user[0],
            "first_name": user[1],
            "last_name": user[2],
            "email": user[3],
            "phone": user[4],
            "role": user[6],
            "photo": user[7],
            "created_at": user[8]
        }
    except jwt.PyJWTError as e:
        print(f"JWT Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except Exception as e:
        print(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Routes
@app.get("/users/me", response_model=User)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # Convert datetime to string if it exists
    if current_user.get("created_at"):
        current_user["created_at"] = str(current_user["created_at"])
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
        "photo": user[7],
        "created_at": user[8]
    } for user in users]

@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    print(f"\n=== START REGISTRATION ===")
    print(f"Received user data: {user}")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user.email,))
        if cursor.fetchone():
            print("Email already registered")
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
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
        print(f"User created successfully with ID: {user_id}")
        
        # Create access token
        access_token = create_access_token({"sub": str(user_id), "role": role})
        print("=== END REGISTRATION ===\n")
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

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

@app.post("/doctors", response_model=Doctor)
async def create_doctor(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    position: str = Form(...),
    qualification: str = Form(...),
    age: int = Form(...),
    experience: int = Form(...),
    specializations: str = Form(...),
    photo: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    try:
        # Create user first
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        cursor.execute('''
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (first_name, last_name, email, phone, password_hash, "doctor"))
        
        user_id = cursor.lastrowid
        print(f"Created user with ID: {user_id}")
        
        # Handle photo upload
        photo_path = f"/uploads/{DEFAULT_PHOTO}"  # Путь к дефолтной фотографии
        if photo:
            # Generate unique filename
            file_extension = os.path.splitext(photo.filename)[1]
            filename = f"doctor_{user_id}{file_extension}"
            photo_path = f"/uploads/{filename}"  # Путь к загруженной фотографии
            
            # Save the file
            full_path = UPLOAD_DIR / filename
            print(f"Attempting to save photo to: {full_path}")
            print(f"Current working directory: {os.getcwd()}")
            print(f"Upload directory exists: {UPLOAD_DIR.exists()}")
            
            with open(full_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            
            print(f"Successfully saved photo to: {full_path}")
            print(f"File exists after save: {full_path.exists()}")
            print(f"File size: {full_path.stat().st_size} bytes")
            print(f"Photo path in database: {photo_path}")
        
        # Обработка специализаций
        specializations = specializations.replace('[', '').replace(']', '').replace('"', '').replace('\\', '')
        # Разбиение на список и очистка каждой специализации
        specializations_list = [spec.strip() for spec in specializations.split(',')]
        # Удаляем пустые строки и дубликаты
        specializations_list = list(dict.fromkeys([spec for spec in specializations_list if spec]))
        # Сбор обратно в строку
        specializations = ','.join(specializations_list)
        
        # Create doctor record
        cursor.execute('''
        INSERT INTO doctors (user_id, position, qualification, age, experience, specializations, photo)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, position, qualification, age, experience, specializations, photo_path))
        
        doctor_id = cursor.lastrowid
        print(f"Created doctor with ID: {doctor_id}")
        
        # Verify the photo path was saved correctly
        cursor.execute('SELECT photo FROM doctors WHERE id = ?', (doctor_id,))
        saved_photo_path = cursor.fetchone()[0]
        print(f"Photo path saved in database: {saved_photo_path}")
        
        conn.commit()
        
        # Return created doctor
        cursor.execute('''
        SELECT 
            d.id,
            d.user_id,
            d.photo,
            d.position,
            d.qualification,
            d.age,
            d.experience,
            d.specializations,
            u.first_name,
            u.last_name,
            u.email,
            u.phone
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
        ''', (doctor_id,))
        
        doctor_data = cursor.fetchone()
        print(f"Created doctor with photo path: {doctor_data[2]}")
        return {
            "id": doctor_data[0],
            "user_id": doctor_data[1],
            "photo": doctor_data[2],
            "position": doctor_data[3],
            "qualification": doctor_data[4],
            "age": doctor_data[5],
            "experience": doctor_data[6],
            "specializations": doctor_data[7].split(','),
            "first_name": doctor_data[8],
            "last_name": doctor_data[9],
            "email": doctor_data[10],
            "phone": doctor_data[11]
        }
    except sqlite3.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    finally:
        conn.close()

@app.get("/doctors", response_model=list[Doctor])
async def get_doctors(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT 
        d.id,
        d.user_id,
        d.photo,
        d.position,
        d.qualification,
        d.age,
        d.experience,
        d.specializations,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    ''')
    
    doctors = cursor.fetchall()
    conn.close()
    
    result = [{
        "id": doctor[0],
        "user_id": doctor[1],
        "photo": doctor[2],
        "position": doctor[3],
        "qualification": doctor[4],
        "age": doctor[5],
        "experience": doctor[6],
        "specializations": [spec.strip() for spec in doctor[7].split(',')],
        "first_name": doctor[8],
        "last_name": doctor[9],
        "email": doctor[10],
        "phone": doctor[11]
    } for doctor in doctors]
    
    print(f"Retrieved doctors: {result}")
    return result

@app.delete("/doctors/{doctor_id}")
async def delete_doctor(doctor_id: int, current_user: dict = Depends(get_current_user)):
    print(f"Attempting to delete doctor with ID: {doctor_id}")
    
    if current_user["role"] != "admin":
        print("Unauthorized attempt to delete doctor")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    try:
        # Получаем данные врача
        cursor.execute("SELECT user_id, photo FROM doctors WHERE id = ?", (doctor_id,))
        doctor = cursor.fetchone()
        
        if not doctor:
            print(f"Doctor with ID {doctor_id} not found")
            conn.close()
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        user_id, photo = doctor
        print(f"Found doctor: user_id={user_id}, photo={photo}")
        
        # Удаляем фото, если оно не является дефолтным
        if photo and photo != DEFAULT_PHOTO:
            photo_path = UPLOAD_DIR / photo
            if photo_path.exists():
                print(f"Deleting photo: {photo_path}")
                photo_path.unlink()
        
        # Удаляем запись из таблицы doctors
        print(f"Deleting doctor record with ID: {doctor_id}")
        cursor.execute("DELETE FROM doctors WHERE id = ?", (doctor_id,))
        
        # Удаляем связанного пользователя
        print(f"Deleting user record with ID: {user_id}")
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        
        conn.commit()
        print("Database changes committed successfully")
        conn.close()
        
        return {"message": "Doctor deleted successfully"}
    except Exception as e:
        print(f"Error deleting doctor: {str(e)}")
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/doctors/{doctor_id}")
async def update_doctor(
    doctor_id: int,
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    qualification: Optional[str] = Form(None),
    age: Optional[int] = Form(None),
    experience: Optional[int] = Form(None),
    specializations: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    print("\n=== START DOCTOR UPDATE ===")
    print(f"Doctor ID: {doctor_id}")
    print(f"Received data: first_name={first_name}, last_name={last_name}, email={email}, phone={phone}")
    print(f"Specializations: {specializations}")
    print(f"Photo: {photo.filename if photo else 'None'}")
    
    conn = sqlite3.connect('clinic.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        # Начинаем транзакцию
        cursor.execute("BEGIN TRANSACTION")
        print("\nTransaction started")
        
        # Get doctor and user IDs
        cursor.execute("SELECT user_id, photo FROM doctors WHERE id = ?", (doctor_id,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        user_id, current_photo = result["user_id"], result["photo"]
        print(f"\nFound doctor: user_id={user_id}, current_photo={current_photo}")
        
        # Update user data if any fields are provided
        update_user_fields = []
        update_user_values = []
        
        if first_name is not None:
            update_user_fields.append("first_name = ?")
            update_user_values.append(first_name)
            print(f"Will update first_name to: {first_name}")
        if last_name is not None:
            update_user_fields.append("last_name = ?")
            update_user_values.append(last_name)
            print(f"Will update last_name to: {last_name}")
        if email is not None:
            update_user_fields.append("email = ?")
            update_user_values.append(email)
            print(f"Will update email to: {email}")
        if phone is not None:
            update_user_fields.append("phone = ?")
            update_user_values.append(phone)
            print(f"Will update phone to: {phone}")
        
        if update_user_fields:
            update_user_values.append(user_id)
            update_query = f'''
            UPDATE users 
            SET {', '.join(update_user_fields)}
            WHERE id = ?
            '''
            print(f"\nExecuting user update query: {update_query}")
            print(f"With values: {update_user_values}")
            cursor.execute(update_query, update_user_values)
            affected_rows = cursor.rowcount
            print(f"Updated user record: {affected_rows} rows affected")
            
            if affected_rows == 0:
                print("ERROR: No rows were updated in users table")
                raise HTTPException(status_code=500, detail="Failed to update user data")
            
            # Verify the update
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            updated_user = cursor.fetchone()
            print(f"User data after update: {dict(updated_user)}")
        
        # Handle photo upload
        photo_path = current_photo
        if photo:
            print(f"\nProcessing new photo upload: {photo.filename}")
            # Delete old photo if it's not the default one
            if current_photo and current_photo != f"/uploads/{DEFAULT_PHOTO}":
                old_photo_path = UPLOAD_DIR / current_photo.split('/')[-1]
                if old_photo_path.exists():
                    print(f"Deleting old photo: {old_photo_path}")
                    old_photo_path.unlink()
            
            # Save new photo
            file_extension = os.path.splitext(photo.filename)[1]
            filename = f"doctor_{user_id}{file_extension}"
            photo_path = f"/uploads/{filename}"
            
            full_path = UPLOAD_DIR / filename
            print(f"Saving new photo to: {full_path}")
            with open(full_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            print(f"Photo saved successfully")
        
        # Update doctor data if any fields are provided
        update_doctor_fields = []
        update_doctor_values = []
        
        if position is not None:
            update_doctor_fields.append("position = ?")
            update_doctor_values.append(position)
            print(f"Will update position to: {position}")
        if qualification is not None:
            update_doctor_fields.append("qualification = ?")
            update_doctor_values.append(qualification)
            print(f"Will update qualification to: {qualification}")
        if age is not None:
            update_doctor_fields.append("age = ?")
            update_doctor_values.append(age)
            print(f"Will update age to: {age}")
        if experience is not None:
            update_doctor_fields.append("experience = ?")
            update_doctor_values.append(experience)
            print(f"Will update experience to: {experience}")
        if specializations is not None:
            # Очищаем специализации от лишних символов
            cleaned_specializations = specializations.replace('[', '').replace(']', '').replace('"', '').replace('\\', '')
            # Разделяем по запятой и удаляем пробелы в начале и конце каждой специализации
            specializations_list = [spec.strip() for spec in cleaned_specializations.split(',')]
            # Удаляем пустые строки и дубликаты
            specializations_list = list(dict.fromkeys([spec for spec in specializations_list if spec]))
            # Собираем обратно в строку
            cleaned_specializations = ','.join(specializations_list)
            update_doctor_fields.append("specializations = ?")
            update_doctor_values.append(cleaned_specializations)
            print(f"Will update specializations to: {cleaned_specializations}")
        if photo:
            update_doctor_fields.append("photo = ?")
            update_doctor_values.append(photo_path)
            print(f"Will update photo to: {photo_path}")
        
        if update_doctor_fields:
            update_doctor_values.append(doctor_id)
            update_query = f'''
            UPDATE doctors 
            SET {', '.join(update_doctor_fields)}
            WHERE id = ?
            '''
            print(f"\nExecuting doctor update query: {update_query}")
            print(f"With values: {update_doctor_values}")
            cursor.execute(update_query, update_doctor_values)
            affected_rows = cursor.rowcount
            print(f"Updated doctor record: {affected_rows} rows affected")
            
            if affected_rows == 0:
                print("ERROR: No rows were updated in doctors table")
                raise HTTPException(status_code=500, detail="Failed to update doctor data")
            
            # Verify the update
            cursor.execute("SELECT * FROM doctors WHERE id = ?", (doctor_id,))
            updated_doctor = cursor.fetchone()
            print(f"Doctor data after update: {dict(updated_doctor)}")
        
        # Подтверждаем транзакцию
        conn.commit()
        print("\nTransaction committed successfully")
        
        # Get final updated data
        cursor.execute('''
        SELECT 
            d.id,
            d.user_id,
            d.photo,
            d.position,
            d.qualification,
            d.age,
            d.experience,
            d.specializations,
            u.first_name,
            u.last_name,
            u.email,
            u.phone
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
        ''', (doctor_id,))
        
        doctor = cursor.fetchone()
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found after update")
        
        print("\nFinal doctor data:")
        print(f"first_name: {doctor['first_name']}")
        print(f"last_name: {doctor['last_name']}")
        print(f"email: {doctor['email']}")
        print(f"phone: {doctor['phone']}")
        print(f"photo: {doctor['photo']}")
        print("=== END DOCTOR UPDATE ===\n")
        
        return {
            "id": doctor["id"],
            "user_id": doctor["user_id"],
            "photo": doctor["photo"],
            "position": doctor["position"],
            "qualification": doctor["qualification"],
            "age": doctor["age"],
            "experience": doctor["experience"],
            "specializations": [spec.strip() for spec in doctor["specializations"].split(',')],
            "first_name": doctor["first_name"],
            "last_name": doctor["last_name"],
            "email": doctor["email"],
            "phone": doctor["phone"]
        }
    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {str(e)}")
        print("Transaction rolled back")
        print("=== END DOCTOR UPDATE WITH ERROR ===\n")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/doctors/{doctor_id}", response_model=Doctor)
async def get_doctor(doctor_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    cursor.execute('''
    SELECT 
        d.id,
        d.user_id,
        d.photo,
        d.position,
        d.qualification,
        d.age,
        d.experience,
        d.specializations,
        u.first_name,
        u.last_name,
        u.email,
        u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = ?
    ''', (doctor_id,))
    
    doctor = cursor.fetchone()
    conn.close()
    
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return {
        "id": doctor[0],
        "user_id": doctor[1],
        "photo": doctor[2],
        "position": doctor[3],
        "qualification": doctor[4],
        "age": doctor[5],
        "experience": doctor[6],
        "specializations": [spec.strip() for spec in doctor[7].split(',')],
        "first_name": doctor[8],
        "last_name": doctor[9],
        "email": doctor[10],
        "phone": doctor[11]
    }

@app.put("/users/{user_id}")
async def update_user(
    user_id: int,
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    print("\n=== START USER UPDATE ===")
    print(f"Current user: {current_user}")
    print(f"Target user_id: {user_id}")
    print(f"Received data: first_name={first_name}, last_name={last_name}, email={email}, phone={phone}")
    print(f"Photo: {photo.filename if photo else 'None'}")
    
    if current_user["role"] != "admin":
        print("Unauthorized attempt to update user")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    try:
        # Проверяем существование пользователя
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            print(f"User with ID {user_id} not found")
            raise HTTPException(status_code=404, detail=f"User with ID {user_id} not found")
        
        print(f"Found user: {user}")
        
        # Обновляем данные пользователя
        update_fields = []
        update_values = []
        
        if first_name is not None:
            update_fields.append("first_name = ?")
            update_values.append(first_name)
        if last_name is not None:
            update_fields.append("last_name = ?")
            update_values.append(last_name)
        if email is not None:
            update_fields.append("email = ?")
            update_values.append(email)
        if phone is not None:
            update_fields.append("phone = ?")
            update_values.append(phone)
        
        # Обработка фото
        if photo:
            print(f"Processing photo upload: {photo.filename}")
            # Генерируем уникальное имя файла
            file_extension = os.path.splitext(photo.filename)[1]
            filename = f"user_{user_id}{file_extension}"
            full_path = UPLOAD_DIR / filename
            
            # Сохраняем файл
            with open(full_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            
            update_fields.append("photo = ?")
            update_values.append(f"/uploads/{filename}")  # Сохраняем полный путь
            print(f"Photo saved to: {full_path}")
        
        if update_fields:
            update_values.append(user_id)
            update_query = f'''
            UPDATE users 
            SET {', '.join(update_fields)}
            WHERE id = ?
            '''
            print(f"Executing update query: {update_query}")
            print(f"With values: {update_values}")
            cursor.execute(update_query, update_values)
            affected_rows = cursor.rowcount
            print(f"Updated {affected_rows} rows")
            
            if affected_rows == 0:
                print("No rows were updated")
                raise HTTPException(status_code=500, detail="Failed to update user data")
        
        conn.commit()
        print("Transaction committed successfully")
        
        # Получаем обновленные данные
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        updated_user = cursor.fetchone()
        print(f"Updated user data: {updated_user}")
        
        print("=== END USER UPDATE ===\n")
        return {
            "id": updated_user[0],
            "first_name": updated_user[1],
            "last_name": updated_user[2],
            "email": updated_user[3],
            "phone": updated_user[4],
            "role": updated_user[6],
            "photo": updated_user[7],  # Возвращаем обновленный путь к фото
            "created_at": updated_user[8]
        }
    except HTTPException as e:
        print(f"HTTP Exception: {str(e)}")
        conn.rollback()
        raise e
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/users/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(get_current_user)):
    print(f"Attempting to delete user with ID: {user_id}")
    
    if current_user["role"] != "admin":
        print("Unauthorized attempt to delete user")
        raise HTTPException(status_code=403, detail="Not authorized")
    
    conn = sqlite3.connect('clinic.db')
    cursor = conn.cursor()
    
    try:
        # Проверяем, существует ли пользователь
        cursor.execute("SELECT id FROM users WHERE id = ?", (user_id,))
        if not cursor.fetchone():
            print(f"User with ID {user_id} not found")
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
        
        # Удаляем пользователя
        print(f"Deleting user with ID: {user_id}")
        cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
        
        conn.commit()
        print("Database changes committed successfully")
        conn.close()
        
        return {"message": "User deleted successfully"}
    except Exception as e:
        print(f"Error deleting user: {str(e)}")
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=str(e)) 