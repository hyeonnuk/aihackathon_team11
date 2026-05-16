import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../App.css';
import EventAddModal from '../components/EventAddModal';
import EventDetailPanel from '../components/EventDetailPanel';
import { TAG_COLORS, TAG_TEXT_COLORS, TAG_CHIP_COLORS, getTagColor } from '../constants/tagColors';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const ALL_GRADES = ['1학년', '2학년', '3학년', '4학년'];
const ALL_TAGS = ['공모전', '해커톤', '스터디', '프로젝트', '장학/취업'];
const NOTICE_COLOR = '#f8927d';

const EVENTS_DATA = [
  {
    id: 'detail-1',
    title: '교내 웹 해커톤',
    start: '2026-05-20',
    end: '2026-05-23',
    backgroundColor: '#818cf8',
    borderColor: '#818cf8',
    extendedProps: {
      grade: ['2학년', '3학년', '4학년'],
      tags: ['해커톤', '프로젝트'],
      description:
        '교내 학생들이 팀을 이루어 웹 서비스를 개발하는 해커톤입니다.\n최대 5명 팀으로 구성하여 24시간 동안 개발 및 발표를 진행합니다.',
      applyPeriod: '2026-05-01 ~ 2026-05-18',
      applyEndDate: '2026-05-18',
      author: '관리자',
      applyLink: 'https://example.com/hackathon',
      likes: 12,
      dislikes: 2,
      userReaction: null,
      comments: [
        {
          id: 1,
          author: '김학생',
          content: '백엔드 가능한 팀원 구합니다.',
          createdAt: '2026-05-16 14:30',
          likes: 3,
          dislikes: 0,
          userReaction: null,
        },
      ],
    },
  },
  {
    id: 'detail-2',
    title: '기말 프로젝트 발표',
    start: '2026-05-25',
    end: '2026-05-27',
    backgroundColor: '#fb7185',
    borderColor: '#fb7185',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['프로젝트'],
      description: '소프트웨어공학 기말 프로젝트 발표 일정입니다. PPT 및 데모 준비가 필요합니다.',
      applyPeriod: '2026-05-05 ~ 2026-05-24',
      applyEndDate: '2026-05-24',
      author: '김교수',
      applyLink: null,
      likes: 8,
      dislikes: 1,
      userReaction: null,
      comments: [],
    },
  },
  {
    id: 'detail-3',
    title: '카카오 코딩테스트',
    start: '2026-05-28',
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
    extendedProps: {
      grade: ['3학년', '4학년'],
      tags: ['장학/취업'],
      description: '카카오 2026 하반기 공채 코딩테스트입니다. 온라인으로 진행됩니다.',
      applyPeriod: '2026-04-20 ~ 2026-05-13',
      applyEndDate: '2026-05-13',
      author: '취업지원팀',
      applyLink: 'https://careers.kakao.com',
      likes: 20,
      dislikes: 0,
      userReaction: null,
      comments: [],
    },
  },
  {
    id: 'detail-4',
    title: '알고리즘 스터디',
    start: '2026-06-03',
    backgroundColor: '#34d399',
    borderColor: '#34d399',
    extendedProps: {
      grade: ['1학년', '2학년', '3학년', '4학년'],
      tags: ['스터디'],
      description: '매주 화요일 알고리즘 스터디. 이번 주 주제는 다이나믹 프로그래밍입니다.',
      applyPeriod: null,
      applyEndDate: null,
      author: '최민준',
      applyLink: null,
      likes: 7,
      dislikes: 0,
      userReaction: null,
      comments: [],
    },
  },
  {
    id: 'detail-5',
    title: 'Google ML Bootcamp',
    start: '2026-06-05',
    end: '2026-06-08',
    backgroundColor: '#60a5fa',
    borderColor: '#60a5fa',
    extendedProps: {
      grade: ['2학년', '3학년', '4학년'],
      tags: ['공모전', '프로젝트'],
      description: 'Google 머신러닝 부트캠프입니다. 사전 과제 제출 후 참가 가능합니다.',
      applyPeriod: '2026-05-01 ~ 2026-05-31',
      applyEndDate: '2026-05-31',
      author: '운영진',
      applyLink: 'https://developers.google.com/ml-bootcamp',
      likes: 35,
      dislikes: 3,
      userReaction: null,
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

function scheduleToEvent(schedule) {
  const tags = parseTags(schedule.hashtag);
  const color = schedule.notice ? NOTICE_COLOR : getTagColor(tags);
  const firstTag = tags[0];
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
    textColor: schedule.notice
      ? '#ffffff'
      : TAG_TEXT_COLORS[firstTag] ?? '#383642',
    extendedProps: {
      scheduleId: schedule.id,
      grade: gradeToLabels(schedule.grade),
      tags,
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
    const tagOk = selectedTags.length === 0 || selectedTags.some((t) => tags.includes(t));
    return gradeOk && tagOk;
  });
}

function getEventsForDate(events, dateStr) {
  return events.filter((event) => {
    const start = getDatePart(event.start);
    const end = getDatePart(event.end);
    if (!start) return false;
    if (!end || start === end) return start === dateStr;
    return dateStr >= start && dateStr < end;
  });
}

function getDeadlineBadge(applyEndDate) {
  if (!applyEndDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${applyEndDate}T23:59:59`);
  const diff = Math.ceil((end - today) / 86_400_000);
  if (diff < 0) return 'closed';
  if (diff <= 3) return 'imminent';
  return null;
}

function buildEditInitialData(event) {
  const ep = event.extendedProps;

  let gradeValue = 'all';
  if (ep.grade && ep.grade.length > 0 && ep.grade.length < ALL_GRADES.length) {
    gradeValue = ep.grade[0].replace('학년', '');
  }

  let endDateStr = '';
  if (event.end) {
    const d = new Date(`${event.end}T00:00:00`);
    d.setDate(d.getDate() - 1);
    endDateStr = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
  }

  const title = event.title.replace(/^\[공지\] /, '');

  return {
    scheduleId: ep.scheduleId,
    title,
    startDate: event.start ? `${event.start}T00:00` : '',
    endDate: endDateStr ? `${endDateStr}T00:00` : '',
    content: ep.description || '',
    photo: ep.photo || null,
    link: ep.applyLink || '',
    note: ep.note || '',
    grade: gradeValue,
    notice: Boolean(ep.notice),
    hashtags: ep.tags || [],
    author: ep.author || '',
  };
}

function getReactionUpdate(currentProps, reaction) {
  const nextProps = { ...currentProps };
  const deltas = { likeDelta: 0, dislikeDelta: 0 };

  if (nextProps.userReaction === reaction) {
    if (reaction === 'like') {
      nextProps.likes = Math.max(nextProps.likes - 1, 0);
      deltas.likeDelta = -1;
    } else {
      nextProps.dislikes = Math.max(nextProps.dislikes - 1, 0);
      deltas.dislikeDelta = -1;
    }
    nextProps.userReaction = null;
  } else {
    if (nextProps.userReaction === 'like') {
      nextProps.likes = Math.max(nextProps.likes - 1, 0);
      deltas.likeDelta = -1;
    }
    if (nextProps.userReaction === 'dislike') {
      nextProps.dislikes = Math.max(nextProps.dislikes - 1, 0);
      deltas.dislikeDelta = -1;
    }

    if (reaction === 'like') {
      nextProps.likes += 1;
      deltas.likeDelta += 1;
    } else {
      nextProps.dislikes += 1;
      deltas.dislikeDelta += 1;
    }
    nextProps.userReaction = reaction;
  }

  return { nextProps, deltas };
}

function AgendaCard({ event, isLast, onDetail }) {
  const { description, tags, applyEndDate, author } = event.extendedProps;
  const badge = getDeadlineBadge(applyEndDate);

  return (
    <div>
      <button
        className="group flex w-full gap-3 rounded-lg py-4 text-left transition-colors hover:bg-primary-50/60"
        onClick={onDetail}
      >
        <div className="w-1 shrink-0 rounded-full self-stretch" style={{ backgroundColor: event.backgroundColor }} />
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-semibold leading-snug text-gray-800">{event.title}</p>
            {badge === 'closed' && (
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                마감
              </span>
            )}
            {badge === 'imminent' && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                마감 임박
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-400">
              {description.replace(/\n/g, ' ')}
            </p>
          )}
          {author && <p className="mt-1 text-xs text-gray-400">작성자 {author}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid ${TAG_CHIP_COLORS[tag] ?? event.backgroundColor}`,
                  color: TAG_CHIP_COLORS[tag] ?? event.backgroundColor,
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center text-gray-300 transition-colors group-hover:text-primary-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      className="calendar-filter-popup absolute z-50 rounded-2xl border border-gray-100 bg-white p-5 shadow-xl"
      style={{ top: '62px', right: '8px', width: '288px', maxWidth: 'calc(100vw - 24px)' }}
    >
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">캘린더 필터</h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          x
        </button>
      </div>
      <p className="mb-4 text-xs text-gray-400">표시할 캘린더를 선택하세요.</p>

      <div className="mb-4">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-500">학년</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={selectedGrades.length === 0}
              onChange={() => onGradeChange([])}
              className="h-4 w-4 accent-primary-500"
            />
            <span className="text-sm text-gray-600">전체</span>
          </label>
          {ALL_GRADES.map((grade) => (
            <label key={grade} className="flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade)}
                onChange={() =>
                  onGradeChange((prev) => {
                    const next = prev.includes(grade)
                      ? prev.filter((g) => g !== grade)
                      : [...prev, grade];
                    return next.length === ALL_GRADES.length ? [] : next;
                  })
                }
                className="h-4 w-4 accent-primary-500"
              />
              <span className="text-sm text-gray-600">{grade}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4 h-px bg-gray-100" />

      <div>
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-primary-500">태그</p>
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
                className="rounded-full border px-3 py-1 text-xs font-semibold transition-all active:scale-95"
                style={
                  isSelected
                    ? {
                        backgroundColor: TAG_COLORS[tag] ?? '#ACB1BE',
                        borderColor: TAG_COLORS[tag] ?? '#ACB1BE',
                        color: TAG_TEXT_COLORS[tag] ?? '#383642',
                      }
                    : {
                        backgroundColor: '#ffffff',
                        borderColor: '#D3D6DE',
                        color: '#ACB1BE',
                      }
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {(selectedGrades.length > 0 || selectedTags.length > 0) && (
        <button
          onClick={() => {
            onGradeChange([]);
            onTagChange([]);
          }}
          className="mt-4 w-full rounded-lg border border-primary-200 py-2 text-xs font-semibold text-primary-500 transition-all hover:bg-primary-50 hover:text-primary-700"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openedTargetRef = useRef(null);
  const calendarRef = useRef(null);

  const [user, setUser] = useState(getStoredUser);
  const [selectedDate, setSelectedDate] = useState(getTodayStr);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [events, setEvents] = useState([]);
  const [scheduleError, setScheduleError] = useState('');
  const [panelView, setPanelView] = useState('list');
  const [detailEventId, setDetailEventId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetEvent, setEditTargetEvent] = useState(null);

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
    const scheduleId = searchParams.get('scheduleId');
    const commentId = searchParams.get('commentId');
    if (!scheduleId || events.length === 0) return;

    const targetKey = `${scheduleId}:${commentId || ''}`;
    if (openedTargetRef.current === targetKey) return;

    const targetEvent = events.find((event) => String(event.extendedProps.scheduleId) === scheduleId);
    if (!targetEvent) return;

    openedTargetRef.current = targetKey;
    setSelectedDate(targetEvent.start);
    setDetailEventId(targetEvent.id);
    setPanelView('detail');
  }, [events, searchParams]);

  useEffect(() => {
    if (!isFilterOpen) return;
    const handler = (event) => {
      const popup = document.querySelector('.calendar-filter-popup');
      const button = document.querySelector('.fc-filterBtn-button');
      if (popup && !popup.contains(event.target) && (!button || !button.contains(event.target))) {
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

  const handleCalendarEventClick = ({ event }) => {
    setSelectedDate(event.startStr.slice(0, 10));
    setDetailEventId(event.id);
    setPanelView('detail');
  };

  const handleShowDetail = (eventId) => {
    setDetailEventId(eventId);
    setPanelView('detail');
  };

  const handleBackToList = () => {
    setPanelView('list');
    setDetailEventId(null);
  };

  const handleOpenEdit = (eventId) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    setEditTargetEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = async (eventId) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return;

    const scheduleId = event.extendedProps.scheduleId;

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    handleBackToList();

    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || data.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      setEvents((prev) => {
        const stillAbsent = !prev.find((e) => e.id === eventId);
        return stillAbsent ? [...prev, event] : prev;
      });
      alert(`일정 삭제 실패\n${error.message}`);
    }
  };

  const handleEventReaction = async (eventId, reaction) => {
    const currentEvent = events.find((event) => event.id === eventId);
    if (!currentEvent) return;

    const { nextProps, deltas } = getReactionUpdate(currentEvent.extendedProps, reaction);

    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, extendedProps: nextProps } : event,
      ),
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/schedules/${currentEvent.extendedProps.scheduleId}/reactions`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deltas),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || '반응을 저장하지 못했습니다.');
      }

      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                extendedProps: {
                  ...event.extendedProps,
                  likes: data.likeCount ?? event.extendedProps.likes,
                  dislikes: data.dislikeCount ?? event.extendedProps.dislikes,
                },
              }
            : event,
        ),
      );
    } catch (error) {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, extendedProps: currentEvent.extendedProps } : event,
        ),
      );
      alert(error.message);
    }
  };

  const handleCommentReaction = async (eventId, commentId, reaction) => {
    const currentEvent = events.find((event) => event.id === eventId);
    const currentComment = currentEvent?.extendedProps.comments.find(
      (comment) => comment.id === commentId,
    );
    if (!currentEvent || !currentComment) return;

    const { nextProps: nextComment, deltas } = getReactionUpdate(currentComment, reaction);

    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;
        const comments = event.extendedProps.comments.map((comment) =>
          comment.id === commentId ? nextComment : comment,
        );
        return { ...event, extendedProps: { ...event.extendedProps, comments } };
      }),
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/schedules/${currentEvent.extendedProps.scheduleId}/comments/${commentId}/reactions`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deltas),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || '댓글 반응을 저장하지 못했습니다.');
      }

      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== eventId) return event;
          const comments = event.extendedProps.comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  likes: data.likes ?? comment.likes,
                  dislikes: data.dislikes ?? comment.dislikes,
                }
              : comment,
          );
          return { ...event, extendedProps: { ...event.extendedProps, comments } };
        }),
      );
    } catch (error) {
      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== eventId) return event;
          const comments = event.extendedProps.comments.map((comment) =>
            comment.id === commentId ? currentComment : comment,
          );
          return { ...event, extendedProps: { ...event.extendedProps, comments } };
        }),
      );
      alert(error.message);
    }
  };

  const handleAddComment = async (eventId, content) => {
    const currentEvent = events.find((event) => event.id === eventId);
    if (!currentEvent) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/schedules/${currentEvent.extendedProps.scheduleId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: user?.name ?? 'unknown',
            content,
          }),
        },
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || '댓글을 저장하지 못했습니다.');
      }

      await loadSchedules();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-sm">
            <span className="text-sm font-extrabold text-white">C</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-800">COM:HUB</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95"
              >
                <span className="text-base leading-none">+</span>
                <span>새 일정 등록</span>
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 transition-all hover:bg-primary-100 active:scale-95"
              >
                <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-primary-200">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt="프로필" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-primary-600">{user.name?.charAt(0)}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-primary-700">{user.name}님</span>
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700 active:scale-95"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-600 active:scale-95"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <section
          className={`relative overflow-y-auto bg-white p-5 ${
            hasActiveFilters ? 'calendar-has-filters' : ''
          }`}
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

          {scheduleError && (
            <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {scheduleError}
            </div>
          )}

          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            events={filteredCalendarEvents}
            dateClick={handleDateClick}
            eventClick={handleCalendarEventClick}
            eventCursor="pointer"
            height="auto"
            customButtons={{
              filterBtn: {
                text: '필터',
                hint: '캘린더 필터',
                click: () => setIsFilterOpen((prev) => !prev),
              },
              todayBtn: {
                text: '오늘',
                click: () => {
                  calendarRef.current?.getApi().today();
                  setSelectedDate(getTodayStr());
                  setPanelView('list');
                  setDetailEventId(null);
                },
              },
            }}
            headerToolbar={{
              left: 'prev,next todayBtn',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek filterBtn',
            }}
            buttonText={{ month: '월별', week: '주별' }}
            dayCellContent={(arg) => arg.date.getDate()}
            dayCellClassNames={(arg) => {
              const d = arg.date;
              const dateStr = [
                d.getFullYear(),
                String(d.getMonth() + 1).padStart(2, '0'),
                String(d.getDate()).padStart(2, '0'),
              ].join('-');
              return dateStr === selectedDate ? ['day-selected'] : [];
            }}
            eventContent={(arg) => (
              <div
                style={{
                  color: arg.event.textColor || '#383642',
                  fontWeight: 600,
                  fontSize: '0.72rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '1px 4px',
                }}
              >
                {arg.event.title}
              </div>
            )}
          />
        </section>

        <aside
          className="flex flex-col overflow-hidden border-l border-gray-200 bg-gray-50"
          style={{ flex: '3 3 0' }}
        >
          {panelView === 'list' ? (
            <div className="flex h-full flex-col overflow-hidden">
              <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-6 pb-4 pt-6">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-500">
                  Daily Agenda
                </p>
                <h2 className="text-2xl font-extrabold leading-tight text-gray-800">
                  {formatDateLabel(selectedDate)}
                </h2>
                <p className="mt-1.5 text-xs text-gray-400">
                  {agendaEvents.length > 0 ? `총 ${agendaEvents.length}개의 일정` : '일정 없음'}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-2">
                {agendaEvents.length === 0 ? (
                  <div className="flex h-full select-none flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 text-4xl">-</div>
                    <p className="text-sm font-semibold text-gray-500">예정된 일정이 없습니다.</p>
                    <p className="mt-1.5 text-xs text-gray-400">
                      달력에서 다른 날짜를 클릭해 보세요.
                    </p>
                  </div>
                ) : (
                  agendaEvents.map((event, index) => (
                    <AgendaCard
                      key={event.id}
                      event={event}
                      isLast={index === agendaEvents.length - 1}
                      onDetail={() => handleShowDetail(event.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ) : detailEvent ? (
            <EventDetailPanel
              event={detailEvent}
              onBack={handleBackToList}
              onReact={(reaction) => handleEventReaction(detailEventId, reaction)}
              onCommentReact={(commentId, reaction) =>
                handleCommentReaction(detailEventId, commentId, reaction)
              }
              onAddComment={(content) => handleAddComment(detailEventId, content)}
              onEdit={user ? () => handleOpenEdit(detailEventId) : undefined}
              onDelete={user ? () => handleDeleteEvent(detailEventId) : undefined}
              highlightedCommentId={searchParams.get('commentId')}
              user={user}
            />
          ) : null}
        </aside>
      </div>

      <EventAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={loadSchedules}
      />

      <EventAddModal
        key={editTargetEvent?.id ?? 'edit-modal'}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onCreated={() => { loadSchedules(); setIsEditModalOpen(false); }}
        mode="edit"
        initialData={editTargetEvent ? buildEditInitialData(editTargetEvent) : null}
      />
    </div>
  );
}
