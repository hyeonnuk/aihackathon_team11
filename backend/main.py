import os
import re
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
import mysql.connector
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from mysql.connector import pooling
from mysql.connector.errors import IntegrityError
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

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


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(min_length=1)

    @field_validator("role")
    @classmethod
    def normalize_role(cls, value: str) -> str:
        normalized = value.strip().lower()
        role_map = {
            "admin": "admin",
            "administrator": "admin",
            "\uad00\ub9ac\uc790": "admin",
            "user": "user",
            "normal": "user",
            "\uc77c\ubc18": "user",
        }
        if normalized not in role_map:
            raise ValueError("role must be admin or user")
        return role_map[normalized]


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


class ProfileImageUpdateRequest(BaseModel):
    profileImage: str = Field(min_length=1)


class ScheduleCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    startDate: datetime
    endDate: datetime
    content: str = Field(min_length=1)
    photo: str | None = None
    link: str | None = Field(default=None, max_length=2048)
    note: str | None = None
    grade: str = Field(min_length=1, max_length=10)
    notice: bool = False
    hashtag: str | None = Field(default=None, max_length=255)
    author: str = Field(min_length=1, max_length=50)

    @field_validator("title", "content", "author")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("photo", "link", "note", "hashtag")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("grade")
    @classmethod
    def normalize_grade(cls, value: str) -> str:
        normalized = value.strip().lower()
        grade_map = {
            "1": "1",
            "1학년": "1",
            "2": "2",
            "2학년": "2",
            "3": "3",
            "3학년": "3",
            "4": "4",
            "4학년": "4",
            "all": "all",
            "전체": "all",
        }
        if normalized not in grade_map:
            raise ValueError("grade must be 1, 2, 3, 4, or all")
        return grade_map[normalized]

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.endDate < self.startDate:
            raise ValueError("endDate must be greater than or equal to startDate")
        return self


class ScheduleUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    startDate: datetime | None = None
    endDate: datetime | None = None
    content: str | None = Field(default=None, min_length=1)
    photo: str | None = None
    link: str | None = Field(default=None, max_length=2048)
    note: str | None = None
    grade: str | None = Field(default=None, min_length=1, max_length=10)
    notice: bool | None = None
    hashtag: str | None = Field(default=None, max_length=255)
    author: str | None = Field(default=None, min_length=1, max_length=50)

    @field_validator("title", "content", "author")
    @classmethod
    def strip_optional_required_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value

    @field_validator("photo", "link", "note", "hashtag")
    @classmethod
    def strip_update_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("grade")
    @classmethod
    def normalize_update_grade(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return ScheduleCreateRequest.normalize_grade(value)

    @model_validator(mode="after")
    def validate_update_date_range(self):
        if self.startDate is not None and self.endDate is not None and self.endDate < self.startDate:
            raise ValueError("endDate must be greater than or equal to startDate")
        return self


class ScheduleReactionRequest(BaseModel):
    likeDelta: int = Field(default=0, ge=-1, le=1)
    dislikeDelta: int = Field(default=0, ge=-1, le=1)

    @model_validator(mode="after")
    def validate_reaction_delta(self):
        if self.likeDelta == 0 and self.dislikeDelta == 0:
            raise ValueError("likeDelta or dislikeDelta is required")
        return self


class CommentCreateRequest(BaseModel):
    author: str = Field(min_length=1, max_length=50)
    content: str = Field(min_length=1)
    parentId: int | None = None

    @field_validator("author", "content")
    @classmethod
    def strip_comment_text(cls, value: str) -> str:
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
              profile_image LONGTEXT NULL,
              role ENUM('master', 'admin', 'user') NOT NULL DEFAULT 'user',
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              UNIQUE KEY uk_users_student_number (student_number),
              UNIQUE KEY uk_users_email (email),
              UNIQUE KEY uk_users_login_id (login_id)
            )
            """
        )
        cursor.execute("SHOW COLUMNS FROM users LIKE 'profile_image'")
        if cursor.fetchone() is None:
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image LONGTEXT NULL AFTER password_hash")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'role'")
        if cursor.fetchone() is None:
            cursor.execute(
                "ALTER TABLE users ADD COLUMN role ENUM('master', 'admin', 'user') NOT NULL DEFAULT 'user' AFTER profile_image"
            )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS schedules (
              id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              title VARCHAR(100) NOT NULL,
              start_date DATETIME NOT NULL,
              end_date DATETIME NOT NULL,
              content TEXT NOT NULL,
              photo LONGTEXT NULL,
              link VARCHAR(2048) NULL,
              note TEXT NULL,
              grade ENUM('1', '2', '3', '4', 'all') NOT NULL,
              notice BOOLEAN NOT NULL DEFAULT FALSE,
              hashtag VARCHAR(255) NULL,
              author VARCHAR(50) NOT NULL,
              like_count INT UNSIGNED NOT NULL DEFAULT 0,
              dislike_count INT UNSIGNED NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              INDEX idx_schedules_start_date (start_date),
              INDEX idx_schedules_grade (grade),
              INDEX idx_schedules_notice (notice)
            )
            """
        )
        cursor.execute("SHOW COLUMNS FROM schedules LIKE 'photo'")
        photo_column = cursor.fetchone()
        if photo_column and "longtext" not in str(photo_column[1]).lower():
            cursor.execute("ALTER TABLE schedules MODIFY COLUMN photo LONGTEXT NULL")
        cursor.execute("SHOW COLUMNS FROM schedules LIKE 'link'")
        link_column = cursor.fetchone()
        if link_column and "2048" not in str(link_column[1]):
            cursor.execute("ALTER TABLE schedules MODIFY COLUMN link VARCHAR(2048) NULL")
        cursor.execute("SHOW COLUMNS FROM schedules LIKE 'dislike_count'")
        if cursor.fetchone() is None:
            cursor.execute(
                "ALTER TABLE schedules ADD COLUMN dislike_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER like_count"
            )
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS schedule_comments (
              id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              schedule_id BIGINT UNSIGNED NOT NULL,
                  parent_id BIGINT UNSIGNED NULL,
              author VARCHAR(50) NOT NULL,
              content TEXT NOT NULL,
              like_count INT UNSIGNED NOT NULL DEFAULT 0,
              dislike_count INT UNSIGNED NOT NULL DEFAULT 0,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (id),
              INDEX idx_schedule_comments_schedule_id (schedule_id),
                  INDEX idx_schedule_comments_parent_id (parent_id),
              CONSTRAINT fk_schedule_comments_schedule_id
                FOREIGN KEY (schedule_id) REFERENCES schedules(id)
                    ON DELETE CASCADE,
                  CONSTRAINT fk_schedule_comments_parent_id
                    FOREIGN KEY (parent_id) REFERENCES schedule_comments(id)
                    ON DELETE CASCADE
            )
            """
        )
        cursor.execute("SHOW COLUMNS FROM schedule_comments LIKE 'parent_id'")
        if cursor.fetchone() is None:
            cursor.execute("ALTER TABLE schedule_comments ADD COLUMN parent_id BIGINT UNSIGNED NULL AFTER schedule_id")
            cursor.execute("ALTER TABLE schedule_comments ADD CONSTRAINT fk_schedule_comments_parent_id FOREIGN KEY (parent_id) REFERENCES schedule_comments(id) ON DELETE CASCADE")
            
        connection.commit()
    finally:
        cursor.close()
        connection.close()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: int, login_id: str, role: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRES_MINUTES)
    return jwt.encode(
        {"userId": user_id, "loginId": login_id, "role": role, "exp": expires_at},
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
        "profileImage": row.get("profile_image"),
        "role": row.get("role", "user"),
    }


def to_admin_user_response(row: dict) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "studentNumber": row["student_number"],
        "gender": row["gender"],
        "phoneNumber": row["phone_number"],
        "email": row["email"],
        "loginId": row["login_id"],
        "role": row.get("role", "user"),
        "createdAt": serialize_datetime(row["created_at"]),
    }


def load_user_from_authorization(authorization: str | None, required: bool = True) -> dict | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        if not required:
            return None
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization bearer token is required.",
        )

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )

    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT id, name, student_number, gender, phone_number, email,
                       login_id, profile_image, role, created_at
                FROM users
                WHERE id = %s
                LIMIT 1
                """,
                (user_id,),
            )
            user = cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load current user.",
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    return user


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    return load_user_from_authorization(authorization, required=True)


def require_master_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "master":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Master role is required.",
        )
    return current_user


