# COM:HUB Database Tables

This document summarizes the MySQL tables used by the FastAPI backend.

## Database

- Name: `synccs`
- Charset: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`

The database and tables are created automatically when `main.py` starts.
The raw SQL definition is also available in `schema.sql`.

## users

Stores registered user accounts.

| Column | Type | Required | Key | API Field | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | Yes | Primary Key | `id` | Auto-increment user ID |
| `name` | `VARCHAR(50)` | Yes |  | `name` | User name |
| `student_number` | `VARCHAR(30)` | Yes | Unique | `studentNumber` | Student number |
| `gender` | `ENUM('male', 'female', 'other')` | Yes |  | `gender` | Gender |
| `phone_number` | `VARCHAR(30)` | Yes |  | `phoneNumber` | Phone number |
| `email` | `VARCHAR(255)` | Yes | Unique | `email` | Email address |
| `login_id` | `VARCHAR(50)` | Yes | Unique | `loginId` | Login ID |
| `password_hash` | `VARCHAR(255)` | Yes |  | Not returned | Bcrypt password hash |
| `profile_image` | `LONGTEXT` | No |  | `profileImage` | Optional profile image data URL |
| `created_at` | `TIMESTAMP` | Yes |  | `createdAt` | Created time |
| `updated_at` | `TIMESTAMP` | Yes |  |  | Updated time |

Unique constraints:

- `uk_users_student_number`: `student_number`
- `uk_users_email`: `email`
- `uk_users_login_id`: `login_id`

## schedules

Stores schedule posts.

| Column | Type | Required | Key | API Field | Description |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | Yes | Primary Key | `id` | Auto-increment schedule ID |
| `title` | `VARCHAR(100)` | Yes |  | `title` | Schedule title |
| `start_date` | `DATETIME` | Yes | Index | `startDate` | Start datetime |
| `end_date` | `DATETIME` | Yes |  | `endDate` | End datetime |
| `content` | `TEXT` | Yes |  | `content` | Schedule content |
| `photo` | `LONGTEXT` | No |  | `photo` | Optional photo data URL |
| `link` | `VARCHAR(2048)` | No |  | `link` | Optional link |
| `note` | `TEXT` | No |  | `note` | Optional note |
| `grade` | `ENUM('1', '2', '3', '4', 'all')` | Yes | Index | `grade` | Target grade |
| `notice` | `BOOLEAN` | Yes | Index | `notice` | Notice flag |
| `hashtag` | `VARCHAR(255)` | No |  | `hashtag` | Optional hashtags |
| `author` | `VARCHAR(50)` | Yes |  | `author` | Author name or ID |
| `like_count` | `INT UNSIGNED` | Yes |  | `likeCount` | Like count, default `0` |
| `dislike_count` | `INT UNSIGNED` | Yes |  | `dislikeCount` | Dislike count, default `0` |
| `created_at` | `TIMESTAMP` | Yes |  | `createdAt` | Created time |
| `updated_at` | `TIMESTAMP` | Yes |  | `updatedAt` | Updated time |

Indexes:

- `idx_schedules_start_date`: `start_date`
- `idx_schedules_grade`: `grade`
- `idx_schedules_notice`: `notice`

## Related Files

- `main.py`: FastAPI app, table auto-creation, API logic
- `schema.sql`: SQL schema
- `.env.example`: database connection example
