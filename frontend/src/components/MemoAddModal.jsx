import { useEffect, useState } from 'react';

const INPUT =
  'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 ' +
  'placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 ' +
  'focus:border-transparent transition';

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null');
  } catch {
    return null;
  }
}

export default function MemoAddModal({ isOpen, onClose, onCreated, initialData = null, mode = 'add' }) {
  const [form, setForm] = useState({
    title: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    isAllDay: false,
    content: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setForm(initialData);
      } else {
        const now = new Date();
        const today = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, '0'),
          String(now.getDate()).padStart(2, '0')
        ].join('-');
  
        setForm({
          title: '',
          startDate: today,
          startTime: '09:00',
          endDate: today,
          endTime: '10:00',
          isAllDay: false,
          content: '',
        });
      }
    }
  }, [isOpen, mode, initialData]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.startDate) {
      alert('제목과 시작 날짜를 입력해주세요.');
      return;
    }

    const user = getStoredUser();
    let finalEndDate = form.endDate || form.startDate;
    
    // 종료일이 시작일보다 빠르면 시작일과 동일하게 보정
    if (finalEndDate < form.startDate) {
      finalEndDate = form.startDate;
    }

    const newMemo = {
      id: mode === 'edit' ? initialData.id : `memo_${Date.now()}`,
      title: `[메모] ${form.title.trim()}`,
      start: form.isAllDay ? form.startDate : `${form.startDate}T${form.startTime}:00`,
      end: form.isAllDay ? finalEndDate : `${finalEndDate}T${form.endTime}:00`,
      allDay: form.isAllDay,
      backgroundColor: '#f59e0b', // amber-500
      borderColor: '#f59e0b',
      extendedProps: {
        grade: [],
        tags: ['메모'],
        description: form.content.trim(),
        applyPeriod: null,
        applyEndDate: null,
        author: user?.name || '나',
        photo: null,
        note: null,
        notice: false,
        likes: 0,
        dislikes: 0,
        userReaction: null,
        comments: [],
        isMemo: true,
      }
    };

    try {
      const existing = JSON.parse(localStorage.getItem('local_memos') || '[]');
      if (mode === 'edit') {
        const idx = existing.findIndex(m => m.id === initialData.id);
        if (idx > -1) existing[idx] = newMemo;
        else existing.push(newMemo);
      } else {
        existing.push(newMemo);
      }
      localStorage.setItem('local_memos', JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save memo to localStorage', e);
    }

    alert(mode === 'edit' ? '메모가 수정되었습니다.' : '메모가 등록되었습니다.');
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-widest text-amber-500 uppercase">개인 메모</p>
            <h2 className="text-lg font-extrabold leading-tight text-gray-800">{mode === 'edit' ? '메모 수정' : '새 메모 등록'}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">✕</button>
        </div>

        {/* 본문 폼 */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="memo-add-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="메모 제목" required>
              <input type="text" value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="기억할 메모의 제목을 입력하세요" className={INPUT} required />
            </Field>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">일정 시간 설정</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAllDay} onChange={(e) => handleChange('isAllDay', e.target.checked)} className="h-4 w-4 accent-amber-500" />
                  <span className="text-xs font-bold text-gray-600">하루 종일</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="시작 날짜/시간" required>
                  <div className="flex flex-col gap-1.5">
                    <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className={`${INPUT} py-2.5`} required />
                    {!form.isAllDay && <input type="time" value={form.startTime} onChange={(e) => handleChange('startTime', e.target.value)} className={`${INPUT} py-2.5`} required />}
                  </div>
                </Field>
                <Field label="종료 날짜/시간">
                  <div className="flex flex-col gap-1.5">
                    <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} className={`${INPUT} py-2.5`} />
                    {!form.isAllDay && <input type="time" value={form.endTime} onChange={(e) => handleChange('endTime', e.target.value)} className={`${INPUT} py-2.5`} />}
                  </div>
                </Field>
              </div>
            </div>
            <Field label="메모 내용">
              <textarea value={form.content} onChange={(e) => handleChange('content', e.target.value)} placeholder="자세한 메모 내용을 작성하세요..." rows={5} className={`${INPUT} resize-none leading-relaxed`} />
            </Field>
          </form>
        </div>

        {/* 푸터 버튼 */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200">취소</button>
          <button type="submit" form="memo-add-form" className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-600 active:scale-95">{mode === 'edit' ? '수정 완료' : '메모 저장'}</button>
        </div>
      </div>
    </div>
  );
}