def ensure_notice_permission(notice: bool, authorization: str | None) -> None:
    if not notice:
        return
    current_user = load_user_from_authorization(authorization, required=True)
    if current_user["role"] not in ("master", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only master or admin can create or update notices.",
        )


def serialize_datetime(value):
    return value.isoformat(sep=" ") if value else None


def to_comment_response(row: dict) -> dict:
    return {
        "id": row["id"],
        "scheduleId": row["schedule_id"],
        "parentId": row.get("parent_id"),
        "author": row["author"],
        "content": row["content"],
        "likes": row["like_count"],
        "dislikes": row["dislike_count"],
        "createdAt": serialize_datetime(row["created_at"]),
    }


def fetch_comments_by_schedule_ids(cursor, schedule_ids: list[int]) -> dict[int, list[dict]]:
    if not schedule_ids:
        return {}

    placeholders = ", ".join(["%s"] * len(schedule_ids))
    cursor.execute(
        f"""
        SELECT id, schedule_id, parent_id, author, content, like_count, dislike_count, created_at
        FROM schedule_comments
        WHERE schedule_id IN ({placeholders})
        ORDER BY created_at ASC, id ASC
        """,
        schedule_ids,
    )
    all_comments = cursor.fetchall()
    comments_by_schedule_id = {schedule_id: [] for schedule_id in schedule_ids}
    
    # 1. 최상위 댓글 (parent_id가 없는 댓글) 그룹핑
    for comment in all_comments:
        if comment.get("parent_id") is None:
            c_resp = to_comment_response(comment)
            c_resp["replies"] = []
            comments_by_schedule_id.setdefault(comment["schedule_id"], []).append(c_resp)
            
    # 2. 대댓글을 부모 댓글의 replies 배열에 담기
    for comment in all_comments:
        if comment.get("parent_id") is not None:
            for parent_comment in comments_by_schedule_id.get(comment["schedule_id"], []):
                if parent_comment["id"] == comment["parent_id"]:
                    parent_comment.setdefault("replies", []).append(to_comment_response(comment))
                    break
    return comments_by_schedule_id


def to_schedule_response(row: dict, comments: list[dict] | None = None) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "startDate": serialize_datetime(row["start_date"]),
        "endDate": serialize_datetime(row["end_date"]),
        "content": row["content"],
        "photo": row["photo"],
        "link": row["link"],
        "note": row["note"],
        "grade": row["grade"],
        "notice": bool(row["notice"]),
        "hashtag": row["hashtag"],
        "author": row["author"],
        "likeCount": row["like_count"],
        "dislikeCount": row["dislike_count"],
        "comments": comments or [],
        "createdAt": serialize_datetime(row["created_at"]),
        "updatedAt": serialize_datetime(row["updated_at"]),
    }


def to_user_post_response(row: dict) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "content": row["content"],
        "startDate": serialize_datetime(row["start_date"]),
        "endDate": serialize_datetime(row["end_date"]),
        "createdAt": serialize_datetime(row["created_at"]),
        "likeCount": row["like_count"],
        "dislikeCount": row["dislike_count"],
    }


def to_user_comment_response(row: dict) -> dict:
    return {
        "id": row["id"],
        "scheduleId": row["schedule_id"],
        "postId": row["schedule_id"],
        "postTitle": row["schedule_title"],
        "author": row["author"],
        "content": row["content"],
        "likes": row["like_count"],
        "dislikes": row["dislike_count"],
        "createdAt": serialize_datetime(row["created_at"]),
    }


