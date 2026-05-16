// ============================================================
//  DashboardPage.jsx — /
//  FullCalendar 대시보드 + localStorage 기반 인증 헤더
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import EventAddModal from '../components/EventAddModal';
import MemoAddModal from '../components/MemoAddModal';

// ──────────────────────────────────────────────────────────────
// 더미 이벤트 데이터
// ──────────────────────────────────────────────────────────────
const EVENTS = [
  {
    id: '1',
    title: '교내 웹 해커톤',
    start: '2026-05-20',
    end: '2026-05-23',
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    extendedProps: {
      dateLabel: '2026년 5월 20일 ~ 22일',
      description: '학교 주관 웹 개발 해커톤. 팀원 모집 후 참가 등록 필요.',
      recruitments: [
        { id: 'r1', field: '프론트엔드', author: '홍길동' },
        { id: 'r2', field: '백엔드', author: '김철수' },
      ],
    },
  },
  {
    id: '2',
    title: '카카오 코딩테스트',
    start: '2026-05-28',
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    extendedProps: {
      dateLabel: '2026년 5월 28일',
      description: '카카오 2026 하반기 공채 코딩테스트. 온라인 진행.',
      recruitments: [
        { id: 'r3', field: '알고리즘 스터디', author: '이영희' },
        { id: 'r4', field: '풀스택', author: '박지수' },
      ],
    },
  },
  {
    id: '3',
    title: 'Google ML Bootcamp',
    start: '2026-06-05',
    end: '2026-06-08',
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    extendedProps: {
      dateLabel: '2026년 6월 5일 ~ 7일',
      description: 'Google 머신러닝 부트캠프. 사전 과제 제출 후 참가 가능.',
      recruitments: [
        { id: 'r5', field: 'AI / ML', author: '최민준' },
        { id: 'r6', field: '데이터 분석', author: '정수현' },
      ],
    },
  },
];

