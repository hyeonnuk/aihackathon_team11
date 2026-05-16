// ============================================================
//  pages/Home.jsx — 경로: /
//  개인화 캘린더 대시보드
//  좌측(70%): FullCalendar — dateClick(빈 날짜) + eventClick(일정) 모두 처리
//  우측(30%): Daily Agenda — 선택된 날짜의 일정 필터링 & 카드 표시
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; // FullCalendar 버튼 보정 스타일
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction'; // dateClick 사용에 필수

// ── 오늘 날짜를 "YYYY-MM-DD" 문자열로 반환 ──────────────────
function getTodayStr() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

// ── "YYYY-MM-DD" → "X월 XX일 (요일)" 형태로 변환 ─────────
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
function formatDateLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // new Date(year, month-1, day): 로컬 타임존 기준으로 생성 (UTC 이슈 방지)
  const d = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_NAMES[d.getDay()]})`;
}

// ── 더미 이벤트 데이터 ──────────────────────────────────────
// - 여러 날에 걸친 bar 형태 일정 포함 (end는 exclusive)
// - extendedProps.tags: 해시태그 뱃지에 사용
const EVENTS = [
  {
    id: '1',
    title: '교내 웹 해커톤',
    start: '2026-05-20',
    end: '2026-05-23',          // 실제 기간: 20 ~ 22일 (end exclusive)
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    extendedProps: {
      description: '학교 주관 웹 개발 해커톤. 팀원 모집 후 참가 등록 필요.',
      tags: ['해커톤', '팀프로젝트', '웹개발'],
    },
  },
  {
    id: '2',
    title: '기말 프로젝트 발표',
    start: '2026-05-25',
    end: '2026-05-27',          // 실제 기간: 25 ~ 26일
    backgroundColor: '#f43f5e',
    borderColor: '#f43f5e',
    extendedProps: {
      description: '소프트웨어공학 기말 프로젝트 발표. PPT 및 데모 준비 필요.',
      tags: ['발표', '소공', '기말'],
    },
  },
  {
    id: '3',
    title: '카카오 코딩테스트',
    start: '2026-05-28',
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    extendedProps: {
      description: '카카오 2026 하반기 공채 코딩테스트. 온라인 진행.',
      tags: ['코딩테스트', '취업', '카카오'],
    },
  },
  {
    id: '4',
    title: '알고리즘 스터디',
    start: '2026-06-03',
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    extendedProps: {
      description: '매주 화요일 알고리즘 스터디. 이번 주 주제: 다이나믹 프로그래밍.',
      tags: ['스터디', '알고리즘', 'DP'],
    },
  },
  {
    id: '5',
    title: 'Google ML Bootcamp',
    start: '2026-06-05',
    end: '2026-06-08',          // 실제 기간: 5 ~ 7일
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    extendedProps: {
      description: 'Google 머신러닝 부트캠프. 사전 과제 제출 후 참가 가능.',
      tags: ['ML', '부트캠프', 'Google'],
    },
  },
];

// ── 날짜에 해당하는 이벤트 필터링 ───────────────────────────
// end가 있는 경우: start <= date < end (end exclusive 적용)
// end가 없는 경우: start === date (단일 일정)
function getEventsForDate(dateStr) {
  return EVENTS.filter((ev) =>
    ev.end
      ? dateStr >= ev.start && dateStr < ev.end
      : dateStr === ev.start
  );
}

// ── localStorage 헬퍼 ────────────────────────────────────────
function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── AgendaCard: 우측 패널 일정 카드 ────────────────────────
// 구성: 색상 바 | 일정명(굵게) + 설명(회색) + 해시태그 뱃지
function AgendaCard({ event, isLast }) {
  const { description, tags } = event.extendedProps;

  return (
    <div>
      <div className="py-4 flex gap-3 items-stretch">
        {/* 좌측 이벤트 색상 인디케이터 바 */}
        <div
          className="w-1 rounded-full shrink-0"
          style={{ backgroundColor: event.backgroundColor }}
        />

        <div className="flex-1 min-w-0">
          {/* 일정 이름 */}
          <p className="text-sm font-bold text-gray-800 leading-snug">
            {event.title}
          </p>

          {/* 세부 설명 */}
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            {description}
          </p>

          {/* 해시태그 뱃지 (이벤트 색상 기반 반투명 배경) */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                style={{
                  // 8자리 hex: 마지막 2자리가 alpha (0x1a = 약 10% 투명도)
                  backgroundColor: event.backgroundColor + '1a',
                  color: event.backgroundColor,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 카드 사이 구분선 — 마지막 카드는 생략 */}
      {!isLast && <div className="h-px bg-gray-100" />}
    </div>
  );
}

// ── Home: 메인 컴포넌트 (export default) ─────────────────────
export default function Home() {
  const navigate = useNavigate();

  // localStorage에서 유저 정보 초기화 (마운트 시 1회)
  const [user, setUser] = useState(getStoredUser);

  // 선택된 날짜 — 초기값: 오늘 (getTodayStr을 함수로 전달해 1회만 실행)
  const [selectedDate, setSelectedDate] = useState(getTodayStr);

  // 로그아웃: Login.jsx가 저장한 token + user 모두 제거
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // ── dateClick: 빈 날짜 셀 클릭 시 호출 (interactionPlugin 필요)
  // info.dateStr → "YYYY-MM-DD" 형식
  const handleDateClick = ({ dateStr }) => {
    setSelectedDate(dateStr);
  };

  // ── eventClick: 이벤트(일정 바) 클릭 시 호출
  // event.startStr 예시: "2026-05-20" 또는 "2026-05-20T00:00:00"
  // slice(0, 10)으로 날짜 부분만 추출
  const handleEventClick = ({ event }) => {
    setSelectedDate(event.startStr.slice(0, 10));
  };

  // 선택된 날짜에 해당하는 일정 목록
  const agendaEvents = getEventsForDate(selectedDate);

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Header
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="h-16 shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 z-10">
        {/* 로고 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-extrabold">C</span>
          </div>
          <span className="text-xl font-extrabold text-gray-800 tracking-tight">COM:HUB</span>
        </div>

        {/* 우측 인증 영역 */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* 새 일정 등록 */}
              <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
                <span className="text-base leading-none">+</span>
                <span>새 일정 등록</span>
              </button>

              {/* 유저 뱃지 — 클릭 시 /profile */}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full hover:bg-indigo-100 active:scale-95 transition-all"
              >
                <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-700">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-indigo-800">
                  {user.name}님
                </span>
              </button>

              {/* 로그아웃 */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 active:scale-95 transition-all"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          메인 콘텐츠 — 좌(캘린더) / 우(Daily Agenda) 분할
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ────────────────────────────────────────────────────
            좌측: FullCalendar 영역 (70%)
            ──────────────────────────────────────────────────── */}
        <section
          className="bg-white overflow-y-auto p-5"
          style={{ flex: '7 7 0' }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            events={EVENTS}
            dateClick={handleDateClick}   // 빈 날짜 셀 클릭
            eventClick={handleEventClick} // 이벤트(바) 클릭
            eventCursor="pointer"
            height="auto"
            headerToolbar={{
              left: 'prev,next today',    // 이전 / 다음 / 오늘
              center: 'title',            // "2026년 X월"
              right: 'dayGridMonth,dayGridWeek', // 월별 / 주별 전환
            }}
            buttonText={{
              today: '오늘',
              month: '월별',
              week: '주별',
            }}
          />
        </section>

        {/* ────────────────────────────────────────────────────
            우측: Daily Agenda 패널 (30%)
            border-l로 좌측과 시각적 구분 + bg-gray-50 으로 대비
            ──────────────────────────────────────────────────── */}
        <aside
          className="border-l border-gray-200 bg-gray-50 overflow-y-auto flex flex-col"
          style={{ flex: '3 3 0' }}
        >
          {/* 날짜 헤더 — 스크롤해도 고정 */}
          <div className="sticky top-0 bg-gray-50 px-6 pt-6 pb-4 border-b border-gray-200 z-10">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">
              Daily Agenda
            </p>
            <h2 className="text-2xl font-extrabold text-gray-800 leading-tight">
              {formatDateLabel(selectedDate)}
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              {agendaEvents.length > 0
                ? `총 ${agendaEvents.length}개의 일정`
                : '일정 없음'}
            </p>
          </div>

          {/* 일정 카드 목록 */}
          <div className="px-6 py-2 flex-1">
            {agendaEvents.length === 0 ? (
              /* 해당 날짜 일정 없음 */
              <div className="flex flex-col items-center justify-center h-full py-16 text-center select-none">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="text-sm font-semibold text-gray-500">
                  예정된 일정이 없습니다.
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  달력에서 다른 날짜를 클릭해 보세요.
                </p>
              </div>
            ) : (
              /* 일정 카드 렌더링 */
              agendaEvents.map((ev, index) => (
                <AgendaCard
                  key={ev.id}
                  event={ev}
                  isLast={index === agendaEvents.length - 1}
                />
              ))
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