def load_user_activity(cursor, user_id: int) -> tuple[dict, list[dict], list[dict], dict]:
    cursor.execute(
        """
        SELECT id, name, student_number, gender, phone_number, email,
               login_id, profile_image, role
        FROM users
        WHERE id = %s
        LIMIT 1
        """,
        (user_id,),
    )
    user = cursor.fetchone()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    author_names = (user["name"], user["login_id"])
    cursor.execute(
        """
        SELECT id, title, start_date, end_date, content, like_count, dislike_count, created_at
        FROM schedules
        WHERE author IN (%s, %s)
        ORDER BY created_at DESC, id DESC
        """,
        author_names,
    )
    posts = [to_user_post_response(post) for post in cursor.fetchall()]

    cursor.execute(
        """
        SELECT c.id, c.schedule_id, c.author, c.content, c.like_count, c.dislike_count,
               c.created_at, s.title AS schedule_title
        FROM schedule_comments c
        JOIN schedules s ON s.id = c.schedule_id
        WHERE c.author IN (%s, %s)
        ORDER BY c.created_at DESC, c.id DESC
        """,
        author_names,
    )
    comments = [to_user_comment_response(comment) for comment in cursor.fetchall()]

    stats = {
        "scheduleCount": len(posts),
        "commentCount": len(comments),
        "receivedLikesCount": sum(post["likeCount"] for post in posts),
        "receivedDislikesCount": sum(post["dislikeCount"] for post in posts),
        "likesCount": 0,
        "dislikesCount": 0,
        "hasJoinedHackathon": any("hackathon" in (post["title"] or "").lower() or "해커톤" in (post["title"] or "") for post in posts),
        "isFirstCommenter": False,
    }
    return user, posts, comments, stats


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
    role = "user"

    try:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO users
                  (name, student_number, gender, phone_number, email, login_id, password_hash, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    payload.name,
                    payload.studentNumber,
                    payload.gender,
                    payload.phoneNumber,
                    payload.email.lower(),
                    payload.loginId,
                    password_hash,
                    role,
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
            "role": role,
        },
    }


@app.post("/api/auth/master", status_code=status.HTTP_201_CREATED)
def create_master_user(payload: SignupRequest):
    password_hash = hash_password(payload.password)
    role = "master"

    try:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO users
                  (name, student_number, gender, phone_number, email, login_id, password_hash, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    payload.name,
                    payload.studentNumber,
                    payload.gender,
                    payload.phoneNumber,
                    payload.email.lower(),
                    payload.loginId,
                    password_hash,
                    role,
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
            detail="Master signup failed.",
        )

    return {
        "message": "Master account created.",
        "user": {
            "id": user_id,
            "name": payload.name,
            "studentNumber": payload.studentNumber,
            "gender": payload.gender,
            "phoneNumber": payload.phoneNumber,
            "email": payload.email.lower(),
            "loginId": payload.loginId,
            "role": role,
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
                SELECT id, name, student_number, gender, phone_number, email, login_id,
                       password_hash, profile_image, role
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
        "token": create_access_token(user["id"], user["login_id"], user["role"]),
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
                SELECT id, login_id, name, student_number, email, role, created_at
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
                "role": user["role"],
                "createdAt": user["created_at"].isoformat() if user["created_at"] else None,
            }
            for user in users
        ],
    }


