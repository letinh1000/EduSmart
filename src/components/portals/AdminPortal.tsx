'use client';

import React, { useState, useEffect } from 'react';
import { useEduSmart, SyncLog } from '@/store/edusmartStore';
import { 
  Shield, Users, Activity, Sliders, Database, Trash2, CheckCircle2, 
  Settings, Key, AlertCircle, Plus, FileSpreadsheet, Edit
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    syncQueue, 
    clearSyncQueue,
    users,
    createUser,
    deleteUser,
    updateUser,
    ttsLimits,
    setTtsLimits,
    ttsUsage,
    resetTtsUsage,
    recordTtsUsage,
    currentUser
  } = useEduSmart();
  
  const [activeTab, setActiveTab] = useState<'users' | 'sync' | 'keys'>('users');

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'teacher' | 'parent' | 'academic' | 'admin'>('student');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // User Tab Search & Filter States
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'teacher' | 'parent' | 'academic' | 'admin'>('all');

  // User Editing States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<'student' | 'teacher' | 'parent' | 'academic' | 'admin'>('student');

  // Limit Input States
  const [parentLimitInput, setParentLimitInput] = useState(ttsLimits.parentLimit);
  const [teacherLimitInput, setTeacherLimitInput] = useState(ttsLimits.teacherLimit);
  const [saveLimitsSuccess, setSaveLimitsSuccess] = useState(false);

  // Search & Filter States for TTS Settings
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'parent' | 'teacher'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'system_api' | 'exceeded_limit'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setParentLimitInput(ttsLimits.parentLimit);
    setTeacherLimitInput(ttsLimits.teacherLimit);
  }, [ttsLimits]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;

    createUser(newUserName.trim(), newUserEmail.trim(), newUserRole, newUserPassword.trim());
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    alert('Thêm tài khoản người dùng mới thành công! 🌟');
  };

  const handleSimulateCSV = () => {
    alert('Đã sẵn sàng tải lên CSV danh sách học sinh Lớp 3A... Đồng bộ 3 tài khoản hoàn tất! 📂');
    createUser('Trần Thu Trang', 'trang.tt@edusmart.vn', 'student', '123');
    createUser('Phạm Hải Nam', 'nam.ph@edusmart.vn', 'student', '123');
    createUser('Lê Thùy Linh', 'linh.lt@edusmart.vn', 'student', '123');
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    setTtsLimits({
      parentLimit: Number(parentLimitInput),
      teacherLimit: Number(teacherLimitInput)
    });
    setSaveLimitsSuccess(true);
    setTimeout(() => setSaveLimitsSuccess(false), 2000);
  };

  const handleStartEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
  };

  const handleSaveEditUser = (id: string) => {
    if (!editUserName.trim() || !editUserEmail.trim()) {
      alert('Họ tên và Email không được để trống.');
      return;
    }

    updateUser(id, {
      name: editUserName.trim(),
      email: editUserEmail.trim(),
      role: editUserRole
    });
    setEditingUserId(null);
    alert('Cập nhật tài khoản thành công! 📝');
  };

  const parentsAndTeachers = users.filter(u => u.role === 'parent' || u.role === 'teacher');

  // Search Suggestions for TTS (Name / ID matching)
  const searchSuggestions = searchTerm.trim() === '' ? [] : parentsAndTeachers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.id.includes(searchTerm)
  ).slice(0, 5);

  // Filtered Users List for TTS Tab
  const filteredUsers = parentsAndTeachers.filter(user => {
    // 1. Search filter: matches name or ID
    const matchesSearch = searchTerm.trim() === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.includes(searchTerm);
      
    // 2. Group filter
    const matchesGroup = selectedGroup === 'all' || user.role === selectedGroup;
    
    // 3. Status filter
    const usage = ttsUsage[user.id] || 0;
    const limit = user.role === 'parent' ? ttsLimits.parentLimit : ttsLimits.teacherLimit;
    const hasOwnKey = !!(user.geminiKey || user.openaiKey);
    const isExceeded = !hasOwnKey && usage >= limit;

    let matchesStatus = true;
    if (statusFilter === 'system_api') {
      matchesStatus = !hasOwnKey;
    } else if (statusFilter === 'exceeded_limit') {
      matchesStatus = !hasOwnKey && isExceeded;
    }
    
    return matchesSearch && matchesGroup && matchesStatus;
  });

  // Filtered Users List for Account List Tab
  const filteredUsersList = users.filter(user => {
    const matchesSearch = userSearchTerm.trim() === '' ||
      user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.id.includes(userSearchTerm);

    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.includes(u.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect all filtered
      const filteredIds = filteredUsers.map(u => u.id);
      setSelectedUsers(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered
      const filteredIds = filteredUsers.map(u => u.id);
      setSelectedUsers(prev => {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      });
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkResetUsage = () => {
    if (selectedUsers.length === 0) {
      alert('Vui lòng chọn ít nhất một người dùng để đặt lại hạn mức.');
      return;
    }
    
    if (confirm(`Bạn có chắc chắn muốn đặt lại hạn mức cho ${selectedUsers.length} tài khoản đã chọn?`)) {
      selectedUsers.forEach(id => {
        const usage = ttsUsage[id] || 0;
        if (usage > 0) {
          recordTtsUsage(id, -usage);
        }
      });
      setSelectedUsers([]);
      alert('Đã đặt lại hạn mức sử dụng thành công!');
    }
  };

  const handleResetUserUsage = (id: string, name: string) => {
    if (confirm(`Đặt lại hạn mức sử dụng giọng đọc AI về 0 cho tài khoản: ${name}?`)) {
      const usage = ttsUsage[id] || 0;
      if (usage > 0) {
        recordTtsUsage(id, -usage);
      }
      alert(`Đã đặt lại hạn mức sử dụng của ${name} về 0.`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Portal Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-700 via-slate-800 to-zinc-900 rounded-3xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 rounded-full border-4 border-white/60 bg-white flex items-center justify-center text-3xl shadow">
            👑
          </div>
          <div>
            <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Hệ Thống</span>
            <h1 className="text-2xl font-black font-display tracking-tight mt-0.5">{currentUser ? currentUser.name : 'Quản trị viên'}</h1>
            <p className="text-xs font-semibold opacity-90">Theo dõi đồng bộ, cấu hình API Key & ngân sách chi phí</p>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-center flex flex-col">
          <span className="text-[10px] font-bold opacity-80 uppercase">Số lượng người dùng</span>
          <span className="text-base font-black mt-0.5">{users.length} tài khoản</span>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex bg-white/40 p-2 rounded-2xl border border-slate-200/50">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'users' ? 'bg-slate-800 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          Quản lý tài khoản
        </button>
        <button 
          onClick={() => setActiveTab('sync')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'sync' ? 'bg-slate-800 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Database className="w-4 h-4" />
          Đồng bộ Ngoại tuyến
        </button>
        <button 
          onClick={() => setActiveTab('keys')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'keys' ? 'bg-slate-800 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Key className="w-4 h-4" />
          Cài đặt hệ thống
        </button>
      </div>

      {/* Main Tab Panel Content */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/80">
        
        {/* USER MANAGEMENT DASHBOARD */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Lọc và Tìm kiếm người dùng */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/50 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm tài khoản theo Họ tên, Email, ID..."
                  className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
                {userSearchTerm && (
                  <button 
                    type="button" 
                    onClick={() => setUserSearchTerm('')}
                    className="absolute right-3 top-2 text-xs font-black text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Xóa
                  </button>
                )}
              </div>

              <div className="sm:w-48">
                <select
                  value={userRoleFilter}
                  onChange={(e: any) => setUserRoleFilter(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="student">Học sinh (Student)</option>
                  <option value="teacher">Giáo viên (Teacher)</option>
                  <option value="parent">Phụ huynh (Parent)</option>
                  <option value="academic">Giáo vụ (Academic)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Users list database view */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Danh sách tài khoản hệ thống ({filteredUsersList.length})</h3>
                  <button 
                    onClick={handleSimulateCSV}
                    className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 bg-white text-slate-700 text-xs font-black rounded-xl shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Nhập hàng loạt CSV
                  </button>
                </div>

                <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm bg-white text-xs">
                  <table className="w-full border-collapse text-left font-bold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="p-3">Họ Tên</th>
                        <th className="p-3">Vai trò</th>
                        <th className="p-3">Email liên hệ</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsersList.map(user => {
                        const isEditing = editingUserId === user.id;

                        if (isEditing) {
                          return (
                            <tr key={user.id} className="bg-indigo-50/20">
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={editUserName}
                                  onChange={(e) => setEditUserName(e.target.value)}
                                  className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 font-bold text-slate-700 focus:outline-none"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={editUserRole}
                                  onChange={(e: any) => setEditUserRole(e.target.value)}
                                  className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 font-bold text-slate-750 focus:outline-none"
                                >
                                  <option value="student">student</option>
                                  <option value="teacher">teacher</option>
                                  <option value="parent">parent</option>
                                  <option value="academic">academic</option>
                                  <option value="admin">admin</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="email"
                                  value={editUserEmail}
                                  onChange={(e) => setEditUserEmail(e.target.value)}
                                  className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1.5 font-bold text-slate-700 focus:outline-none"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex gap-1.5 justify-center">
                                  <button
                                    onClick={() => handleSaveEditUser(user.id)}
                                    className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-sm"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    onClick={() => setEditingUserId(null)}
                                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black cursor-pointer"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={user.id} className="hover:bg-slate-50">
                            <td className="p-3 font-extrabold text-slate-850">{user.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                user.role === 'student' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                user.role === 'teacher' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                user.role === 'parent' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                                user.role === 'academic' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-500">{user.email}</td>
                            <td className="p-2 text-center">
                              <div className="flex justify-center gap-1.5">
                                <button 
                                  onClick={() => handleStartEditUser(user)}
                                  className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-500 hover:text-slate-750"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { if (confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) deleteUser(user.id); }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create User Form */}
              <div className="lg:col-span-1">
                <form onSubmit={handleAddUser} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-slate-600" />
                    Thêm người dùng mới
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Họ và tên</label>
                    <input 
                      type="text" 
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Email</label>
                    <input 
                      type="email" 
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="a.nguyen@edusmart.vn"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Mật khẩu</label>
                    <input 
                      type="password" 
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Vai trò người dùng</label>
                    <select 
                      value={newUserRole}
                      onChange={(e: any) => setNewUserRole(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="student">Học sinh (Student)</option>
                      <option value="teacher">Giáo viên (Teacher)</option>
                      <option value="parent">Phụ huynh (Parent)</option>
                      <option value="academic">Giáo vụ (Academic)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                  >
                    Tạo tài khoản mới
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* OFFLINE SYNC LOGS MONITOR */}
        {activeTab === 'sync' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Đồng bộ dữ liệu ngoại tuyến (Offline-First Monitor)</h3>
                <p className="text-xs font-semibold text-slate-500">Giám sát các bản ghi nhật ký hoạt động được đồng bộ ngược từ LocalStorage máy khách lên hệ thống.</p>
              </div>
              {syncQueue.length > 0 && (
                <button 
                  onClick={clearSyncQueue}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                >
                  Xóa lịch sử đồng bộ
                </button>
              )}
            </div>

            {syncQueue.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/50 text-slate-400 text-xs font-bold space-y-1">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p>Mọi dữ liệu cục bộ đã được đồng bộ hoàn hảo với Supabase!</p>
                <p className="text-[10px] text-slate-400 font-medium">Không phát hiện bản ghi lỗi hoặc xung đột dữ liệu.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                {syncQueue.map(log => (
                  <div key={log.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-700">{log.action}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">{new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      log.status === 'synced' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700 animate-pulse'
                    }`}>
                      {log.status === 'synced' ? 'Đã đồng bộ' : 'Chờ mạng'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* API KEY & TOKEN SYSTEM SYSTEM SETTINGS */}
        {activeTab === 'keys' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h3 className="text-lg font-black text-slate-800 font-display">Cấu hình Hạn mức Giọng đọc AI (TTS)</h3>
              <p className="text-xs font-semibold text-slate-500">Giới hạn số lượng ký tự hàng tháng cho Phụ huynh và Giáo viên sử dụng API Key chung (.env).</p>
            </div>

            <form onSubmit={handleSaveLimits} className="space-y-4 bg-white/40 p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-650 uppercase">Hạn mức Phụ huynh (ký tự/tháng)</label>
                  <input 
                    type="number" 
                    value={parentLimitInput}
                    onChange={(e) => setParentLimitInput(Number(e.target.value))}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    min="0"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold">Áp dụng khi dùng API hệ thống chung.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-650 uppercase">Hạn mức Giáo viên (ký tự/tháng)</label>
                  <input 
                    type="number" 
                    value={teacherLimitInput}
                    onChange={(e) => setTeacherLimitInput(Number(e.target.value))}
                    className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    min="0"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold">Áp dụng cho nghe thử và giáo án giáo viên.</p>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-slate-850 hover:bg-slate-700 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saveLimitsSuccess ? 'Đã lưu cài đặt thành công! 🎉' : 'Lưu cấu hình hạn mức'}
              </button>
            </form>

            {/* Thống kê sử dụng AI TTS tháng này */}
            <div className="border-t border-slate-200/70 pt-6 mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-sm font-black text-slate-850 uppercase tracking-wider font-display">Thống kê sử dụng AI TTS tháng này</h4>
                  <p className="text-[11px] font-semibold text-slate-500">Tìm kiếm, lọc danh sách tài khoản và tùy chọn đặt lại hạn mức.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { if(confirm('Bạn có chắc chắn muốn đặt lại toàn bộ lịch sử sử dụng ký tự cho tất cả người dùng?')) resetTtsUsage(); }}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold rounded-xl transition-colors cursor-pointer border border-rose-200/50 shadow-sm"
                >
                  Đặt lại tất cả sử dụng
                </button>
              </div>

              {/* Filters & Search Widget */}
              <div 
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3 relative"
                onMouseLeave={() => setShowSuggestions(false)}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Search input with suggestions autocomplete */}
                  <div className="relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Tìm kiếm nhanh Họ tên / ID</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Nhập tên hoặc ID..."
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {searchSuggestions.map(u => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSearchTerm(u.name);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs font-bold hover:bg-slate-50 flex justify-between items-center text-slate-700 cursor-pointer"
                          >
                            <span>{u.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">ID: {u.id}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchTerm && (
                      <button 
                        type="button" 
                        onClick={() => { setSearchTerm(''); setShowSuggestions(false); }}
                        className="absolute right-2 top-7 text-[10px] font-black text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Group selection filter */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Lọc theo Nhóm</label>
                    <select
                      value={selectedGroup}
                      onChange={(e: any) => setSelectedGroup(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả vai trò</option>
                      <option value="parent">Phụ huynh (Parent)</option>
                      <option value="teacher">Giáo viên (Teacher)</option>
                    </select>
                  </div>

                  {/* Limit / API Status filter selection */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">Hạn mức & API Key</label>
                    <select
                      value={statusFilter}
                      onChange={(e: any) => setStatusFilter(e.target.value)}
                      className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả cấu hình</option>
                      <option value="system_api">Chỉ dùng API Hệ thống (.env)</option>
                      <option value="exceeded_limit">Đã hết hạn mức API</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* Checkboxes Bulk Operations Actions Header */}
              {filteredUsers.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="selectAllTtsCheckbox"
                      checked={allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-slate-350 cursor-pointer"
                    />
                    <label htmlFor="selectAllTtsCheckbox" className="text-xs font-extrabold text-slate-700 cursor-pointer select-none">
                      Chọn tất cả ({filteredUsers.length} hiển thị)
                    </label>
                  </div>

                  {selectedUsers.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkResetUsage}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-755 text-white font-black rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    >
                      🔄 Đặt lại hạn mức đã chọn ({selectedUsers.length})
                    </button>
                  )}
                </div>
              )}

              {/* Main List Rendering */}
              {parentsAndTeachers.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200/50 rounded-2xl text-center text-slate-400 font-bold text-xs">
                  Không tìm thấy tài khoản Phụ huynh hoặc Giáo viên nào trong hệ thống.
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-6 bg-slate-50 border border-slate-200/50 rounded-2xl text-center text-slate-450 font-bold text-xs">
                  Không tìm thấy kết quả nào phù hợp với bộ lọc tìm kiếm.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map(user => {
                    const usage = ttsUsage[user.id] || 0;
                    const isParent = user.role === 'parent';
                    const limit = isParent ? ttsLimits.parentLimit : ttsLimits.teacherLimit;
                    const hasOwnKey = !!(user.geminiKey || user.openaiKey);
                    
                    const pct = hasOwnKey ? 0 : Math.min(100, (usage / limit) * 100);
                    const isExceeded = !hasOwnKey && usage >= limit;
                    const isChecked = selectedUsers.includes(user.id);

                    return (
                      <div 
                        key={user.id} 
                        className={`p-4 border rounded-2xl transition-all duration-200 flex items-start gap-3.5 shadow-sm ${
                          isChecked 
                            ? 'bg-indigo-50/20 border-indigo-400 ring-1 ring-indigo-200' 
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectUser(user.id)}
                            className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-slate-350 cursor-pointer"
                          />
                        </div>

                        {/* User Details & Progress */}
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-sm text-slate-800">{user.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold ml-2">({user.email})</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ml-2 ${
                                isParent 
                                  ? 'bg-pink-55 text-pink-700 border border-pink-100 bg-pink-50' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {isParent ? 'Phụ huynh' : 'Giáo viên'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                hasOwnKey 
                                  ? 'bg-green-100 text-green-700' 
                                  : isExceeded 
                                    ? 'bg-red-100 text-red-700 animate-pulse' 
                                    : 'bg-slate-100 text-slate-650'
                              }`}>
                                {hasOwnKey ? 'API Key riêng' : isExceeded ? 'Vượt hạn mức' : 'API Hệ thống'}
                              </span>

                              {/* Individual Reset Trigger Button */}
                              {usage > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleResetUserUsage(user.id, user.name)}
                                  className="px-2 py-0.5 border border-slate-200 hover:bg-slate-50 text-[10px] text-slate-600 font-bold rounded-lg cursor-pointer transition-colors"
                                >
                                  Đặt lại
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>Ký tự đã phát:</span>
                            <span className="font-mono">
                              {hasOwnKey 
                                ? `${usage.toLocaleString()} / Không giới hạn` 
                                : `${usage.toLocaleString()} / ${limit.toLocaleString()}`
                              }
                            </span>
                          </div>

                          {!hasOwnKey && (
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-350 ${
                                  isExceeded ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
