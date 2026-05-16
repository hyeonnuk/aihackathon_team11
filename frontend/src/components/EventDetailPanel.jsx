// ============================================================
//  components/EventDetailPanel.jsx
//  일정 상세 패널 — 정보, 좋아요/싫어요, 댓글
// ============================================================

import { useState } from 'react';

// ── Helpers ──────────────────────────────────────────────────

// FullCalendar의 end 는 exclusive → 실제 마지막 날은 -1 day
function formatEventDateRange(start, end) {
  if (!end) return start;
  const d = new Date(end + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  const endStr = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
  return start === endStr ? start : `${start} ~ ${endStr}`;
}

function getDeadlineBadge(applyEndDate) {
  if (!applyEndDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(applyEndDate + 'T23:59:59');
  const diffDays = Math.ceil((end - today) / 86_400_000);
  if (diffDays < 0) return 'closed';
  if (diffDays <= 3) return 'imminent';
  return null;
}

// ── Sub-components ────────────────────────────────────────────

function ReactionBtn({ emoji, count, isActive, activeClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
        isActive ? activeClass : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
      }`}
    >
      <span className="text-base">{emoji}</span>
      <span>{count}</span>
    </button>
  );
}

function SmallReactionBtn({ emoji, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? 'bg-indigo-50 text-indigo-600'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}

function CommentCard({ comment, onReact }) {
  return (
    <div className="py-4">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-indigo-600">
              {comment.author.charAt(0)}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-700">{comment.author}</span>
        </div>
        <span className="text-[10px] text-gray-400">{comment.createdAt}</span>
      </div>

      {/* 댓글 내용 */}
      <p className="text-sm text-gray-700 leading-relaxed pl-8 whitespace-pre-wrap break-words">
        {comment.content}
      </p>

      {/* 댓글 반응 */}
      <div className="flex items-center gap-2 mt-2 pl-8">
        <SmallReactionBtn
          emoji="👍"
          count={comment.likes}
          isActive={comment.userReaction === 'like'}
          onClick={() => onReact(comment.id, 'like')}
        />
        <SmallReactionBtn
          emoji="👎"
          count={comment.dislikes}
          isActive={comment.userReaction === 'dislike'}
          onClick={() => onReact(comment.id, 'dislike')}
        />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────
export default function EventDetailPanel({
  event,
  onBack,
  onReact,
  onCommentReact,
  onAddComment,
  user,
}) {
  const [commentText, setCommentText] = useState('');
  const ep = event.extendedProps;
  const badge = getDeadlineBadge(ep.applyEndDate);
  const dateRange = formatEventDateRange(event.start, event.end);

  const submitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    onAddComment(text);
    setCommentText('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── 고정 헤더 ──────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-gray-50 shrink-0">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors mb-3 group"
        >
          <svg
            className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          일정 목록으로
        </button>

        {/* 제목 + 뱃지 */}
        <div className="flex items-start gap-3">
          <div
            className="w-1.5 rounded-full shrink-0 mt-0.5"
            style={{ backgroundColor: event.backgroundColor, height: '44px' }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-800 leading-snug">{event.title}</h2>
              {badge === 'closed' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-200 text-gray-500">
                  마감
                </span>
              )}
              {badge === 'imminent' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600">
                  마감 임박
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">📅 {dateRange}</p>
          </div>
        </div>
      </div>

      {/* ── 스크롤 바디 ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* 메타 정보 */}
        <div className="space-y-3">
          {ep.applyPeriod && (
            <div className="flex gap-3">
              <span className="text-gray-300 shrink-0">📋</span>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">신청 기간</p>
                <p className="text-sm text-gray-700 mt-0.5">{ep.applyPeriod}</p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <span className="text-gray-300 shrink-0">👤</span>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">작성자</p>
              <p className="text-sm text-gray-700 mt-0.5">{ep.author}</p>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">설명</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
            {ep.description}
          </p>
        </div>

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5">
          {ep.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-semibold rounded-full"
              style={{
                backgroundColor: event.backgroundColor + '22',
                color: event.backgroundColor,
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* 좋아요 / 싫어요 */}
        <div className="flex items-center gap-3">
          <ReactionBtn
            emoji="👍"
            count={ep.likes}
            isActive={ep.userReaction === 'like'}
            activeClass="bg-indigo-50 text-indigo-700 border-indigo-200"
            onClick={() => onReact('like')}
          />
          <ReactionBtn
            emoji="👎"
            count={ep.dislikes}
            isActive={ep.userReaction === 'dislike'}
            activeClass="bg-rose-50 text-rose-600 border-rose-200"
            onClick={() => onReact('dislike')}
          />
        </div>

        {/* 신청 링크 버튼 */}
        {ep.applyLink && (
          <a
            href={ep.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
          >
            신청하러 가기
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        )}

        {/* 구분선 */}
        <div className="h-px bg-gray-100" />

        {/* 댓글 영역 */}
        <div>
          <p className="text-xs font-bold text-gray-700 mb-4">
            💬 댓글 {ep.comments.length}개
          </p>

          {/* 댓글 입력 */}
          {user ? (
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-indigo-600">{user.name.charAt(0)}</span>
              </div>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitComment(); } }}
                placeholder="댓글을 입력하세요..."
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-white"
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className="px-3 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                작성
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-3 mb-4 bg-gray-100 rounded-lg">
              로그인 후 댓글을 작성할 수 있습니다.
            </p>
          )}

          {/* 댓글 목록 */}
          {ep.comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">아직 댓글이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {ep.comments.map((c) => (
                <CommentCard key={c.id} comment={c} onReact={onCommentReact} />
              ))}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