@app.get("/api/admin/users")
def list_users_for_role_management(current_user: dict = Depends(require_master_user)):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT id, name, student_number, gender, phone_number, email,
                       login_id, role, created_at
                FROM users
                ORDER BY
                  CASE role
                    WHEN 'master' THEN 0
                    WHEN 'admin' THEN 1
                    ELSE 2
                  END,
                  id DESC
                """
            )
            users = cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load users.",
        )

    return {
        "count": len(users),
        "users": [to_admin_user_response(user) for user in users],
        "currentUser": to_admin_user_response(current_user),
    }


@app.patch("/api/admin/users/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UserRoleUpdateRequest,
    current_user: dict = Depends(require_master_user),
):
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Master cannot change their own role here.",
        )

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT id, role FROM users WHERE id = %s LIMIT 1",
                (user_id,),
            )
            target_user = cursor.fetchone()
            if not target_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found.",
                )
            if target_user["role"] == "master":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Master role cannot be changed here.",
                )

            cursor.execute(
                "UPDATE users SET role = %s WHERE id = %s",
                (payload.role, user_id),
            )
            connection.commit()

            cursor.execute(
                """
                SELECT id, name, student_number, gender, phone_number, email,
                       login_id, role, created_at
                FROM users
                WHERE id = %s
                LIMIT 1
                """,
                (user_id,),
            )
            updated_user = cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user role.",
        )

    return {
        "message": "User role updated.",
        "user": to_admin_user_response(updated_user),
    }


@app.get("/api/test/schedules/{schedule_id}/comments")
def list_schedule_comments_for_test(schedule_id: int):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT id FROM schedules WHERE id = %s LIMIT 1", (schedule_id,))
            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule not found.",
                )

            cursor.execute(
                """
                SELECT id, schedule_id, parent_id, author, content, like_count, dislike_count, created_at
                FROM schedule_comments
                WHERE schedule_id = %s
                ORDER BY created_at ASC, id ASC
                """,
                (schedule_id,),
            )
            comments = cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load schedule comments.",
        )

    return {
        "scheduleId": schedule_id,
        "count": len(comments),
        "comments": [to_comment_response(comment) for comment in comments],
    }


@app.get("/api/users/{user_id}")
def get_user(user_id: int):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            user, posts, comments, stats = load_user_activity(cursor, user_id)
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load user.",
        )

    return {
        "user": {
            **to_user_response(user),
            "posts": posts,
            "comments": comments,
            "stats": stats,
        }
    }


@app.get("/api/users/{user_id}/posts")
def get_user_posts(user_id: int):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            _, posts, _, _ = load_user_activity(cursor, user_id)
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load user posts.",
        )

    return {"count": len(posts), "posts": posts}


@app.get("/api/users/{user_id}/comments")
def get_user_comments(user_id: int):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            _, _, comments, _ = load_user_activity(cursor, user_id)
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load user comments.",
        )

    return {"count": len(comments), "comments": comments}


@app.put("/api/users/{user_id}/profile-image")
def update_profile_image(user_id: int, payload: ProfileImageUpdateRequest):
    try:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(
                "UPDATE users SET profile_image = %s WHERE id = %s",
                (payload.profileImage, user_id),
            )
            connection.commit()
            updated_count = cursor.rowcount
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile image.",
        )

    if updated_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return {
        "message": "Profile image updated.",
        "profileImage": payload.profileImage,
    }


@app.get("/api/schedules")
def list_schedules():
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT id, title, start_date, end_date, content, photo, link, note,
                       grade, notice, hashtag, author, like_count, dislike_count, created_at, updated_at
                FROM schedules
                ORDER BY start_date ASC, id ASC
                """
            )
            schedules = cursor.fetchall()
            comments_by_schedule_id = fetch_comments_by_schedule_ids(
                cursor,
                [schedule["id"] for schedule in schedules],
            )
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load schedules.",
        )

    return {
        "count": len(schedules),
        "schedules": [
            to_schedule_response(schedule, comments_by_schedule_id.get(schedule["id"], []))
            for schedule in schedules
        ],
    }


@app.get("/api/schedules/{schedule_id}")
def get_schedule(schedule_id: int):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT id, title, start_date, end_date, content, photo, link, note,
                       grade, notice, hashtag, author, like_count, dislike_count, created_at, updated_at
                FROM schedules
                WHERE id = %s
                LIMIT 1
                """,
                (schedule_id,),
            )
            schedule = cursor.fetchone()
            comments_by_schedule_id = fetch_comments_by_schedule_ids(
                cursor,
                [schedule["id"]] if schedule else [],
            )
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load schedule.",
        )

    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found.",
        )

    return {"schedule": to_schedule_response(schedule, comments_by_schedule_id.get(schedule["id"], []))}


@app.patch("/api/schedules/{schedule_id}/reactions")
def update_schedule_reactions(schedule_id: int, payload: ScheduleReactionRequest):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                UPDATE schedules
                SET
                  like_count = GREATEST(CAST(like_count AS SIGNED) + %s, 0),
                  dislike_count = GREATEST(CAST(dislike_count AS SIGNED) + %s, 0)
                WHERE id = %s
                """,
                (payload.likeDelta, payload.dislikeDelta, schedule_id),
            )
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule not found.",
                )
            connection.commit()

            cursor.execute(
                """
                SELECT like_count, dislike_count
                FROM schedules
                WHERE id = %s
                LIMIT 1
                """,
                (schedule_id,),
            )
            counts = cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update schedule reactions.",
        )

    return {
        "message": "Schedule reactions updated.",
        "id": schedule_id,
        "likeCount": counts["like_count"],
        "dislikeCount": counts["dislike_count"],
    }


@app.post("/api/schedules/{schedule_id}/comments", status_code=status.HTTP_201_CREATED)
def create_schedule_comment(schedule_id: int, payload: CommentCreateRequest):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SELECT id FROM schedules WHERE id = %s LIMIT 1", (schedule_id,))
            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule not found.",
                )

            cursor.execute(
                """
                INSERT INTO schedule_comments
                  (schedule_id, parent_id, author, content)
                VALUES (%s, %s, %s, %s)
                """,
                (schedule_id, payload.parentId, payload.author, payload.content),
            )
            connection.commit()
            comment_id = cursor.lastrowid

            cursor.execute(
                """
                SELECT id, schedule_id, parent_id, author, content,
                       like_count, dislike_count, created_at
                FROM schedule_comments
                WHERE id = %s
                LIMIT 1
                """,
                (comment_id,),
            )
            comment = cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create comment.",
        )

    return {
        "message": "Schedule comment created.",
        "comment": to_comment_response(comment),
    }