// ──────────────────────────────────────────────────────────────
// localStorage 헬퍼: 파싱 실패 시 null 반환
// ──────────────────────────────────────────────────────────────
function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// RecruitCard: 모집글 카드
// ──────────────────────────────────────────────────────────────
function RecruitCard({ field, author }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="inline-block w-fit px-2.5 py-0.5 bg-primary-100 text-primary-600 text-xs font-semibold rounded-full">
            {field}
          </span>
          <p className="text-xs text-gray-500">
            작성자&nbsp;<span className="font-medium text-gray-700">{author}</span>
          </p>
        </div>
        <button
          onClick={() => alert(`"${field}" 포지션에 지원했습니다! 작성자(${author})에게 알림이 전송됩니다.`)}
          className="shrink-0 px-3 py-1.5 bg-primary-500 text-white text-xs font-semibold rounded-lg hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
        >
          지원하기
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DetailPanel: 우측 상세 패널
// ──────────────────────────────────────────────────────────────
function DetailPanel({ selectedEvent }) {
  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center select-none py-12">
        <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4 text-3xl">
          📅
        </div>
        <p className="text-sm font-semibold text-gray-600">달력에서 일정을 선택해주세요</p>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          일정을 클릭하면 상세 정보와<br />팀원 모집글이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 leading-snug">{selectedEvent.title}</h2>
        <p className="mt-1 text-sm font-semibold text-primary-500">{selectedEvent.dateLabel}</p>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">{selectedEvent.description}</p>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">팀원 모집글</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {selectedEvent.recruitments.length}건
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {selectedEvent.recruitments.map((rec) => (
            <RecruitCard key={rec.id} field={rec.field} author={rec.author} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DashboardPage: 메인 컴포넌트
// ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();

  // localStorage 에서 초기값을 읽어 유저 상태 초기화
  const [user, setUser] = useState(getStoredUser);

  // 캘린더에서 선택된 이벤트
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // 새 일정 모달 상태 및 로컬에 저장된 커스텀 이벤트들 불러오기
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);

  const loadLocalData = () => {
    try {
      const events = JSON.parse(localStorage.getItem('local_events')) || [];
      const memos = JSON.parse(localStorage.getItem('local_memos')) || [];
      const adjustedMemos = memos.map(m => {
        if (m.allDay && m.end) {
          const d = new Date(`${m.end}T00:00:00`);
          d.setDate(d.getDate() + 1);
          return { ...m, end: [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-') };
        }
        return m;
      });
      return [...events, ...adjustedMemos];
    } catch {
      return [];
    }
  };

  const [localEvents, setLocalEvents] = useState(loadLocalData);

  const allEvents = [...EVENTS, ...localEvents];

  // 로그아웃: localStorage 삭제 → 상태 초기화 → 로그인 페이지로 이동
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const handleEventClick = ({ event }) => {
    setSelectedEvent({
      title: event.title,
      dateLabel: event.extendedProps.dateLabel,
      description: event.extendedProps.description,
      recruitments: event.extendedProps.recruitments,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ━━━ 상단 네비게이션 바 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="h-16 shrink-0 bg-white shadow-sm flex items-center justify-between px-6 z-10">

        {/* 좌측 로고 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-extrabold">C</span>
          </div>
          <span className="text-xl font-extrabold text-gray-800 tracking-tight">COM:HUB</span>
        </div>

        {/* 우측 인증 영역 */}
        <div className="flex items-center gap-3">
          {user ? (
            // ── 로그인 상태 ──────────────────────────────────────
            <>
              {/* 새 메모 등록 버튼 */}
              <button 
                onClick={() => setIsMemoModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-primary-200 bg-primary-50 text-primary-700 text-sm font-semibold rounded-lg hover:bg-primary-100 active:scale-95 transition-all shadow-sm"
              >
                <span className="text-base leading-none">+</span>
                <span>새 메모 등록</span>
              </button>

              {/* 새 일정 등록 버튼 */}
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
              >
                <span className="text-base leading-none">+</span>
                <span>새 일정 등록</span>
              </button>

              {/* 유저 뱃지 */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-full">
                <div className="w-6 h-6 bg-primary-200 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-600">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-primary-700">
                  {user.name}님 환영합니다
                </span>
              </div>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 active:scale-95 transition-all"
              >
                로그아웃
              </button>
            </>
          ) : (
            // ── 비로그인 상태 ─────────────────────────────────────
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 bg-primary-500 text-white text-sm font-semibold rounded-lg hover:bg-primary-600 active:scale-95 transition-all shadow-sm"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* ━━━ 메인 콘텐츠 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="flex flex-1 gap-6 p-6 overflow-hidden min-h-0">

        {/* ─── 좌측 캘린더 (약 67%) ───────────────────────────── */}
        <section
          className="bg-white rounded-xl shadow-md p-4 overflow-y-auto min-w-0"
          style={{ flex: '2 2 0' }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            events={allEvents}
            eventClick={handleEventClick}
            eventCursor="pointer"
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            buttonText={{ today: '오늘', month: '월별', week: '주별' }}
          />
        </section>

        {/* ─── 우측 상세 패널 (약 33%) ─────────────────────────── */}
        <aside
          className="bg-white rounded-xl shadow-md p-6 overflow-y-auto flex flex-col min-w-0"
          style={{ flex: '1 1 0' }}
        >
          <h2 className="text-base font-bold text-gray-800 mb-5 shrink-0 pb-3 border-b border-gray-100">
            일정 상세
          </h2>
          <DetailPanel selectedEvent={selectedEvent} />
        </aside>

      </main>

      <EventAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={() => setLocalEvents(loadLocalData())}
      />
      <MemoAddModal
        isOpen={isMemoModalOpen}
        onClose={() => setIsMemoModalOpen(false)}
        onCreated={() => setLocalEvents(loadLocalData())}
      />
    </div>
  );
}
