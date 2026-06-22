'use client';

import React, { useState } from 'react';
import { EduSmartProvider, useEduSmart, Role } from '@/store/edusmartStore';
import { StudentPortal } from '@/components/portals/StudentPortal';
import { TeacherPortal } from '@/components/portals/TeacherPortal';
import { ParentPortal } from '@/components/portals/ParentPortal';
import { AcademicPortal } from '@/components/portals/AcademicPortal';
import { AdminPortal } from '@/components/portals/AdminPortal';
import { 
  GraduationCap, Users, ShieldAlert, Sparkles, Heart, Library, 
  Settings, Menu, BookOpen, Volume2, LogOut, Lock, Mail
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { role, setRole, isOnline, setIsOnline, currentUser, login, logout, users } = useEduSmart();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!email || !password) {
      setLoginError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    const success = login(email.trim(), password);
    if (!success) {
      setLoginError('Email hoặc mật khẩu không chính xác.');
    }
  };

  const handleQuickLogin = (quickEmail: string) => {
    login(quickEmail, '123');
  };

  const getDemoName = (email: string, defaultName: string) => {
    const user = users.find(u => u.email === email);
    return user ? user.name : defaultName;
  };

  const roleDetails: Record<Role, { label: string; icon: string; desc: string; color: string }> = {
    student: { 
      label: 'Học sinh', 
      icon: '👦', 
      desc: 'Bản đồ chặng học, Đấu trường AI & Linh vật thú cưng', 
      color: 'from-blue-500 to-indigo-500' 
    },
    teacher: { 
      label: 'Giáo viên', 
      icon: '👩‍🏫', 
      desc: 'Thiết kế lộ trình, duyệt bài soạn AI & Bản đồ nhiệt', 
      color: 'from-emerald-500 to-teal-500' 
    },
    parent: { 
      label: 'Phụ huynh', 
      icon: '👩‍👦', 
      desc: 'Theo dõi tiến trình con, duyệt quà thực & Lời khuyên AI', 
      color: 'from-pink-500 to-rose-500' 
    },
    academic: { 
      label: 'Giáo vụ', 
      icon: '🎓', 
      desc: 'Thành lập lớp học ảo & Quản trị thư viện số gốc', 
      color: 'from-sky-500 to-indigo-500' 
    },
    admin: { 
      label: 'Quản trị viên', 
      icon: '👑', 
      desc: 'Vòng đời tài khoản, đồng bộ Logs offline & Gemini Key', 
      color: 'from-slate-700 to-slate-900' 
    }
  };

  // Render Login view if no user logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-4 font-sans text-white">
        <div className="max-w-md w-full glass-card bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-5xl block animate-float">🎓</span>
            <h1 className="text-3xl font-black font-display tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              EduSmart AI Portal
            </h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hệ thống Cổng thông tin học tập thông minh</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Địa chỉ Email
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="phuphuynh@gmail.com hoặc giaovu@edusmart.vn"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Mật khẩu đăng nhập
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (Mặc định: 123)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-550 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer mt-2"
            >
              Đăng nhập Hệ thống
            </button>
          </form>

          {/* Quick login selectors */}
          <div className="border-t border-white/10 pt-5 space-y-3.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center">
              💡 Trải nghiệm nhanh các vai trò mẫu
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handleQuickLogin('huong.nt@gmail.com')}
                className="px-3 py-2 bg-pink-950/40 hover:bg-pink-950/60 border border-pink-900/40 rounded-xl text-[11px] font-bold text-pink-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>👩‍👦</span> Phụ huynh ({getDemoName('huong.nt@gmail.com', 'Mẹ Hương')})
              </button>
              <button 
                onClick={() => handleQuickLogin('quan.hm@edusmart.vn')}
                className="px-3 py-2 bg-sky-950/40 hover:bg-sky-950/60 border border-sky-900/40 rounded-xl text-[11px] font-bold text-sky-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>🎓</span> Giáo vụ ({getDemoName('quan.hm@edusmart.vn', 'Thầy Quân')})
              </button>
              <button 
                onClick={() => handleQuickLogin('mai.lt@edusmart.vn')}
                className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-900/40 rounded-xl text-[11px] font-bold text-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>👩‍🏫</span> Giáo viên ({getDemoName('mai.lt@edusmart.vn', 'Cô Mai')})
              </button>
              <button 
                onClick={() => handleQuickLogin('han.lng@edusmart.vn')}
                className="px-3 py-2 bg-pink-950/40 hover:bg-pink-950/60 border border-pink-900/40 rounded-xl text-[11px] font-bold text-pink-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>👧</span> Học sinh ({getDemoName('han.lng@edusmart.vn', 'Gia Hân')})
              </button>
            </div>
            <button 
              onClick={() => handleQuickLogin('admin@edusmart.vn')}
              className="w-full px-3 py-2 bg-slate-850 hover:bg-slate-800 border border-white/5 rounded-xl text-[11px] font-bold text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>👑</span> Đăng nhập Quản trị viên (Admin)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const details = roleDetails[role] || roleDetails.student;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/30 flex flex-col font-sans pb-12">
      
      {/* Universal Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/80 px-6 py-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Branding Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-3xl animate-float">🎓</span>
          <div>
            <h1 className="text-xl font-black font-display tracking-tight text-slate-800 flex items-center gap-1.5">
              EduSmart
              <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow">AI Portal</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400">Cổng thông tin học tập thông minh Tiểu học</p>
          </div>
        </div>

        {/* Global Role Selector Bar - For admins/testing, or show profile details */}
        <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-2xl border border-slate-200/50">
          <div className="text-right">
            <h4 className="text-xs font-black text-slate-800">{currentUser.name}</h4>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
              {details.label} ({currentUser.email})
            </p>
          </div>
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${details.color} text-white flex items-center justify-center text-sm shadow`}>
            {details.icon}
          </div>
          
          <button 
            onClick={logout}
            className="p-2 hover:bg-slate-200 text-slate-500 hover:text-red-650 rounded-xl transition-all cursor-pointer"
            title="Đăng xuất khỏi tài khoản"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Connectivity Control widget */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              isOnline 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
            }`}
            title="Nhấn để mô phỏng mất kết nối mạng Internet"
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>{isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 flex-1">
        
        {/* Role intro snippet */}
        <div className="mb-6 p-4.5 bg-white border border-slate-200/60 rounded-3xl flex items-center gap-3.5 shadow-sm">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${details.color} text-white flex items-center justify-center text-xl shadow-md`}>
            {details.icon}
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              Không gian: {details.label}
            </h2>
            <p className="text-xs font-semibold text-slate-500 leading-normal">
              {details.desc}
            </p>
          </div>
        </div>

        {/* Render Portal Views */}
        <div className="transition-all duration-300">
          {role === 'student' && <StudentPortal />}
          {role === 'teacher' && <TeacherPortal />}
          {role === 'parent' && <ParentPortal />}
          {role === 'academic' && <AcademicPortal />}
          {role === 'admin' && <AdminPortal />}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] font-semibold text-slate-400 mt-12 py-4 border-t border-slate-200/50">
        EduSmart Prototype v1.0.0 © 2026. Thiết kế dựa trên Chuẩn GDPT 2018 Việt Nam & Next.js 16.
      </footer>
    </div>
  );
};

export default function Home() {
  return (
    <EduSmartProvider>
      <AppContent />
    </EduSmartProvider>
  );
}
