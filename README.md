# COM:HUB

대학교 커뮤니티 일정 허브 플랫폼입니다. 학과 행사, 공모전, 스터디, 취업 정보 등이 사이버캠퍼스, 학교 홈페이지, 카카오톡 등에  분산되어 한 눈에 보기 어렵다는 문제점이 있습니다. 이를 한눈에 볼 수 있는 캘린더로 해결하고, 댓글과 반응으로 소통할 수 있습니다.

---

## 주요 기능

### 캘린더 & 일정 관리
- 월별 캘린더에서 전체 일정을 시각적으로 확인
- 날짜 클릭 시 해당 날짜의 일정 목록(Daily Agenda) 표시
- 일정 등록 / 수정 / 삭제 (사진, 링크, 메모 포함)
- **공지 일정** 별도 색상으로 구분 표시
- 토·일요일 및 공휴일·대체공휴일 색상 구분
- **개인 메모** 기능 — 나만 보이는 캘린더 메모 추가

### 필터
- **공지만 보기** — 공지 일정만 필터링
- **학년 필터** — 1~4학년별 선택 표시
- **태그 필터** — 공모전 / 해커톤 / 강의 / 프로젝트 / 장학·취업

### 일정 상세
- 일정 설명, 신청 기간, 신청 링크, 작성자 정보 확인
- 좋아요 / 싫어요 반응 (토글 방식, 중복 반응 방지)
- 댓글 및 대댓글 작성 / 수정 / 삭제
- 댓글에 좋아요 / 싫어요 반응
- 마감일 기준 **마감** / **마감 임박** 뱃지 자동 표시

### 사용자 & 권한
- 회원가입 / 로그인 (JWT 인증)
- **역할 체계** — `master` / `admin` / `user` 3단계 권한
  - `admin` 이상만 공지 일정 등록·수정 가능
  - `master`만 다른 사용자의 권한 변경 가능
- 프로필 페이지 — 내가 작성한 일정 및 댓글 이력 / 통계
- 프로필 이미지 업로드 (base64)
- **뱃지 시스템** — 활동 기반으로 자동 획득되는 19종 뱃지
  - 일정 등록 횟수별: 아기 무한이 / 어른 무한이 / 할미 무한이
  - 댓글 횟수별: 직진중인 / 과속 / 폭주 무한이
  - 받은 좋아요별: 똑똑한 / 유능한 / 학사·석사·박사 무한이
  - 좋아요 누른 횟수별: 해피·행복한·도파민·행복해서 쓰러진 무한이
  - 싫어요 누른 횟수별: 싫어하는 / 부정적인 / 모든게 싫은 무한이
  - 특별: 확성기 무한이 (1등 댓글), 해커톤 참여자
- **대표 뱃지** 설정 — 프로필에 뱃지 1개 대표로 표시

### 관리자
- `/admin/users` 페이지 — 전체 사용자 목록 조회 및 권한 관리 (master 전용)
- 이름 / 아이디 / 학번 / 이메일로 사용자 검색

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
│       ├── pages/     # Home, Login, Signup, Profile, AdminUsers
│       ├── components/# EventAddModal, EventDetailPanel, MemoAddModal
│       └── constants/ # tagColors (태그 색상 매핑)
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

### 인증
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/master` | 마스터 계정 생성 |

### 일정
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/schedules` | 전체 일정 조회 (댓글 포함) |
| GET | `/api/schedules/{id}` | 단일 일정 조회 |
| POST | `/api/schedules` | 일정 등록 |
| PUT | `/api/schedules/{id}` | 일정 수정 (본인·관리자만) |
| DELETE | `/api/schedules/{id}` | 일정 삭제 (본인·관리자만) |
| PATCH | `/api/schedules/{id}/reactions` | 좋아요/싫어요 |

### 댓글
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/schedules/{id}/comments` | 댓글·대댓글 작성 |
| PUT | `/api/schedules/{id}/comments/{cid}` | 댓글 수정 |
| DELETE | `/api/schedules/{id}/comments/{cid}` | 댓글 삭제 |
| PATCH | `/api/schedules/{id}/comments/{cid}/reactions` | 댓글 좋아요/싫어요 |

### 사용자
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/users/{id}` | 유저 프로필·작성 이력·통계 조회 |
| GET | `/api/users/{id}/posts` | 유저가 작성한 일정 목록 |
| GET | `/api/users/{id}/comments` | 유저가 작성한 댓글 목록 |
| PUT | `/api/users/{id}/profile-image` | 프로필 이미지 업데이트 |
| PUT | `/api/users/{id}/rep-badge` | 대표 뱃지 설정 |

### 관리자 (master 전용)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/admin/users` | 전체 사용자 목록 조회 |
| PATCH | `/api/admin/users/{id}/role` | 사용자 권한 변경 |