@app.patch("/api/schedules/{schedule_id}/comments/{comment_id}/reactions")
def update_schedule_comment_reactions(
    schedule_id: int,
    comment_id: int,
    payload: ScheduleReactionRequest,
):
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                UPDATE schedule_comments
                SET
                  like_count = GREATEST(CAST(like_count AS SIGNED) + %s, 0),
                  dislike_count = GREATEST(CAST(dislike_count AS SIGNED) + %s, 0)
                WHERE id = %s AND schedule_id = %s
                """,
                (payload.likeDelta, payload.dislikeDelta, comment_id, schedule_id),
            )
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule comment not found.",
                )
            connection.commit()

            cursor.execute(
                """
                SELECT like_count, dislike_count
                FROM schedule_comments
                WHERE id = %s AND schedule_id = %s
                LIMIT 1
                """,
                (comment_id, schedule_id),
            )
            counts = cursor.fetchone()
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update schedule comment reactions.",
        )

    return {
        "message": "Schedule comment reactions updated.",
        "id": comment_id,
        "scheduleId": schedule_id,
        "likes": counts["like_count"],
        "dislikes": counts["dislike_count"],
    }


@app.post("/api/schedules", status_code=status.HTTP_201_CREATED)
def create_schedule(payload: ScheduleCreateRequest, authorization: str | None = Header(default=None)):
    ensure_notice_permission(payload.notice, authorization)

    try:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute(
                """
                INSERT INTO schedules
                  (title, start_date, end_date, content, photo, link, note,
                   grade, notice, hashtag, author)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    payload.title,
                    payload.startDate,
                    payload.endDate,
                    payload.content,
                    payload.photo,
                    payload.link,
                    payload.note,
                    payload.grade,
                    payload.notice,
                    payload.hashtag,
                    payload.author,
                ),
            )
            connection.commit()
            schedule_id = cursor.lastrowid
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create schedule.",
        )

    return {
        "message": "Schedule created.",
        "id": schedule_id,
    }


@app.put("/api/schedules/{schedule_id}")
def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdateRequest,
    authorization: str | None = Header(default=None),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update.",
        )
    if updates.get("notice") is True:
        ensure_notice_permission(True, authorization)

    column_map = {
        "title": "title",
        "startDate": "start_date",
        "endDate": "end_date",
        "content": "content",
        "photo": "photo",
        "link": "link",
        "note": "note",
        "grade": "grade",
        "notice": "notice",
        "hashtag": "hashtag",
        "author": "author",
    }

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT start_date, end_date FROM schedules WHERE id = %s LIMIT 1",
                (schedule_id,),
            )
            current_schedule = cursor.fetchone()
            if not current_schedule:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Schedule not found.",
                )

            next_start = updates.get("startDate", current_schedule["start_date"])
            next_end = updates.get("endDate", current_schedule["end_date"])
            if next_end < next_start:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="endDate must be greater than or equal to startDate.",
                )

            set_clause = ", ".join(f"{column_map[field]} = %s" for field in updates)
            values = [updates[field] for field in updates]
            values.append(schedule_id)
            cursor.execute(
                f"UPDATE schedules SET {set_clause} WHERE id = %s",
                values,
            )
            connection.commit()
        finally:
            cursor.close()
            connection.close()
    except HTTPException:
        raise
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update schedule.",
        )

    return {
        "message": "Schedule updated.",
        "id": schedule_id,
    }


@app.delete("/api/schedules/{schedule_id}")
def delete_schedule(schedule_id: int):
    try:
        connection = get_connection()
        cursor = connection.cursor()
        try:
            cursor.execute("DELETE FROM schedules WHERE id = %s", (schedule_id,))
            connection.commit()
            deleted_count = cursor.rowcount
        finally:
            cursor.close()
            connection.close()
    except mysql.connector.Error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete schedule.",
        )

    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found.",
        )

    return {
        "message": "Schedule deleted.",
        "id": schedule_id,
    }
