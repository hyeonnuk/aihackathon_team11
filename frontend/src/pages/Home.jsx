// ============================================================
//  pages/Home.jsx — 경로: /
//  개인화 캘린더 대시보드
//  좌측(70%): FullCalendar — 날짜/이벤트 클릭 + 학년/태그 필터
//  우측(30%): Daily Agenda — 목록(list) ↔ 상세(detail) 전환
// ============================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import EventAddModal    from '../components/EventAddModal';
import EventDetailPanel from '../components/EventDetailPanel';
import { TAG_COLORS, TAG_TEXT_COLORS, TAG_CHIP_COLORS, getTagColor } from '../constants/tagColors';
import FullCalendar     from '@fullcalendar/react';
import dayGridPlugin    from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// ── Helpers ───────────────────────────────────────────────────
function getTodayStr() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
function formatDateLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_NAMES[d.getDay()]})`;
}

function formatNow() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
}

function getDeadlineBadge(applyEndDate) {
  if (!applyEndDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end   = new Date(applyEndDate + 'T23:59:59');
  const diff  = Math.ceil((end - today) / 86_400_000);
  if (diff < 0)  return 'closed';
  if (diff <= 3) return 'imminent';
  return null;
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null'); }
  catch { return null; }
}

// ── 필터 상수 ─────────────────────────────────────────────────
const ALL_GRADES = ['1학년', '2학년', '3학년', '4학년'];
const ALL_TAGS   = ['공모전', '해커톤', '스터디', '프로젝트', '장학/취업'];


// ── 이벤트 초기 데이터 ─────────────────────────────────────────
// extendedProps 에 grade, tags, description, applyPeriod, applyEndDate,
// author, applyLink, likes, dislikes, userReaction, comments 포함
// EVENTS_DATA의 backgroundColor/borderColor는 아래 EVENTS에서 태그 기반으로 자동 적용됨
const EVENTS_DATA = [
  {
    id: '1',
    title: '교내 웹 해커톤',
    start: '2026-05-20',
    end: '2026-05-23',
    extendedProps: {
      grade: ['2학년', '3학년', '4학년'],
      tags: ['해커톤', '프로젝트'],
      description: '교내 학생들이 팀을 이루어 웹 서비스를 개발하는 해커톤입니다.\n최대 5명 팀으로 구성하여 24시간 동안 개발 후 발표를 진행합니다.\n우수 팀에게는 장학금 및 수료증이 수여됩니다.',
      applyPeriod:  '2026-05-01 ~ 2026-05-18',
      applyEndDate: '2026-05-18',
      author:   '권이은',
      applyLink: 'https://example.com/hackathon',
      likes: 12, dislikes: 2, userReaction: null,
      comments: [
        { id: 1, author: '가천이',   content: '팀원 구해요! 백엔드 할 수 있는 분 댓글 남겨주세요.', createdAt: '2026-05-16 14:30', likes: 3, dislikes: 0, userReaction: null },
        { id: 2, author: '컴소학생', content: '작년에 참가했는데 정말 좋았어요! 이번에도 도전!',      createdAt: '2026-05-17 09:15', likes: 5, dislikes: 1, userReaction: null },
      ],
    },
  },
  {
    id: '2',
    title: '기말 프로젝트 발표',
    start: '2026-05-25',
    end: '2026-05-27',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['프로젝트'],
      description: '소프트웨어공학 기말 프로젝트 발표입니다.\nPPT 및 데모 준비 필요. 발표 시간은 팀당 15분입니다.',
      applyPeriod:  '2026-05-05 ~ 2026-05-24',
      applyEndDate: '2026-05-24',
      author:   '홍길동',
      applyLink: null,
      likes: 8, dislikes: 1, userReaction: null,
      comments: [
        { id: 1, author: '이영희', content: '발표 장소가 어디인가요?', createdAt: '2026-05-18 11:00', likes: 1, dislikes: 0, userReaction: null },
      ],
    },
  },
  {
    id: '3',
    title: '카카오 코딩테스트',
    start: '2026-05-28',
    extendedProps: {
      grade: ['3학년', '4학년'],
      tags: ['장학/취업'],
      description: '카카오 2026 하반기 공채 코딩테스트입니다.\n온라인으로 진행됩니다.',
      applyPeriod:  '2026-04-20 ~ 2026-05-13',
      applyEndDate: '2026-05-13',   // 마감된 일정
      author:   '박지수',
      applyLink: 'https://careers.kakao.com',
      likes: 20, dislikes: 0, userReaction: null,
      comments: [],
    },
  },
  {
    id: '4',
    title: '알고리즘 스터디',
    start: '2026-06-03',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['스터디'],
      description: '매주 화요일 알고리즘 스터디. 이번 주 주제: 다이나믹 프로그래밍.',
      applyPeriod:  null,
      applyEndDate: null,
      author:   '최민준',
      applyLink: null,
      likes: 7, dislikes: 0, userReaction: null,
      comments: [
        { id: 1, author: '정수현', content: 'DP 어렵지만 열심히 공부해요!', createdAt: '2026-05-30 20:00', likes: 2, dislikes: 0, userReaction: null },
      ],
    },
  },
  {
    id: '5',
    title: 'Google ML Bootcamp',
    start: '2026-06-05',
    end: '2026-06-08',
    extendedProps: {
      grade: ['2학년', '3학년', '4학년'],
      tags: ['공모전', '프로젝트'],
      description: 'Google 머신러닝 부트캠프입니다.\n사전 과제 제출 후 참가 가능합니다.\n선발된 참가자에게는 교통비 및 숙박비가 지원됩니다.',
      applyPeriod:  '2026-05-01 ~ 2026-05-31',
      applyEndDate: '2026-05-31',
      author:   '김철수',
      applyLink: 'https://developers.google.com/ml-bootcamp',
      likes: 35, dislikes: 3, userReaction: null,
      comments: [
        { id: 1, author: '박민영', content: '사전 과제가 있나요? 난이도는 어떤가요?',                                      createdAt: '2026-05-10 15:30', likes: 4, dislikes: 0, userReaction: null },
        { id: 2, author: '운영자', content: '사전 과제는 기초 ML 코드 작성 과제입니다. 파이썬 기본기가 있으면 충분합니다!', createdAt: '2026-05-11 10:00', likes: 8, dislikes: 0, userReaction: null },
      ],
    },
  },
  {
    id: '6',
    title: '장학금 신청 마감',
    start: '2026-05-31',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['장학/취업'],
      description: '2026년 1학기 성적 장학금 신청 마감일입니다.\n포털에서 신청 가능합니다.',
      applyPeriod:  '2026-05-12 ~ 2026-05-16',
      applyEndDate: '2026-05-16',   // 마감 임박(당일)
      author:   '학생처',
      applyLink: null,
      likes: 5, dislikes: 0, userReaction: null,
      comments: [],
    },
  },
  {
    id: '7',
    title: '앱 공모전 접수 마감',
    start: '2026-06-10',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년'],
      tags: ['공모전'],
      description: '전국 대학생 앱 개발 공모전 접수 마감입니다.\n개인/팀 모두 가능합니다.',
      applyPeriod:  '2026-05-01 ~ 2026-06-08',
      applyEndDate: '2026-06-08',
      author:   '이나라',
      applyLink: 'https://example.com/app-contest',
      likes: 15, dislikes: 1, userReaction: null,
      comments: [],
    },
  },
];

function getTodayStr() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatDateLabel(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return `${month}월 ${day}일 (${DAY_NAMES[date.getDay()]})`;
}

function formatNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null');
  } catch {
    return null;
  }
}

function normalizeDateTime(value) {
  return value ? value.replace(' ', 'T') : value;
}

function getDatePart(value) {
  return normalizeDateTime(value)?.slice(0, 10);
}

function addOneDay(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseTags(hashtag) {
  if (!hashtag) return [];
  return hashtag
    .split(/[\s,]+/)
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean);
}

function gradeToLabels(grade) {
  if (grade === 'all') return ALL_GRADES;
  return [`${grade}학년`];
}

function scheduleToEvent(schedule, index) {
  const color = schedule.notice ? '#ef4444' : EVENT_COLORS[index % EVENT_COLORS.length];
  const start = getDatePart(schedule.startDate);
  const end = getDatePart(schedule.endDate || schedule.startDate);

  return {
    id: `schedule-${schedule.id}`,
    title: schedule.notice ? `[공지] ${schedule.title}` : schedule.title,
    start,
    end: addOneDay(end || start),
    allDay: true,
    backgroundColor: color,
    borderColor: color,
    extendedProps: {
      scheduleId: schedule.id,
      grade: gradeToLabels(schedule.grade),
      tags: parseTags(schedule.hashtag),
      description: schedule.content || '',
      applyPeriod: start && end ? `${start} ~ ${end}` : null,
      applyEndDate: end || start,
      author: schedule.author || '',
      applyLink: schedule.link || null,
      photo: schedule.photo || null,
      note: schedule.note || null,
      notice: Boolean(schedule.notice),
      likes: schedule.likeCount ?? 0,
      dislikes: schedule.dislikeCount ?? 0,
      userReaction: null,
      comments: (schedule.comments || []).map((comment) => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        createdAt: comment.createdAt,
        likes: comment.likes ?? 0,
        dislikes: comment.dislikes ?? 0,
        userReaction: null,
      })),
    },
  };
}

function getFilteredEvents(events, selectedGrades, selectedTags) {
  if (selectedGrades.length === 0 && selectedTags.length === 0) return events;
  return events.filter(({ extendedProps: { grade, tags } }) => {
    const gradeOk = selectedGrades.length === 0 || selectedGrades.some((g) => grade.includes(g));
    const tagOk   = selectedTags.length   === 0 || selectedTags.some((t)   => tags.includes(t));
    return gradeOk && tagOk;
  });
}

function getEventsForDate(events, dateStr) {
  return events.filter((ev) =>
    ev.end ? dateStr >= ev.start && dateStr < ev.end : dateStr === ev.start
  );
}

// ── AgendaCard ────────────────────────────────────────────────
function AgendaCard({ event, isLast, onDetail }) {
  const { description, tags, applyEndDate, author } = event.extendedProps;
  const badge = getDeadlineBadge(applyEndDate);

  return (
    <div>
      <button
        className="w-full text-left py-4 flex gap-3 items-stretch hover:bg-primary-50/60 transition-colors rounded-lg group"
        onClick={onDetail}
      >
        {/* 색상 인디케이터 */}
        <div className="w-1 rounded-full shrink-0 self-stretch" style={{ backgroundColor: event.backgroundColor }} />

        <div className="flex-1 min-w-0">
          {/* 제목 + 뱃지 */}
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-gray-800 leading-snug">{event.title}</p>
            {badge === 'closed' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-200 text-gray-500">마감</span>
            )}
            {badge === 'imminent' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600">마감 임박</span>
            )}
          </div>

          {/* 설명 요약 */}
          {description && (
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
              {description.replace(/\n/g, ' ')}
            </p>
          )}

          {/* 작성자 */}
          {author && <p className="text-xs text-gray-400 mt-1">👤 {author}</p>}

          {/* 태그 칩 */}
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full"
                style={{ backgroundColor: '#ffffff', border: `1px solid ${TAG_CHIP_COLORS[tag] ?? event.backgroundColor}`, color: TAG_CHIP_COLORS[tag] ?? event.backgroundColor }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 화살표 */}
        <div className="flex items-center text-[#D3D6DE] group-hover:text-primary-400 shrink-0 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {!isLast && <div className="h-px bg-gray-100" />}
    </div>
  );
}

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
      <p className="mb-4 text-xs text-gray-400">표시할 캘린더를 선택하세요.</p>

      {/* 학년 필터 */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-2.5">학년</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={selectedGrades.length === 0} onChange={() => onGradeChange([])} className="w-4 h-4 accent-primary-500" />
            <span className="text-sm text-[#383642]">전체</span>
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
                className="w-4 h-4 accent-primary-500"
              />
              <span className="text-sm text-[#383642]">{grade}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100 mb-4" />

      {/* 태그 필터 — 태그별 고유 색상 */}
      <div>
        <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mb-2.5">태그</p>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            const tagBg   = TAG_COLORS[tag] ?? '#ACB1BE';
            const tagText = TAG_TEXT_COLORS[tag] ?? '#383642';
            return (
              <button
                key={tag}
                onClick={() =>
                  onTagChange((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                className="px-3 py-1 text-xs font-semibold rounded-full border transition-all active:scale-95"
                style={isSelected
                  ? { backgroundColor: tagBg, color: tagText, borderColor: tagBg }
                  : { backgroundColor: 'white', color: '#ACB1BE', borderColor: '#D3D6DE' }
                }
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {(selectedGrades.length > 0 || selectedTags.length > 0 || showNoticeOnly) && (
        <button
          onClick={() => {
            onGradeChange([]);
            onTagChange([]);
          }}
          className="mt-4 w-full rounded-lg border border-indigo-200 py-2 text-xs font-semibold text-indigo-600 transition-all hover:bg-indigo-50 hover:text-indigo-800"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}

// ── Home (main) ───────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  // ── 기존 상태 ──────────────────────────────────────────────
  const [user, setUser]                     = useState(getStoredUser);
  const [selectedDate, setSelectedDate]     = useState(getTodayStr);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen]     = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [events, setEvents] = useState([]);
  const [scheduleError, setScheduleError] = useState('');
  const [panelView, setPanelView] = useState('list');
  const [detailEventId, setDetailEventId] = useState(null);

  const hasActiveFilters = selectedGrades.length > 0 || selectedTags.length > 0;

  const loadSchedules = async () => {
    setScheduleError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || '일정을 불러오지 못했습니다.');
      }

      setEvents((data.schedules || []).map((schedule, index) => scheduleToEvent(schedule, index)));
    } catch (error) {
      setScheduleError(error.message);
      setEvents([]);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

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

  const filteredCalendarEvents = useMemo(
    () => getFilteredEvents(events, selectedGrades, selectedTags),
    [events, selectedGrades, selectedTags],
  );
  const agendaEvents = useMemo(
    () => getEventsForDate(filteredCalendarEvents, selectedDate),
    [filteredCalendarEvents, selectedDate],
  );
  const detailEvent = detailEventId
    ? events.find((event) => event.id === detailEventId) ?? null
    : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleDateClick = ({ dateStr }) => {
    setSelectedDate(dateStr);
    setPanelView('list');
    setDetailEventId(null);
  };

  // 캘린더 이벤트 바 클릭 → 해당 일정 상세로 바로 이동
  const handleCalendarEventClick = ({ event }) => {
    setSelectedDate(event.startStr.slice(0, 10));
    setDetailEventId(event.id);
    setPanelView('detail');
  };

  // AgendaCard 클릭 → 상세 뷰
  const handleShowDetail = (eventId) => {
    setDetailEventId(eventId);
    setPanelView('detail');
  };

  // 상세 → 목록
  const handleBackToList = () => {
    setPanelView('list');
    setDetailEventId(null);
  };

  // ── 일정 좋아요/싫어요 ─────────────────────────────────────
  const handleEventReaction = (eventId, reaction) => {
    setEventsBase((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const ep = { ...ev.extendedProps };
        if (ep.userReaction === reaction) {
          reaction === 'like' ? ep.likes-- : ep.dislikes--;
          ep.userReaction = null;
        } else {
          if (ep.userReaction === 'like')    ep.likes--;
          if (ep.userReaction === 'dislike') ep.dislikes--;
          reaction === 'like' ? ep.likes++ : ep.dislikes++;
          ep.userReaction = reaction;
        }
        return { ...ev, extendedProps: ep };
      })
    );
  };

  // ── 댓글 좋아요/싫어요 ─────────────────────────────────────
  const handleCommentReaction = (eventId, commentId, reaction) => {
    setEventsBase((prev) =>
      prev.map((ev) => {
        if (ev.id !== eventId) return ev;
        const comments = ev.extendedProps.comments.map((c) => {
          if (c.id !== commentId) return c;
          const u = { ...c };
          if (u.userReaction === reaction) {
            reaction === 'like' ? u.likes-- : u.dislikes--;
            u.userReaction = null;
          } else {
            if (u.userReaction === 'like')    u.likes--;
            if (u.userReaction === 'dislike') u.dislikes--;
            reaction === 'like' ? u.likes++ : u.dislikes++;
            u.userReaction = reaction;
          }
          return u;
        });
        return { ...ev, extendedProps: { ...ev.extendedProps, comments } };
      })
    );
  };

  // ── 댓글 추가 ──────────────────────────────────────────────
  const handleAddComment = (eventId, content) => {
    const newComment = {
      id: Date.now(),
      author: user?.name ?? '익명',
      content,
      createdAt: formatNow(),
      likes: 0, dislikes: 0, userReaction: null,
    };
    setEventsBase((prev) =>
      prev.map((ev) =>
        ev.id !== eventId
          ? ev
          : { ...ev, extendedProps: { ...ev.extendedProps, comments: [...ev.extendedProps.comments, newComment] } }
      )
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">

      {/* ━━━ Header ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="h-16 shrink-0 bg-white border-b border-[#D3D6DE] flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-extrabold">C</span>
          </div>
          <span className="text-xl font-extrabold text-[#383642] tracking-tight">COM:HUB</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
              >
                <span className="text-base leading-none">+</span>
                <span>새 일정 등록</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-full hover:bg-primary-100 active:scale-95 transition-all"
              >
                <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-700">{user.name.charAt(0)}</span>
                </div>
                <span className="text-sm font-semibold text-primary-700">{user.name}님</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-semibold text-[#ACB1BE] border border-[#D3D6DE] rounded-lg hover:bg-[#E7EBF6] hover:text-[#383642] active:scale-95 transition-all"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* ━━━ Main ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* ── 좌측: 캘린더 (70%) ─────────────────────────────── */}
        <section
          className={`bg-white overflow-y-auto p-5 relative ${hasActiveFilters ? 'calendar-has-filters' : ''}`}
          style={{ flex: '7 7 0' }}
        >
          {isFilterOpen && (
            <CalendarFilterPopup
              selectedGrades={selectedGrades}
              selectedTags={selectedTags}
              showNoticeOnly={showNoticeOnly}
              onGradeChange={setSelectedGrades}
              onTagChange={setSelectedTags}
              onNoticeChange={setShowNoticeOnly}
              onClose={() => setIsFilterOpen(false)}
            />
          )}

          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            events={filteredEvents}
            dateClick={handleDateClick}
            eventClick={handleCalendarEventClick}
            eventCursor="pointer"
            height="auto"
            customButtons={{
              filterBtn: {
                text: '📅',
                hint: '캘린더 필터',
                click: () => setIsFilterOpen((p) => !p),
              },
            }}
            headerToolbar={{
              left:   'prev,next today',
              center: 'title',
              right:  'dayGridMonth,dayGridWeek filterBtn',
            }}
            buttonText={{ today: '오늘', month: '월별', week: '주별' }}
            dayCellContent={(arg) => arg.date.getDate()}
            eventContent={(arg) => {
              const firstTag  = arg.event.extendedProps.tags?.[0];
              const textColor = TAG_TEXT_COLORS[firstTag] ?? '#383642';
              return (
                <div style={{ color: textColor, fontWeight: 600, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '1px 4px' }}>
                  {arg.event.title}
                </div>
              );
            }}
          />
        </section>

        {/* ── 우측: Daily Agenda / 상세 패널 (30%) ───────────── */}
        {/* overflow-hidden + flex flex-col → 각 뷰가 내부 스크롤 관리 */}
        <aside
          className="border-l border-gray-100 bg-surface flex flex-col overflow-hidden"
          style={{ flex: '3 3 0' }}
        >
          {panelView === 'list' ? (
            /* ── 목록 뷰 ──────────────────────────────────────── */
            <div className="flex flex-col h-full overflow-hidden">
              {/* 날짜 헤더 (고정) */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100 bg-surface shrink-0">
                <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">
                  Daily Agenda
                </p>
                <h2 className="text-2xl font-extrabold text-[#383642] leading-tight">
                  {formatDateLabel(selectedDate)}
                </h2>
                <p className="text-xs text-[#ACB1BE] mt-1.5">
                  {agendaEvents.length > 0 ? `총 ${agendaEvents.length}개의 일정` : '일정 없음'}
                </p>
              </div>

              {/* 일정 카드 목록 (스크롤) */}
              <div className="flex-1 overflow-y-auto px-6 py-2">
                {agendaEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center select-none">
                    <div className="text-4xl mb-3">🗓️</div>
                    <p className="text-sm font-semibold text-[#ACB1BE]">예정된 일정이 없습니다.</p>
                    <p className="text-xs text-[#ACB1BE] mt-1.5">달력에서 다른 날짜를 클릭해 보세요.</p>
                  </div>
                ) : (
                  agendaEvents.map((ev, i) => (
                    <AgendaCard
                      key={ev.id}
                      event={ev}
                      isLast={i === agendaEvents.length - 1}
                      onDetail={() => handleShowDetail(ev.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ) : detailEvent ? (
            /* ── 상세 뷰 ──────────────────────────────────────── */
            <EventDetailPanel
              event={detailEvent}
              onBack={handleBackToList}
              onReact={(reaction) => handleEventReaction(detailEventId, reaction)}
              onCommentReact={(commentId, reaction) => handleCommentReaction(detailEventId, commentId, reaction)}
              onAddComment={(content) => handleAddComment(detailEventId, content)}
              user={user}
            />
          ) : null}
        </aside>
      </div>

      {/* 새 일정 등록 모달 */}
      <EventAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
