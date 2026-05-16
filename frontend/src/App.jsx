// ============================================================
//  App.jsx — 라우터 전용 진입점
//  페이지 컴포넌트를 import해서 경로만 연결한다.
//  비즈니스 로직은 각 pages/ 파일에서 관리한다.
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home    from './pages/Home';
import Login   from './pages/Login';
import Profile from './pages/Profile';
import Signup  from './pages/Signup';
import AdminUsers from './pages/AdminUsers';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Home />}    />
        <Route path="/login"   element={<Login />}   />
        <Route path="/signup"  element={<Signup />}  />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        {/* 정의되지 않은 경로는 홈으로 리다이렉트 */}
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
