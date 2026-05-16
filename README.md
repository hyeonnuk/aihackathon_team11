# COM:HUB

대학교 커뮤니티 일정 허브 플랫폼입니다. 학과 행사, 공모전, 스터디, 취업 정보 등 다양한 일정을 캘린더로 한눈에 확인하고, 댓글과 반응으로 소통할 수 있습니다.

---

## 주요 기능

### 캘린더 & 일정 관리
- 월별 캘린더에서 전체 일정을 시각적으로 확인
- 날짜 클릭 시 해당 날짜의 일정 목록(Daily Agenda) 표시
- 일정 등록 / 수정 / 삭제
- **공지 일정** 별도 색상으로 구분 표시

### 필터
- **공지만 보기** — 공지 일정만 필터링
- **학년 필터** — 1~4학년별 선택 표시
- **태그 필터** — 공모전 / 해커톤 / 강의 / 프로젝트 / 장학·취업

### 일정 상세
- 일정 설명, 신청 기간, 신청 링크, 작성자 정보 확인
- 좋아요 / 싫어요 반응
- 댓글 및 대댓글 작성
- 마감일 기준 **마감** / **마감 임박** 뱃지 자동 표시

### 사용자
- 회원가입 / 로그인 (JWT 인증)
- 프로필 페이지 — 내가 작성한 일정 및 댓글 이력

---

## 기술 스택

| 구분 | 사용 기술 |
|------|----------|
| Frontend | React 18, Vite, Tailwind CSS, FullCalendar, React Router |
| Backend | FastAPI (Python), Uvicorn |
| Database | MySQL 8.0 |
| 인증 | JWT (PyJWT), bcrypt |
| 인프라 | Docker / Docker Compose |

---

## 프로젝트 구조

```
aihackathon_team11/
├── frontend/          # React 클라이언트
│   └── src/
│       ├── pages/     # Home, Login, Signup, Profile 등
│       └── components/# EventAddModal, EventDetailPanel 등
├── backend/           # FastAPI 서버
│   └── main.py        # API 엔드포인트
└── docker-compose.yml
```

---

## 실행 방법

### Docker (권장)

```bash
# 1. 환경 변수 설정
cp backend/.env.example backend/.env
# .env 파일의 DB_PASSWORD, JWT_SECRET 값을 설정하세요

# 2. 실행
docker-compose up
```

브라우저에서 `http://localhost:5173` 접속

---

### 직접 실행

**백엔드**

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # .env 값 설정 후
uvicorn main:app --reload --port 5000
```

**프론트엔드**

```bash
cd frontend
npm install
npm run dev
```

---

## 환경 변수 (`backend/.env`)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버 포트 | `5000` |
| `CLIENT_ORIGINS` | CORS 허용 도메인 | `http://localhost:5173` |
| `DB_HOST` | MySQL 호스트 | `localhost` |
| `DB_PORT` | MySQL 포트 | `3306` |
| `DB_USER` | DB 사용자 | `root` |
| `DB_PASSWORD` | DB 비밀번호 | — |
| `DB_NAME` | DB 이름 | `synccs` |
| `JWT_SECRET` | JWT 서명 키 | — |
| `JWT_EXPIRES_MINUTES` | 토큰 만료 시간(분) | `120` |

---

## API 주요 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/schedules` | 전체 일정 조회 |
| POST | `/api/schedules` | 일정 등록 |
| PATCH | `/api/schedules/{id}` | 일정 수정 |
| DELETE | `/api/schedules/{id}` | 일정 삭제 |
| PATCH | `/api/schedules/{id}/reactions` | 좋아요/싫어요 |
| POST | `/api/schedules/{id}/comments` | 댓글 작성 |
| GET | `/api/users/{id}` | 유저 프로필 조회 |
