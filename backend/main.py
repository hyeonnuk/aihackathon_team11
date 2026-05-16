import os
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import pooling
from mysql.connector.errors import IntegrityError
from pydantic import BaseModel, EmailStr, Field, field_validator

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "synccs")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "120"))
CLIENT_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CLIENT_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
ALLOW_ALL_ORIGINS = "*" in CLIENT_ORIGINS

if not re.fullmatch(r"[a-zA-Z0-9_]+", DB_NAME):
    raise RuntimeError("DB_NAME can only contain letters, numbers, and underscores.")

app = FastAPI(title="COM:HUB Auth API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ALLOW_ALL_ORIGINS else CLIENT_ORIGINS,
    allow_credentials=not ALLOW_ALL_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

pool: pooling.MySQLConnectionPool | None = None


class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    studentNumber: str = Field(min_length=1, max_length=30)
    gender: str = Field(min_length=1, max_length=20)
    phoneNumber: str = Field(min_length=1, max_length=30)
    email: EmailStr
    loginId: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8, max_length=100)

    @field_validator("name", "studentNumber", "phoneNumber", "loginId")
    @classmethod
    def strip_and_require_value(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("gender")
    @classmethod
    def normalize_gender(cls, value: str) -> str:
        normalized = value.strip().lower()
        gender_map = {
            "male": "male",
            "m": "male",
            "\ub0a8": "male",
            "\ub0a8\uc790": "male",
            "\ub0a8\uc131": "male",
            "female": "female",
            "f": "female",
            "\uc5ec": "female",
            "\uc5ec\uc790": "female",
            "\uc5ec\uc131": "female",
            "other": "other",
            "\uae30\ud0c0": "other",
        }
        if normalized not in gender_map:
            raise ValueError("must be male, female, or other")
        return gender_map[normalized]


class LoginRequest(BaseModel):
    loginId: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=100)

    @field_validator("loginId")
    @classmethod
    def strip_login_id(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


def create_database_if_needed() -> None:
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            connection_timeout=5,
        )
    except mysql.connector.Error as error:
        raise RuntimeError(
            f"Cannot connect to MySQL at {DB_HOST}:{DB_PORT}. "
            "Start MySQL first, then check DB_HOST, DB_PORT, DB_USER, and DB_PASSWORD in backend/.env."
        ) from error
    cursor = connection.cursor()
    try:
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
            "DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci"
        )
    finally:
        cursor.close()
        connection.close()


def init_connection_pool() -> pooling.MySQLConnectionPool:
    return pooling.MySQLConnectionPool(
        pool_name="synccs_pool",
        pool_size=5,
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
    )


def get_connection():
    if pool is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database pool is not ready.",
        )
    return pool.get_connection()


def init_tables() -> None:
    connection = get_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              name VARCHAR(50) NOT NULL,
              student_number VARCHAR(30) NOT NULL,
              gender ENUM('male', 'female', 'other') NOT NULL,
              phone_number VARCHAR(30) NOT NULL,
              email VARCHAR(255) NOT NULL,
              login_id VARCHAR(50) NOT NULL,
              password_hash VARCHAR(255) NOT NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uk_users_student_number (student_number),
              UNIQUE KEY uk_users_email (email),
              UNIQUE KEY uk_users_login_id (login_id)
            )
            """
        )
        connection.commit()
    finally:
        cursor.close()
        connection.close()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: int, login_id: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MINUTES)
    return jwt.encode(
        {"userId": user_id, "loginId": login_id, "exp": expires_at},
        JWT_SECRET,
        algorithm="HS256",
    )


def to_user_response(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "studentNumber": row["student_number"],
        "gender": row["gender"],
        "phoneNumber": row["phone_number"],
        "email": row["email"],
        "loginId": row["login_id"],
    }


@app.on_event("startup")
def startup() -> None:
    global pool
    create_database_if_needed()
    pool = init_connection_pool()
    init_tables()


@app.get("/api/health")
def health_check():
    try:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
        return {"status": "ok", "message": "Backend and database are running."}
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed.",
        )


@app.post("/api/auth/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest):
    password_hash = hash_password(payload.password)

    try:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO users
                  (name, student_number, gender, phone_number, email, login_id, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    payload.name,
                    payload.studentNumber,
                    payload.gender,
                    payload.phoneNumber,
                    payload.email.lower(),
                    payload.loginId,
                    password_hash,
                ),
            )
            connection.commit()
            user_id = cursor.lastrowid
        finally:
            cursor.close()
            connection.close()
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student number, email, or login id already exists.",
        )
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Signup failed.",
        )

    return {
        "message": "Signup completed.",
        "user": {
            "id": user_id,
            "name": payload.name,
            "studentNumber": payload.studentNumber,
            "gender": payload.gender,
            "phoneNumber": payload.phoneNumber,
            "email": payload.email.lower(),
            "loginId": payload.loginId,
        },
    }


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT id, name, student_number, gender, phone_number, email, login_id, password_hash
                FROM users
                WHERE login_id = %s
                LIMIT 1
                """,
                (payload.loginId,),
            )
            user = cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed.",
        )

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid login id or password.",
        )

    return {
        "message": "Login completed.",
        "token": create_access_token(user["id"], user["login_id"]),
        "user": to_user_response(user),
    }


@app.get("/api/test/users")
def list_signup_users():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT id, login_id, name, student_number, email, created_at
                FROM users
                ORDER BY id DESC
                """
            )
            users = cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load signup users.",
        )

    return {
        "count": len(users),
        "users": [
            {
                "id": user["id"],
                "loginId": user["login_id"],
                "name": user["name"],
                "studentNumber": user["student_number"],
                "email": user["email"],
                "createdAt": user["created_at"].isoformat() if user["created_at"] else None,
            }
            for user in users
        ],
    }
