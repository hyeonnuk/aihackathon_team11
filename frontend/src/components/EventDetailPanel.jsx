// ============================================================
//  components/EventDetailPanel.jsx
//  일정 상세 패널 — 정보, 좋아요/싫어요, 댓글
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { TAG_CHIP_COLORS } from '../constants/tagColors';

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
          ? 'bg-primary-50 text-primary-500'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}

function CommentCard({
  comment,
  user,
  onReact,
  onEditComment,
  onDeleteComment,
  onAddReply,
  onEditReply,
  onDeleteReply,
  onReplyReact,
  isReply = false,
  parentId = null,
  isHighlighted = false,
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isHighlighted) return;
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [isHighlighted]);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  // 로컬 상태 추가: UI에 수정/삭제/대댓글 등록을 즉각적으로 반영하기 위함
  const [localContent, setLocalContent] = useState(comment.content);
  const [localIsDeleted, setLocalIsDeleted] = useState(comment.isDeleted);
  const [localIsEdited, setLocalIsEdited] = useState(comment.isEdited || false);
  const [localReplies, setLocalReplies] = useState(comment.replies || []);

  // 좋아요, 싫어요, 유저 반응 로컬 상태 추가
  const [localLikes, setLocalLikes] = useState(comment.likes || 0);
  const [localDislikes, setLocalDislikes] = useState(comment.dislikes || 0);
  const [localUserReaction, setLocalUserReaction] = useState(comment.userReaction || null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // 상위에서 새로운 댓글 데이터가 넘어올 경우 동기화
  useEffect(() => {
    setLocalContent(comment.content);
    setLocalIsDeleted(comment.isDeleted);
    setLocalIsEdited(comment.isEdited || false);
    setLocalReplies(comment.replies || []);
    setEditContent(comment.content);
    setLocalLikes(comment.likes || 0);
    setLocalDislikes(comment.dislikes || 0);
    setLocalUserReaction(comment.userReaction || null);
  }, [comment.id, comment.content, comment.isDeleted, comment.isEdited, comment.likes, comment.dislikes, comment.userReaction, JSON.stringify(comment.replies)]);

  const isAuthor = user && (user.id === comment.authorId || user.name === comment.author);

  const handleEditSubmit = () => {
    if (!editContent.trim()) return;
    
    setLocalContent(editContent);
    setLocalIsEdited(true);

    if (isReply) {
      if (onEditReply) onEditReply(parentId, comment.id, editContent);
    } else {
      if (onEditComment) onEditComment(comment.id, editContent);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setLocalIsDeleted(true);
      if (isReply) {
        if (onDeleteReply) onDeleteReply(parentId, comment.id);
      } else {
        if (onDeleteComment) onDeleteComment(comment.id);
      }
    }
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;

    const newReply = {
      id: `reply_${Date.now()}`,
      content: replyContent,
      author: user?.name || '익명',
      authorId: user?.id,
      createdAt: '방금 전',
      likes: 0,
      dislikes: 0,
    };
    setLocalReplies((prev) => [...prev, newReply]);

    if (onAddReply) onAddReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  // 좋아요/싫어요 반응 즉시 반영 및 서버 연동 함수 호출
  const handleReaction = (type) => {
    // 화면 즉시 반영 (Optimistic UI)
    if (localUserReaction === type) {
      // 이미 누른 반응 취소
      if (type === 'like') setLocalLikes((prev) => Math.max(0, prev - 1));
      if (type === 'dislike') setLocalDislikes((prev) => Math.max(0, prev - 1));
      setLocalUserReaction(null);
    } else {
      // 새로운 반응 추가 또는 변경
      if (type === 'like') {
        setLocalLikes((prev) => prev + 1);
        if (localUserReaction === 'dislike') setLocalDislikes((prev) => Math.max(0, prev - 1));
      } else {
        setLocalDislikes((prev) => prev + 1);
        if (localUserReaction === 'like') setLocalLikes((prev) => Math.max(0, prev - 1));
      }
      setLocalUserReaction(type);
    }

    // 부모 이벤트 호출 (API 연동을 위함)
    if (isReply) {
      if (onReplyReact) onReplyReact(parentId, comment.id, type);
    } else {
      if (onReact) onReact(comment.id, type);
    }
  };

  const displayContent = localIsDeleted ? '삭제된 내용입니다.' : localContent;

  return (
    <div
      ref={cardRef}
      className={`transition-colors ${isReply ? 'ml-8 mt-2 pl-4 border-l-2 border-gray-100 py-3' : 'py-4'} ${
        isHighlighted ? 'rounded-xl bg-primary-50 px-3 ring-2 ring-primary-200' : ''
      }`}
    >
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-primary-500">
              {comment.author ? comment.author.charAt(0) : '?'}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-700">{comment.author}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{comment.createdAt}</span>
          {localIsEdited && !localIsDeleted && (
            <span className="text-[10px] text-gray-400">(수정됨)</span>
          )}
          {isAuthor && !localIsDeleted && (
            <div className="flex items-center gap-1">
              <button onClick={() => setIsEditing(!isEditing)} className="text-[10px] text-gray-400 hover:text-indigo-600 transition-colors">수정</button>
              <button onClick={handleDelete} className="text-[10px] text-gray-400 hover:text-red-600 transition-colors">삭제</button>
            </div>
          )}
        </div>
      </div>

      {/* 댓글 내용 */}
      {!isEditing ? (
        <p className={`text-sm leading-relaxed pl-8 whitespace-pre-wrap break-words ${localIsDeleted ? 'text-gray-400 italic' : 'text-gray-700'}`}>
          {displayContent}
        </p>
      ) : (
        <div className="pl-8 mt-2 flex flex-col gap-2">
          <textarea
            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500">취소</button>
            <button onClick={handleEditSubmit} className="text-xs font-bold text-indigo-600">저장</button>
          </div>
        </div>
      )}

      {!localIsDeleted && (
        <div className="flex items-center gap-2 mt-2 pl-8">
          <SmallReactionBtn
            emoji="👍"
            count={localLikes}
            isActive={localUserReaction === 'like'}
            onClick={() => handleReaction('like')}
          />
          <SmallReactionBtn
            emoji="👎"
            count={localDislikes}
            isActive={localUserReaction === 'dislike'}
            onClick={() => handleReaction('dislike')}
          />
          {!isReply && user && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="ml-2 text-[10px] font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
            >
              답글 달기
            </button>
          )}
        </div>
      )}

      {isReplying && (
        <div className="pl-8 mt-3 flex gap-2 items-start">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
             <span className="text-[8px] font-bold text-indigo-600">{user.name.charAt(0)}</span>
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
              placeholder="답글을 입력하세요..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsReplying(false)} className="text-xs text-gray-500">취소</button>
              <button onClick={handleReplySubmit} className="text-xs font-bold text-indigo-600">등록</button>
            </div>
          </div>
        </div>
      )}

      {/* 대댓글 렌더링 */}
      {localReplies && localReplies.length > 0 && (
        <div className="mt-2">
          {localReplies.map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              user={user}
              isReply={true}
              parentId={comment.id}
              onReact={onReact}
              onEditComment={onEditComment}
              onDeleteComment={onDeleteComment}
              onAddReply={onAddReply}
              onEditReply={onEditReply}
              onDeleteReply={onDeleteReply}
              onReplyReact={onReplyReact}
            />
          ))}
        </div>
      )}
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
  onEditComment,
  onDeleteComment,
  onAddReply,
  onEditReply,
  onDeleteReply,
  onReplyReact,
  onEdit,
  onDelete,
  highlightedCommentId,
  user,
}) {
  const [commentText, setCommentText] = useState('');
  const ep = event.extendedProps;
  const [prevEventId, setPrevEventId] = useState(event.id);

  const [localComments, setLocalComments] = useState(() => {
    try {
      const stored = localStorage.getItem(`comments_${event.id}`);
      return stored ? JSON.parse(stored) : (ep.comments || []);
    } catch {
      return ep.comments || [];
    }
  });

  // 이벤트가 변경되었을 때 다른 일정의 댓글로 덮어씌워지는 것을 방지 (즉시 동기화)
  if (event.id !== prevEventId) {
    setPrevEventId(event.id);
    setCommentText(''); // 입력 중이던 댓글 초기화
    try {
      const stored = localStorage.getItem(`comments_${event.id}`);
      setLocalComments(stored ? JSON.parse(stored) : (ep.comments || []));
    } catch {
      setLocalComments(ep.comments || []);
    }
  }

  useEffect(() => {
    localStorage.setItem(`comments_${event.id}`, JSON.stringify(localComments));
  }, [localComments, event.id]);

  // 하위 컴포넌트 이벤트 래핑(Intercept) : 부모의 로컬 상태(저장소)를 업데이트하기 위함
  const handleInterceptEditComment = (id, content) => {
    setLocalComments(prev => prev.map(c => c.id === id ? { ...c, content, isEdited: true } : c));
    if (onEditComment) onEditComment(id, content);
  };

  const handleInterceptDeleteComment = (id) => {
    setLocalComments(prev => prev.map(c => c.id === id ? { ...c, isDeleted: true } : c));
    if (onDeleteComment) onDeleteComment(id);
  };

  const handleInterceptAddReply = (parentId, content) => {
    setLocalComments(prev => prev.map(c => {
      if (c.id === parentId) {
        const newReply = {
          id: `reply_${Date.now()}`,
          content,
          author: user?.name || '익명',
          authorId: user?.id,
          createdAt: '방금 전',
          likes: 0,
          dislikes: 0,
        };
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      return c;
    }));
    if (onAddReply) onAddReply(parentId, content);
  };

  const handleInterceptEditReply = (parentId, replyId, content) => {
    setLocalComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: (c.replies || []).map(r => r.id === replyId ? { ...r, content, isEdited: true } : r) } : c));
    if (onEditReply) onEditReply(parentId, replyId, content);
  };

  const handleInterceptDeleteReply = (parentId, replyId) => {
    setLocalComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: (c.replies || []).map(r => r.id === replyId ? { ...r, isDeleted: true } : r) } : c));
    if (onDeleteReply) onDeleteReply(parentId, replyId);
  };

  const handleInterceptCommentReact = (id, type) => {
    setLocalComments(prev => prev.map(c => {
      if (c.id === id) {
        let likes = c.likes || 0;
        let dislikes = c.dislikes || 0;
        let userReaction = c.userReaction;
        if (userReaction === type) {
          if (type === 'like') likes = Math.max(0, likes - 1);
          if (type === 'dislike') dislikes = Math.max(0, dislikes - 1);
          userReaction = null;
        } else {
          if (type === 'like') { likes++; if (userReaction === 'dislike') dislikes = Math.max(0, dislikes - 1); }
          else { dislikes++; if (userReaction === 'like') likes = Math.max(0, likes - 1); }
          userReaction = type;
        }
        return { ...c, likes, dislikes, userReaction };
      }
      return c;
    }));
    if (onCommentReact) onCommentReact(id, type);
  };

  const handleInterceptReplyReact = (parentId, replyId, type) => {
    setLocalComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: (c.replies || []).map(r => {
      if (r.id === replyId) {
        let likes = r.likes || 0;
        let dislikes = r.dislikes || 0;
        let userReaction = r.userReaction;
        if (userReaction === type) {
          if (type === 'like') likes = Math.max(0, likes - 1);
          if (type === 'dislike') dislikes = Math.max(0, dislikes - 1);
          userReaction = null;
        } else {
          if (type === 'like') { likes++; if (userReaction === 'dislike') dislikes = Math.max(0, dislikes - 1); }
          else { dislikes++; if (userReaction === 'like') likes = Math.max(0, likes - 1); }
          userReaction = type;
        }
        return { ...r, likes, dislikes, userReaction };
      }
      return r;
    }) } : c));
    if (onReplyReact) onReplyReact(parentId, replyId, type);
  };

  const badge = getDeadlineBadge(ep.applyEndDate);
  const dateRange = formatEventDateRange(event.start, event.end);

  const submitComment = () => {
    const text = commentText.trim();
    if (!text) return;

    const newComment = {
      id: `comment_${Date.now()}`,
      content: text,
      author: user?.name || '익명',
      authorId: user?.id,
      createdAt: '방금 전',
      likes: 0,
      dislikes: 0,
      replies: [],
    };
    setLocalComments((prev) => [...prev, newComment]);

    if (onAddComment) onAddComment(text);
    setCommentText('');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── 고정 헤더 ──────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-200 bg-gray-50 shrink-0">
        {/* 뒤로가기 + 수정 버튼 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors group"
          >
            <svg
              className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            일정 목록으로
          </button>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                수정
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                삭제
              </button>
            )}
          </div>
        </div>

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
        {ep.photo && (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <img
              src={ep.photo}
              alt={event.title}
              className="max-h-56 w-full object-cover"
            />
          </div>
        )}

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
                backgroundColor: '#ffffff',
                border: `1px solid ${TAG_CHIP_COLORS[tag] ?? event.backgroundColor}`,
                color: TAG_CHIP_COLORS[tag] ?? event.backgroundColor,
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
            activeClass="bg-primary-50 text-primary-600 border-primary-200"
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
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 text-white text-sm font-bold rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all shadow-sm"
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
            💬 댓글 {localComments.length}개
          </p>

          {/* 댓글 입력 */}
          {user ? (
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary-500">{user.name.charAt(0)}</span>
              </div>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent?.isComposing) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
                placeholder="댓글을 입력하세요..."
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent bg-white"
              />
              <button
                onClick={submitComment}
                disabled={!commentText.trim()}
                className="px-3 py-2 text-xs font-bold bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                등록
              </button>
            </div>
          ) : (
            <div className="text-xs text-center text-gray-400 mb-5 py-2 bg-gray-50 rounded-lg">
              댓글을 작성하려면 로그인이 필요합니다.
            </div>
          )}

          {/* 댓글 목록 */}
          {localComments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">아직 댓글이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {localComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  user={user}
                  onReact={handleInterceptCommentReact}
                  onEditComment={handleInterceptEditComment}
                  onDeleteComment={handleInterceptDeleteComment}
                  onAddReply={handleInterceptAddReply}
                  onEditReply={handleInterceptEditReply}
                  onDeleteReply={handleInterceptDeleteReply}
                  onReplyReact={handleInterceptReplyReact}
                  isHighlighted={String(comment.id) === String(highlightedCommentId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}