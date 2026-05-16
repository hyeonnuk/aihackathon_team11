# COM:HUB FastAPI Backend

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `.env` with your MySQL account.

## Run for external testing

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Local Swagger test page:

```text
http://localhost:5000/docs
```

External test URL format:

```text
http://YOUR_PC_IP:5000/docs
```

Your firewall and router must allow inbound traffic to port `5000`.

## API

### Signup

```http
POST /api/auth/signup
```

```json
{
  "name": "Hong Gil Dong",
  "studentNumber": "202412345",
  "gender": "male",
  "phoneNumber": "010-1234-5678",
  "email": "test@example.com",
  "loginId": "hong123",
  "password": "password123"
}
```

`gender` accepts `male`, `female`, or `other`.

### Login

```http
POST /api/auth/login
```

```json
{
  "loginId": "hong123",
  "password": "password123"
}
```
