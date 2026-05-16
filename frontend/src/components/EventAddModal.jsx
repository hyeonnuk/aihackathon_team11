// ============================================================
//  components/EventAddModal.jsx — '새 일정 등록' 모달
//  Props: isOpen(boolean), onClose(fn)
// ============================================================

import { useState } from 'react';

const INPUT =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 ' +
  'placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 ' +
  'focus:border-transparent transition';

const GRADES = ['전체', '1학년', '2학년', '3학년', '4학년'];

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null'); }
  catch { return null; }
}

function initForm(authorName) {
  return {
    title: '', startDate: '', endDate: '', content: '',
    photo: null, link: '', note: '',
    targetGrade: '전체', isNotice: false,
    hashtags: [],
    author: authorName ?? '알 수 없음',
    likes: 0,
  };
}

// 라벨 + 입력 래퍼
function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function EventAddModal({ isOpen, onClose }) {
  const user = getStoredUser();
  const [form, setForm]             = useState(() => initForm(user?.name));
  const [tagInput, setTagInput]     = useState('');

  if (!isOpen) return null;

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  // 해시태그 추가
  const commitTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !form.hashtags.includes(tag))
      setForm(p => ({ ...p, hashtags: [...p.hashtags, tag] }));
    setTagInput('');
  };
  const onTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commitTag(); }
    if (e.key === 'Backspace' && tagInput === '')
      setForm(p => ({ ...p, hashtags: p.hashtags.slice(0, -1) }));
  };
  const removeTag = (t) =>
    setForm(p => ({ ...p, hashtags: p.hashtags.filter(x => x !== t) }));

  const handleClose = () => {
    setForm(initForm(user?.name));
    setTagInput('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const final = { ...form, endDate: form.endDate || form.startDate };
    console.log('[새 일정 등록] formData:', final);
    handleClose();
  };

  return (
    /* 반투명 배경 — 클릭하면 닫힘 */
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* 모달 박스 */}
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* ── 헤더 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">새 일정 등록</h2>
            <p className="text-xs text-gray-400 mt-0.5">작성한 일정은 캘린더에 표시됩니다.</p>
          </div>
          <button type="button" onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-lg">
            ✕
          </button>
        </div>

        {/* ── 바디 (스크롤 가능) ───────────────────────────── */}
        <div className="overflow-y-auto flex-1">
          <form id="event-add-form" onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

            {/* 1. 제목 */}
            <Field label="제목" required>
              <input type="text" value={form.title} onChange={set('title')}
                placeholder="일정 제목을 입력하세요" required className={INPUT} />
            </Field>

            {/* 2·3. 시작일자 / 마감일자 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="시작일자" required>
                <input type="datetime-local" value={form.startDate}
                  onChange={set('startDate')} required className={INPUT} />
              </Field>
              <Field label="마감일자">
                <input type="datetime-local" value={form.endDate}
                  onChange={set('endDate')} className={INPUT} />
                <p className="text-xs text-gray-400 mt-1">비우면 시작일자와 동일하게 저장됩니다.</p>
              </Field>
            </div>

            {/* 4. 내용 */}
            <Field label="내용">
              <textarea value={form.content} onChange={set('content')} rows={4}
                placeholder="일정에 대한 상세 내용을 입력하세요"
                className={INPUT + ' resize-none'} />
            </Field>

            {/* 5·6. 사진 / 링크 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="사진 첨부">
                <label className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-sm select-none">
                  <span>📎</span>
                  <span className="text-gray-500 truncate">
                    {form.photo ? form.photo.name : '이미지 선택 (선택)'}
                  </span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => setForm(p => ({ ...p, photo: e.target.files[0] ?? null }))} />
                </label>
              </Field>
              <Field label="링크">
                <input type="url" value={form.link} onChange={set('link')}
                  placeholder="https://..." className={INPUT} />
              </Field>
            </div>

            {/* 7. 비고 */}
            <Field label="비고">
              <input type="text" value={form.note} onChange={set('note')}
                placeholder="기타 참고사항 (선택)" className={INPUT} />
            </Field>

            {/* 8·9. 대상 학년 / 공지 여부 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="대상 학년">
                <select value={form.targetGrade} onChange={set('targetGrade')} className={INPUT}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              <Field label="공지 여부">
                <label className="flex items-center gap-3 h-[46px] cursor-pointer select-none">
                  <div className="relative shrink-0">
                    <input type="checkbox" checked={form.isNotice} className="sr-only peer"
                      onChange={e => setForm(p => ({ ...p, isNotice: e.target.checked }))} />
                    <div className="w-10 h-6 bg-gray-200 peer-checked:bg-indigo-600 rounded-full transition-colors duration-200" />
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-gray-600">
                    {form.isNotice ? '공지로 등록됩니다' : '일반 일정으로 등록됩니다'}
                  </span>
                </label>
              </Field>
            </div>

            {/* 10. 해시태그 */}
            <Field label="해시태그">
              <div
                className="flex flex-wrap items-center gap-1.5 w-full min-h-[46px] px-3 py-2 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-transparent transition cursor-text"
                onClick={() => document.getElementById('tag-input').focus()}
              >
                {form.hashtags.map(tag => (
                  <span key={tag}
                    className="flex items-center gap-1 px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                    #{tag}
                    <button type="button"
                      onClick={e => { e.stopPropagation(); removeTag(tag); }}
                      className="text-indigo-400 hover:text-indigo-700 leading-none">✕</button>
                  </span>
                ))}
                <input id="tag-input" type="text" value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={onTagKey} onBlur={commitTag}
                  placeholder={form.hashtags.length === 0 ? 'Enter 또는 Space로 태그 추가' : ''}
                  className="flex-1 min-w-[140px] text-sm bg-transparent outline-none placeholder-gray-300" />
              </div>
            </Field>

            {/* 11·12. 작성자 / 좋아요 */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="작성자">
                <input type="text" value={form.author} readOnly
                  className={INPUT + ' bg-gray-50 text-gray-400 cursor-not-allowed'} />
              </Field>
              <Field label="좋아요">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 select-none">
                  <span>❤️</span><span>0 — 등록 후 집계됩니다</span>
                </div>
              </Field>
            </div>

          </form>
        </div>

        {/* ── 푸터 ─────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={handleClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all">
            취소
          </button>
          <button type="submit" form="event-add-form"
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm">
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}
