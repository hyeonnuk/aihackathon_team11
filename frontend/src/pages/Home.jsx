import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import EventAddModal from '../components/EventAddModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

function getTodayStr() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
function formatDateLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_NAMES[d.getDay()]})`;
}

const ALL_GRADES = ['1학년', '2학년', '3학년', '4학년'];
const ALL_TAGS   = ['공모전', '해커톤', '스터디', '프로젝트', '장학/취업'];

const EVENTS = [
  {
    id: '1',
    title: '교내 웹 해커톤',
    start: '2026-05-20',
    end: '2026-05-23',
    backgroundColor: '#818cf8',
    borderColor: '#818cf8',
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
    end: '2026-05-27',
    backgroundColor: '#fb7185',
    borderColor: '#fb7185',
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
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
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
    backgroundColor: '#34d399',
    borderColor: '#34d399',
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
    end: '2026-06-08',
    backgroundColor: '#60a5fa',
    borderColor: '#60a5fa',
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
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
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
    backgroundColor: '#f472b6',
    borderColor: '#f472b6',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년'],
      tags: ['공모전'],
      description: '전국 대학생 앱 개발 공모전 접수 마감. 개인/팀 모두 가능.',
    },
  },
];

function getFilteredEvents(selectedGrades, selectedTags) {
  if (selectedGrades.length === 0 && selectedTags.length === 0) return EVENTS;
  return EVENTS.filter(({ extendedProps: { grade, tags } }) => {
    const gradeOk = selectedGrades.length === 0 || selectedGrades.some((g) => grade.includes(g));
    const tagOk   = selectedTags.length === 0   || selectedTags.some((t) => tags.includes(t));
    return gradeOk && tagOk;
  });
}

function getEventsForDate(events, dateStr) {
  return events.filter((ev) =>
    ev.end
      ? dateStr >= ev.start && dateStr < ev.end
      : dateStr === ev.start
  );
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── AgendaCard ──────────────────────────────────────────────
function AgendaCard({ event, isLast }) {
  const { description, tags } = event.extendedProps;
  return (
    <div>
      <div className="py-4 flex gap-3 items-stretch">
        <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: event.backgroundColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-snug">{event.title}</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-xs font-medium rounded-full"
                style={{ backgroundColor: event.backgroundColor + '22', color: event.backgroundColor }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      {!isLast && <div className="h-px bg-gray-100" />}
    </div>
  );
}

// ── CalendarFilterPopup ─────────────────────────────────────
function CalendarFilterPopup({ selectedGrades, selectedTags, onGradeChange, onTagChange, onClose }) {
  return (
    <div
      className="calendar-filter-popup absolute z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-5"
      style={{ top: '62px', right: '8px', width: '288px', maxWidth: 'calc(100vw - 24px)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-gray-800">캘린더 필터</h3>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors text-lg leading-none"
        >×</button>
      </div>
      <p className="text-xs text-gray-400 mb-4">표시할 캘린더를 선택하세요.</p>

      <div className="mb-4">
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2.5">학년</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={selectedGrades.length === 0} onChange={() => onGradeChange([])} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm text-gray-600">전체</span>
          </label>
          {ALL_GRADES.map((grade) => (
            <label key={grade} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade)}
                onChange={() =>
                  onGradeChange((prev) => {
                    const next = prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade];
                    return next.length === ALL_GRADES.length ? [] : next;
                  })
                }
                className="w-4 h-4 accent-indigo-600"
              />
              <span className="text-sm text-gray-600">{grade}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100 mb-4" />

      <div>
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2.5">태그</p>
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
                    : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {(selectedGrades.length > 0 || selectedTags.length > 0) && (
        <button
          onClick={() => { onGradeChange([]); onTagChange([]); }}
          className="mt-4 w-full text-xs text-indigo-600 hover:text-indigo-800 font-semibold py-2 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}

// ── Home ────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  const [user, setUser]                     = useState(getStoredUser);
  const [selectedDate, setSelectedDate]     = useState(getTodayStr);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen]     = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedTags, setSelectedTags]     = useState([]);

  const hasActiveFilters = selectedGrades.length > 0 || selectedTags.length > 0;

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
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Header
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="shrink-0 bg-white border-b border-gray-100 px-6 z-10">
        {/* 상단 행: 로고 + 인증 영역 */}
        <div className="h-14 flex items-center justify-between">
          {/* 로고 */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-extrabold">C</span>
            </div>
            <div>
              <span className="text-base font-extrabold text-gray-800 tracking-tight">COM:HUB</span>
              <span className="text-gray-300 mx-2 text-xs">/</span>
              <span className="text-sm text-gray-500 font-medium">캘린더</span>
            </div>
          </div>

          {/* 우측 인증 영역 */}
          <div className="flex items-center gap-2.5">
            {user ? (
              <>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
                >
                  <span className="text-base leading-none">+</span>
                  <span>새 일정 등록</span>
                </button>

                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full hover:bg-indigo-100 active:scale-95 transition-all"
                >
                  <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-700">{user.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-700">{user.name}님</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-600 active:scale-95 transition-all"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
              >
                로그인
              </button>
            )}
          </div>
        </div>

      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          메인 콘텐츠 — 좌(캘린더) / 우(Daily Agenda)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-1 overflow-hidden min-h-0 p-4 gap-4">

        {/* 좌측: FullCalendar 영역 (70%) */}
        <section
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto p-5 relative ${hasActiveFilters ? 'calendar-has-filters' : ''}`}
          style={{ flex: '7 7 0' }}
        >
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

        {/* 우측: Daily Agenda 패널 (30%) */}
        <aside
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-y-auto flex flex-col"
          style={{ flex: '3 3 0' }}
        >
          <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 z-10 rounded-t-2xl">
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">
              Daily Agenda
            </p>
            <h2 className="text-lg font-extrabold text-gray-800 leading-tight">
              {formatDateLabel(selectedDate)}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {agendaEvents.length > 0 ? `총 ${agendaEvents.length}개의 일정` : '일정 없음'}
            </p>
          </div>

          <div className="px-6 py-2 flex-1">
            {agendaEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center select-none">
                <div className="text-4xl mb-3">🗓️</div>
                <p className="text-sm font-semibold text-gray-500">예정된 일정이 없습니다.</p>
                <p className="text-xs text-gray-400 mt-1.5">달력에서 다른 날짜를 클릭해 보세요.</p>
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

      <EventAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
