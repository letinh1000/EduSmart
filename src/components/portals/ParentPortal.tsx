'use client';

import React, { useState, useEffect } from 'react';
import { useEduSmart, RealWorldReward } from '@/store/edusmartStore';
import { 
  TrendingUp, Award, Star, Heart, Volume2, Sparkles, Plus, Trash, 
  Check, X, Settings, ShieldAlert, BookOpen, Gift, Activity, Users, Edit,
  RefreshCw, Eye, EyeOff, KeyRound, Cloud, CloudOff
} from 'lucide-react';
import { localDB } from '@/lib/localDB';

export const ParentPortal: React.FC = () => {
  const { 
    stats, 
    rewards, 
    approveReward, 
    rejectReward, 
    addReward, 
    updateReward,
    deleteReward,
    selectedStudent,
    setSelectedStudent,
    users,
    currentUser,
    createUser,
    updateUser,
    deleteUser,
    virtualClasses,
    progressMap,
    subjects
  } = useEduSmart();

  const [activeTab, setActiveTab] = useState<'children' | 'rewards' | 'settings'>('children');

  const selectedUserObj = users.find(u => u.name === selectedStudent && u.role === 'student');
  const selectedGrade = selectedUserObj?.grade || 3;

  const getStudentSubjectAverage = (studentName: string, subjectName: string, defaultScore: number) => {
    const progress = progressMap[studentName];
    if (!progress || !progress.roadmaps) return defaultScore;
    
    let sum = 0;
    let count = 0;
    
    const subjectMap: Record<string, string> = {
      'Toán học': 'Toán',
      'Tiếng Việt': 'Tiếng Việt',
      'Ngoại ngữ 1 (Anh)': 'Ngoại ngữ 1',
      'Ngoại ngữ 1': 'Ngoại ngữ 1',
      'Khoa học': 'Khoa học',
      'Lịch sử và Địa lí': 'Lịch sử và Địa lí',
      'Tin học và Công nghệ': 'Tin học và Công nghệ'
    };
    
    const storeSubject = subjectMap[subjectName] || subjectName;

    progress.roadmaps.forEach(r => {
      if (r.stages) {
        r.stages.forEach(s => {
          if ((s.subject === storeSubject || s.subject === subjectName) && s.status === 'completed') {
            sum += s.score !== undefined ? s.score : 85;
            count++;
          }
        });
      }
    });
    
    return count > 0 ? Math.round(sum / count) : defaultScore;
  };

  const getStudentSubjectCompletion = (studentName: string, subjectName: string) => {
    const progress = progressMap[studentName];
    if (!progress || !progress.roadmaps) return 0;
    
    let total = 0;
    let completed = 0;
    
    const subjectMap: Record<string, string> = {
      'Toán học': 'Toán',
      'Tiếng Việt': 'Tiếng Việt',
      'Ngoại ngữ 1 (Anh)': 'Ngoại ngữ 1',
      'Ngoại ngữ 1': 'Ngoại ngữ 1',
      'Khoa học': 'Khoa học',
      'Lịch sử và Địa lí': 'Lịch sử và Địa lí',
      'Tin học và Công nghệ': 'Tin học và Công nghệ'
    };
    
    const storeSubject = subjectMap[subjectName] || subjectName;

    progress.roadmaps.forEach(r => {
      if (r.stages) {
        r.stages.forEach(s => {
          if (s.subject === storeSubject || s.subject === subjectName) {
            total++;
            if (s.status === 'completed') {
              completed++;
            }
          }
        });
      }
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getPersonalizedInsights = (studentName: string, grade: number) => {
    const isSpecial = studentName.includes('A') || studentName.includes('a') || grade >= 4;
    
    // Get grade subjects from academic setup
    const gradeSubjects = subjects.filter(s => s.grade === grade);
    const subjectList = gradeSubjects.length > 0 
      ? gradeSubjects.map(s => s.name)
      : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí'];

    const colors = ['bg-blue-500', 'bg-orange-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-purple-500', 'bg-teal-500'];
    
    const accuracy = subjectList.map((sub, idx) => {
      let defaultScore = isSpecial ? 78 : 92;
      if (sub.includes('Việt') || sub.includes('Văn')) defaultScore = isSpecial ? 85 : 88;
      if (sub.includes('Ngoại') || sub.includes('Anh')) defaultScore = isSpecial ? 82 : 95;
      if (sub.includes('Khoa')) defaultScore = isSpecial ? 90 : 85;
      if (sub.includes('Sử') || sub.includes('Địa')) defaultScore = isSpecial ? 75 : 90;

      const pct = getStudentSubjectAverage(studentName, sub, defaultScore);
      return {
        name: sub,
        pct,
        color: colors[idx % colors.length]
      };
    });

    const mathScore = getStudentSubjectAverage(studentName, 'Toán', isSpecial ? 78 : 92);
    const englishScore = getStudentSubjectAverage(studentName, 'Ngoại ngữ 1', isSpecial ? 82 : 95);
    const historyScore = getStudentSubjectAverage(studentName, 'Lịch sử và Địa lí', isSpecial ? 75 : 90);

    return {
      accuracy,
      aiAnalysis: isSpecial 
        ? `Bé <strong>${studentName}</strong> (Khối ${grade}) đang học tốt môn Khoa học và có sự tò mò lớn về thế giới tự nhiên. Tuy nhiên, bé đang gặp thử thách ở môn Lịch sử và Địa lí (${historyScore}%) do có nhiều mốc sự kiện và khái niệm địa lý mới của Khối ${grade} cần ghi nhớ.`
        : `Bé <strong>${studentName}</strong> (Khối ${grade}) đang có ưu thế vượt trội ở môn Ngoại ngữ 1 (${englishScore}%) và khả năng giao tiếp phản biện tốt. Điểm cần hỗ trợ thêm là phần phép toán có nhớ và nhận diện hình khối không gian của Khối ${grade}.`,
      aiAdvice: isSpecial
        ? `Khuyên cha mẹ cùng bé vẽ sơ đồ tư duy hình ảnh để liên kết các thời kỳ lịch sử của Khối ${grade}, hoặc kết hợp kể chuyện danh nhân trước giờ ngủ.`
        : `Cùng bé cắt dán hình học giấy màu sắc và đố vui thực tế qua các đồ vật gia dụng để rèn luyện kỹ năng Toán học trực quan.`,
      bondingActivityTitle: isSpecial
        ? `Trò chơi: Khám phá địa lý & Lịch sử quanh nhà 🗺️`
        : `Trò chơi: Trồng mầm đậu nhỏ thí nghiệm 🌱`,
      bondingActivityDesc: isSpecial
        ? `Cha mẹ vẽ bản đồ nhỏ giấu đồ vật trong phòng. Bé trả lời câu hỏi lịch sử/địa lý Khối ${grade} để nhận chỉ dẫn tìm kho báu.`
        : `Cốc giấy ẩm và vài hạt đậu. Mỗi ngày cha mẹ cùng con tưới nước, quan sát rễ mọc và thảo luận về bộ phận hút dinh dưỡng của thực vật.`
    };
  };

  const [parentInsights, setParentInsights] = useState<Record<string, ReturnType<typeof getPersonalizedInsights>>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const loadCachedInsights = async () => {
      const cached = await localDB.get<string>('es_parent_insights');
      if (cached) {
        try {
          setParentInsights(JSON.parse(cached));
        } catch (e) {
          console.error("Cache corrupted, loading defaults");
        }
      }
    };
    loadCachedInsights();
  }, []);

  const handleReevaluateParentInsights = async () => {
    if (!selectedStudent) return;
    setIsEvaluating(true);
    try {
      const aiConfig = {
        aiProvider: currentUser?.openaiKey ? 'openai' : 'gemini',
        customApiKey: currentUser?.geminiKey || '',
        openaiKey: currentUser?.openaiKey || '',
        openaiBaseUrl: currentUser?.openaiBaseUrl || '',
        openaiModel: currentUser?.openaiModel || ''
      };

      const gradeSubjects = subjects.filter(s => s.grade === selectedGrade);
      const subjectList = gradeSubjects.length > 0 
        ? gradeSubjects.map(s => s.name)
        : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí'];

      const subjectScores = subjectList.map(sub => {
        const score = getStudentSubjectAverage(selectedStudent, sub, 80);
        const completion = getStudentSubjectCompletion(selectedStudent, sub);
        return `${sub}: Điểm trung bình: ${score}%, Tỷ lệ hoàn thành chặng học: ${completion}%`;
      });

      const prompt = `Dưới đây là kết quả học tập trung bình các môn của học sinh ${selectedStudent} (Khối ${selectedGrade}):
${subjectScores.join('\n')}

Dựa trên kết quả học tập thực tế này, hãy phân tích điểm mạnh/yếu, đưa ra lời khuyên thực tiễn giúp cha mẹ đồng hành cùng con và đề xuất 1 hoạt động trò chơi kết nối (bonding activity) cuối tuần liên quan trực tiếp đến nội dung học tập.
Trả về định dạng JSON chính xác theo cấu trúc sau (không bọc markdown, chỉ trả về JSON cấu trúc thô):
{
  "aiAnalysis": "Phân tích cụ thể về thế mạnh và khó khăn của học sinh bằng tiếng Việt...",
  "aiAdvice": "Lời khuyên thực tiễn chi tiết cho phụ huynh...",
  "bondingActivityTitle": "Tên trò chơi kết nối gợi ý (ví dụ: Trò chơi: Khám phá địa lý...)",
  "bondingActivityDesc": "Mô tả chi tiết cách cha mẹ tổ chức trò chơi này cùng con..."
}`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'report',
          prompt: prompt,
          aiProvider: aiConfig.aiProvider,
          customApiKey: aiConfig.customApiKey,
          openaiKey: aiConfig.openaiKey,
          openaiBaseUrl: aiConfig.openaiBaseUrl,
          openaiModel: aiConfig.openaiModel
        })
      });

      if (!res.ok) {
        throw new Error(`API Error HTTP ${res.status}`);
      }

      const data = await res.json();
      const result = data.result;

      if (result && result.aiAnalysis && result.aiAdvice && result.bondingActivityTitle && result.bondingActivityDesc) {
        const colors = ['bg-blue-500', 'bg-orange-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-purple-500', 'bg-teal-500'];
        const accuracy = subjectList.map((sub, idx) => ({
          name: sub,
          pct: getStudentSubjectAverage(selectedStudent, sub, 80),
          color: colors[idx % colors.length]
        }));

        const updated = {
          ...parentInsights,
          [selectedStudent]: {
            accuracy,
            aiAnalysis: result.aiAnalysis,
            aiAdvice: result.aiAdvice,
            bondingActivityTitle: result.bondingActivityTitle,
            bondingActivityDesc: result.bondingActivityDesc
          }
        };

        setParentInsights(updated);
        await localDB.set('es_parent_insights', JSON.stringify(updated));
        alert('Đã đánh giá lại thành công bằng AI! 🤖');
      } else {
        alert('AI không trả về cấu trúc phân tích hợp lệ. Vui lòng thử lại.');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Không thể đánh giá lại bằng AI: ${e.message || 'Lỗi kết nối API'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const insights = parentInsights[selectedStudent] || getPersonalizedInsights(selectedStudent || 'Học sinh', selectedGrade);

  // Form states for creating student account
  const [childName, setChildName] = useState('');

  // Parent Custom API Key states
  const [parentAiProvider, setParentAiProvider] = useState<'gemini' | 'openai'>(
    currentUser?.openaiKey ? 'openai' : 'gemini'
  );
  const [parentGeminiKey, setParentGeminiKey] = useState(currentUser?.geminiKey || '');
  const [parentOpenaiKey, setParentOpenaiKey] = useState(currentUser?.openaiKey || '');
  const [parentOpenaiBaseUrl, setParentOpenaiBaseUrl] = useState(currentUser?.openaiBaseUrl || '');
  const [parentOpenaiModel, setParentOpenaiModel] = useState(currentUser?.openaiModel || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setParentAiProvider(currentUser.openaiKey ? 'openai' : 'gemini');
      setParentGeminiKey(currentUser.geminiKey || '');
      setParentOpenaiKey(currentUser.openaiKey || '');
      setParentOpenaiBaseUrl(currentUser.openaiBaseUrl || '');
      setParentOpenaiModel(currentUser.openaiModel || '');
    }
  }, [currentUser]);

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    updateUser(currentUser.id, {
      aiProvider: parentAiProvider,
      geminiKey: parentGeminiKey.trim(),
      openaiKey: parentOpenaiKey.trim(),
      openaiBaseUrl: parentOpenaiBaseUrl.trim(),
      openaiModel: parentOpenaiModel.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  const [childEmail, setChildEmail] = useState('');
  const [childPassword, setChildPassword] = useState('');
  const [childBirthYear, setChildBirthYear] = useState<number | ''>('');
  const [childGender, setChildGender] = useState<string>('Nam');
  const [childGrade, setChildGrade] = useState<number>(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('es_pref_grade')) || 3;
    return 3;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('es_pref_grade', childGrade.toString());
    }
  }, [childGrade]);

  // Default selected student to the first child if not already set to a child of this parent
  useEffect(() => {
    const parentChildren = users.filter(u => u.parentId === currentUser?.id && u.role === 'student');
    if (parentChildren.length > 0) {
      const isStillValid = parentChildren.some(c => c.name === selectedStudent);
      if (!isStillValid) {
        setSelectedStudent(parentChildren[0].name);
      }
    }
  }, [users, currentUser, selectedStudent, setSelectedStudent]);

  // Edit child states
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editBirthYear, setEditBirthYear] = useState<number | ''>('');
  const [editGender, setEditGender] = useState('Nam');
  const [editGrade, setEditGrade] = useState<number>(3);

  const startEditing = (child: any) => {
    setEditingChildId(child.id);
    setEditName(child.name);
    setEditEmail(child.email);
    setEditPassword(child.password || '123');
    setEditBirthYear(child.birthYear || 2017);
    setEditGender(child.gender || 'Nam');
    setEditGrade(child.grade || 3);
  };

  const handleUpdateChildSubmit = (id: string) => {
    if (!editName.trim() || !editEmail.trim() || !editPassword.trim() || !editBirthYear) {
      alert('Vui lòng nhập đầy đủ thông tin của con.');
      return;
    }

    // Check duplicate email (excluding the current user being edited)
    if (users.some(u => u.email === editEmail.trim() && u.id !== id)) {
      alert('Email này đã được đăng ký cho tài khoản khác.');
      return;
    }

    updateUser(id, {
      name: editName.trim(),
      email: editEmail.trim(),
      password: editPassword,
      birthYear: Number(editBirthYear),
      gender: editGender,
      grade: editGrade
    });

    setEditingChildId(null);
    alert('Cập nhật thông tin con thành công! 📝');
  };

  // New reward creation state
  const [newRewardDesc, setNewRewardDesc] = useState('');
  const [newRewardCost, setNewRewardCost] = useState<number>(100);
  const [newRewardExpiresAt, setNewRewardExpiresAt] = useState<string>('');

  // Edit reward state
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editRewardDesc, setEditRewardDesc] = useState('');
  const [editRewardCost, setEditRewardCost] = useState<number>(100);
  const [editRewardExpiresAt, setEditRewardExpiresAt] = useState<string>('');

  const handleAddNewReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardDesc.trim() || newRewardCost <= 0) return;
    addReward(newRewardDesc.trim(), newRewardCost, newRewardExpiresAt || undefined);
    setNewRewardDesc('');
    setNewRewardCost(100);
    setNewRewardExpiresAt('');
    alert('Đã thêm quà tặng mới thành công!');
  };

  const startEditingReward = (reward: RealWorldReward) => {
    setEditingRewardId(reward.id);
    setEditRewardDesc(reward.description);
    setEditRewardCost(reward.cost);
    setEditRewardExpiresAt(reward.expiresAt || '');
  };

  const handleUpdateRewardSubmit = (id: string) => {
    if (!editRewardDesc.trim() || editRewardCost <= 0) {
      alert('Vui lòng nhập thông tin hợp lệ.');
      return;
    }
    updateReward(id, {
      description: editRewardDesc.trim(),
      cost: editRewardCost,
      expiresAt: editRewardExpiresAt || undefined
    });
    setEditingRewardId(null);
    alert('Cập nhật quà tặng thành công!');
  };

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim() || !childEmail.trim() || !childPassword.trim() || !childBirthYear) {
      alert('Vui lòng nhập đầy đủ họ tên, email, mật khẩu và năm sinh của con.');
      return;
    }
    
    // Check duplicate email
    if (users.some(u => u.email === childEmail.trim())) {
      alert('Email này đã được đăng ký trong hệ thống.');
      return;
    }

    createUser(
      childName.trim(),
      childEmail.trim(),
      'student',
      childPassword,
      currentUser?.id,
      undefined,
      Number(childBirthYear),
      childGender,
      childGrade
    );

    setChildName('');
    setChildEmail('');
    setChildPassword('');
    setChildBirthYear('');
    setChildGender('Nam');
    setChildGrade(3);
    alert('Tạo tài khoản học sinh thành công! Con có thể dùng tài khoản này để đăng nhập.');
  };

  const currentChildren = users.filter(u => u.parentId === currentUser?.id && u.role === 'student');

  return (
    <div className="space-y-6">
      {/* Parent Header Banner */}
      <div className="p-6 bg-gradient-to-r from-pink-400 via-rose-400 to-rose-500 rounded-3xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 rounded-full border-4 border-white/60 bg-white flex items-center justify-center text-3xl shadow">
            👩‍👦
          </div>
          <div>
            <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Phụ Huynh</span>
            <h1 className="text-2xl font-black font-display tracking-tight mt-0.5">Phụ huynh {currentUser ? currentUser.name : 'Nguyễn Thu Hương'}</h1>
            {selectedStudent && (
              <p className="text-xs font-semibold opacity-90">Đang chọn tài khoản của: <strong>{selectedStudent}</strong></p>
            )}
          </div>
        </div>

        {/* Stats Quick view */}
        {selectedStudent && (
          <div className="flex gap-3">
            <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-center flex flex-col items-center">
              <span className="text-xs font-bold opacity-85">Xu tích lũy</span>
              <span className="text-base font-black mt-0.5">{stats.coins} xu</span>
            </div>
            <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-center flex flex-col items-center">
              <span className="text-xs font-bold opacity-85">Chuỗi Streak</span>
              <span className="text-base font-black mt-0.5">{stats.streak} ngày</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex bg-white/40 p-2 rounded-2xl border border-slate-200/50">
        <button 
          onClick={() => setActiveTab('children')}
          className={`flex-1 py-2.5 px-3 text-center rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'children' ? 'bg-rose-500 text-white shadow-md' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Users className="w-4.5 h-4.5" />
          Quản lý tài khoản con
        </button>
        <button 
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-2.5 px-3 text-center rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
            activeTab === 'rewards' ? 'bg-rose-500 text-white shadow-md' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Gift className="w-4.5 h-4.5" />
          Duyệt đổi quà thực tế
          {rewards.some(r => r.status === 'pending') && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 px-3 text-center rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-rose-500 text-white shadow-md' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
          Cài đặt Key
        </button>
      </div>

      {/* Main Tab Panel Content */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/80">
        
        {/* CHILDREN TAB */}
        {activeTab === 'children' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Left Column: Children list & Add child form */}
              <div className="xl:col-span-5 space-y-6">
                {/* Children List */}
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Danh sách các con</span>
                  
                  {currentChildren.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 text-center text-slate-400 text-xs font-bold">
                      Chưa có tài khoản học sinh nào được liên kết hoặc tạo bởi phụ huynh.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentChildren.map(child => {
                        const childClass = virtualClasses.find(c => c.id === child.classId);
                        const isEditing = editingChildId === child.id;
                        if (isEditing) {
                          return (
                            <div key={child.id} className="p-4 bg-pink-50/40 border border-pink-200 rounded-2xl shadow-sm space-y-3 relative">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Cập nhật thông tin</h4>
                              <div className="space-y-2 text-xs">
                                <div className="space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">Họ và tên</label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-750 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">Email đăng nhập</label>
                                  <input
                                    type="email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-750 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase">Mật khẩu</label>
                                  <input
                                    type="password"
                                    value={editPassword}
                                    onChange={(e) => setEditPassword(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-750 focus:outline-none"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Năm sinh</label>
                                    <input
                                      type="number"
                                      value={editBirthYear}
                                      onChange={(e) => setEditBirthYear(e.target.value ? Number(e.target.value) : '')}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-750 focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Giới tính</label>
                                    <select
                                      value={editGender}
                                      onChange={(e) => setEditGender(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-755"
                                    >
                                      <option value="Nam">Nam</option>
                                      <option value="Nữ">Nữ</option>
                                    </select>
                                  </div>
                                  <div className="space-y-0.5">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Khối lớp</label>
                                    <select
                                      value={editGrade}
                                      onChange={(e) => setEditGrade(Number(e.target.value))}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-755"
                                    >
                                      <option value={1}>Khối 1</option>
                                      <option value={2}>Khối 2</option>
                                      <option value={3}>Khối 3</option>
                                      <option value={4}>Khối 4</option>
                                      <option value={5}>Khối 5</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateChildSubmit(child.id)}
                                    className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black cursor-pointer text-center"
                                  >
                                    Lưu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingChildId(null)}
                                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-750 rounded-xl text-[10px] font-black cursor-pointer text-center"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div 
                            key={child.id} 
                            onClick={() => {
                              setSelectedStudent(child.name);
                            }}
                            className={`p-4 border rounded-2xl shadow-sm space-y-3 relative transition-all cursor-pointer ${
                              selectedStudent === child.name 
                                ? 'bg-pink-50/50 border-pink-400 ring-2 ring-pink-200 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-pink-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{child.gender === 'Nữ' ? '👧' : '👦'}</span>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800">
                                    {child.name} 
                                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">
                                      ({child.gender || 'Nam'} - {child.birthYear || 2017})
                                    </span>
                                  </h4>
                                  <p className="text-[10px] font-semibold text-slate-450">{child.email}</p>
                                </div>
                              </div>
                              <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => startEditing(child)}
                                  className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  title="Chỉnh sửa thông tin con"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn chắc chắn muốn xóa tài khoản của con: ${child.name}?`)) {
                                      deleteUser(child.id);
                                    }
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="Xóa tài khoản con"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-500 font-semibold border-t border-slate-50 pt-2 flex flex-col gap-1">
                              <div className="flex justify-between">
                                <span>Khối lớp đăng ký:</span>
                                <span className="text-slate-700 font-bold">Khối {child.grade || 3}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Lớp học hiện tại:</span>
                                <span className={childClass ? "text-pink-600 font-bold" : "text-slate-400 font-medium italic"}>
                                  {childClass ? childClass.name : 'Chưa phân lớp'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Add Child Form */}
                <form onSubmit={handleAddChildSubmit} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-pink-600" />
                    Thêm tài khoản cho con
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Họ và tên con</label>
                    <input 
                      type="text" 
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn An"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Email đăng nhập cho con</label>
                    <input 
                      type="email" 
                      value={childEmail}
                      onChange={(e) => setChildEmail(e.target.value)}
                      placeholder="an.nv@edusmart.vn"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Mật khẩu</label>
                    <input 
                      type="password" 
                      value={childPassword}
                      onChange={(e) => setChildPassword(e.target.value)}
                      placeholder="Nhập mật khẩu của con"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Năm sinh</label>
                      <input 
                        type="number" 
                        value={childBirthYear}
                        onChange={(e) => setChildBirthYear(e.target.value ? Number(e.target.value) : '')}
                        placeholder="2017"
                        min={2010}
                        max={new Date().getFullYear()}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase">Giới tính</label>
                      <select 
                        value={childGender}
                        onChange={(e) => setChildGender(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Khối lớp học tập</label>
                    <select 
                      value={childGrade}
                      onChange={(e) => setChildGrade(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <option value={1}>Khối 1</option>
                      <option value={2}>Khối 2</option>
                      <option value={3}>Khối 3</option>
                      <option value={4}>Khối 4</option>
                      <option value={5}>Khối 5</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                  >
                    Tạo tài khoản học sinh
                  </button>
                </form>
              </div>

              {/* Right Column: Integrated Child Progress & AI Advisor */}
              <div className="xl:col-span-7 space-y-6">
                {selectedStudent ? (
                  <div className="space-y-6">
                    {/* Selected Student Banner Card */}
                    <div className="p-5 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-200/50 rounded-3xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{selectedUserObj?.gender === 'Nữ' ? '👧' : '👦'}</span>
                        <div>
                          <h3 className="text-base font-black text-slate-800">
                            Học tập của con: {selectedStudent}
                          </h3>
                          <p className="text-[11px] font-bold text-pink-700">
                            Khối {selectedGrade} • Cấp độ {stats.level} • Chuỗi {stats.streak} ngày liên tiếp
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-white border border-pink-200 text-pink-700 font-extrabold px-3 py-1.5 rounded-2xl shadow-sm">
                          🪙 {stats.coins} xu tích lũy
                        </span>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-4">
                      <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Activity className="w-4.5 h-4.5 text-blue-500" />
                        Tiến trình học tập & Cấp độ
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Level progress */}
                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl space-y-2.5">
                          <h4 className="text-[10px] font-black text-indigo-900 uppercase">Kinh nghiệm cấp độ</h4>
                          <p className="text-xl font-black text-indigo-750">Cấp độ {stats.level}</p>
                          <div className="w-full bg-indigo-200/50 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-600 h-full" style={{ width: `${(stats.xp / (stats.level * 200)) * 100}%` }}></div>
                          </div>
                          <p className="text-[9px] text-indigo-600 font-bold">{stats.xp}/{stats.level * 200} XP</p>
                        </div>

                        {/* Badges milestones */}
                        <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100/50 border border-pink-100 rounded-2xl space-y-2.5">
                          <h4 className="text-[10px] font-black text-pink-900 uppercase">Huy chương đạt được</h4>
                          <div className="flex gap-1.5 flex-wrap pt-1">
                            <span className="px-2.5 py-0.5 bg-white border border-pink-200 rounded-lg text-[10px] font-extrabold" title="Làm bài đúng liên tục">⚡ Tia Chớp</span>
                            <span className="px-2.5 py-0.5 bg-white border border-pink-200 rounded-lg text-[10px] font-extrabold" title="Học tốt các bài Toán">📐 Trạng Toán</span>
                            <span className="px-2.5 py-0.5 bg-white border border-pink-200 rounded-lg text-[10px] font-extrabold" title="Học chuyên cần trên 30 ngày">👑 Bền bỉ</span>
                          </div>
                        </div>
                      </div>

                      {/* Subject stats graph */}
                      <div className="p-4 border border-slate-200/80 rounded-2xl bg-white space-y-2.5 shadow-sm">
                        <h4 className="text-[10px] font-black text-slate-700 uppercase">Độ chính xác bài làm trung bình theo môn (%)</h4>
                        <div className="space-y-2 pt-1">
                          {insights.accuracy.map(sub => (
                            <div key={sub.name} className="flex items-center gap-3">
                              <span className="w-24 text-[10px] font-bold text-slate-500 truncate">{sub.name}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className={`${sub.color} h-full rounded-full transition-all`} style={{ width: `${sub.pct}%` }}></div>
                              </div>
                              <span className="w-8 text-[10px] font-black text-slate-800 text-right">{sub.pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* AI Insights & Bonding Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                          Lời khuyên AI & Hoạt động kết nối (Bonding)
                        </h4>
                        <button
                          onClick={handleReevaluateParentInsights}
                          disabled={isEvaluating}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isEvaluating ? 'animate-spin' : ''}`} />
                          {isEvaluating ? 'Đang phân tích...' : 'Đánh giá lại'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Child Insights */}
                        <div className="p-4 bg-indigo-50/40 border border-indigo-155/60 rounded-2xl space-y-2">
                          <h4 className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-650" />
                            Phân tích & Lời khuyên AI
                          </h4>
                          <p 
                            className="text-[11px] font-semibold text-indigo-850 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: insights.aiAnalysis }}
                          />
                          <div className="p-2.5 bg-white rounded-xl border border-indigo-200/50 text-[10px] text-slate-650 leading-relaxed font-semibold">
                            <strong className="text-indigo-850 block mb-0.5">Lời khuyên của Cú Học Thức:</strong>
                            {insights.aiAdvice}
                          </div>
                        </div>

                        {/* Bonding Activities */}
                        <div className="p-4 bg-emerald-50/40 border border-emerald-155/60 rounded-2xl space-y-2">
                          <h4 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                            <Heart className="w-3.5 h-3.5 text-emerald-650" />
                            Gợi ý kết nối gia đình
                          </h4>
                          <p className="text-[10px] font-semibold text-emerald-900 leading-relaxed">
                            Hoạt động gắn kết cuối tuần liên quan trực tiếp đến bài học:
                          </p>
                          <div className="p-2.5 bg-white rounded-xl border border-emerald-250/50 text-[10px] text-slate-650 leading-relaxed font-semibold">
                            <strong className="text-emerald-900 block mb-0.5">{insights.bondingActivityTitle}</strong>
                            {insights.bondingActivityDesc}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400">
                    <span className="text-5xl mb-4">👧👦</span>
                    <h3 className="text-sm font-black text-slate-650">Chưa chọn học sinh</h3>
                    <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm">
                      Vui lòng nhấp chọn một bé ở danh sách tài khoản bên trái để theo dõi tiến trình và nhận nhận định học tập từ AI.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* REWARDS INTEGRATION */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 font-display">Cơ chế quy đổi "Quà đời thực"</h3>
              <p className="text-xs font-semibold text-slate-500">Giúp bé có động lực học tập bằng cách liên kết đổi Xu lấy Quà thực tế ngoài đời.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Approve pending requests */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Yêu cầu chờ phụ huynh duyệt</span>
                
                {rewards.filter(r => r.status === 'pending').length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 text-center text-slate-400 text-xs font-bold">
                    Không có yêu cầu đổi quà nào đang chờ duyệt.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewards.filter(r => r.status === 'pending').map(reward => (
                      <div key={reward.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <div>
                          <h4 className="text-xs font-black text-slate-700">{reward.description}</h4>
                          <span className="text-[10px] text-amber-600 font-bold">Trị giá: 🪙 {reward.cost} xu</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => approveReward(reward.id)}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                            title="Đồng ý duyệt"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => rejectReward(reward.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                            title="Từ chối"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All Rewards database list */}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pt-4">Các quà tặng khả dụng đã thiết lập</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rewards.map(reward => {
                    const isEditing = editingRewardId === reward.id;
                    
                    if (isEditing) {
                      return (
                        <div key={reward.id} className="p-3 bg-pink-50 border border-pink-200 rounded-xl space-y-2 text-xs shadow-sm">
                          <input 
                            type="text" 
                            value={editRewardDesc}
                            onChange={(e) => setEditRewardDesc(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-700 focus:outline-none"
                            placeholder="Mô tả phần quà..."
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="number" 
                              value={editRewardCost}
                              onChange={(e) => setEditRewardCost(Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-700 focus:outline-none"
                              placeholder="Giá (xu)"
                            />
                            <input 
                              type="date" 
                              value={editRewardExpiresAt}
                              onChange={(e) => setEditRewardExpiresAt(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-700 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateRewardSubmit(reward.id)} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg py-1.5 transition-colors cursor-pointer text-[10px]">Lưu</button>
                            <button onClick={() => setEditingRewardId(null)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg py-1.5 transition-colors cursor-pointer text-[10px]">Hủy</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={reward.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start text-xs group relative">
                        <div className="flex-1 pr-2">
                          <span className="font-extrabold text-slate-700 block line-clamp-2" title={reward.description}>{reward.description}</span>
                          <div className="flex gap-2 flex-wrap items-center mt-1">
                            <span className="text-[10px] font-bold text-yellow-600">🪙 {reward.cost} xu</span>
                            {reward.expiresAt && <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">⏳ Hạn: {new Date(reward.expiresAt).toLocaleDateString('vi-VN')}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            reward.status === 'approved' ? 'bg-green-100 text-green-700' :
                            reward.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            reward.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {reward.status === 'approved' ? 'Đã tặng' :
                             reward.status === 'rejected' ? 'Từ chối' :
                             reward.status === 'pending' ? 'Chờ duyệt' : 'Sẵn có'}
                          </span>
                          
                          {/* Edit/Delete actions appear on hover */}
                          {reward.status === 'available' && (
                            <div className="hidden group-hover:flex gap-1 absolute top-2 right-2 bg-white/90 backdrop-blur rounded shadow-sm border border-slate-100 p-0.5 z-10">
                              <button 
                                onClick={() => startEditingReward(reward)} 
                                className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                                title="Chỉnh sửa quà"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => { if(confirm('Bạn có chắc chắn muốn xóa phần quà này?')) deleteReward(reward.id); }} 
                                className="p-1 hover:bg-red-50 rounded text-red-500 cursor-pointer"
                                title="Xóa quà"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Add new reward */}
              <div className="lg:col-span-1">
                <form onSubmit={handleAddNewReward} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Plus className="w-4 h-4 text-rose-500" />
                    Thêm quà tặng mới
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Mô tả phần quà</label>
                    <input 
                      type="text" 
                      value={newRewardDesc}
                      onChange={(e) => setNewRewardDesc(e.target.value)}
                      placeholder="Ví dụ: Một buổi đi xem phim hoạt hình"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Yêu cầu xu tích lũy</label>
                    <input
                      type="number"
                      value={newRewardCost}
                      onChange={(e) => setNewRewardCost(Number(e.target.value))}
                      placeholder="100"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Thời hạn đổi quà (Tùy chọn)</label>
                    <input
                      type="date"
                      value={newRewardExpiresAt}
                      onChange={(e) => setNewRewardExpiresAt(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                  >
                    Tạo quà tặng mới
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveApiKeys} className="space-y-6 max-w-xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 font-display flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-rose-500" />
                  API Key Cá Nhân (Phụ Huynh)
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Gán key riêng để tối ưu chất lượng AI cho con — không bị giới hạn token hệ thống.
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border ${
                currentUser?.geminiKey || currentUser?.openaiKey
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}>
                {currentUser?.geminiKey || currentUser?.openaiKey
                  ? <><Cloud className="w-3.5 h-3.5" /> Đã có key riêng</>
                  : <><CloudOff className="w-3.5 h-3.5" /> Dùng key hệ thống</>}
              </div>
            </div>

            {/* Provider Toggle */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">Nhà cung cấp AI
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setParentAiProvider('gemini')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    parentAiProvider === 'gemini'
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>♊</span> Google Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setParentAiProvider('openai')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    parentAiProvider === 'openai'
                      ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>🤖</span> OpenAI / CocoLink
                </button>
              </div>
            </div>

            {/* Gemini Card */}
            <div className={`p-5 rounded-3xl border space-y-3 transition-all duration-300 ${
              parentAiProvider === 'gemini'
                ? 'bg-emerald-50/40 border-emerald-200 ring-2 ring-emerald-50'
                : 'bg-slate-50/50 border-slate-200 opacity-50 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">♊</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Google Gemini API Key</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Dùng cho gia sư Socratic AI và phân tích học tập.</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={parentGeminiKey}
                  onChange={(e) => setParentGeminiKey(e.target.value)}
                  placeholder="AIza... (bỏ trống = dùng key hệ thống)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button type="button" onClick={() => setShowGeminiKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {parentGeminiKey && <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Key cá nhân sẽ ưu tiên hơn key hệ thống</p>}
            </div>

            {/* OpenAI Card */}
            <div className={`p-5 rounded-3xl border space-y-3 transition-all duration-300 ${
              parentAiProvider === 'openai'
                ? 'bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-50'
                : 'bg-slate-50/50 border-slate-200 opacity-50 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800">OpenAI / CocoLink</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Proxy tương thích OpenAI hoặc key riêng.</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showOpenaiKey ? 'text' : 'password'}
                    value={parentOpenaiKey}
                    onChange={(e) => setParentOpenaiKey(e.target.value)}
                    placeholder="sk-... OpenAI API Key"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button type="button" onClick={() => setShowOpenaiKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={parentOpenaiBaseUrl}
                  onChange={(e) => setParentOpenaiBaseUrl(e.target.value)}
                  placeholder="Base URL (vd: https://www.cocolink.ai/)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  type="text"
                  value={parentOpenaiModel}
                  onChange={(e) => setParentOpenaiModel(e.target.value)}
                  placeholder="Model (vd: gpt-3.5-turbo, gpt-4o)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-xl text-sm font-black shadow transition-all cursor-pointer flex items-center justify-center gap-2 ${
                saveSuccess ? 'bg-emerald-500 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              {saveSuccess ? (
                <><Check className="w-4 h-4" /> Đã lưu vào hồ sơ thành công! 🎉</>
              ) : (
                'Lưu cấu hình API'
              )}
            </button>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
              <h4 className="font-extrabold text-amber-800 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Lưu ý hạn mức &amp; bảo mật
              </h4>
              <p className="font-semibold text-slate-600 leading-relaxed">
                Nếu không điền API Key riêng, con sẽ sử dụng API Key dùng chung của hệ thống và chịu giới hạn số lượng ký tự/token hàng tháng. Key riêng được lưu trực tiếp trong tài khoản và đồng bộ lên Supabase.
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
