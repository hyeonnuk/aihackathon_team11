// ============================================================
//  pages/Home.jsx — 경로: /
//  개인화 캘린더 대시보드
//  좌측(70%): FullCalendar — dateClick + eventClick + 학년/태그 필터
//  우측(30%): Daily Agenda — 선택된 날짜의 일정 필터링 & 카드 표시
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import EventAddModal from '../components/EventAddModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

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
  const d = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_NAMES[d.getDay()]})`;
}

// ── 필터 상수 ──────────────────────────────────────────────
const ALL_GRADES = ['1학년', '2학년', '3학년', '4학년'];
const ALL_TAGS   = ['공모전', '해커톤', '스터디', '프로젝트', '장학/취업'];

// ── 더미 이벤트 데이터 ──────────────────────────────────────
// extendedProps.grade : 대상 학년 배열 (필터용)
// extendedProps.tags  : 카테고리 태그 배열 (필터 + 해시태그 표시 겸용)
const EVENTS = [
  {
    id: '1',
    title: '교내 웹 해커톤',
    start: '2026-05-20',
    end: '2026-05-23',          // 실제 기간: 20 ~ 22일 (end exclusive)
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    extendedProps: {
      grade: ['2학년', '3학년', '4학년'],
      tags: ['해커톤', '프로젝트'],
      description: '학교 주관 웹 개발 해커톤. 팀원 모집 후 참가 등록 필요.',
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
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['프로젝트'],
      description: '소프트웨어공학 기말 프로젝트 발표. PPT 및 데모 준비 필요.',
    },
  },
  {
    id: '3',
    title: '카카오 코딩테스트',
    start: '2026-05-28',
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    extendedProps: {
      grade: ['3학년', '4학년'],
      tags: ['장학/취업'],
      description: '카카오 2026 하반기 공채 코딩테스트. 온라인 진행.',
    },
  },
  {
    id: '4',
    title: '알고리즘 스터디',
    start: '2026-06-03',
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['스터디'],
      description: '매주 화요일 알고리즘 스터디. 이번 주 주제: 다이나믹 프로그래밍.',
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
      grade: ['2학년', '3학년', '4학년'],
      tags: ['공모전', '프로젝트'],
      description: 'Google 머신러닝 부트캠프. 사전 과제 제출 후 참가 가능.',
    },
  },
  {
    id: '6',
    title: '장학금 신청 마감',
    start: '2026-05-31',
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['장학/취업'],
      description: '2026년 1학기 성적 장학금 신청 마감일. 포털에서 신청 가능.',
    },
  },
  {
    id: '7',
    title: '앱 공모전 접수 마감',
    start: '2026-06-10',
    backgroundColor: '#ec4899',
    borderColor: '#ec4899',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년'],
      tags: ['공모전'],
      description: '전국 대학생 앱 개발 공모전 접수 마감. 개인/팀 모두 가능.',
    },
  },
];

// ── 필터 로직 ──────────────────────────────────────────────
// 학년(OR) AND 태그(OR), 둘 다 비어있으면 전체 표시
function getFilteredEvents(selectedGrades, selectedTags) {
  if (selectedGrades.length === 0 && selectedTags.length === 0) return EVENTS;
  return EVENTS.filter(({ extendedProps: { grade, tags } }) => {
    const gradeOk = selectedGrades.length === 0 || selectedGrades.some((g) => grade.includes(g));
    const tagOk   = selectedTags.length === 0   || selectedTags.some((t) => tags.includes(t));
    return gradeOk && tagOk;
  });
}

// ── 날짜에 해당하는 이벤트 필터링 ──────────────────────────
// end가 있는 경우: start <= date < end (end exclusive 적용)
// end가 없는 경우: start === date (단일 일정)
function getEventsForDate(events, dateStr) {
  return events.filter((ev) =>
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
          <p className="text-sm font-bold text-gray-800 leading-snug">
            {event.title}
          </p>
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

// ── CalendarFilterPopup: 필터 팝업 ─────────────────────────
function CalendarFilterPopup({ selectedGrades, selectedTags, onGradeChange, onTagChange, onClose }) {
  return (
    <div
      className="calendar-filter-popup absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-5"
      style={{ top: '62px', right: '8px', width: '288px', maxWidth: 'calc(100vw - 24px)' }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-bold text-gray-800">캘린더</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full text-xl font-bold transition-colors leading-none"
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-4">표시할 캘린더를 선택하세요.</p>

      {/* 학년 필터 */}
      <div className="mb-4">
        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2.5">학년</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {/* 전체 체크박스 */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedGrades.length === 0}
              onChange={() => onGradeChange([])}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-sm text-gray-700">전체</span>
          </label>

          {/* 학년별 체크박스 */}
          {ALL_GRADES.map((grade) => (
            <label key={grade} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade)}
                onChange={() =>
                  onGradeChange((prev) => {
                    const next = prev.includes(grade)
                      ? prev.filter((g) => g !== grade)
                      : [...prev, grade];
                    // 4개 모두 선택 시 전체(빈 배열)로 자동 전환
                    return next.length === ALL_GRADES.length ? [] : next;
                  })
                }
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-gray-700">{grade}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px bg-gray-100 mb-4" />

      {/* 태그 필터 */}
      <div>
        <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2.5">태그</p>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  onTagChange((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* 필터 초기화 (활성 필터가 있을 때만 표시) */}
      {(selectedGrades.length > 0 || selectedTags.length > 0) && (
        <button
          onClick={() => { onGradeChange([]); onTagChange([]); }}
          className="mt-4 w-full text-xs text-indigo-600 hover:text-indigo-800 font-semibold py-2 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}

// ── Home: 메인 컴포넌트 (export default) ─────────────────────
export default function Home() {
  const navigate = useNavigate();

  const [user, setUser]                     = useState(getStoredUser);
  const [selectedDate, setSelectedDate]     = useState(getTodayStr);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);  // 새 일정 등록 모달

  // 필터 상태
  const [isFilterOpen, setIsFilterOpen]     = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedTags, setSelectedTags]     = useState([]);

  const hasActiveFilters = selectedGrades.length > 0 || selectedTags.length > 0;

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!isFilterOpen) return;
    const handler = (e) => {
      const popup = document.querySelector('.calendar-filter-popup');
      const btn   = document.querySelector('.fc-filterBtn-button');
      if (popup && !popup.contains(e.target) && (!btn || !btn.contains(e.target))) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isFilterOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleDateClick  = ({ dateStr }) => setSelectedDate(dateStr);
  const handleEventClick = ({ event }) => setSelectedDate(event.startStr.slice(0, 10));

  const filteredEvents = getFilteredEvents(selectedGrades, selectedTags);
  const agendaEvents   = getEventsForDate(filteredEvents, selectedDate);

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
              {/* 새 일정 등록 — GitHub에서 추가된 모달 연동 유지 */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
              >
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
            position: relative — 필터 팝업 absolute 기준점
            ──────────────────────────────────────────────────── */}
        <section
          className={`bg-white overflow-y-auto p-5 relative ${hasActiveFilters ? 'calendar-has-filters' : ''}`}
          style={{ flex: '7 7 0' }}
        >
          {/* 필터 팝업 — 주별 버튼 오른쪽(fc-filterBtn-button) 아래 절대 배치 */}
          {isFilterOpen && (
            <CalendarFilterPopup
              selectedGrades={selectedGrades}
              selectedTags={selectedTags}
              onGradeChange={setSelectedGrades}
              onTagChange={setSelectedTags}
              onClose={() => setIsFilterOpen(false)}
            />
          )}

          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            events={filteredEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventCursor="pointer"
            height="auto"
            customButtons={{
              filterBtn: {
                text: '📅',
                hint: '캘린더 필터',
                click: () => setIsFilterOpen((prev) => !prev),
              },
            }}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek filterBtn',
            }}
            buttonText={{ today: '오늘', month: '월별', week: '주별' }}
          />
        </section>

        {/* ────────────────────────────────────────────────────
            우측: Daily Agenda 패널 (30%)
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

      {/* 새 일정 등록 모달 — GitHub에서 추가된 기능 유지 */}
      <EventAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
