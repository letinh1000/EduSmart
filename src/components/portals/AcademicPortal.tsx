'use client';

import React, { useState, useEffect } from 'react';
import { useEduSmart } from '@/store/edusmartStore';
import { 
  Building, BookOpen, Users, Plus, Upload, Save, CheckCircle, 
  Trash2, ShieldAlert, Library, BarChart3, GraduationCap, Edit, X, Check, Settings
} from 'lucide-react';

export const AcademicPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'library' | 'reports' | 'settings'>('classes');

  // VIRTUAL CLASS & USER STATE
  const { 
    virtualClasses: classesList, 
    createVirtualClass, 
    updateVirtualClass,
    deleteVirtualClass,
    users, 
    assignStudentToClass,
    updateUser,
    deleteUser,
    bulkAssignStudents,
    createUser,
    textbooks,
    addTextbook,
    deleteTextbook,
    currentUser,
    subjects,
    createSubject,
    updateSubject,
    deleteSubject
  } = useEduSmart();

  // Subjects filter and form states
  const [filterSubjectSchoolYear, setFilterSubjectSchoolYear] = useState('2025-2026');
  const [filterSubjectGrade, setFilterSubjectGrade] = useState<string>('3');
  
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectGrade, setNewSubjectGrade] = useState<number>(3);
  const [newSubjectSchoolYear, setNewSubjectSchoolYear] = useState('2025-2026');

  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [editSubjectGrade, setEditSubjectGrade] = useState<number>(3);
  const [editSubjectSchoolYear, setEditSubjectSchoolYear] = useState('2025-2026');

  const [aiSuggestedSubjects, setAiSuggestedSubjects] = useState<string[]>([]);
  const [isRetrievingAI, setIsRetrievingAI] = useState(false);

  // API key configuration states
  const [academicGeminiKey, setAcademicGeminiKey] = useState(currentUser?.geminiKey || '');
  const [academicOpenaiKey, setAcademicOpenaiKey] = useState(currentUser?.openaiKey || '');
  const [academicOpenaiBaseUrl, setAcademicOpenaiBaseUrl] = useState(currentUser?.openaiBaseUrl || '');
  const [academicOpenaiModel, setAcademicOpenaiModel] = useState(currentUser?.openaiModel || '');
  const [academicAiProvider, setAcademicAiProvider] = useState(currentUser?.openaiKey ? 'openai' : 'gemini');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setAcademicGeminiKey(currentUser.geminiKey || '');
      setAcademicOpenaiKey(currentUser.openaiKey || '');
      setAcademicOpenaiBaseUrl(currentUser.openaiBaseUrl || '');
      setAcademicOpenaiModel(currentUser.openaiModel || '');
      setAcademicAiProvider(currentUser.openaiKey ? 'openai' : 'gemini');
    }
  }, [currentUser]);

  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    updateUser(currentUser.id, {
      geminiKey: academicGeminiKey.trim(),
      openaiKey: academicOpenaiKey.trim(),
      openaiBaseUrl: academicOpenaiBaseUrl.trim(),
      openaiModel: academicOpenaiModel.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const startEditingSubject = (sub: any) => {
    setEditingSubjectId(sub.id);
    setEditSubjectName(sub.name);
    setEditSubjectGrade(sub.grade);
    setEditSubjectSchoolYear(sub.schoolYear);
  };

  const handleUpdateSubjectSubmit = (id: string) => {
    if (!editSubjectName.trim()) {
      alert('Vui lòng điền tên môn học.');
      return;
    }
    updateSubject(id, editSubjectName.trim(), editSubjectGrade, editSubjectSchoolYear);
    setEditingSubjectId(null);
    alert('Cập nhật môn học thành công! 📝');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      alert('Vui lòng nhập tên môn học.');
      return;
    }
    const exists = subjects.some(s => 
      s.name.toLowerCase() === newSubjectName.trim().toLowerCase() && 
      s.grade === newSubjectGrade && 
      s.schoolYear === newSubjectSchoolYear
    );
    if (exists) {
      alert('Môn học này đã tồn tại trong khối lớp và năm học này.');
      return;
    }
    createSubject(newSubjectName.trim(), newSubjectGrade, newSubjectSchoolYear);
    setNewSubjectName('');
    alert('Thêm môn học thành công! 📚');
  };

  const handleAISuggestSubjects = async () => {
    const targetGrade = filterSubjectGrade === 'all' ? 3 : Number(filterSubjectGrade);
    setIsRetrievingAI(true);
    setAiSuggestedSubjects([]);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent: 'curriculum',
          prompt: `Hãy liệt kê khoảng 8-12 môn học chính khóa bắt buộc và tự chọn dành cho Khối lớp ${targetGrade} của năm học ${filterSubjectSchoolYear} theo Chương trình Giáo dục Phổ thông mới 2018 tại Việt Nam (ví dụ: Toán, Tiếng Việt, Ngoại ngữ 1, Đạo đức, Tự nhiên và Xã hội, Lịch sử và Địa lí, Khoa học, Tin học và Công nghệ, Hoạt động trải nghiệm, Âm nhạc, Mỹ thuật). Chỉ trả về danh sách tên môn học ngắn gọn trong mảng lessons của cấu trúc JSON.`,
          aiProvider: currentUser?.openaiKey ? 'openai' : 'gemini',
          customApiKey: currentUser?.geminiKey || '',
          openaiKey: currentUser?.openaiKey || '',
          openaiBaseUrl: currentUser?.openaiBaseUrl || '',
          openaiModel: currentUser?.openaiModel || ''
        })
      });
      if (!res.ok) {
        throw new Error('Lỗi từ AI server');
      }
      const data = await res.json();
      if (data.result && data.result.lessons && Array.isArray(data.result.lessons)) {
        setAiSuggestedSubjects(data.result.lessons);
      } else {
        // Fallback standard subjects if AI structure fails
        const standardList = [
          'Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Đạo đức', 
          targetGrade <= 3 ? 'Tự nhiên và Xã hội' : 'Khoa học',
          targetGrade > 3 ? 'Lịch sử và Địa lí' : '',
          'Tin học và Công nghệ', 'Hoạt động trải nghiệm', 'Âm nhạc', 'Mỹ thuật', 'Giáo dục thể chất'
        ].filter(Boolean);
        setAiSuggestedSubjects(standardList);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      const targetGradeNum = Number(targetGrade);
      const standardList = [
        'Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Đạo đức', 
        targetGradeNum <= 3 ? 'Tự nhiên và Xã hội' : 'Khoa học',
        targetGradeNum > 3 ? 'Lịch sử và Địa lí' : '',
        'Tin học và Công nghệ', 'Hoạt động trải nghiệm', 'Âm nhạc', 'Mỹ thuật', 'Giáo dục thể chất'
      ].filter(Boolean);
      setAiSuggestedSubjects(standardList);
      alert('Không kết nối được AI. Đã tự động hiển thị danh sách môn học tiêu chuẩn của Bộ GD&ĐT làm gợi ý.');
    } finally {
      setIsRetrievingAI(false);
    }
  };

  const handleAddSuggestedSubject = (sName: string) => {
    const targetGrade = filterSubjectGrade === 'all' ? 3 : Number(filterSubjectGrade);
    createSubject(sName, targetGrade, filterSubjectSchoolYear);
  };

  const handleAddAllSuggested = () => {
    const targetGrade = filterSubjectGrade === 'all' ? 3 : Number(filterSubjectGrade);
    let addedCount = 0;
    aiSuggestedSubjects.forEach(sName => {
      const exists = subjects.some(s => 
        s.name.toLowerCase() === sName.toLowerCase() && 
        s.grade === targetGrade && 
        s.schoolYear === filterSubjectSchoolYear
      );
      if (!exists) {
        createSubject(sName, targetGrade, filterSubjectSchoolYear);
        addedCount++;
      }
    });
    alert(`Đã thêm ${addedCount} môn học mới từ gợi ý AI! 🚀`);
  };

  const filteredSubjects = subjects.filter(sub => {
    const matchesYear = sub.schoolYear === filterSubjectSchoolYear;
    const matchesGrade = filterSubjectGrade === 'all' || String(sub.grade) === filterSubjectGrade;
    return matchesYear && matchesGrade;
  });
  
  // Search Filters for Students
  const [filterSchoolYear, setFilterSchoolYear] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_year') || '2025-2026';
    return '2025-2026';
  });
  const [filterGrade, setFilterGrade] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_grade') || 'all';
    return 'all';
  });
  const [filterClassStatus, setFilterClassStatus] = useState<string>('unassigned'); // 'all' | 'assigned' | 'unassigned'

  // Search Filters for Virtual Classes
  const [classFilterSchoolYear, setClassFilterSchoolYear] = useState('all');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('es_pref_year');
      if (saved) {
        setClassFilterSchoolYear(saved);
        return;
      }
    }
    if (currentUser?.schoolYear) {
      setClassFilterSchoolYear(currentUser.schoolYear);
    } else {
      setClassFilterSchoolYear('all');
    }
  }, [currentUser]);
  const [classFilterGrade, setClassFilterGrade] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_grade') || 'all';
    return 'all';
  });
  const [classFilterTeacher, setClassFilterTeacher] = useState<string>('all');

  // Editing Student States
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGrade, setEditGrade] = useState<number>(3);
  const [editSchoolYear, setEditSchoolYear] = useState('2025-2026');

  // Editing Class States
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassTeacher, setEditClassTeacher] = useState('');
  const [editClassGrade, setEditClassGrade] = useState<number>(3);
  const [editClassSchoolYear, setEditClassSchoolYear] = useState('2025-2026');
  const [editClassMaxStudents, setEditClassMaxStudents] = useState<number>(35);

  // Editing Teacher Search States
  const [editTeacherSearchInput, setEditTeacherSearchInput] = useState('');
  const [selectedEditTeacherId, setSelectedEditTeacherId] = useState<string | null>(null);
  const [showEditTeacherSuggestions, setShowEditTeacherSuggestions] = useState(false);

  // Track selected class for assignment dropdowns
  const [selectedClasses, setSelectedClasses] = useState<Record<string, string>>({});

  // New Class Form States
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState(3);
  const [newClassSchoolYear, setNewClassSchoolYear] = useState('2025-2026');
  const [newClassMaxStudents, setNewClassMaxStudents] = useState(35);

  // Teacher Autocomplete Search States
  const [teacherSearchInput, setTeacherSearchInput] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [showTeacherSuggestions, setShowTeacherSuggestions] = useState(false);

  const startEditing = (student: any) => {
    setEditingStudentId(student.id);
    setEditName(student.name);
    setEditEmail(student.email);
    setEditGrade(student.grade || 3);
    setEditSchoolYear(student.schoolYear || '2025-2026');
  };

  const handleUpdateStudentSubmit = (id: string) => {
    if (!editName.trim() || !editEmail.trim()) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    updateUser(id, {
      name: editName.trim(),
      email: editEmail.trim(),
      grade: editGrade,
      schoolYear: editSchoolYear
    });
    setEditingStudentId(null);
    alert('Cập nhật thông tin học sinh thành công! 📝');
  };

  const startEditingClass = (cls: any) => {
    setEditingClassId(cls.id);
    setEditClassName(cls.name);
    setEditClassTeacher(cls.teacher);
    setEditTeacherSearchInput(cls.teacher);
    setSelectedEditTeacherId(null);
    setShowEditTeacherSuggestions(false);
    setEditClassGrade(cls.grade);
    setEditClassSchoolYear(cls.schoolYear || '2025-2026');
    setEditClassMaxStudents(cls.maxStudents || 35);
  };

  const handleUpdateClassSubmit = (id: string) => {
    const teacherName = editClassTeacher.trim() || editTeacherSearchInput.trim();
    if (!editClassName.trim() || !teacherName || editClassMaxStudents <= 0) {
      alert('Vui lòng nhập đầy đủ thông tin hợp lệ.');
      return;
    }
    updateVirtualClass(id, {
      name: editClassName.trim(),
      teacher: teacherName,
      grade: editClassGrade,
      schoolYear: editClassSchoolYear,
      maxStudents: editClassMaxStudents
    });
    setEditingClassId(null);
    alert('Cập nhật thông tin lớp học ảo thành công! 🏫');
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !teacherSearchInput.trim() || newClassMaxStudents <= 0) {
      alert('Vui lòng điền đầy đủ thông tin lớp và chọn/thêm giáo viên.');
      return;
    }
    
    createVirtualClass({
      name: newClassName.trim(),
      teacher: teacherSearchInput.trim(),
      studentsCount: 0,
      grade: newClassGrade,
      schoolYear: newClassSchoolYear,
      maxStudents: newClassMaxStudents
    });

    setNewClassName('');
    setTeacherSearchInput('');
    setSelectedTeacherId(null);
    setNewClassMaxStudents(35);
    alert('Đã thành lập lớp học ảo mới thành công! 🏫');
  };


  // Autocomplete Suggestions
  const teacherList = users.filter(u => u.role === 'teacher');
  const suggestedTeachers = teacherSearchInput.trim() === ''
    ? []
    : teacherList.filter(t => 
        t.name.toLowerCase().includes(teacherSearchInput.toLowerCase()) ||
        t.id.toLowerCase().includes(teacherSearchInput.toLowerCase())
      );

  const suggestedEditTeachers = editTeacherSearchInput.trim() === ''
    ? []
    : teacherList.filter(t => 
        t.name.toLowerCase().includes(editTeacherSearchInput.toLowerCase()) ||
        t.id.toLowerCase().includes(editTeacherSearchInput.toLowerCase())
      );

  // TEXTBOOK LIBRARY STATE
  const [tbFilterSchoolYear, setTbFilterSchoolYear] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('es_pref_year');
      return saved ? saved : 'all';
    }
    return 'all';
  });
  const [tbFilterGrade, setTbFilterGrade] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('es_pref_grade');
      return saved ? saved : 'all';
    }
    return 'all';
  });
  const [tbFilterSubject, setTbFilterSubject] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('es_pref_subject');
      return saved ? saved : 'all';
    }
    return 'all';
  });
  const [tbFilterStatus, setTbFilterStatus] = useState('all');

  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadBase64, setUploadBase64] = useState<string | undefined>(undefined);
  const [uploadSubject, setUploadSubject] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_subject') || 'Toán';
    return 'Toán';
  });
  const [uploadGrade, setUploadGrade] = useState(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('es_pref_grade')) || 4;
    return 4;
  });
  const [uploadSchoolYear, setUploadSchoolYear] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_year') || '2025-2026';
    return '2025-2026';
  });

  // Sync back to local storage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (filterSchoolYear !== 'all') localStorage.setItem('es_pref_year', filterSchoolYear);
      if (filterGrade !== 'all') localStorage.setItem('es_pref_grade', filterGrade);
    }
  }, [filterSchoolYear, filterGrade]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (classFilterSchoolYear !== 'all') localStorage.setItem('es_pref_year', classFilterSchoolYear);
      if (classFilterGrade !== 'all') localStorage.setItem('es_pref_grade', classFilterGrade);
    }
  }, [classFilterSchoolYear, classFilterGrade]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (tbFilterSchoolYear !== 'all') localStorage.setItem('es_pref_year', tbFilterSchoolYear);
      if (tbFilterGrade !== 'all') localStorage.setItem('es_pref_grade', tbFilterGrade);
      if (tbFilterSubject !== 'all') localStorage.setItem('es_pref_subject', tbFilterSubject);
    }
  }, [tbFilterSchoolYear, tbFilterGrade, tbFilterSubject]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('es_pref_subject', uploadSubject);
      localStorage.setItem('es_pref_grade', uploadGrade.toString());
      localStorage.setItem('es_pref_year', uploadSchoolYear);
    }
  }, [uploadSubject, uploadGrade, uploadSchoolYear]);
  const [uploadStatus, setUploadStatus] = useState<'active' | 'archived'>('active');

  const handleSimulateTextbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setUploadBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTextbook = () => {
    if (!uploadedFileName) return;
    addTextbook({
      name: uploadedFileName,
      subject: uploadSubject,
      grade: uploadGrade,
      schoolYear: uploadSchoolYear,
      status: uploadStatus,
      size: (Math.random() * 10 + 5).toFixed(1) + ' MB',
      fileBase64: uploadBase64
    });
    setUploadedFileName(null);
    setUploadBase64(undefined);
    alert('Đã bổ sung tài liệu gốc sách giáo khoa vào thư viện số toàn trường!');
  };

  const filteredTextbooks = textbooks.filter(tb => {
    const matchYear = tbFilterSchoolYear === 'all' || (tb.schoolYear || '').replace(/\s+/g, '') === tbFilterSchoolYear.replace(/\s+/g, '');
    const matchGrade = tbFilterGrade === 'all' || String(tb.grade) === tbFilterGrade;
    const matchSubject = tbFilterSubject === 'all' || tb.subject === tbFilterSubject;
    const matchStatus = tbFilterStatus === 'all' || tb.status === tbFilterStatus;
    return matchYear && matchGrade && matchSubject && matchStatus;
  });

  const filteredClasses = classesList.filter(c => {
    const matchesYear = classFilterSchoolYear === 'all' || (c.schoolYear || '2025-2026').replace(/\s+/g, '') === classFilterSchoolYear.replace(/\s+/g, '');
    const classGrade = c.grade || 3; // Fallback for legacy cached classes without grade
    const matchesGrade = classFilterGrade === 'all' || String(classGrade) === classFilterGrade;
    const matchesTeacher = classFilterTeacher === 'all' || c.teacher.toLowerCase().includes(classFilterTeacher.toLowerCase());
    return matchesYear && matchesGrade && matchesTeacher;
  });

  // Filter students: must be role student, matching filters
  const filteredStudents = users.filter(u => {
    if (u.role !== 'student') return false;
    
    // Class Status filter
    if (filterClassStatus === 'assigned' && !u.classId) return false;
    if (filterClassStatus === 'unassigned' && u.classId) return false;
    
    const matchesYear = (u.schoolYear || '2025-2026').replace(/\s+/g, '') === filterSchoolYear.replace(/\s+/g, '');
    const matchesGrade = filterGrade === 'all' || String(u.grade) === filterGrade;
    
    return matchesYear && matchesGrade;
  });

  // Auto-Assign Students Logic
  const handleAutoAssign = () => {
    if (filteredStudents.length === 0) {
      alert('Không có học sinh nào đang hiển thị để gán tự động.');
      return;
    }

    const assignments: { studentId: string; classId: string }[] = [];
    const tempClasses = classesList.map(c => ({ ...c }));

    const getStudentsInClass = (classId: string) => {
      const existing = users.filter(u => u.classId === classId);
      const newlyAssigned = assignments
        .filter(a => a.classId === classId)
        .map(a => users.find(u => u.id === a.studentId))
        .filter((u): u is any => u !== undefined);
      return [...existing, ...newlyAssigned];
    };

    let assignedCount = 0;
    const failedStudentNames: string[] = [];

    filteredStudents.forEach(student => {
      // Find matching classes for this student's grade
      const candidateClasses = tempClasses.filter(c => c.grade === student.grade);

      if (candidateClasses.length === 0) {
        failedStudentNames.push(`${student.name} (Lý do: Không có lớp Khối ${student.grade})`);
        return;
      }

      let assigned = false;

      for (const cls of candidateClasses) {
        // Limit capacity based on class max students
        const limit = cls.maxStudents || 35;
        if (cls.studentsCount >= limit) {
          continue;
        }

        // Avoid duplicate name and birthYear in the same class
        const currentClassStudents = getStudentsInClass(cls.id);
        const hasDuplicate = currentClassStudents.some(s => 
          s.name.trim().toLowerCase() === student.name.trim().toLowerCase() && 
          s.birthYear === student.birthYear
        );

        if (hasDuplicate) {
          continue;
        }

        // Add assignment
        assignments.push({ studentId: student.id, classId: cls.id });
        cls.studentsCount += 1;
        assigned = true;
        assignedCount++;
        break;
      }

      if (!assigned) {
        failedStudentNames.push(`${student.name} (Lý do: Lớp Khối ${student.grade} đã đầy hoặc trùng Tên + Năm sinh)`);
      }
    });

    if (assignments.length > 0) {
      bulkAssignStudents(assignments);
      let alertMessage = `Đã tự động phân bổ thành công ${assignedCount} học sinh vào lớp học tương ứng! 🎉`;
      if (failedStudentNames.length > 0) {
        alertMessage += `\n\nKhông thể xếp lớp tự động cho các học sinh:\n- ${failedStudentNames.join('\n- ')}`;
      }
      alert(alertMessage);
    } else {
      alert('Tự động xếp lớp không thành công. Lý do: Tất cả các lớp học ảo phù hợp đã đầy hoặc trùng Tên & Năm sinh của học sinh đã có trong lớp.');
    }
  };

  console.log('DEBUG CLASS LIST:', { classesList, classFilterSchoolYear, classFilterGrade, classFilterTeacher, filteredClasses });

  return (
    <div className="space-y-6">
      
      {/* Academic Affairs Banner */}
      <div className="p-6 bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500 rounded-3xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 rounded-full border-4 border-white/60 bg-white flex items-center justify-center text-3xl shadow">
            🎓
          </div>
          <div>
            <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Ban Giáo Vụ</span>
            <h1 className="text-2xl font-black font-display tracking-tight mt-0.5">Thầy {currentUser ? currentUser.name : 'Hoàng Minh Quân'}</h1>
            <p className="text-xs font-semibold opacity-90">Quản trị Lớp học ảo & Thư viện số gốc toàn trường</p>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-center flex flex-col">
          <span className="text-[10px] font-bold opacity-80 uppercase">Hệ Thống Lớp Học</span>
          <span className="text-base font-black mt-0.5">{classesList.length} Lớp ảo</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex bg-white/40 p-2 rounded-2xl border border-slate-200/50">
        <button 
          onClick={() => setActiveTab('classes')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'classes' ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Quản trị Lớp ảo
        </button>
        <button 
          onClick={() => setActiveTab('subjects')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'subjects' ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Quản lý Môn học
        </button>
        <button 
          onClick={() => setActiveTab('library')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'library' ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Library className="w-4 h-4" />
          Thư viện số gốc (SGK)
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'reports' ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Báo cáo chất lượng trường
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-blue-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          Cấu hình API Key
        </button>
      </div>

      {/* Main Tab Panel Content */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/80">
        
        {/* VIRTUAL CLASS MANAGER */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Classes List (dạng danh sách table) */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Danh sách Lớp Học Ảo đã thiết lập</h3>
                
                {/* Search Filters for Virtual Classes */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Lọc theo Năm Học</span>
                    <select
                      value={classFilterSchoolYear}
                      onChange={(e) => setClassFilterSchoolYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Lọc theo Khối Lớp</span>
                    <select
                      value={classFilterGrade}
                      onChange={(e) => setClassFilterGrade(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả</option>
                      <option value="1">Khối 1</option>
                      <option value="2">Khối 2</option>
                      <option value="3">Khối 3</option>
                      <option value="4">Khối 4</option>
                      <option value="5">Khối 5</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Lọc theo Giáo viên</span>
                    <select
                      value={classFilterTeacher}
                      onChange={(e) => setClassFilterTeacher(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả giáo viên</option>
                      {teacherList.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredClasses.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 text-center text-slate-400 text-xs font-bold">
                    Không có lớp học ảo nào phù hợp với bộ lọc tìm kiếm.
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm bg-white text-xs">
                    <table className="w-full border-collapse text-left font-bold">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="p-3">Tên Lớp</th>
                          <th className="p-3">Chi Tiết Lớp</th>
                          <th className="p-3">Giáo Viên Chủ Nhiệm</th>
                          <th className="p-3 text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClasses.map(cls => {
                          const isEditingClass = editingClassId === cls.id;
                          
                          if (isEditingClass) {
                            return (
                              <tr key={cls.id} className="bg-blue-50/20">
                                <td className="p-3" colSpan={2}>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-slate-455 uppercase block">Tên lớp ảo</label>
                                      <input
                                        type="text"
                                        value={editClassName}
                                        onChange={(e) => setEditClassName(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                                      />
                                    </div>
                                    <div className="space-y-1 relative">
                                      <label className="text-[9px] text-slate-455 uppercase block">Giáo viên chủ nhiệm</label>
                                      <input
                                        type="text"
                                        value={editTeacherSearchInput}
                                        onChange={(e) => {
                                          setEditTeacherSearchInput(e.target.value);
                                          setSelectedEditTeacherId(null);
                                          setShowEditTeacherSuggestions(true);
                                        }}
                                        onFocus={() => setShowEditTeacherSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowEditTeacherSuggestions(false), 200)}
                                        placeholder="Gõ tìm kiếm hoặc thêm mới..."
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                                      />
                                      {showEditTeacherSuggestions && (
                                        <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20 text-xs text-slate-700">
                                          {suggestedEditTeachers.map(teacher => (
                                            <div 
                                              key={teacher.id}
                                              onClick={() => {
                                                setEditTeacherSearchInput(teacher.name);
                                                setEditClassTeacher(teacher.name);
                                                setSelectedEditTeacherId(teacher.id);
                                                setShowEditTeacherSuggestions(false);
                                              }}
                                              className="p-2 hover:bg-blue-50 cursor-pointer font-bold border-b border-slate-100 flex justify-between items-center"
                                            >
                                              <span>{teacher.name}</span>
                                              <span className="text-[9px] text-slate-400 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded">
                                                ID: {teacher.id}
                                              </span>
                                            </div>
                                          ))}
                                          {editTeacherSearchInput.trim() === '' && teacherList.length > 0 && (
                                            <div className="p-2 text-slate-400 text-center font-semibold">
                                              Gõ để tìm kiếm giáo viên
                                            </div>
                                          )}
                                          {editTeacherSearchInput.trim() === '' && teacherList.length === 0 && (
                                            <div className="p-2 text-slate-400 text-center font-semibold">
                                              Không có giáo viên nào
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-slate-455 uppercase block">Khối lớp</label>
                                      <select
                                        value={editClassGrade}
                                        onChange={(e) => setEditClassGrade(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                                      >
                                        <option value={1}>Khối 1</option>
                                        <option value={2}>Khối 2</option>
                                        <option value={3}>Khối 3</option>
                                        <option value={4}>Khối 4</option>
                                        <option value={5}>Khối 5</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-slate-455 uppercase block">Năm học</label>
                                      <select
                                        value={editClassSchoolYear}
                                        onChange={(e) => setEditClassSchoolYear(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                                      >
                                        <option value="2025-2026">2025-2026</option>
                                        <option value="2024-2025">2024-2025</option>
                                        <option value="2023-2024">2023-2024</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] text-slate-455 uppercase block">Sĩ số tối đa</label>
                                      <input
                                        type="number"
                                        value={editClassMaxStudents}
                                        onChange={(e) => setEditClassMaxStudents(Number(e.target.value))}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3" colSpan={2}>
                                  <div className="flex gap-2 justify-end pt-4">
                                    <button
                                      onClick={() => handleUpdateClassSubmit(cls.id)}
                                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl cursor-pointer"
                                      title="Lưu thay đổi"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingClassId(null)}
                                      className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl cursor-pointer"
                                      title="Hủy"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={cls.id} className="hover:bg-slate-50">
                              <td className="p-3 font-extrabold text-slate-800">
                                <span className="text-base">🏫</span> {cls.name}
                              </td>
                              <td className="p-3 font-semibold text-slate-500">
                                <div className="flex gap-1.5 flex-wrap">
                                  <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    Khối {cls.grade || 3}
                                  </span>
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    Năm học: {cls.schoolYear || '2025-2026'}
                                  </span>
                                  <span className="text-[9px] bg-indigo-50 text-indigo-750 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    Sĩ số: {cls.studentsCount}/{cls.maxStudents || 35} HS
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-slate-700 font-extrabold">
                                {cls.teacher}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2 justify-center items-center">
                                  <button
                                    onClick={() => startEditingClass(cls)}
                                    className="p-1.5 text-slate-550 hover:bg-slate-100 rounded-lg cursor-pointer"
                                    title="Sửa lớp học"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Bạn chắc chắn muốn xóa lớp học ${cls.name}?`)) {
                                        deleteVirtualClass(cls.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-550 hover:bg-red-50 rounded-lg cursor-pointer"
                                    title="Xóa lớp học"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Create Virtual Class Form (Thành lập lớp ảo) */}
              <div className="lg:col-span-4">
                <form onSubmit={handleCreateClass} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-blue-600" />
                    Thành lập lớp ảo
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Năm học của lớp</label>
                    <select 
                      value={newClassSchoolYear}
                      onChange={(e) => setNewClassSchoolYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Phân loại khối lớp</label>
                    <select 
                      value={newClassGrade}
                      onChange={(e) => setNewClassGrade(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <option value={1}>Khối 1</option>
                      <option value={2}>Khối 2</option>
                      <option value={3}>Khối 3</option>
                      <option value={4}>Khối 4</option>
                      <option value={5}>Khối 5</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tên lớp ảo</label>
                    <input 
                      type="text" 
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Ví dụ: Lớp 3A"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Số lượng học sinh tối đa</label>
                    <input 
                      type="number"
                      value={newClassMaxStudents}
                      onChange={(e) => setNewClassMaxStudents(Number(e.target.value))}
                      min={5}
                      max={50}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Giáo viên chủ nhiệm</label>
                    <input 
                      type="text" 
                      value={teacherSearchInput}
                      onChange={(e) => {
                        setTeacherSearchInput(e.target.value);
                        setSelectedTeacherId(null);
                        setShowTeacherSuggestions(true);
                      }}
                      onFocus={() => setShowTeacherSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowTeacherSuggestions(false), 200)}
                      placeholder="Gõ tìm kiếm hoặc thêm mới..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />

                    {/* Teacher Autocomplete suggestions dropdown */}
                    {showTeacherSuggestions && (
                      <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20 text-xs">
                        {suggestedTeachers.map(teacher => (
                          <div 
                            key={teacher.id}
                            onClick={() => {
                              setTeacherSearchInput(teacher.name);
                              setSelectedTeacherId(teacher.id);
                              setShowTeacherSuggestions(false);
                            }}
                            className="p-2.5 hover:bg-blue-50 cursor-pointer font-bold border-b border-slate-100 flex justify-between items-center"
                          >
                            <span>{teacher.name}</span>
                            <span className="text-[10px] text-slate-400 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded">
                              ID: {teacher.id}
                            </span>
                          </div>
                        ))}

                        {/* Quick Add Option */}

                        {teacherSearchInput.trim() === '' && teacherList.length > 0 && (
                          <div className="p-2 text-slate-400 text-center font-semibold">
                            Gõ để tìm kiếm giáo viên
                          </div>
                        )}
                        
                        {teacherSearchInput.trim() === '' && teacherList.length === 0 && (
                          <div className="p-2 text-slate-400 text-center font-semibold">
                            Không có giáo viên nào
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                  >
                    Khởi tạo Lớp học ảo
                  </button>
                </form>
              </div>
            </div>

            {/* Student Assignment Section with Filters & Actions */}
            <div className="border-t border-slate-200/80 pt-6 mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Phân phối Học sinh vào Lớp học ảo</h3>
                  <p className="text-xs font-semibold text-slate-500">Danh sách học sinh của trường. Lọc theo trạng thái xếp lớp, năm học và khối lớp.</p>
                </div>

                {/* Auto Assign Action Button */}
                <button
                  onClick={handleAutoAssign}
                  className="px-4.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" />
                  Xếp lớp tự động
                </button>
              </div>

              {/* Search Filters */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">NĂM HỌC</span>
                  <select
                    value={filterSchoolYear}
                    onChange={(e) => setFilterSchoolYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="2025-2026">2025-2026</option>
                    <option value="2024-2025">2024-2025</option>
                    <option value="2023-2024">2023-2024</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">KHỐI LỚP HỌC SINH</span>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="1">Khối 1</option>
                    <option value="2">Khối 2</option>
                    <option value="3">Khối 3</option>
                    <option value="4">Khối 4</option>
                    <option value="5">Khối 5</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">TRẠNG THÁI XẾP LỚP</span>
                  <select
                    value={filterClassStatus}
                    onChange={(e) => setFilterClassStatus(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="all">Tất cả</option>
                    <option value="assigned">Đã xếp lớp</option>
                    <option value="unassigned">Chưa xếp lớp</option>
                  </select>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 text-center text-slate-400 text-xs font-bold">
                  Không tìm thấy học sinh nào đang chờ phân lớp phù hợp với bộ lọc.
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm bg-white text-xs">
                  <table className="w-full border-collapse text-left font-bold">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                        <th className="p-3">Học sinh</th>
                        <th className="p-3">Thông tin chi tiết</th>
                        <th className="p-3">Gán Lớp ảo</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map(student => {
                        const currentSelect = selectedClasses[student.id] || student.classId || (classesList[0]?.id || '');
                        const isEditing = editingStudentId === student.id;

                        if (isEditing) {
                          return (
                            <tr key={student.id} className="bg-blue-50/20">
                              <td className="p-3" colSpan={2}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-slate-455 uppercase block">Họ tên</label>
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-slate-455 uppercase block">Email</label>
                                    <input
                                      type="email"
                                      value={editEmail}
                                      onChange={(e) => setEditEmail(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-slate-455 uppercase block">Khối lớp học sinh</label>
                                    <select
                                      value={editGrade}
                                      onChange={(e) => setEditGrade(Number(e.target.value))}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                                    >
                                      <option value={1}>Khối 1</option>
                                      <option value={2}>Khối 2</option>
                                      <option value={3}>Khối 3</option>
                                      <option value={4}>Khối 4</option>
                                      <option value={5}>Khối 5</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-slate-455 uppercase block">Năm học</label>
                                    <select
                                      value={editSchoolYear}
                                      onChange={(e) => setEditSchoolYear(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold"
                                    >
                                      <option value="2025-2026">2025-2026</option>
                                      <option value="2024-2025">2024-2025</option>
                                      <option value="2023-2024">2023-2024</option>
                                    </select>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3" colSpan={2}>
                                <div className="flex gap-2 justify-end pt-4">
                                  <button
                                    onClick={() => handleUpdateStudentSubmit(student.id)}
                                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl cursor-pointer"
                                    title="Lưu thay đổi"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingStudentId(null)}
                                    className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl cursor-pointer"
                                    title="Hủy"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="p-3 font-extrabold text-slate-800 flex items-center gap-1.5">
                              {student.gender === 'Nữ' ? '👧' : '👦'} {student.name}
                              {student.birthYear && (
                                <span className="text-[10px] text-slate-400 font-bold ml-1">
                                  ({student.gender} - {student.birthYear})
                                </span>
                              )}
                              {student.classId && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                                  {classesList.find(c => c.id === student.classId)?.name || 'Đã xếp lớp'}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-500">
                              <div>{student.email}</div>
                              <div className="flex gap-1.5 mt-1 flex-wrap">
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                  Khối {student.grade || 3}
                                </span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                  Năm Học: {student.schoolYear || '2025-2026'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <select
                                value={currentSelect}
                                onChange={(e) => setSelectedClasses({
                                  ...selectedClasses,
                                  [student.id]: e.target.value
                                })}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                              >
                                {classesList.map(c => (
                                  <option key={c.id} value={c.id}>{c.name} (Khối {c.grade} - GV {c.teacher})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center items-center">
                                <button
                                  onClick={() => {
                                    const targetClassId = currentSelect;
                                    if (!targetClassId) {
                                      alert('Vui lòng tạo lớp học ảo trước.');
                                      return;
                                    }
                                    assignStudentToClass(student.id, targetClassId);
                                    alert(`Đã gán học sinh ${student.name} vào lớp học ảo thành công!`);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-xl shadow-sm cursor-pointer"
                                >
                                  Gán lớp
                                </button>
                                <button
                                  onClick={() => startEditing(student)}
                                  className="p-1.5 text-slate-555 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  title="Chỉnh sửa thông tin học sinh"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn chắc chắn muốn xóa học sinh ${student.name}?`)) {
                                      deleteUser(student.id);
                                    }
                                  }}
                                  className="p-1.5 text-red-555 hover:bg-red-50 rounded-lg cursor-pointer"
                                  title="Xóa học sinh"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* SUBJECTS MANAGER */}
        {activeTab === 'subjects' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Subjects List */}
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Danh sách môn học đã thiết lập</h3>
                    <p className="text-xs font-semibold text-slate-500">Quản lý môn học chính thức theo khối lớp và năm học.</p>
                  </div>
                  
                  {/* AI Suggestion Trigger */}
                  <button
                    onClick={handleAISuggestSubjects}
                    disabled={isRetrievingAI}
                    type="button"
                    className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-650 hover:from-violet-600 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <span>🤖</span>
                    {isRetrievingAI ? 'Đang gợi ý bằng AI...' : 'Lấy môn học tự động bằng AI'}
                  </button>
                </div>

                {/* AI Suggestions Display Area */}
                {aiSuggestedSubjects.length > 0 && (
                  <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-violet-850 flex items-center gap-1">
                        ✨ Gợi ý môn học GDPT 2018 cho Khối {filterSubjectGrade !== 'all' ? filterSubjectGrade : '3'} ({filterSubjectSchoolYear}):
                      </span>
                      <button
                        type="button"
                        onClick={handleAddAllSuggested}
                        className="text-[10px] font-black text-violet-700 bg-white hover:bg-violet-100/50 border border-violet-200 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Thêm nhanh tất cả (+{aiSuggestedSubjects.length})
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestedSubjects.map((sName, idx) => {
                        const targetG = filterSubjectGrade === 'all' ? 3 : Number(filterSubjectGrade);
                        const exists = subjects.some(s => 
                          s.name.toLowerCase() === sName.toLowerCase() && 
                          s.grade === targetG && 
                          s.schoolYear === filterSubjectSchoolYear
                        );
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddSuggestedSubject(sName)}
                            disabled={exists}
                            className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                              exists 
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-white border-violet-200 text-violet-750 hover:bg-violet-50 hover:border-violet-305'
                            }`}
                          >
                            {sName} {exists ? '✓' : '+'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Search Filters for Subjects */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Lọc theo Năm Học</span>
                    <select
                      value={filterSubjectSchoolYear}
                      onChange={(e) => setFilterSubjectSchoolYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Lọc theo Khối Lớp</span>
                    <select
                      value={filterSubjectGrade}
                      onChange={(e) => setFilterSubjectGrade(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="all">Tất cả khối lớp</option>
                      <option value="1">Khối 1</option>
                      <option value="2">Khối 2</option>
                      <option value="3">Khối 3</option>
                      <option value="4">Khối 4</option>
                      <option value="5">Khối 5</option>
                    </select>
                  </div>
                </div>

                {filteredSubjects.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 text-center text-slate-400 text-xs font-bold">
                    Chưa có môn học nào được cấu hình cho bộ lọc này. Hãy thêm mới hoặc click "Lấy môn học tự động bằng AI".
                  </div>
                ) : (
                  <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm bg-white text-xs">
                    <table className="w-full border-collapse text-left font-bold">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="p-3">Tên Môn Học</th>
                          <th className="p-3">Thông Tin Phân Lớp</th>
                          <th className="p-3 text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSubjects.map(sub => {
                          const isEditingSub = editingSubjectId === sub.id;
                          
                          if (isEditingSub) {
                            return (
                              <tr key={sub.id} className="bg-blue-50/20">
                                <td className="p-3">
                                  <input
                                    type="text"
                                    value={editSubjectName}
                                    onChange={(e) => setEditSubjectName(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2">
                                    <select
                                      value={editSubjectGrade}
                                      onChange={(e) => setEditSubjectGrade(Number(e.target.value))}
                                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none"
                                    >
                                      <option value={1}>Khối 1</option>
                                      <option value={2}>Khối 2</option>
                                      <option value={3}>Khối 3</option>
                                      <option value={4}>Khối 4</option>
                                      <option value={5}>Khối 5</option>
                                    </select>
                                    <select
                                      value={editSubjectSchoolYear}
                                      onChange={(e) => setEditSubjectSchoolYear(e.target.value)}
                                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none"
                                    >
                                      <option value="2025-2026">2025-2026</option>
                                      <option value="2024-2025">2024-2025</option>
                                      <option value="2023-2024">2023-2024</option>
                                    </select>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateSubjectSubmit(sub.id)}
                                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-xl cursor-pointer"
                                      title="Lưu"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSubjectId(null)}
                                      className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl cursor-pointer"
                                      title="Hủy"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={sub.id} className="hover:bg-slate-50">
                              <td className="p-3 font-extrabold text-slate-800">
                                📚 {sub.name}
                              </td>
                              <td className="p-3 font-semibold text-slate-500">
                                <div className="flex gap-1.5">
                                  <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    Khối {sub.grade}
                                  </span>
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                    Năm học: {sub.schoolYear}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2 justify-center items-center">
                                  <button
                                    onClick={() => startEditingSubject(sub)}
                                    className="p-1.5 text-slate-550 hover:bg-slate-100 rounded-lg cursor-pointer"
                                    title="Sửa môn"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Bạn chắc chắn muốn xóa môn học ${sub.name}?`)) {
                                        deleteSubject(sub.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-550 hover:bg-red-555 rounded-lg cursor-pointer"
                                    title="Xóa môn"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Create Subject Form */}
              <div className="lg:col-span-4">
                <form onSubmit={handleCreateSubject} className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4.5 h-4.5 text-blue-600" />
                    Thêm môn học mới
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Năm học</label>
                    <select 
                      value={newSubjectSchoolYear}
                      onChange={(e) => setNewSubjectSchoolYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Khối lớp tương ứng</label>
                    <select 
                      value={newSubjectGrade}
                      onChange={(e) => setNewSubjectGrade(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    >
                      <option value={1}>Khối 1</option>
                      <option value={2}>Khối 2</option>
                      <option value={3}>Khối 3</option>
                      <option value={4}>Khối 4</option>
                      <option value={5}>Khối 5</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Tên môn học</label>
                    <input 
                      type="text" 
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Ví dụ: Tự nhiên và Xã hội"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer"
                  >
                    Thêm môn học
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* DIGITAL TEXTBOOK LIBRARY */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Textbook Library database list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Thư viện Sách Giáo Khoa chuẩn toàn trường</h3>
                
                {/* Library Filters */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Năm học</span>
                    <select
                      value={tbFilterSchoolYear}
                      onChange={(e) => setTbFilterSchoolYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value="all">Tất cả</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Khối lớp</span>
                    <select
                      value={tbFilterGrade}
                      onChange={(e) => setTbFilterGrade(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value="all">Tất cả</option>
                      <option value="1">Khối 1</option>
                      <option value="2">Khối 2</option>
                      <option value="3">Khối 3</option>
                      <option value="4">Khối 4</option>
                      <option value="5">Khối 5</option>
                    </select>
                  </div>
                   <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Môn học</span>
                    <select
                      value={tbFilterSubject}
                      onChange={(e) => setTbFilterSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value="all">Tất cả</option>
                      {(() => {
                        const activeTbGradeVal = tbFilterGrade === 'all' ? undefined : Number(tbFilterGrade);
                        const gradeSubjects = activeTbGradeVal ? subjects.filter(s => s.grade === activeTbGradeVal) : subjects;
                        const uniqueNames = Array.from(new Set(gradeSubjects.map(s => s.name)));
                        const list = uniqueNames.length > 0
                          ? uniqueNames
                          : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
                        return list.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Trạng thái</span>
                    <select
                      value={tbFilterStatus}
                      onChange={(e) => setTbFilterStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700"
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Đang sử dụng</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredTextbooks.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 text-center text-slate-400 text-xs font-bold">
                      Không tìm thấy SGK nào.
                    </div>
                  ) : filteredTextbooks.map(tb => (
                    <div key={tb.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <BookOpen className={`w-5 h-5 ${tb.status === 'active' ? 'text-blue-500' : 'text-slate-400'}`} />
                        <div>
                          <h4 className={`text-xs font-black ${tb.status === 'active' ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{tb.name}</h4>
                          <div className="flex gap-2 text-[10px] text-slate-400 mt-1">
                            <span>Môn: {tb.subject}</span>
                            <span>|</span>
                            <span>Khối: {tb.grade}</span>
                            <span>|</span>
                            <span>Năm học: {tb.schoolYear}</span>
                            <span>|</span>
                            <span>Dung lượng: {tb.size}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm(`Bạn muốn xóa SGK ${tb.name}?`)) deleteTextbook(tb.id);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Xóa sách"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload textbook simulation */}
              <div className="lg:col-span-1 space-y-4">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <Upload className="w-4.5 h-4.5 text-blue-600" />
                    Đăng tải học liệu gốc
                  </h4>

                  <div className="p-4 border-2 border-dashed border-slate-300 bg-white rounded-2xl text-center space-y-2">
                    <span className="text-2xl">📁</span>
                    <label className="bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer block hover:bg-slate-200">
                      Chọn File PDF
                      <input 
                        type="file" 
                        accept=".pdf"
                        onChange={handleSimulateTextbookUpload}
                        className="hidden" 
                      />
                    </label>
                    {uploadedFileName && (
                      <p className="text-[10px] font-black text-emerald-600 truncate">{uploadedFileName}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Năm học</label>
                    <select 
                      value={uploadSchoolYear}
                      onChange={(e) => setUploadSchoolYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Khối lớp tương ứng</label>
                    <select 
                      value={uploadGrade}
                      onChange={(e) => setUploadGrade(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <option value={1}>Khối 1</option>
                      <option value={2}>Khối 2</option>
                      <option value={3}>Khối 3</option>
                      <option value={4}>Khối 4</option>
                      <option value={5}>Khối 5</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Môn học gốc</label>
                    <select 
                      value={uploadSubject} 
                      onChange={(e) => setUploadSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      {(() => {
                        const gradeSubjects = subjects.filter(s => s.grade === uploadGrade);
                        const uniqueNames = Array.from(new Set(gradeSubjects.map(s => s.name)));
                        const list = uniqueNames.length > 0
                          ? uniqueNames
                          : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
                        return list.map(name => (
                          <option key={name} value={name}>{name === 'Ngoại ngữ 1' ? 'Ngoại ngữ 1 (Anh)' : name}</option>
                        ));
                      })()}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">Trạng thái</label>
                    <select 
                      value={uploadStatus}
                      onChange={(e) => setUploadStatus(e.target.value as 'active' | 'archived')}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <option value="active">Đang sử dụng</option>
                      <option value="archived">Lưu trữ</option>
                    </select>
                  </div>

                  <button 
                    onClick={handleAddTextbook}
                    disabled={!uploadedFileName}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer"
                  >
                    Lưu vào thư viện trường
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SCHOOL-WIDE REPORT */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 rounded-2xl text-center space-y-2">
                <span className="text-3xl">📊</span>
                <h4 className="text-xs font-black text-blue-900 uppercase">Độ phủ chương trình</h4>
                <p className="text-2xl font-black text-blue-700">88.5%</p>
                <p className="text-[10px] text-blue-600 font-bold">Số chặng học sinh hoàn thành đúng kế hoạch.</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl text-center space-y-2">
                <span className="text-3xl">🏫</span>
                <h4 className="text-xs font-black text-emerald-900 uppercase">Tỷ lệ tương tác giáo viên</h4>
                <p className="text-2xl font-black text-emerald-700">96.8%</p>
                <p className="text-[10px] text-emerald-600 font-bold">Số bài soạn do giáo viên duyệt và chỉnh sửa thủ công.</p>
              </div>

              <div className="p-5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-2xl text-center space-y-2">
                <span className="text-3xl">🤖</span>
                <h4 className="text-xs font-black text-indigo-900 uppercase">Token AI Tiêu dùng</h4>
                <p className="text-2xl font-black text-indigo-700">125,400 tokens</p>
                <p className="text-[10px] text-indigo-650 font-bold font-semibold">Thống kê token tiêu thụ qua Gemini API tuần qua.</p>
              </div>

            </div>
          </div>
        )}

        {/* SETTINGS CARD */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveApiKeys} className="space-y-6 max-w-xl mx-auto bg-white/50 p-6 rounded-3xl border border-slate-100 shadow-sm animate-fadeIn">
            <div>
              <h3 className="text-lg font-black text-slate-800 font-display">Cấu hình API Key Riêng (Giáo Vụ)</h3>
              <p className="text-xs font-semibold text-slate-500">Gán API Key riêng của giáo vụ để quản lý danh sách môn học tự động, không bị giới hạn token hệ thống.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 uppercase">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={academicGeminiKey}
                  onChange={(e) => setAcademicGeminiKey(e.target.value)}
                  placeholder="Hệ thống mặc định sử dụng API Key chung (.env)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <p className="text-[10px] text-slate-400 font-semibold">Dùng cho tính năng đề xuất môn học tự động bằng AI.</p>
              </div>

              <div className="space-y-1 border-t border-slate-100 pt-3">
                <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Cấu hình OpenAI (Tùy chọn)</label>
                <div className="space-y-3">
                  <input 
                    type="password" 
                    value={academicOpenaiKey}
                    onChange={(e) => setAcademicOpenaiKey(e.target.value)}
                    placeholder="OpenAI API Key riêng"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
                  />
                  <input 
                    type="text" 
                    value={academicOpenaiBaseUrl}
                    onChange={(e) => setAcademicOpenaiBaseUrl(e.target.value)}
                    placeholder="Base URL (mặc định: https://api.openai.com/v1)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
                  />
                  <input 
                    type="text" 
                    value={academicOpenaiModel}
                    onChange={(e) => setAcademicOpenaiModel(e.target.value)}
                    placeholder="Model (mặc định: gpt-3.5-turbo)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    Đã lưu cài đặt thành công! 🎉
                  </>
                ) : (
                  'Lưu cấu hình API'
                )}
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
              <h4 className="font-extrabold text-amber-800 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Lưu ý hạn mức & bảo mật
              </h4>
              <p className="font-semibold text-slate-600 leading-relaxed">
                Nếu không điền API Key riêng, hệ thống sẽ sử dụng API Key dùng chung của trường. API Key riêng được lưu cục bộ và mã hóa an toàn trên thiết bị của bạn.
              </p>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
