// ============================================================
//  Sync-CS 메인 대시보드
//  구성: Header + 좌측 캘린더(FullCalendar) + 우측 상세 패널
// ============================================================

import { useState } from 'react';
import './App.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

// ──────────────────────────────────────────────────────────────
// 더미 이벤트 데이터
// extendedProps 는 FullCalendar 커스텀 필드 (eventClick 에서 접근)
// FullCalendar 의 end 는 exclusive 이므로 실제 마지막 날 +1 로 입력
// ──────────────────────────────────────────────────────────────
const EVENTS = [
  {
    id: '1',
    title: '교내 웹 해커톤',
    start: '2026-05-20',
    end: '2026-05-23', // 5월 20~22일 (end exclusive)
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
    end: '2026-06-08', // 6월 5~7일 (end exclusive)
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
// RecruitCard: 모집글 카드 (분야 뱃지 + 작성자 + 지원하기 버튼)
// ──────────────────────────────────────────────────────────────
function RecruitCard({ field, author }) {
  const handleApply = () => {
    alert(`"${field}" 포지션에 지원했습니다! 작성자(${author})에게 알림이 전송됩니다.`);
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {/* 모집 분야 뱃지 */}
          <span className="inline-block w-fit px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
            {field}
          </span>
          {/* 작성자 */}
          <p className="text-xs text-gray-500">
            작성자&nbsp;
            <span className="font-medium text-gray-700">{author}</span>
          </p>
        </div>
        {/* 지원하기 버튼 */}
        <button
          onClick={handleApply}
          className="shrink-0 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all duration-100 shadow-sm"
        >
          지원하기
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// DetailPanel: 우측 상세 패널
//   - selectedEvent 가 null  → 안내 문구
//   - selectedEvent 가 있음  → 제목/날짜 + 모집글 카드 리스트
// ──────────────────────────────────────────────────────────────
function DetailPanel({ selectedEvent }) {
  // 이벤트 미선택 상태
  if (!selectedEvent) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-center select-none py-12">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-3xl">
          📅
        </div>
        <p className="text-sm font-semibold text-gray-600">달력에서 일정을 선택해주세요</p>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
          일정을 클릭하면 상세 정보와<br />팀원 모집글이 표시됩니다.
        </p>
      </div>
    );
  }

  // 이벤트 선택 상태
  return (
    <div className="flex flex-col gap-5">
      {/* 선택된 일정 헤더 영역 */}
      <div className="pb-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 leading-snug">
          {selectedEvent.title}
        </h2>
        <p className="mt-1 text-sm font-semibold text-indigo-600">
          {selectedEvent.dateLabel}
        </p>
        <p className="mt-2 text-xs text-gray-500 leading-relaxed">
          {selectedEvent.description}
        </p>
      </div>

      {/* 팀원 모집글 리스트 */}
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
// App: 루트 컴포넌트
// ──────────────────────────────────────────────────────────────
export default function App() {
  // 선택된 이벤트 상태 (null = 미선택)
  const [selectedEvent, setSelectedEvent] = useState(null);

  // 캘린더 이벤트 클릭 핸들러
  // clickInfo.event 로 FullCalendar 이벤트 객체에 접근
  const handleEventClick = ({ event }) => {
    setSelectedEvent({
      title: event.title,
      dateLabel: event.extendedProps.dateLabel,
      description: event.extendedProps.description,
      recruitments: event.extendedProps.recruitments,
    });
  };

  return (
    // 화면 전체를 꽉 채우는 세로 Flex 컨테이너
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          상단 네비게이션 바
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <header className="h-16 shrink-0 bg-white shadow-sm flex items-center justify-between px-6 z-10">
        {/* 좌측 로고 */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-extrabold">S</span>
          </div>
          <span className="text-xl font-extrabold text-gray-800 tracking-tight">
            Sync-CS
          </span>
        </div>

        {/* 우측 액션 버튼 그룹 */}
        <div className="flex items-center gap-3">
          {/* 새 일정 등록 버튼 */}
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm">
            <span className="text-base leading-none">+</span>
            <span>새 일정 등록</span>
          </button>
          {/* 내 프로필 버튼 (아이콘) */}
          <button
            title="내 프로필"
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all text-base"
          >
            👤
          </button>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          메인 콘텐츠 영역 (Header 아래 나머지 전체)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="flex flex-1 gap-6 p-6 overflow-hidden min-h-0">

        {/* ─── 좌측 캘린더 영역 (약 67%) ─────────────── */}
        <section
          className="bg-white rounded-xl shadow-md p-4 overflow-y-auto min-w-0"
          style={{ flex: '2 2 0' }}
        >
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="ko"
            events={EVENTS}
            eventClick={handleEventClick}
            eventCursor="pointer"
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek',
            }}
            buttonText={{
              today: '오늘',
              month: '월별',
              week: '주별',
            }}
          />
        </section>

        {/* ─── 우측 상세 패널 (약 33%) ─────────────────── */}
        <aside
          className="bg-white rounded-xl shadow-md p-6 overflow-y-auto flex flex-col min-w-0"
          style={{ flex: '1 1 0' }}
        >
          {/* 패널 타이틀 */}
          <h2 className="text-base font-bold text-gray-800 mb-5 shrink-0 pb-3 border-b border-gray-100">
            일정 상세
          </h2>
          {/* 선택 여부에 따른 콘텐츠 */}
          <DetailPanel selectedEvent={selectedEvent} />
        </aside>

      </main>
    </div>
  );
}
