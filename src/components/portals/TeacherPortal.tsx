'use client';

import React, { useState } from 'react';
import { useEduSmart, LearningStage, LessonContent, Roadmap } from '@/store/edusmartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash, Edit3, Save, FileText, CheckCircle, AlertTriangle, 
  TrendingDown, Grid, Calendar, Users, Upload, Activity, Sparkles, 
  BookOpen, FileCheck, ArrowRight, ArrowDown, RefreshCw, Sliders, ShieldAlert,
  XCircle, Eye, EyeOff, KeyRound, Cloud, CloudOff
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { getVietJackPreset } from '@/data/vietjackPresets';
import { localDB } from '@/lib/localDB';
import { supabase } from '@/lib/supabaseClient';

const SGK_MOCK_LESSONS: Record<string, string[]> = {
  'Toán_3': [
    'Bài 1: Phép nhân trong phạm vi 1000',
    'Bài 2: Phép chia hết & phép chia có dư',
    'Bài 3: Xem đồng hồ & tính thời gian',
    'Bài 4: Làm quen với chữ số La Mã'
  ],
  'Toán_4': [
    'Bài 1. Ôn tập các số đến 100 000',
    'Bài 2. Ôn tập các phép tính trong phạm vi 100 000',
    'Bài 3. Số chẵn, số lẻ',
    'Bài 4. Biểu thức chữ',
    'Bài 5. Giải bài toán có ba bước tính',
    'Bài 6. Luyện tập chung'
  ],
  'Toán_5': [
    'Bài 1: Hỗn số & phép tính hỗn số',
    'Bài 2: Giải toán về tỉ số phần trăm',
    'Bài 3: Diện tích hình tam giác & hình thang'
  ],
  'Tiếng Việt_3': [
    'Bài 1: Tập đọc: Thư gửi các học sinh',
    'Bài 2: Từ chỉ hoạt động, trạng thái',
    'Bài 3: So sánh & Nhân hóa học đường'
  ],
  'Tiếng Việt_4': [
    'Bài 1: Tập đọc: Dế Mèn bênh vực kẻ yếu',
    'Bài 2: Từ đơn & Từ phức tiếng Việt',
    'Bài 3: Danh từ, Động từ & Tính từ'
  ],
  'Tiếng Việt_5': [
    'Bài 1: Tập đọc: Thư gửi các học sinh lớp 5',
    'Bài 2: Từ đồng nghĩa, trái nghĩa'
  ],
  'Khoa học_3': [
    'Bài 1: Các bộ phận của thực vật',
    'Bài 2: Hệ tiêu hóa của con người',
    'Bài 3: Hệ hô hấp của con người',
    'Bài 4: Động vật ăn gì để sống?'
  ],
  'Khoa học_4': [
    'Bài 1: Nước có những tính chất gì?',
    'Bài 2: Không khí cần cho sự sống',
    'Bài 3: Các nguồn năng lượng quanh ta'
  ],
  'Ngoại ngữ 1_3': [
    'Unit 1: Hello & Greetings',
    'Unit 2: My Family members',
    'Unit 3: School things & toys'
  ],
  'Ngoại ngữ 1_4': [
    'Unit 1: Local communities',
    'Unit 2: Daily routines & chores',
    'Unit 3: Jobs & Dream careers'
  ],
  'Lịch sử và Địa lí_3': [
    'Bài 1: Bản đồ Việt Nam',
    'Bài 2: Gia đình & Trường học',
    'Bài 3: Nước và không khí'
  ],
  'Lịch sử và Địa lí_4': [
    'Bài 1: Thiên nhiên và con người vùng Trung du',
    'Bài 2: Lịch sử vùng đất Thăng Long Hà Nội'
  ],
  'Tin học và Công nghệ_3': [
    'Bài 1: Máy tính quanh ta',
    'Bài 2: Làm quen với Internet',
    'Bài 3: Gõ phím đúng cách'
  ],
  'Tin học và Công nghệ_4': [
    'Bài 1: Phần cứng và phần mềm máy tính',
    'Bài 2: Tạo bài trình chiếu đơn giản'
  ]
};

const fetchWithRetry = async (url: string, options: any, maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      let finalOptions = { ...options };
      if (typeof finalOptions.body === 'string') {
        finalOptions.body = new Blob([finalOptions.body], { type: finalOptions.headers?.['Content-Type'] || 'application/json' });
      }
      const res = await fetch(url, finalOptions);
      if (res.ok) return res;

      let errMsg = res.statusText;
      try {
        const errJson = await res.clone().json();
        if (errJson.error) errMsg = errJson.error;
      } catch (e) {}
      
      const resWithErr = new Response(res.body, {
        status: res.status,
        statusText: errMsg.replace(/\r?\n|\r/g, ' ').replace(/[^\x20-\x7E]/g, '')
      });

      if (res.status === 429 || res.status === 503 || (res.statusText && res.statusText.includes('Service Unavailable'))) {
        if (i === maxRetries - 1) return resWithErr;
        const delay = (i + 1) * 10000; // 10s, 20s, 30s, 40s
        console.warn(`API quá tải (Lần ${i + 1}/${maxRetries}), đang thử lại sau ${delay/1000} giây...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return resWithErr;
    } catch (e: any) {
      if (i === maxRetries - 1) throw e;
      const delay = (i + 1) * 10000;
      console.warn(`Lỗi kết nối/mạng (Lần ${i + 1}/${maxRetries}), đang thử lại sau ${delay/1000} giây... Chi tiết:`, e);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  try {
    let finalOptions = { ...options };
    if (typeof finalOptions.body === 'string') {
      finalOptions.body = new Blob([finalOptions.body], { type: finalOptions.headers?.['Content-Type'] || 'application/json' });
    }
    return await fetch(url, finalOptions); // fallback
  } catch (e: any) {
    throw e;
  }
};

export interface ExtractedLesson {
  title: string;
  startPage: number;
  endPage: number;
}

const getLessonNumber = (title: string): number => {
  const prefixMatch = title.match(/(?:Bài|Unit|Chặng|Lesson|Chương)\s*(\d+)/i);
  if (prefixMatch) return parseInt(prefixMatch[1], 10);
  const leadingMatch = title.match(/^\s*(\d+)/);
  if (leadingMatch) return parseInt(leadingMatch[1], 10);
  return Infinity;
};

const sortLessons = (a: any, b: any) => {
  const numA = getLessonNumber(a.title);
  const numB = getLessonNumber(b.title);
  if (numA !== numB) {
    return numA - numB;
  }
  return a.title.localeCompare(b.title, 'vi');
};

export const TeacherPortal: React.FC = () => {
  const { 
    roadmaps, 
    teacherSettings, 
    updateTeacherSettings, 
    isOnline, 
    syncQueue,
    clearSyncQueue,
    virtualClasses,
    users,
    createRoadmap,
    updateRoadmap,
    deleteRoadmap,
    assignRoadmapToClass,
    moderationList,
    setModerationList,
    textbooks,
    currentUser,
    progressMap,
    subjects
  } = useEduSmart();

  const [aiEarlyWarnings, setAiEarlyWarnings] = React.useState<Array<{ student: string; reason: string; action: string }>>([]);
  const [isEvaluatingWarnings, setIsEvaluatingWarnings] = React.useState(false);

  React.useEffect(() => {
    const loadWarnings = async () => {
      const cached = await localDB.get<string>('es_early_warnings');
      if (cached) {
        setAiEarlyWarnings(JSON.parse(cached));
      } else {
        const defaults = [
          { student: 'Phạm Hải Nam', reason: 'Điểm số môn Toán giảm sút đột ngột từ 85% xuống 45% ở 2 chặng học gần nhất.', action: 'Gợi ý phụ huynh đồng hành trò chơi Toán học cuối tuần và kích hoạt Socratic Tutor tăng cường.' }
        ];
        setAiEarlyWarnings(defaults);
        await localDB.set('es_early_warnings', JSON.stringify(defaults));
      }
    };
    loadWarnings();
  }, []);

  // Re-ordered views: 'pdf' -> 'moderation' -> 'timeline' -> 'heatmap' -> 'settings'
  const [activeTab, setActiveTab] = useState<'pdf' | 'moderation' | 'timeline' | 'heatmap' | 'settings'>('pdf');
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  // --- API Key Settings Local State (không gọi updateTeacherSettings mỗi keystroke) ---
  const [localAiProvider, setLocalAiProvider] = useState<'gemini' | 'openai'>(teacherSettings.aiProvider || 'gemini');
  const [localGeminiKey, setLocalGeminiKey] = useState(teacherSettings.geminiKey || '');
  const [localOpenaiKey, setLocalOpenaiKey] = useState(teacherSettings.openaiKey || '');
  const [localOpenaiBaseUrl, setLocalOpenaiBaseUrl] = useState(teacherSettings.openaiBaseUrl || '');
  const [localOpenaiModel, setLocalOpenaiModel] = useState(teacherSettings.openaiModel || '');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [apiKeySaveStatus, setApiKeySaveStatus] = useState<'idle' | 'saved'>('idle');

  // Sync local state when teacherSettings change (e.g. on login)
  React.useEffect(() => {
    setLocalAiProvider(teacherSettings.aiProvider || 'gemini');
    setLocalGeminiKey(teacherSettings.geminiKey || '');
    setLocalOpenaiKey(teacherSettings.openaiKey || '');
    setLocalOpenaiBaseUrl(teacherSettings.openaiBaseUrl || '');
    setLocalOpenaiModel(teacherSettings.openaiModel || '');
  }, [teacherSettings.aiProvider, teacherSettings.geminiKey, teacherSettings.openaiKey]);

  const handleSaveApiKeys = () => {
    updateTeacherSettings({
      aiProvider: localAiProvider,
      geminiKey: localGeminiKey.trim(),
      openaiKey: localOpenaiKey.trim(),
      openaiBaseUrl: localOpenaiBaseUrl.trim(),
      openaiModel: localOpenaiModel.trim()
    });
    setApiKeySaveStatus('saved');
    setTimeout(() => setApiKeySaveStatus('idle'), 3000);
  };

  // Heatmap Filters State
  const [heatmapYear, setHeatmapYear] = useState<string>('all');
  const [heatmapGrade, setHeatmapGrade] = useState<string>('all');
  const [heatmapClassId, setHeatmapClassId] = useState<string>('all');

  // Assigned Class
  const teacherName = currentUser ? currentUser.name : 'Lê Thị Mai';
  const assignedClass = virtualClasses.find(c => c.teacher.includes(teacherName)) || virtualClasses[0];
  const className = assignedClass ? assignedClass.name : 'Lớp 3A';

  // TIMELINE BUILDER STATE
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>(roadmaps[0]?.id || '');
  const activeRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);
  const [tempStages, setTempStages] = useState<LearningStage[]>(activeRoadmap?.stages || []);

  // Filters for Timeline Builder
  const [timelineSchoolYear, setTimelineSchoolYear] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_year') || '2025-2026';
    return '2025-2026';
  });
  const [timelineGrade, setTimelineGrade] = useState<number>(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('es_pref_grade')) || 4;
    return 4;
  });
  const [filterAssignedStatus, setFilterAssignedStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('es_pref_grade', timelineGrade.toString());
      localStorage.setItem('es_pref_year', timelineSchoolYear);
    }
  }, [timelineGrade, timelineSchoolYear]);

  const [newRoadmapTitle, setNewRoadmapTitle] = useState('');
  const [newRoadmapMaxLessons, setNewRoadmapMaxLessons] = useState<number>(10);
  const [assignedClassId, setAssignedClassId] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleText, setEditTitleText] = useState('');

  // Bulk assign states
  const [bulkSelectedRoadmapIds, setBulkSelectedRoadmapIds] = useState<string[]>([]);
  const [bulkSelectedClassIds, setBulkSelectedClassIds] = useState<string[]>([]);
  const [filterClassAssignedStatus, setFilterClassAssignedStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [unassigningRoadmapId, setUnassigningRoadmapId] = useState<string | null>(null);

  // Sync selectedRoadmapId with filters
  React.useEffect(() => {
    const filtered = roadmaps.filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear));
    if (filtered.length > 0) {
      if (!filtered.some(r => r.id === selectedRoadmapId)) {
        setSelectedRoadmapId(filtered[0].id);
      }
    } else {
      setSelectedRoadmapId('select_all');
    }
  }, [timelineGrade, timelineSchoolYear, roadmaps]);

  // Sync tempStages when selected roadmap changes
  React.useEffect(() => {
    if (activeRoadmap) {
      setTempStages(activeRoadmap.stages);
    } else {
      setTempStages([]);
    }
  }, [selectedRoadmapId, roadmaps, activeRoadmap]);

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newStages = [...tempStages];
    const temp = newStages[index];
    newStages[index] = newStages[index - 1];
    newStages[index - 1] = temp;
    setTempStages(newStages);
  };

  const handleMoveDown = (index: number) => {
    if (index === tempStages.length - 1) return;
    const newStages = [...tempStages];
    const temp = newStages[index];
    newStages[index] = newStages[index + 1];
    newStages[index + 1] = temp;
    setTempStages(newStages);
  };

  const handleRemoveStage = (id: string) => {
    setTempStages(tempStages.filter(s => s.id !== id));
  };

  // Add custom stage manually
  const [newStageSubject, setNewStageSubject] = useState<'Toán' | 'Tiếng Việt' | 'Ngoại ngữ 1' | 'Khoa học' | 'Lịch sử và Địa lí' | 'Tin học và Công nghệ'>('Toán');
  const [newStageTitle, setNewStageTitle] = useState('');
  
  const handleAddStage = () => {
    if (!newStageTitle.trim()) return;
    const newStage: LearningStage = {
      id: 'stage-' + Math.random().toString(36).substring(7),
      subject: newStageSubject,
      title: newStageTitle,
      lessonId: 'custom_' + Math.random().toString(36).substring(7),
      status: 'available',
      grade: timelineGrade
    };
    setTempStages([...tempStages, newStage]);
    setNewStageTitle('');
  };

  const handleAddStageFromBank = (subject: any, title: string, lessonId?: string) => {
    // Check duplicate
    if (tempStages.some(s => s.title === title && s.subject === subject)) {
      alert('Chặng học này đã có sẵn trong lộ trình!');
      return;
    }
    const newStage: LearningStage = {
      id: 'stage-' + Math.random().toString(36).substring(7),
      subject,
      title,
      lessonId: lessonId || 'lesson_' + Math.random().toString(36).substring(7),
      status: tempStages.length === 0 ? 'available' : 'locked',
      grade: timelineGrade
    };
    setTempStages([...tempStages, newStage]);
  };

  const handleSaveTimeline = () => {
    if (!selectedRoadmapId) return;
    updateRoadmap(selectedRoadmapId, { stages: tempStages });
    alert('Đã lưu trình tự lộ trình môn học thành công! 🎉');
  };

  const handleSelectFromLibrary = async (tb: any) => {
    setPdfFile(tb.name);
    setPdfBase64(tb.fileBase64 || null); // Might be undefined for mock data, that's expected
    setIsLibraryModalOpen(false);

    // Check Cache
    const cacheKey = `es_toc_cache_${parseSubject}_${parseGrade}_${tb.name}`;
    let cached = localStorage.getItem(cacheKey);
    if (!cached) {
      cached = (await localDB.get<string>(cacheKey)) || null;
    }
    if (cached) {
      try {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mappedParsed = parsed.map((item: any) => typeof item === 'string' ? { title: item, startPage: 1, endPage: 10 } : item);
          setExtractedLessons(mappedParsed);
          setSelectedLessons(mappedParsed);
          alert('Đã tải danh sách Mục lục từ bộ nhớ tạm thành công! (Tiết kiệm 1 Request API)');
        }
      } catch (e) {
        console.error("Cache corrupted");
      }
    } else {
      setExtractedLessons([]);
      setSelectedLessons([]);
    }
  };

  const handleCreateNewRoadmap = () => {
    const normalizeYear = (year: string) => year.replace(/\s+/g, '');

    // 1. Gather all lessons already assigned to any roadmap of the same school year and grade
    const existingLessonTitles = new Set<string>();
    roadmaps
      .filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || normalizeYear(r.schoolYear) === normalizeYear(timelineSchoolYear)))
      .forEach(r => {
        r.stages.forEach(s => {
          existingLessonTitles.add(s.title);
        });
      });

    // 2. Gather all approved lessons for this Grade and Year from Moderation Studio, filtering out those already used
    const gradeSubjects = subjects.filter(s => s.grade === timelineGrade);
    const subjectNames = gradeSubjects.length > 0 
      ? Array.from(new Set(gradeSubjects.map(s => s.name)))
      : ['Toán', 'Tiếng Việt', 'Khoa học', 'Ngoại ngữ 1', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
    
    const approvedFromModeration = moderationList
      .filter(m => m.grade === timelineGrade && m.status === 'approved' && (!m.schoolYear || normalizeYear(m.schoolYear) === normalizeYear(timelineSchoolYear)))
      .map(m => ({ subject: m.subject, title: m.title }))
      .filter(l => !existingLessonTitles.has(l.title))
      .sort(sortLessons);

    const allLessons = approvedFromModeration;

    if (allLessons.length === 0) {
      alert(`Không có bài học mới nào đã được duyệt của Khối ${timelineGrade} (Năm học ${timelineSchoolYear}) chưa được đưa vào các lộ trình! Vui lòng duyệt thêm bài học ở tab "Kiểm duyệt bài học".`);
      return;
    }

    // Group by subject (preserving order)
    const grouped: Record<string, string[]> = {};
    subjectNames.forEach(sub => {
      grouped[sub] = allLessons.filter(l => l.subject === sub).map(l => l.title);
    });

    // 3. Dynamic scheduling based on volume and order
    const generatedStages: LearningStage[] = [];
    let lastSubject: string | null = null;
    let iteration = 0;
    
    while (iteration < 100 && generatedStages.length < newRoadmapMaxLessons) {
      const eligibleSubjects = subjectNames.filter(sub => grouped[sub] && grouped[sub].length > 0);
      if (eligibleSubjects.length === 0) break;
      
      eligibleSubjects.sort((a, b) => {
        const countA = grouped[a].length;
        const countB = grouped[b].length;
        const scoreA = countA + (a === lastSubject ? -1.5 : 0);
        const scoreB = countB + (b === lastSubject ? -1.5 : 0);
        return scoreB - scoreA;
      });
      
      const chosenSubject = eligibleSubjects[0];
      const lessonTitle = grouped[chosenSubject].shift()!;
      
      generatedStages.push({
        id: 'ai-stage-' + Math.random().toString(36).substring(7),
        subject: chosenSubject as any,
        title: lessonTitle,
        lessonId: 'lesson_' + Math.random().toString(36).substring(7),
        status: generatedStages.length === 0 ? 'available' : 'locked',
        grade: timelineGrade
      });
      
      lastSubject = chosenSubject;
      iteration++;
    }

    if (generatedStages.length > 0) {
      // Determine roadmap title
      let title = newRoadmapTitle.trim();
      const existingForGradeAndYear = roadmaps.filter(
        r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || normalizeYear(r.schoolYear) === normalizeYear(timelineSchoolYear))
      );
      const nextIndex = existingForGradeAndYear.length + 1;

      if (title) {
        title = `Lộ trình ${nextIndex}: ${title}`;
      } else {
        const titleThemes = [
          'Khởi động thông thái',
          'Bứt phá tư duy',
          'Tăng tốc vượt trội',
          'Chinh phục kiến thức',
          'Khám phá đỉnh cao',
          'Vững bước tương lai',
          'Làm chủ công nghệ',
          'Hành trình sáng tạo'
        ];
        const subtitle = titleThemes[(nextIndex - 1) % titleThemes.length];
        title = `Lộ trình ${nextIndex}: ${subtitle}`;
      }

      // Create new roadmap and auto-select it
      const newId = createRoadmap(title, timelineGrade, timelineSchoolYear, generatedStages);
      setSelectedRoadmapId(newId);
      setTempStages(generatedStages);
      setNewRoadmapTitle('');

      alert(`Đã tự động tạo mới "${title}" thành công gồm ${generatedStages.length} chặng học được thiết kế bằng AI! 🚀\n- Thứ tự bài học sắp xếp tuần tự.\n- Mật độ phân bổ theo khối lượng bài thực tế của từng môn.\n- Các bài đã học ở lộ trình khác trong năm học ${timelineSchoolYear} đã được tự động loại bỏ.`);
    } else {
      alert('Không tìm thấy chặng học hợp lệ chưa sử dụng để biên soạn lộ trình.');
    }
  };

  const handleRenameRoadmap = () => {
    if (!selectedRoadmapId || !editTitleText.trim()) return;
    updateRoadmap(selectedRoadmapId, { title: editTitleText.trim() });
    setIsEditingTitle(false);
    alert('Đã đổi tên lộ trình thành công!');
  };

  const handleDeleteRoadmap = () => {
    if (!selectedRoadmapId) return;
    if (confirm('Bạn có chắc chắn muốn xóa lộ trình này không?')) {
      deleteRoadmap(selectedRoadmapId);
      setSelectedRoadmapId(roadmaps[0]?.id || '');
      alert('Đã xóa lộ trình.');
    }
  };

  const handleAssignRoadmap = () => {
    if (!selectedRoadmapId || !assignedClassId) {
      alert('Vui lòng chọn lớp học ảo để gán lộ trình!');
      return;
    }
    assignRoadmapToClass(selectedRoadmapId, assignedClassId);
    const cls = virtualClasses.find(c => c.id === assignedClassId);
    alert(`Đã gán lộ trình thành công cho lớp ${cls?.name}! Các học sinh thuộc lớp này sẽ được cập nhật lộ trình mới này.`);
  };

  const handleBulkAssign = () => {
    if (bulkSelectedRoadmapIds.length === 0 || bulkSelectedClassIds.length === 0) {
      alert('Vui lòng chọn ít nhất một lộ trình và một lớp học ảo!');
      return;
    }
    bulkSelectedRoadmapIds.forEach(rId => {
      bulkSelectedClassIds.forEach(cId => {
        assignRoadmapToClass(rId, cId);
      });
    });
    const classNames = bulkSelectedClassIds
      .map(cId => virtualClasses.find(c => c.id === cId)?.name)
      .filter(Boolean)
      .join(', ');
    alert(`Đã gán thành công ${bulkSelectedRoadmapIds.length} lộ trình cho lớp: ${classNames}! 🎉`);
    setBulkSelectedRoadmapIds([]);
    setBulkSelectedClassIds([]);
  };

  // PDF PARSER STATE
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [parseSubject, setParseSubject] = useState<string>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('es_pref_subject') as any) || 'Toán';
    return 'Toán';
  });
  const [parseGrade, setParseGrade] = useState<number>(() => {
    if (typeof window !== 'undefined') return Number(localStorage.getItem('es_pref_grade')) || 4;
    return 4;
  });
  const [parseSchoolYear, setParseSchoolYear] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_year') || '2025-2026';
    return '2025-2026';
  });
  const [parseMethod, setParseMethod] = useState<'pdf' | 'topic' | 'vietjack'>('vietjack');
  const [selectedBookSeries, setSelectedBookSeries] = useState<'Kết nối tri thức' | 'Chân trời sáng tạo' | 'Cánh diều'>('Kết nối tri thức');

  // Sync preferences to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('es_pref_subject', parseSubject);
      localStorage.setItem('es_pref_grade', parseGrade.toString());
      localStorage.setItem('es_pref_year', parseSchoolYear);
    }
  }, [parseSubject, parseGrade, parseSchoolYear]);

  // Reset or load lessons when filters change
  React.useEffect(() => {
    let active = true;
    const loadCache = async () => {
      if (parseMethod === 'vietjack') {
        if (parseSubject === 'Tất cả') {
          const cacheKey = `es_toc_cache_vietjack_${parseSubject}_${parseGrade}_${selectedBookSeries}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0 && active) {
                setExtractedLessons(parsed);
                setSelectedLessons(parsed);
                return;
              }
            } catch (e) {
              console.error("Cache corrupted");
            }
          }
          const gradeSubjects = subjects.filter(s => s.grade === parseGrade);
          const subjectsToLoad = gradeSubjects.length > 0 
            ? gradeSubjects.map(s => s.name)
            : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
          let allLessons: ExtractedLesson[] = [];
          for (const subj of subjectsToLoad) {
            const subCacheKey = `es_toc_cache_vietjack_${subj}_${parseGrade}_${selectedBookSeries}`;
            const subCached = localStorage.getItem(subCacheKey);
            let subLessons: ExtractedLesson[] = [];
            if (subCached) {
              try {
                const parsed = JSON.parse(subCached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  subLessons = parsed;
                }
              } catch (e) {
                console.error("Sub cache corrupted");
              }
            }
            if (subLessons.length === 0) {
              const preset = getVietJackPreset(subj, parseGrade, selectedBookSeries);
              subLessons = preset.lessons;
            }
            const prefixedLessons = subLessons.map(lesson => ({
              ...lesson,
              title: `[${subj}] ${lesson.title}`
            }));
            allLessons = [...allLessons, ...prefixedLessons];
          }
          if (active) {
            setExtractedLessons(allLessons);
            setSelectedLessons(allLessons);
          }
          return;
        }

        const cacheKey = `es_toc_cache_vietjack_${parseSubject}_${parseGrade}_${selectedBookSeries}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0 && active) {
              setExtractedLessons(parsed);
              setSelectedLessons(parsed);
              return;
            }
          } catch (e) {
            console.error("Cache corrupted");
          }
        }
        const preset = getVietJackPreset(parseSubject, parseGrade, selectedBookSeries);
        if (active) {
          setExtractedLessons(preset.lessons);
          setSelectedLessons(preset.lessons);
        }
      } else if (parseMethod === 'pdf') {
        if (pdfFile) {
          const cacheKey = `es_toc_cache_${parseSubject}_${parseGrade}_${pdfFile}`;
          let cached = localStorage.getItem(cacheKey);
          if (!cached) {
            cached = (await localDB.get<string>(cacheKey)) || null;
          }
          if (cached) {
            try {
              const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
              if (Array.isArray(parsed) && parsed.length > 0 && active) {
                const mappedParsed = parsed.map((item: any) => typeof item === 'string' ? { title: item, startPage: 1, endPage: 10 } : item);
                setExtractedLessons(mappedParsed);
                setSelectedLessons(mappedParsed);
                return;
              }
            } catch (e) {
              console.error("Cache corrupted");
            }
          }
        }
        if (active) {
          setExtractedLessons([]);
          setSelectedLessons([]);
        }
      } else {
        if (active) {
          setExtractedLessons([]);
          setSelectedLessons([]);
        }
      }
    };

    loadCache();
    return () => {
      active = false;
    };
  }, [parseSubject, parseGrade, parseSchoolYear, selectedBookSeries, parseMethod, pdfFile]);
  const [parseLessonTitle, setParseLessonTitle] = useState('Bài: Ôn tập về Động vật');
  const [isParsing, setIsParsing] = useState(false);
  const [tocEndPage, setTocEndPage] = useState<number>(20);
  const [pageOneOffset, setPageOneOffset] = useState<number>(3);
  const [parseProgress, setParseProgress] = useState<string>('');
  const [selectedLessons, setSelectedLessons] = useState<ExtractedLesson[]>([]);
  const [isExtractingTOC, setIsExtractingTOC] = useState(false);
  const [extractedLessons, setExtractedLessons] = useState<ExtractedLesson[]>([]);
  const [ignoreOldData, setIgnoreOldData] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  
  const [lessonCache, setLessonCache] = useState<Record<string, LessonContent>>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('es_lesson_cache');
      return cached ? JSON.parse(cached) : {};
    }
    return {};
  });

  const saveLessonCache = (updatedCache: Record<string, LessonContent>) => {
    setLessonCache(updatedCache);
    if (typeof window !== 'undefined') {
      localStorage.setItem('es_lesson_cache', JSON.stringify(updatedCache));
    }
  };

  const [lessonsGenerating, setLessonsGenerating] = useState<Record<string, boolean>>({});

  // Moderation list filters
  const [filterSchoolYear, setFilterSchoolYear] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_year') || '2025-2026';
    return '2025-2026';
  });
  const [filterGrade, setFilterGrade] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const g = localStorage.getItem('es_pref_grade');
      return g ? g : '4';
    }
    return '4';
  });
  const [filterSubject, setFilterSubject] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('es_pref_subject') || 'Toán';
    return 'Toán';
  });

  // Sync filter preferences to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (filterSubject !== 'all') localStorage.setItem('es_pref_subject', filterSubject);
      if (filterGrade !== 'all') localStorage.setItem('es_pref_grade', filterGrade);
      localStorage.setItem('es_pref_year', filterSchoolYear);
    }
  }, [filterSubject, filterGrade, filterSchoolYear]);

  // Sync lessonCache with moderationList loaded from indexedDB/Supabase
  React.useEffect(() => {
    if (moderationList && moderationList.length > 0) {
      const newCache = { ...lessonCache };
      let updated = false;
      moderationList.forEach(m => {
        const key = `${m.subject}_${m.grade}_${m.title}`;
        if (m.content && !newCache[key]) {
          newCache[key] = m.content;
          updated = true;
        }
      });
      if (updated) {
        saveLessonCache(newCache);
      }
    }
  }, [moderationList]);

  const [selectedModIds, setSelectedModIds] = useState<string[]>([]);



  // REGENERATE LESSON SCHEMA STATE & HANDLER
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateProgress, setRegenerateProgress] = useState('');

  const handleRegenerateLessonSchema = async (id: string) => {
    const mod = moderationList.find(m => m.id === id);
    if (!mod) return;

    setIsRegenerating(true);
    const providerName = teacherSettings.aiProvider === 'openai' ? 'OpenAI/CocoLink' : 'Gemini AI';
    setRegenerateProgress(`AI Agent: Kết nối với ${providerName}...`);
    
    try {
      const aiConfig = {
        aiProvider: teacherSettings.aiProvider || 'gemini',
        customApiKey: teacherSettings.geminiKey || '',
        openaiKey: teacherSettings.openaiKey || '',
        openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
        openaiModel: teacherSettings.openaiModel || ''
      };

      // Let's call /api/ai for lesson generation
      const lessonRes = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'lesson',
          prompt: `Môn học: ${mod.subject}, Khối lớp: ${mod.grade}, Chủ đề bài học: "${mod.title}"`,
          aiProvider: aiConfig.aiProvider,
          customApiKey: aiConfig.customApiKey,
          openaiKey: aiConfig.openaiKey,
          openaiBaseUrl: aiConfig.openaiBaseUrl,
          openaiModel: aiConfig.openaiModel,
          subject: mod.subject
        })
      });

      if (!lessonRes.ok) {
        if (lessonRes.status === 429) throw new Error(`Quá tải API (429). Vui lòng đợi 1 phút.`);
        if (lessonRes.status === 503 || lessonRes.statusText.includes('Service Unavailable')) throw new Error(`Hệ thống AI đang quá tải (503). Vui lòng thử lại sau vài phút.`);
        throw new Error(`Lỗi tạo bài giảng (HTTP ${lessonRes.status}): ${lessonRes.statusText}`);
      }

      const lessonData = await lessonRes.json();
      const lessonResult = lessonData.result;

      setRegenerateProgress('Exercise Generator Agent: Đang thiết kế ngân hàng bài tập thích ứng...');

      const exerciseRes = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'exercise',
          prompt: `Môn học: ${mod.subject}, Khối lớp: ${mod.grade}, Chủ đề bài học: "${mod.title}". Dựa trên bài giảng sau: ${JSON.stringify(lessonResult)}`,
          aiProvider: aiConfig.aiProvider,
          customApiKey: aiConfig.customApiKey,
          openaiKey: aiConfig.openaiKey,
          openaiBaseUrl: aiConfig.openaiBaseUrl,
          openaiModel: aiConfig.openaiModel,
          subject: mod.subject
        })
      });

      if (!exerciseRes.ok) {
        if (exerciseRes.status === 429) throw new Error(`Quá tải API (429). Vui lòng đợi 1 phút.`);
        if (lessonRes.status === 503 || lessonRes.statusText.includes('Service Unavailable')) throw new Error(`Hệ thống AI đang quá tải (503). Vui lòng thử lại sau vài phút.`);
        throw new Error(`Lỗi tạo bài tập (HTTP ${exerciseRes.status}): ${exerciseRes.statusText}`);
      }

      const exerciseData = await exerciseRes.json();
      const exercises = exerciseData.result;

      const practiceQuestions = Array.isArray(exercises) ? exercises.map((q: any) => ({
        id: q.question_id || 'q_' + Math.random().toString(36).substring(7),
        type: q.type || 'multiple_choice',
        difficulty: q.difficulty || 'medium',
        question: q.question_text || q.question || '',
        question_text: q.question_text || q.question || '',
        options: q.options || undefined,
        correctAnswer: q.correct_answer || '',
        explanation: q.explanation || '',
        hint: q.hint || ''
      })) : [];

      const freshLesson: LessonContent = {
        id: 'parsed_' + Math.random().toString(36).substring(7),
        title: mod.title,
        warmUp: {
          story: lessonResult.warm_up?.story || `Chào mừng con đến với bài học ${mod.title}!`,
          question: lessonResult.warm_up?.question || 'Sẵn sàng chưa con?',
          options: lessonResult.warm_up?.options || (mod.subject === 'Toán' ? ['2 quả', '3 quả', '4 quả', '5 quả'] : 
                    mod.subject === 'Tiếng Việt' ? ['Viết thư', 'Thế giới', 'Gõ kiến', 'Diệu kỳ'] : 
                    mod.subject === 'Khoa học' ? ['Miệng', 'Thực quản', 'Dạ dày', 'Ruột non'] : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'])
        },
        explanation: {
          mainContent: lessonResult.knowledge_explanation?.main_content || '',
          visualHint: lessonResult.knowledge_explanation?.visual_hint || ''
        },
        examples: Array.isArray(lessonResult.examples) ? lessonResult.examples.map((ex: any) => ({
          problem: ex.problem || '',
          solutionSteps: ex.solution_steps || [],
          answer: ex.answer || ''
        })) : [
          {
            problem: 'Bài toán ví dụ thực tiễn.',
            solutionSteps: ['Bước 1: Phân tích', 'Bước 2: Giải'],
            answer: 'Đáp án đúng'
          }
        ],
        application: {
          realWorldConnection: lessonResult.application?.real_world_connection || '',
          challengeQuestion: lessonResult.application?.challenge_question || ''
        },
        practice: practiceQuestions
      };

      setModerationList(prev => prev.map(m => {
        if (m.id === id) {
          return {
            ...m,
            content: freshLesson
          };
        }
        return m;
      }));

      // Sync input form states if the regenerated lesson is currently being edited
      if (editingModId === id) {
        setModWarmUpStory(freshLesson.warmUp.story);
        setModWarmUpQuestion(freshLesson.warmUp.question);
        setModWarmUpOptionsText((freshLesson.warmUp.options || []).join(', '));
        setModExplanationContent(freshLesson.explanation.mainContent);
        setModExplanationVisualHint(freshLesson.explanation.visualHint || '');
        setModExampleProblem(freshLesson.examples?.[0]?.problem || '');
        setModExampleSolution(freshLesson.examples?.[0]?.solutionSteps?.join('\n') || '');
        setModExampleAnswer(freshLesson.examples?.[0]?.answer || '');
        setModApplicationConnection(freshLesson.application?.realWorldConnection || '');
        setModApplicationChallenge(freshLesson.application?.challengeQuestion || '');
        setModPracticeQuestions(freshLesson.practice || []);
      }

      setIsRegenerating(false);
      setRegenerateProgress('');
      alert('Đã tạo mới lại toàn bộ Lesson Schema bài học bằng Gemini AI thành công!');

    } catch (err: any) {
      console.error(err);
      alert(`Lỗi khi tạo lại giáo án bằng AI: ${err.message || 'Lỗi kết nối API'}`);
      setIsRegenerating(false);
      setRegenerateProgress('');
    }
  };

  const handleSaveTOC = () => {
    if (extractedLessons.length > 0) {
      let cacheKey = '';
      let message = '';
      if (parseMethod === 'vietjack') {
        cacheKey = `es_toc_cache_vietjack_${parseSubject}_${parseGrade}_${selectedBookSeries}`;
        message = 'Đã lưu Mục lục VietJack Presets vào Local Data thành công!';
      } else if (parseMethod === 'pdf' && pdfFile) {
        cacheKey = `es_toc_cache_${parseSubject}_${parseGrade}_${pdfFile}`;
        message = 'Đã lưu Mục lục vào Local Data thành công!';
      }

      if (cacheKey) {
        localStorage.setItem(cacheKey, JSON.stringify(extractedLessons));
        localDB.set(cacheKey, JSON.stringify(extractedLessons));
        alert(message);
      } else {
        alert('Vui lòng nạp file PDF hoặc chọn sách để lưu mục lục!');
      }
    } else {
      alert('Không có mục lục nào để lưu!');
    }
  };



  const slicePdfBase64 = async (base64: string, startPage: number, endPage: number, isTOC: boolean = false): Promise<string> => {
    try {
      const pdfDoc = await PDFDocument.load(base64);
      const totalPages = pdfDoc.getPageCount();
      
      let actualStart = 0;
      let actualEnd = 0;

      if (isTOC) {
        // Tối ưu cho Mục Lục: Bỏ qua offset và buffer, chỉ lấy chính xác N trang đầu tiên của file PDF
        actualStart = 0;
        actualEnd = Math.min(totalPages - 1, endPage - 1);
      } else {
        // Tính số trang vật lý của PDF (1-indexed) dựa vào pageOneOffset
        // Ví dụ: startPage in trên sách là 10, trang 1 in trên sách nằm ở trang 3 của PDF
        // => pdfStart = 10 + 3 - 1 = 12
        const pdfStart = startPage + pageOneOffset - 1;
        const pdfEnd = endPage + pageOneOffset - 1;

        // Áp dụng buffer mở rộng (-2 trang đầu, +2 trang cuối) và chuyển về 0-indexed cho pdf-lib
        // pdf-lib index bắt đầu từ 0, nên trang 12 sẽ là index 11.
        actualStart = Math.max(0, pdfStart - 1 - 2); // Trừ 1 để về 0-index, trừ 2 để tạo buffer
        actualEnd = Math.min(totalPages - 1, pdfEnd - 1 + 2); // Trừ 1 để về 0-index, cộng 2 để tạo buffer
      }
      
      if (actualStart === 0 && actualEnd === totalPages - 1) return base64;
      
      const newPdf = await PDFDocument.create();
      const pagesToCopy = [];
      for (let i = actualStart; i <= actualEnd; i++) {
        pagesToCopy.push(i);
      }
      
      if (pagesToCopy.length === 0) return base64;

      const copiedPages = await newPdf.copyPages(pdfDoc, pagesToCopy);
      copiedPages.forEach((page) => newPdf.addPage(page));
      
      return await newPdf.saveAsBase64();
    } catch (e) {
      console.error("Lỗi khi cắt PDF:", e);
      return base64;
    }
  };

  const handleExtractTOCFromPDF = async (fileName: string) => {
    setIsExtractingTOC(true);
    // Xóa cache cũ trước khi quét lại
    localStorage.removeItem(`es_toc_cache_${parseSubject}_${parseGrade}_${fileName}`);
    
    try {
      const aiConfig = {
        aiProvider: teacherSettings.aiProvider || 'gemini',
        customApiKey: teacherSettings.geminiKey || '',
        openaiKey: teacherSettings.openaiKey || '',
        openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
        openaiModel: teacherSettings.openaiModel || ''
      };
      let finalLessons: ExtractedLesson[] = [];
      
      const slicedBase64 = pdfBase64 ? await slicePdfBase64(pdfBase64, 1, tocEndPage, true) : undefined;
      
      const requestBody: any = {
        agent: 'curriculum',
        prompt: `Hãy phân tích tệp sách giáo khoa PDF có tên "${fileName}", môn học "${parseSubject}" lớp "${parseGrade}" và trích xuất TOÀN BỘ danh sách tất cả các bài học có trong phần MỤC LỤC của cuốn sách này. Không bỏ sót bất kỳ bài học nào.\n\nTRẢ VỀ ĐỊNH DẠNG JSON CHÍNH XÁC NHƯ SAU:\n{\n  "isComplete": boolean, // Trả về true nếu bạn đã thấy toàn bộ danh sách Mục Lục đến bài cuối cùng (hoặc hết mục lục). Trả về false nếu danh sách mục lục bị ngắt ngang và dường như còn nằm ở các trang tiếp theo (chưa kết thúc mục lục).\n  "lessons": [\n    {\n      "title": "Tên bài học",\n      "startPage": 10, // Trang bắt đầu của bài học trong sách\n      "endPage": 15 // Trang kết thúc của bài học trong sách (nếu không xác định rõ, có thể ước tính hoặc lấy trang của bài tiếp theo trừ 1)\n    }\n  ]\n}`,
        aiProvider: aiConfig.aiProvider,
        customApiKey: aiConfig.customApiKey,
        openaiKey: aiConfig.openaiKey,
        openaiBaseUrl: aiConfig.openaiBaseUrl,
        openaiModel: aiConfig.openaiModel,
        subject: parseSubject
      };

      if (slicedBase64) {
        requestBody.inlineData = {
          mimeType: "application/pdf",
          data: slicedBase64
        };
      }

      const response = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if (response.status === 429) {
          alert('Lỗi 429: Bạn đã vượt quá giới hạn gọi API (Quá tải). Vui lòng đợi một lát rồi thử lại!');
        } else {
          alert(`Lỗi kết nối API trích xuất mục lục (Mã lỗi: ${response.status}). Vui lòng thử lại!`);
        }
        setIsExtractingTOC(false);
        return;
      }

      const data = await response.json();
      const result = data.result;
      
      if (result && Array.isArray(result.lessons)) {
        finalLessons = result.lessons.map((l: any) => 
          typeof l === 'string' ? { title: l, startPage: 1, endPage: 10 } : l
        );
      } else if (Array.isArray(result)) {
        finalLessons = result.map((l: any) => 
          typeof l === 'string' ? { title: l, startPage: 1, endPage: 10 } : l
        );
      } else if (result && Array.isArray(result.keywords)) {
        finalLessons = result.keywords.map((l: any) => 
          typeof l === 'string' ? { title: l, startPage: 1, endPage: 10 } : l
        );
      } else {
        alert('Lỗi dữ liệu: AI không thể định dạng được mục lục. Vui lòng thử lại!');
        setIsExtractingTOC(false);
        return;
      }

      if (finalLessons.length > 0) {
        for (let i = 0; i < finalLessons.length - 1; i++) {
          if (!finalLessons[i].endPage || finalLessons[i].endPage < finalLessons[i].startPage) {
            finalLessons[i].endPage = finalLessons[i+1].startPage - 1;
          } else {
            finalLessons[i].endPage = Math.max(finalLessons[i].endPage, finalLessons[i+1].startPage - 1);
          }
        }
        
        setExtractedLessons(finalLessons);
        setSelectedLessons(finalLessons);
      } else {
        alert('AI không tìm thấy bài học nào. Vui lòng thử lại!');
        setExtractedLessons([]);
        setSelectedLessons([]);
      }
    } catch (err: any) {
      console.warn("Ngoại lệ trong quá trình quét mục lục:", err);
      alert(err?.message || 'Có lỗi xảy ra khi xử lý mục lục. Hãy thử lại!');
      setExtractedLessons([]);
      setSelectedLessons([]);
    } finally {
      setIsExtractingTOC(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const name = file.name;
      setPdfFile(name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = (event.target?.result as string).split(',')[1];
        setPdfBase64(base64String);
      };
      reader.readAsDataURL(file);

      // Check Cache
      const cacheKey = `es_toc_cache_${parseSubject}_${parseGrade}_${name}`;
      let cached = localStorage.getItem(cacheKey);
      if (!cached) {
        cached = (await localDB.get<string>(cacheKey)) || null;
      }
      if (cached) {
        try {
          const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mappedParsed = parsed.map((item: any) => typeof item === 'string' ? { title: item, startPage: 1, endPage: 10 } : item);
            setExtractedLessons(mappedParsed);
            setSelectedLessons(mappedParsed);
            return;
          }
        } catch (err) {
          console.error(err);
        }
      }
      
      setExtractedLessons([]);
      setSelectedLessons([]);
    }
  };

  const handleGenerateSingleLesson = async (lesson: ExtractedLesson) => {
    const originalTitle = lesson.title;
    let actualSubject = parseSubject;
    let cleanTitle = originalTitle;
    if (parseSubject === 'Tất cả') {
      const match = originalTitle.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (match) {
        actualSubject = match[1];
        cleanTitle = match[2];
      }
    }
    const title = cleanTitle;
    setLessonsGenerating(prev => ({ ...prev, [originalTitle]: true }));
    try {
      const aiConfig = {
        aiProvider: teacherSettings.aiProvider || 'gemini',
        customApiKey: teacherSettings.geminiKey || '',
        openaiKey: teacherSettings.openaiKey || '',
        openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
        openaiModel: teacherSettings.openaiModel || ''
      };

      let base64Data = undefined;
      if (pdfBase64) {
        base64Data = await slicePdfBase64(pdfBase64, lesson.startPage, lesson.endPage);
      }

      const requestBody = {
        lesson: { title: title, startPage: lesson.startPage, endPage: lesson.endPage },
        subject: actualSubject,
        grade: parseGrade,
        schoolYear: parseSchoolYear,
        aiConfig,
        pdfBase64: base64Data
      };

      const workerRes = await fetchWithRetry('/api/lesson-worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!workerRes.ok) {
        throw new Error(`Lỗi Worker (HTTP ${workerRes.status}): ${workerRes.statusText}`);
      }
      
      const workerData = await workerRes.json();
      if (workerData.error) throw new Error(workerData.error);
      
      const newMod = workerData.lesson;
      
      // Update local cache & state
      const cacheKey = `${actualSubject}_${parseGrade}_${title}`;
      const newCache = { ...lessonCache, [cacheKey]: newMod.content };
      saveLessonCache(newCache);
      setModerationList(prev => [newMod, ...prev]);

      alert(`Đã soạn chặng "${title}" bằng AI thành công!`);

    } catch (err: any) {
      console.error(err);
      alert(`Lỗi tạo bài "${title}": ${err.message}`);
    } finally {
      setLessonsGenerating(prev => ({ ...prev, [originalTitle]: false }));
    }
  };

  const handleGenerateWeeklyWorksheet = async (week: any) => {
    const cacheKey = `weekly_${parseSubject}_${parseGrade}_week${week.week}`;
    setLessonsGenerating(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const aiConfig = {
        aiProvider: teacherSettings.aiProvider || 'gemini',
        customApiKey: teacherSettings.geminiKey || '',
        openaiKey: teacherSettings.openaiKey || '',
        openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
        openaiModel: teacherSettings.openaiModel || '',
        subject: parseSubject
      };

      const exerciseRes = await fetchWithRetry('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'exercise',
          prompt: `Môn học: ${parseSubject}, Khối lớp: ${parseGrade}, Nội dung ôn tập của tuần: "${week.title} - ${week.description}". Hãy tạo ngân hàng đề bài kiểm tra ôn tập cuối tuần gồm 8-10 câu hỏi sinh động bám sát nội dung ôn tập này.`,
          aiProvider: aiConfig.aiProvider,
          customApiKey: aiConfig.customApiKey,
          openaiKey: aiConfig.openaiKey,
          openaiBaseUrl: aiConfig.openaiBaseUrl,
          openaiModel: aiConfig.openaiModel,
          subject: aiConfig.subject
        })
      });

      if (!exerciseRes.ok) {
        throw new Error(`Lỗi tạo bài tập (HTTP ${exerciseRes.status}): ${exerciseRes.statusText}`);
      }

      const exerciseData = await exerciseRes.json();
      const exercises = exerciseData.result;

      const practiceQuestions = Array.isArray(exercises) ? exercises.map((q: any) => ({
        id: q.question_id || 'q_' + Math.random().toString(36).substring(7),
        type: q.type || 'multiple_choice',
        difficulty: q.difficulty || 'medium',
        question: q.question_text || q.question || '',
        question_text: q.question_text || q.question || '',
        options: q.options || undefined,
        correctAnswer: q.correct_answer || '',
        explanation: q.explanation || '',
        hint: q.hint || ''
      })) : [];

      const weeklyLesson: LessonContent = {
        id: cacheKey,
        title: week.title,
        warmUp: {
          story: `Chào mừng con đến với bài luyện tập tuần ${week.week}: ${week.title}! Hãy cùng làm các câu đố vui này nhé!`,
          question: `Sẵn sàng chưa con?`,
          options: ['Sẵn sàng!', 'Rất sẵn sàng!']
        },
        explanation: {
          mainContent: `Ôn tập tổng kết kiến thức của Tuần ${week.week}. Chủ đề ôn tập: ${week.description}`,
          visualHint: `📝 Làm bài tập để củng cố kiến thức tốt nhất.`
        },
        examples: [],
        application: {
          realWorldConnection: `Áp dụng các kiến thức đã học vào giải quyết bài tập cuối tuần giúp con ghi nhớ sâu và đạt điểm cao ở trường!`,
          challengeQuestion: `Thử thách: Đạt điểm tối đa 100% trong bài ôn tập này.`
        },
        practice: practiceQuestions
      };

      saveLessonCache({
        ...lessonCache,
        [cacheKey]: weeklyLesson
      });

      setModerationList(prev => [
        {
          id: 'mod-' + Math.random().toString(36).substring(7),
          subject: parseSubject,
          grade: parseGrade,
          title: week.title,
          status: 'approved' as const,
          schoolYear: parseSchoolYear,
          content: weeklyLesson
        },
        ...prev
      ]);

      alert(`Đã tự động tạo và phê duyệt bài ôn tập "${week.title}" thành công!`);
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi tạo bài tập cuối tuần: ${e.message || 'Lỗi kết nối AI'}`);
    } finally {
      setLessonsGenerating(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  const handleScanVietJackTOC = async () => {
    setIsExtractingTOC(true);
    try {
      const aiConfig = {
        aiProvider: teacherSettings.aiProvider || 'gemini',
        customApiKey: teacherSettings.geminiKey || '',
        openaiKey: teacherSettings.openaiKey || '',
        openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
        openaiModel: teacherSettings.openaiModel || ''
      };

      const gradeSubjects = subjects.filter(s => s.grade === parseGrade);
      const standardList = gradeSubjects.length > 0 
        ? gradeSubjects.map(s => s.name)
        : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
      const subjectsToProcess = parseSubject === 'Tất cả' 
        ? standardList
        : [parseSubject];

      let allLessons: ExtractedLesson[] = [];

      for (const subj of subjectsToProcess) {
        const cacheKey = `es_toc_cache_vietjack_${subj}_${parseGrade}_${selectedBookSeries}`;
        localStorage.removeItem(cacheKey);

        const response = await fetchWithRetry('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: 'curriculum',
            prompt: `Hãy phân tích và liệt kê TOÀN BỘ danh sách tất cả các bài học (Mục lục) chính thức cho bộ sách "${selectedBookSeries}", môn học "${subj}" lớp "${parseGrade}" tiểu học Việt Nam năm học "${parseSchoolYear}". Hãy đảm bảo dữ liệu bám sát chương trình chuẩn của sách giáo khoa KNTT/VietJack thực tế.
LƯU Ý QUAN TRỌNG: Bạn phải liệt kê đầy đủ toàn bộ tất cả các bài học từ bài đầu tiên đến bài cuối cùng của cả học kì 1 và học kì 2 (thường có từ 30 đến 70 bài tùy môn). Tuyệt đối không được bỏ sót, viết tắt hoặc tóm tắt nửa chừng.
            
  TRẢ VỀ ĐỊNH DẠNG JSON CHÍNH XÁC NHƯ SAU:
  {
    "lessons": [
      {
        "title": "Tên bài học",
        "startPage": 5,
        "endPage": 10
      }
    ]
  }`,
            aiProvider: aiConfig.aiProvider,
            customApiKey: aiConfig.customApiKey,
            openaiKey: aiConfig.openaiKey,
            openaiBaseUrl: aiConfig.openaiBaseUrl,
            openaiModel: aiConfig.openaiModel,
            subject: subj
          })
        });

        if (!response.ok) {
          throw new Error(`Lỗi kết nối API cho môn ${subj}: HTTP ${response.status}`);
        }

        const data = await response.json();
        const result = data.result;
        
        let finalLessons: ExtractedLesson[] = [];
        if (result && Array.isArray(result.lessons)) {
          finalLessons = result.lessons;
        } else if (Array.isArray(result)) {
          finalLessons = result;
        }

        if (finalLessons.length > 0) {
          localStorage.setItem(cacheKey, JSON.stringify(finalLessons));
          
          // Save to LocalDB
          await localDB.set(cacheKey, JSON.stringify(finalLessons));
          
          if (isOnline) {
            console.log(`Đang đồng bộ Mục lục bộ sách ${selectedBookSeries} lớp ${parseGrade} môn ${subj} lên Supabase...`);
            const tbId = `tb_vietjack_${subj}_${parseGrade}_${selectedBookSeries.replace(/\s+/g, '_')}`;
            const tbData = {
              id: tbId,
              name: `Mục lục ${selectedBookSeries} - ${subj}`,
              subject: subj,
              grade: parseGrade,
              school_year: parseSchoolYear,
              status: 'active',
              size: `${finalLessons.length} bài học`,
              file_base64: JSON.stringify(finalLessons)
            };
            try {
              await supabase.from('textbooks').upsert(tbData);
            } catch (supErr) {
              console.warn("Failed to sync textbooks/TOC to Supabase, continuing locally:", supErr);
            }
          }

          const prefixedLessons = finalLessons.map(lesson => ({
            ...lesson,
            title: parseSubject === 'Tất cả' ? `[${subj}] ${lesson.title}` : lesson.title
          }));
          allLessons = [...allLessons, ...prefixedLessons];
        }
      }

      if (allLessons.length > 0) {
        if (parseSubject === 'Tất cả') {
          const cacheKeyAll = `es_toc_cache_vietjack_Tất cả_${parseGrade}_${selectedBookSeries}`;
          localStorage.setItem(cacheKeyAll, JSON.stringify(allLessons));
          alert(`[Supabase Synced] Đã tự động đồng bộ Mục lục học liệu VietJack mới của Khối ${parseGrade} - Tất cả các môn lên Supabase thành công!`);
        } else {
          alert(`[Supabase Synced] Đã tự động đồng bộ Mục lục học liệu VietJack mới của Khối ${parseGrade} - Môn ${parseSubject} lên Supabase thành công!`);
        }
        setExtractedLessons(allLessons);
        setSelectedLessons(allLessons);
      } else {
        alert('AI Agent không thể định dạng hoặc tìm thấy bài học nào. Vui lòng thử lại!');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Lỗi khi quét mục lục VietJack bằng AI: ${e.message || 'Lỗi kết nối API'}`);
    } finally {
      setIsExtractingTOC(false);
    }
  };

  const handleDeleteCachedLesson = (title: string) => {
    let actualSubject = parseSubject;
    let cleanTitle = title;
    if (parseSubject === 'Tất cả') {
      const match = title.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (match) {
        actualSubject = match[1];
        cleanTitle = match[2];
      }
    }
    const cacheKey = `${actualSubject}_${parseGrade}_${cleanTitle}`;
    const newCache = { ...lessonCache };
    delete newCache[cacheKey];
    saveLessonCache(newCache);

    setModerationList(prev => prev.filter(m => !(m.title === cleanTitle && m.subject === actualSubject && m.grade === parseGrade)));
    alert(`Đã xóa dữ liệu lưu trữ chặng "${cleanTitle}"`);
  };

  const handleRestoreCachedLesson = (lesson: ExtractedLesson) => {
    let actualSubject = parseSubject;
    let cleanTitle = lesson.title;
    if (parseSubject === 'Tất cả') {
      const match = lesson.title.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (match) {
        actualSubject = match[1];
        cleanTitle = match[2];
      }
    }
    const title = cleanTitle;
    const cacheKey = `${actualSubject}_${parseGrade}_${title}`;
    const cachedLesson = lessonCache[cacheKey];
    if (!cachedLesson) return;

    const newMod = {
      id: 'mod-' + Math.random().toString(36).substring(7),
      subject: actualSubject,
      grade: parseGrade,
      title: title,
      status: 'pending' as const,
      schoolYear: parseSchoolYear,
      content: cachedLesson
    };

    setModerationList(prev => [newMod, ...prev]);
    alert(`Đã khôi phục bài "${title}" từ bộ nhớ tạm vào danh sách kiểm duyệt thành công!`);
  };

  const handleRestoreSelectedLessons = async () => {
    const toRestore = selectedLessons.filter(lesson => {
      let actualSubject = parseSubject;
      let cleanTitle = lesson.title;
      if (parseSubject === 'Tất cả') {
        const match = lesson.title.match(/^\[([^\]]+)\]\s*(.*)$/);
        if (match) {
          actualSubject = match[1];
          cleanTitle = match[2];
        }
      }
      const title = cleanTitle;
      const cacheKey = `${actualSubject}_${parseGrade}_${title}`;
      const isCached = !!lessonCache[cacheKey];
      const inModeration = moderationList.some(m => m.title === title && m.subject === actualSubject && m.grade === parseGrade);
      return isCached && !inModeration;
    });

    if (toRestore.length === 0) {
      alert("Không có bài học nào được chọn thoả mãn điều kiện (đã có dữ liệu và chưa nằm trong danh sách duyệt).");
      return;
    }

    const newMods = toRestore.map(lesson => {
      let actualSubject = parseSubject;
      let cleanTitle = lesson.title;
      if (parseSubject === 'Tất cả') {
        const match = lesson.title.match(/^\[([^\]]+)\]\s*(.*)$/);
        if (match) {
          actualSubject = match[1];
          cleanTitle = match[2];
        }
      }
      const cacheKey = `${actualSubject}_${parseGrade}_${cleanTitle}`;
      const cachedLesson = lessonCache[cacheKey];
      return {
        id: 'mod-' + Math.random().toString(36).substring(7),
        subject: actualSubject,
        grade: parseGrade,
        title: cleanTitle,
        status: 'pending' as const,
        schoolYear: parseSchoolYear,
        content: cachedLesson
      };
    });

    setModerationList(prev => [...newMods, ...prev]);

    if (isOnline) {
      try {
        const { error } = await supabase.from('moderation_list').upsert(
          newMods.map(m => ({
            id: m.id,
            subject: m.subject,
            grade: m.grade,
            title: m.title,
            status: m.status,
            school_year: m.schoolYear,
            content: m.content
          }))
        );
        if (error) console.error("Supabase upsert bulk error:", error);
      } catch (err) {
        console.warn("Failed to bulk sync to Supabase:", err);
      }
    }

    alert(`Đã đưa ${newMods.length} bài học có sẵn dữ liệu vào danh sách kiểm duyệt thành công!`);
  };

  const handleGenerateAllSubjectsAndLessons = async () => {
    const subjectsToProcess = ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
    setIsBulkGenerating(true);
    setIsParsing(true);
    setParseProgress(`Khởi tạo tiến trình tạo chặng tự động cho toàn bộ các môn Khối ${parseGrade}...`);

    try {
      const generatedModerations: any[] = [];
      const newCacheEntries: Record<string, LessonContent> = {};
      let totalTokensSaved = 0;
      let totalLessonsGenerated = 0;

      const aiConfig = {
        aiProvider: teacherSettings.aiProvider || 'gemini',
        customApiKey: teacherSettings.geminiKey || '',
        openaiKey: teacherSettings.openaiKey || '',
        openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
        openaiModel: teacherSettings.openaiModel || ''
      };

      for (const subject of subjectsToProcess) {
        setParseProgress(`AI Agent: Đang quét Mục Lục môn ${subject} Khối ${parseGrade}...`);
        
        // 1. Get/Scan TOC
        const preset = getVietJackPreset(subject, parseGrade, selectedBookSeries);
        const lessons = preset.lessons;
        
        // Save TOC to local storage & LocalDB
        const tocCacheKey = `es_toc_cache_vietjack_${subject}_${parseGrade}_${selectedBookSeries}`;
        localStorage.setItem(tocCacheKey, JSON.stringify(lessons));
        localDB.set(tocCacheKey, JSON.stringify(lessons));

        // 2. Generate lessons
        for (let idx = 0; idx < lessons.length; idx++) {
          const lesson = lessons[idx];
          const title = lesson.title;
          const cacheKey = `${subject}_${parseGrade}_${title}`;

          setParseProgress(`Đang xử lý môn ${subject} (${idx + 1}/${lessons.length}): "${title}"...`);

          // Check if cached
          if (lessonCache[cacheKey] && !ignoreOldData) {
            totalTokensSaved++;
            const cachedLesson = lessonCache[cacheKey];
            const alreadyInMod = moderationList.some(m => m.title === title && m.subject === subject && m.grade === parseGrade);
            if (!alreadyInMod) {
              generatedModerations.push({
                id: 'mod-' + Math.random().toString(36).substring(7),
                subject: subject,
                grade: parseGrade,
                title: title,
                status: 'pending' as const,
                schoolYear: parseSchoolYear,
                content: cachedLesson
              });
            }
            continue;
          }

          // Generate using AI
          totalLessonsGenerated++;
          
          const fetchWithRetryLocal = async (url: string, options: any, retries = 3, delay = 1500) => {
            for (let i = 0; i < retries; i++) {
              try {
                let finalOptions = { ...options };
                if (typeof finalOptions.body === 'string') {
                  finalOptions.body = new Blob([finalOptions.body], { type: finalOptions.headers?.['Content-Type'] || 'application/json' });
                }
                const res = await fetch(url, finalOptions);
                if (res.ok) return res;

                let errMsg = res.statusText;
                try {
                  const errJson = await res.clone().json();
                  if (errJson.error) errMsg = errJson.error;
                } catch (e) {}

                const resWithErr = new Response(res.body, {
                  status: res.status,
                  statusText: errMsg.replace(/\r?\n|\r/g, ' ').replace(/[^\x20-\x7E]/g, '')
                });

                if (res.status === 429) {
                  setParseProgress(`AI đang quá tải (429). Đang thử lại sau giây lát...`);
                  await new Promise(r => setTimeout(r, delay * 2));
                  continue;
                }
                
                return resWithErr;
              } catch (e) {
                if (i === retries - 1) throw e;
              }
              await new Promise(r => setTimeout(r, delay));
            }
            let finalOptions = { ...options };
            if (typeof finalOptions.body === 'string') {
              finalOptions.body = new Blob([finalOptions.body], { type: finalOptions.headers?.['Content-Type'] || 'application/json' });
            }
            return fetch(url, finalOptions);
          };

          const lessonRes = await fetchWithRetryLocal('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent: 'lesson',
              prompt: `Môn học: ${subject}, Khối lớp: ${parseGrade}, Chủ đề bài học: "${title}". Hãy sử dụng tệp sách giáo khoa đính kèm để biên soạn chính xác nội dung bài học này.`,
              aiProvider: aiConfig.aiProvider,
              customApiKey: aiConfig.customApiKey,
              openaiKey: aiConfig.openaiKey,
              openaiBaseUrl: aiConfig.openaiBaseUrl,
              openaiModel: aiConfig.openaiModel,
              subject: subject
            })
          });

          if (!lessonRes.ok) {
            throw new Error(`Lỗi tạo bài giảng cho "${title}" (Môn ${subject}): HTTP ${lessonRes.status}`);
          }

          const lessonData = await lessonRes.json();
          const lessonResult = lessonData.result;

          const exerciseRes = await fetchWithRetryLocal('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agent: 'exercise',
              prompt: `Môn học: ${subject}, Khối lớp: ${parseGrade}, Chủ đề bài học: "${title}". Dựa trên nội dung sau: ${JSON.stringify(lessonResult)}`,
              aiProvider: aiConfig.aiProvider,
              customApiKey: aiConfig.customApiKey,
              openaiKey: aiConfig.openaiKey,
              openaiBaseUrl: aiConfig.openaiBaseUrl,
              openaiModel: aiConfig.openaiModel,
              subject: subject
            })
          });

          if (!exerciseRes.ok) {
            throw new Error(`Lỗi tạo bài tập cho "${title}" (Môn ${subject}): HTTP ${exerciseRes.status}`);
          }

          const exerciseData = await exerciseRes.json();
          const exercises = exerciseData.result;

          const practiceQuestions = Array.isArray(exercises) ? exercises.map((q: any) => ({
            id: q.question_id || 'q_' + Math.random().toString(36).substring(7),
            type: q.type || 'multiple_choice',
            difficulty: q.difficulty || 'medium',
            question: q.question_text || q.question || '',
            question_text: q.question_text || q.question || '',
            options: q.options || undefined,
            correctAnswer: q.correct_answer || '',
            explanation: q.explanation || '',
            hint: q.hint || ''
          })) : [];

          const finalLesson: LessonContent = {
            id: 'parsed_' + Math.random().toString(36).substring(7),
            title: title,
            warmUp: {
              story: lessonResult.warm_up?.story || `Chào mừng con đến với bài học ${title}!`,
              question: lessonResult.warm_up?.question || 'Sẵn sàng chưa con?',
              options: lessonResult.warm_up?.options || (subject === 'Toán' ? ['2 quả', '3 quả', '4 quả', '5 quả'] : 
                        subject === 'Tiếng Việt' ? ['Viết thư', 'Thế giới', 'Gõ kiến', 'Diệu kỳ'] : 
                        subject === 'Khoa học' ? ['Miệng', 'Thực quản', 'Dạ dày', 'Ruột non'] : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'])
            },
            explanation: {
              mainContent: lessonResult.knowledge_explanation?.main_content || '',
              visualHint: lessonResult.knowledge_explanation?.visual_hint || ''
            },
            examples: Array.isArray(lessonResult.examples) ? lessonResult.examples.map((ex: any) => ({
              problem: ex.problem || '',
              solutionSteps: ex.solution_steps || [],
              answer: ex.answer || ''
            })) : [{ problem: 'Ví dụ mẫu.', solutionSteps: ['Bước 1: Giải'], answer: 'Đáp án' }],
            application: {
              realWorldConnection: lessonResult.application?.real_world_connection || '',
              challengeQuestion: lessonResult.application?.challenge_question || ''
            },
            practice: practiceQuestions
          };

          newCacheEntries[cacheKey] = finalLesson;

          generatedModerations.push({
            id: 'mod-' + Math.random().toString(36).substring(7),
            subject: subject,
            grade: parseGrade,
            title: title,
            status: 'pending' as const,
            schoolYear: parseSchoolYear,
            content: finalLesson
          });
        }
      }

      if (Object.keys(newCacheEntries).length > 0) {
        saveLessonCache({ ...lessonCache, ...newCacheEntries });
      }

      setModerationList(prev => [
        ...generatedModerations,
        ...prev
      ]);

      alert(`Hoàn thành tạo giáo án toàn bộ các môn học Khối ${parseGrade}! 🚀\n- Đã soạn mới: ${totalLessonsGenerated} bài.\n- Đã tiết kiệm token (tải từ bộ nhớ đệm): ${totalTokensSaved} bài.`);
    } catch (e: any) {
      console.error(e);
      alert(`Gặp lỗi trong quá trình tạo giáo án tự động: ${e.message}`);
    } finally {
      setIsBulkGenerating(false);
      setIsParsing(false);
    }
  };

  const handleStartParse = async () => {
    setIsParsing(true);
    setParseProgress(`AI Agent: Khởi tạo tiến trình trích xuất mục lục & soạn bài học tự động...`);

    const aiConfig = {
      aiProvider: teacherSettings.aiProvider || 'gemini',
      customApiKey: teacherSettings.geminiKey || '',
      openaiKey: teacherSettings.openaiKey || '',
      openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
      openaiModel: teacherSettings.openaiModel || ''
    };

    try {
      // 1. Determine subjects to process
      const gradeSubjects = subjects.filter(s => s.grade === parseGrade);
      const standardList = gradeSubjects.length > 0 
        ? gradeSubjects.map(s => s.name)
        : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
      const subjectsToProcess = parseSubject === 'Tất cả' 
        ? standardList
        : [parseSubject];

      let allLessonsToGenerate: { subject: string; title: string; startPage: number; endPage: number }[] = [];

      // If we already have selected lessons in the checklist, prioritize them
      if ((parseMethod === 'vietjack' || parseMethod === 'pdf') && selectedLessons.length > 0) {
        selectedLessons.forEach(lesson => {
          let actualSubject = parseSubject;
          let cleanTitle = lesson.title;
          if (parseSubject === 'Tất cả') {
            const match = lesson.title.match(/^\[([^\]]+)\]\s*(.*)$/);
            if (match) {
              actualSubject = match[1];
              cleanTitle = match[2];
            }
          }
          allLessonsToGenerate.push({
            subject: actualSubject,
            title: cleanTitle,
            startPage: lesson.startPage,
            endPage: lesson.endPage
          });
        });
      } else if (parseMethod === 'vietjack' || parseMethod === 'pdf') {
        // Fetch/Scan TOC for each subject and save to DB
        for (const subj of subjectsToProcess) {
        setParseProgress(`Đang chuẩn bị mục lục cho môn ${subj}...`);
        let subLessons: ExtractedLesson[] = [];

        if (parseMethod === 'vietjack') {
          const cacheKey = `es_toc_cache_vietjack_${subj}_${parseGrade}_${selectedBookSeries}`;
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              subLessons = JSON.parse(cached);
            } catch (e) {
              console.error("Cache corrupted");
            }
          }

          if (subLessons.length === 0 || ignoreOldData) {
            setParseProgress(`AI đang tạo Mục lục môn ${subj}...`);
            try {
              const response = await fetchWithRetry('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  agent: 'curriculum',
                  prompt: `Hãy phân tích và liệt kê TOÀN BỘ danh sách tất cả các bài học (Mục lục) chính thức cho bộ sách "${selectedBookSeries}", môn học "${subj}" lớp "${parseGrade}" tiểu học Việt Nam năm học "${parseSchoolYear}". Hãy đảm bảo dữ liệu bám sát chương trình chuẩn của sách giáo khoa KNTT/VietJack thực tế.
LƯU Ý QUAN TRỌNG: Bạn phải liệt kê đầy đủ toàn bộ tất cả các bài học từ bài đầu tiên đến bài cuối cùng của cả học kì 1 và học kì 2 (thường có từ 30 đến 70 bài tùy môn). Tuyệt đối không được bỏ sót, viết tắt hoặc tóm tắt nửa chừng.
                  
        TRẢ VỀ ĐỊNH DẠNG JSON CHÍNH XÁC NHƯ SAU:
        {
          "lessons": [
            {
              "title": "Tên bài học",
              "startPage": 5,
              "endPage": 10
            }
          ]
        }`,
                  aiProvider: aiConfig.aiProvider,
                  customApiKey: aiConfig.customApiKey,
                  openaiKey: aiConfig.openaiKey,
                  openaiBaseUrl: aiConfig.openaiBaseUrl,
                  openaiModel: aiConfig.openaiModel,
                  subject: subj
                })
              });

              if (response.ok) {
                const data = await response.json();
                const result = data.result;
                if (result && Array.isArray(result.lessons)) {
                  subLessons = result.lessons;
                } else if (Array.isArray(result)) {
                  subLessons = result;
                }
              }
            } catch (err) {
              console.error(`Lỗi lấy mục lục AI cho môn ${subj}:`, err);
            }

            if (subLessons.length === 0) {
              const preset = getVietJackPreset(subj, parseGrade, selectedBookSeries);
              subLessons = preset.lessons;
            }
          }

          // Save to local storage & LocalDB
          localStorage.setItem(cacheKey, JSON.stringify(subLessons));
          await localDB.set(cacheKey, JSON.stringify(subLessons));

          // Save/Sync to Supabase textbooks table
          if (isOnline) {
            const tbId = `tb_vietjack_${subj}_${parseGrade}_${selectedBookSeries.replace(/\s+/g, '_')}`;
            const tbData = {
              id: tbId,
              name: `Mục lục ${selectedBookSeries} - ${subj}`,
              subject: subj,
              grade: parseGrade,
              school_year: parseSchoolYear,
              status: 'active',
              size: `${subLessons.length} bài học`,
              file_base64: JSON.stringify(subLessons)
            };
            try {
              await supabase.from('textbooks').upsert(tbData);
            } catch (supErr) {
              console.warn("Failed to sync textbooks/TOC to Supabase, continuing locally:", supErr);
            }
          }
        } else if (parseMethod === 'pdf') {
          if (pdfFile) {
            const cacheKey = `es_toc_cache_${subj}_${parseGrade}_${pdfFile}`;
            let cached = localStorage.getItem(cacheKey);
            if (!cached) {
              cached = (await localDB.get<string>(cacheKey)) || null;
            }
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                subLessons = parsed.map((item: any) => typeof item === 'string' ? { title: item, startPage: 1, endPage: 10 } : item);
              } catch (e) {
                console.error("Cache corrupted");
              }
            }
          }
        } else {
          // Topic/custom method
          if (!parseLessonTitle.trim()) {
            alert('Vui lòng nhập tên bài học hoặc chủ đề mong muốn!');
            setIsParsing(false);
            return;
          }
          subLessons = [{ title: parseLessonTitle.trim(), startPage: 1, endPage: 20 }];
        }

        subLessons.forEach(lesson => {
          allLessonsToGenerate.push({
            subject: subj,
            title: lesson.title,
            startPage: lesson.startPage,
            endPage: lesson.endPage
          });
        });
      }
    }

      if (allLessonsToGenerate.length === 0) {
        alert('Không tìm thấy hoặc chưa quét mục lục bài học nào để bắt đầu!');
        setIsParsing(false);
        return;
      }

      setParseProgress(`Đã lấy mục lục thành công. Bắt đầu biên soạn ${allLessonsToGenerate.length} bài học tuần tự...`);

      const generatedModerations: any[] = [];
      const newCacheEntries: Record<string, LessonContent> = {};

      // 3. Generate all lessons sequentially
      for (let idx = 0; idx < allLessonsToGenerate.length; idx++) {
        const item = allLessonsToGenerate[idx];
        const subject = item.subject;
        const title = item.title;
        const cacheKey = `${subject}_${parseGrade}_${title}`;

        setParseProgress(`Đang biên soạn bài ${idx + 1}/${allLessonsToGenerate.length}: "${title}" (Môn ${subject})...`);

        if (lessonCache[cacheKey] && !ignoreOldData) {
          const cachedLesson = lessonCache[cacheKey];
          const alreadyInMod = moderationList.some(m => m.title === title && m.subject === subject && m.grade === parseGrade);
          if (!alreadyInMod) {
            const newMod = {
              id: 'mod-' + Math.random().toString(36).substring(7),
              subject: subject,
              grade: parseGrade,
              title: title,
              status: 'pending' as const,
              schoolYear: parseSchoolYear,
              content: cachedLesson
            };
            generatedModerations.push(newMod);

            if (isOnline) {
              try {
                await supabase.from('moderation_list').upsert({
                  id: newMod.id,
                  subject: newMod.subject,
                  grade: newMod.grade,
                  title: newMod.title,
                  status: newMod.status,
                  school_year: newMod.schoolYear,
                  content: newMod.content
                });
              } catch (supErr) {
                console.warn("Failed to sync cached moderation list to Supabase, continuing locally:", supErr);
              }
            }
          }
          continue;
        }

        let slicedData = undefined;
        if (parseMethod === 'pdf' && pdfBase64) {
          slicedData = await slicePdfBase64(pdfBase64, item.startPage, item.endPage);
        }

        const lessonRes = await fetchWithRetry('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: 'lesson',
            prompt: `Môn học: ${subject}, Khối lớp: ${parseGrade}, Chủ đề bài học: "${title}". Hãy sử dụng tệp sách giáo khoa đính kèm để biên soạn chính xác nội dung bài học này.`,
            aiProvider: aiConfig.aiProvider,
            customApiKey: aiConfig.customApiKey,
            openaiKey: aiConfig.openaiKey,
            openaiBaseUrl: aiConfig.openaiBaseUrl,
            openaiModel: aiConfig.openaiModel,
            subject: subject,
            inlineData: slicedData ? {
              mimeType: "application/pdf",
              data: slicedData
            } : undefined
          })
        });

        if (!lessonRes.ok) {
          if (lessonRes.status === 429) throw new Error(`Quá tải API (429) khi tạo bài "${title}". Vui lòng đợi 1 phút.`);
          if (lessonRes.status === 503 || lessonRes.statusText.includes('Service Unavailable')) throw new Error(`Hệ thống AI đang quá tải (503) khi tạo bài "${title}". Vui lòng thử lại sau vài phút.`);
          throw new Error(`Lỗi tạo bài giảng (HTTP ${lessonRes.status}) cho "${title}": ${lessonRes.statusText}`);
        }

        const lessonData = await lessonRes.json();
        const lessonResult = lessonData.result;

        const exerciseRes = await fetchWithRetry('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agent: 'exercise',
            prompt: `Môn học: ${subject}, Khối lớp: ${parseGrade}, Chủ đề bài học: "${title}". Dựa trên nội dung sau: ${JSON.stringify(lessonResult)}`,
            aiProvider: aiConfig.aiProvider,
            customApiKey: aiConfig.customApiKey,
            openaiKey: aiConfig.openaiKey,
            openaiBaseUrl: aiConfig.openaiBaseUrl,
            openaiModel: aiConfig.openaiModel,
            subject: subject
          })
        });

        if (!exerciseRes.ok) {
          if (exerciseRes.status === 429) throw new Error(`Quá tải API (429) khi tạo bài tập "${title}". Vui lòng đợi 1 phút.`);
          if (exerciseRes.status === 503 || exerciseRes.statusText.includes('Service Unavailable')) throw new Error(`Hệ thống AI đang quá tải (503) khi tạo bài tập "${title}". Vui lòng thử lại sau vài phút.`);
          throw new Error(`Lỗi tạo bài tập (HTTP ${exerciseRes.status}) cho "${title}": ${exerciseRes.statusText}`);
        }

        const exerciseData = await exerciseRes.json();
        const exercises = exerciseData.result;

        const practiceQuestions = Array.isArray(exercises) ? exercises.map((q: any) => ({
          id: q.question_id || 'q_' + Math.random().toString(36).substring(7),
          type: q.type || 'multiple_choice',
          difficulty: q.difficulty || 'medium',
          question: q.question_text || q.question || '',
          question_text: q.question_text || q.question || '',
          options: q.options || undefined,
          correctAnswer: q.correct_answer || '',
          explanation: q.explanation || '',
          hint: q.hint || ''
        })) : [];

        const finalLesson: LessonContent = {
          id: 'parsed_' + Math.random().toString(36).substring(7),
          title: title,
          warmUp: {
            story: lessonResult.warm_up?.story || `Chào mừng con đến với bài học ${title}!`,
            question: lessonResult.warm_up?.question || 'Sẵn sàng chưa con?',
            options: lessonResult.warm_up?.options || (subject === 'Toán' ? ['2 quả', '3 quả', '4 quả', '5 quả'] : 
                      subject === 'Tiếng Việt' ? ['Viết thư', 'Thế giới', 'Gõ kiến', 'Diệu kỳ'] : 
                      subject === 'Khoa học' ? ['Miệng', 'Thực quản', 'Dạ dày', 'Ruột non'] : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'])
          },
          explanation: {
            mainContent: lessonResult.knowledge_explanation?.main_content || '',
            visualHint: lessonResult.knowledge_explanation?.visual_hint || ''
          },
          examples: Array.isArray(lessonResult.examples) ? lessonResult.examples.map((ex: any) => ({
            problem: ex.problem || '',
            solutionSteps: ex.solution_steps || [],
            answer: ex.answer || ''
          })) : [{ problem: 'Ví dụ mẫu.', solutionSteps: ['Bước 1: Giải'], answer: 'Đáp án' }],
          application: {
            realWorldConnection: lessonResult.application?.real_world_connection || '',
            challengeQuestion: lessonResult.application?.challenge_question || ''
          },
          practice: practiceQuestions
        };

        newCacheEntries[cacheKey] = finalLesson;
        
        const newMod = {
          id: 'mod-' + Math.random().toString(36).substring(7),
          subject: subject,
          grade: parseGrade,
          title: title,
          status: 'pending' as const,
          schoolYear: parseSchoolYear,
          content: finalLesson
        };
        generatedModerations.push(newMod);

        // Sync generated lesson to Supabase immediately when online
        if (isOnline) {
          try {
            await supabase.from('moderation_list').upsert({
              id: newMod.id,
              subject: newMod.subject,
              grade: newMod.grade,
              title: newMod.title,
              status: newMod.status,
              school_year: newMod.schoolYear,
              content: newMod.content
            });
          } catch (supErr) {
            console.warn("Failed to sync new moderation list to Supabase, continuing locally:", supErr);
          }
        }
      }

      if (Object.keys(newCacheEntries).length > 0) {
        saveLessonCache({ ...lessonCache, ...newCacheEntries });
      }

      setModerationList(prev => [
        ...generatedModerations,
        ...prev
      ]);

      setPdfFile(null);
      setPdfBase64(null);
      setExtractedLessons([]);
      setActiveTab('moderation');
      alert(`Đã hoàn tất lấy mục lục, soạn giáo án và đồng bộ thành công lên Supabase!`);

    } catch (err: any) {
      console.error(err);
      alert(`Lỗi biên soạn giáo án AI: ${err.message || 'Lỗi kết nối API'}`);
    } finally {
      setIsParsing(false);
    }
  };

  // MODERATION STUDIO STATE
  const [editingModId, setEditingModId] = useState<string | null>(null);
  const [modTitle, setModTitle] = useState('');
  const [modWarmUpStory, setModWarmUpStory] = useState('');
  const [modWarmUpQuestion, setModWarmUpQuestion] = useState('');
  const [modWarmUpOptionsText, setModWarmUpOptionsText] = useState('');
  const [modExplanationContent, setModExplanationContent] = useState('');
  const [modExplanationVisualHint, setModExplanationVisualHint] = useState('');
  const [modExampleProblem, setModExampleProblem] = useState('');
  const [modExampleSolution, setModExampleSolution] = useState('');
  const [modExampleAnswer, setModExampleAnswer] = useState('');
  const [modApplicationConnection, setModApplicationConnection] = useState('');
  const [modApplicationChallenge, setModApplicationChallenge] = useState('');
  const [modPracticeQuestions, setModPracticeQuestions] = useState<any[]>([]);

  const handleStartEdit = (mod: typeof moderationList[0]) => {
    setEditingModId(mod.id);
    setModTitle(mod.content.title);
    setModWarmUpStory(mod.content.warmUp.story);
    setModWarmUpQuestion(mod.content.warmUp.question);
    setModWarmUpOptionsText(mod.content.warmUp.options?.join(', ') || '');
    setModExplanationContent(mod.content.explanation.mainContent);
    setModExplanationVisualHint(mod.content.explanation.visualHint || '');
    setModExampleProblem(mod.content.examples?.[0]?.problem || '');
    setModExampleSolution(mod.content.examples?.[0]?.solutionSteps?.join('\n') || '');
    setModExampleAnswer(mod.content.examples?.[0]?.answer || '');
    setModApplicationConnection(mod.content.application?.realWorldConnection || '');
    setModApplicationChallenge(mod.content.application?.challengeQuestion || '');
    setModPracticeQuestions(mod.content.practice || []);
  };

  const handleSaveEdit = (id: string) => {
    if (!modTitle.trim()) {
      alert('Tên chặng bài học không được để trống!');
      return;
    }
    const warmUpOptions = modWarmUpOptionsText.split(',').map(s => s.trim()).filter(Boolean);
    setModerationList(prev => prev.map(mod => {
      if (mod.id === id) {
        return {
          ...mod,
          title: modTitle.trim(),
          content: {
            ...mod.content,
            title: modTitle.trim(),
            warmUp: {
              ...mod.content.warmUp,
              story: modWarmUpStory,
              question: modWarmUpQuestion,
              options: warmUpOptions
            },
            explanation: {
              ...mod.content.explanation,
              mainContent: modExplanationContent,
              visualHint: modExplanationVisualHint
            },
            examples: [
              {
                problem: modExampleProblem,
                solutionSteps: modExampleSolution.split('\n').filter(line => line.trim()),
                answer: modExampleAnswer
              }
            ],
            application: {
              realWorldConnection: modApplicationConnection,
              challengeQuestion: modApplicationChallenge
            },
            practice: modPracticeQuestions
          }
        };
      }
      return mod;
    }));
    setEditingModId(null);
  };

  const handleApproveContent = (modId: string) => {
    const modItem = moderationList.find(m => m.id === modId);
    if (!modItem) return;
    
    const finalTitleToCheck = editingModId === modId ? modTitle : modItem.title;
    if (!finalTitleToCheck.trim()) {
      alert('Vui lòng nhập tên chặng bài học trước khi duyệt!');
      return;
    }

    const warmUpOptions = modWarmUpOptionsText.split(',').map(s => s.trim()).filter(Boolean);

    setModerationList(prev => prev.map(mod => {
      if (mod.id === modId) {
        return {
          ...mod,
          title: finalTitleToCheck.trim(),
          status: 'approved' as const,
          content: editingModId === modId ? {
            ...mod.content,
            title: finalTitleToCheck.trim(),
            warmUp: {
              ...mod.content.warmUp,
              story: modWarmUpStory,
              question: modWarmUpQuestion,
              options: warmUpOptions
            },
            explanation: {
              ...mod.content.explanation,
              mainContent: modExplanationContent,
              visualHint: modExplanationVisualHint
            },
            examples: [
              {
                problem: modExampleProblem,
                solutionSteps: modExampleSolution.split('\n').filter(line => line.trim()),
                answer: modExampleAnswer
              }
            ],
            application: {
              realWorldConnection: modApplicationConnection,
              challengeQuestion: modApplicationChallenge
            },
            practice: modPracticeQuestions
          } : mod.content
        };
      }
      return mod;
    }));
    setEditingModId(null);
    alert(`Đã phê duyệt giáo án bài "${finalTitleToCheck.trim()}" thành công! Học sinh hiện đã có thể học chặng này trên Bản đồ.`);
  };

  const handleUnapproveContent = (modId: string) => {
    setModerationList(prev => prev.map(m => {
      if (m.id === modId) {
        return { ...m, status: 'pending' as const };
      }
      return m;
    }));
    setEditingModId(null);
    alert('Đã huỷ duyệt bài học thành công! Bài học hiện đã chuyển lại trạng thái chờ duyệt.');
  };

  const handleDeleteContent = (modId: string) => {
    const modItem = moderationList.find(m => m.id === modId);
    if (!modItem) return;

    if (confirm(`Bạn có chắc chắn muốn rút bài học "${modItem.title}" khỏi danh sách kiểm duyệt? (Dữ liệu bài học đã tạo vẫn được giữ lại ở trạng thái chưa duyệt).`)) {
      // Remove from moderation list
      setModerationList(prev => prev.filter(m => m.id !== modId));

      if (editingModId === modId) {
        setEditingModId(null);
      }
      setSelectedModIds(prev => prev.filter(id => id !== modId));
      alert('Đã rút bài giảng khỏi danh sách kiểm duyệt thành công!');
    }
  };

  // CLASS HEATMAP & ALERTS STATE
  const getStudentSubjectAverage = (studentName: string, subjectName: string, defaultScore: number) => {
    const progress = progressMap[studentName];
    if (!progress || !progress.roadmaps) return defaultScore;
    
    let sum = 0;
    let count = 0;
    
    const subjectMap: Record<string, string> = {
      'Toán': 'Toán',
      'T.Việt': 'Tiếng Việt',
      'Eng': 'Ngoại ngữ 1',
      'K.Học': 'Khoa học',
      'Lịch Sử': 'Lịch sử và Địa lí'
    };
    
    const storeSubject = subjectMap[subjectName] || subjectName;

    progress.roadmaps.forEach(r => {
      if (r.stages) {
        r.stages.forEach(s => {
          if (s.subject === storeSubject && s.status === 'completed') {
            sum += s.score !== undefined ? s.score : 85;
            count++;
          }
        });
      }
    });
    
    return count > 0 ? Math.round(sum / count) : defaultScore;
  };

  const filteredStudentsForHeatmap = users.filter(u => {
    if (u.role !== 'student') return false;
    if (heatmapYear !== 'all' && u.schoolYear !== heatmapYear) return false;
    if (heatmapGrade !== 'all' && String(u.grade) !== heatmapGrade) return false;
    if (heatmapClassId !== 'all' && u.classId !== heatmapClassId) return false;
    return true;
  });

  const getStudentSubjectCompletion = (studentName: string, subjectName: string) => {
    const progress = progressMap[studentName];
    if (!progress || !progress.roadmaps) return 0;
    
    let total = 0;
    let completed = 0;
    
    const subjectMap: Record<string, string> = {
      'Toán': 'Toán',
      'T.Việt': 'Tiếng Việt',
      'Tiếng Việt': 'Tiếng Việt',
      'Eng': 'Ngoại ngữ 1',
      'Ngoại ngữ 1': 'Ngoại ngữ 1',
      'K.Học': 'Khoa học',
      'Khoa học': 'Khoa học',
      'Lịch Sử': 'Lịch sử và Địa lí',
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

  const studentsMock = filteredStudentsForHeatmap.map(student => {
    const classGrade = assignedClass?.grade || 3;
    const gradeSubjects = subjects.filter(s => s.grade === classGrade);
    const subjectList = gradeSubjects.length > 0 
      ? gradeSubjects.map(s => s.name)
      : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí'];
    const demoStudentUser = users.find(u => u.email === 'han.lng@edusmart.vn' || u.email === 'minh.nv@edusmart.vn');
    const demoStudentName = demoStudentUser ? demoStudentUser.name : 'Lê Nguyễn Gia Hân';

    const originalScores: Record<string, { math: number, reading: number, english: number, science: number, history: number, status: string }> = {
      'Lê Nguyễn Gia Hân': { math: 95, reading: 92, english: 98, science: 90, history: 94, status: 'normal' },
      'Nguyễn Văn Minh': { math: 92, reading: 88, english: 95, science: 85, history: 90, status: 'normal' },
      'Trần Thu Trang': { math: 88, reading: 94, english: 92, science: 90, history: 85, status: 'normal' },
      'Phạm Hải Nam': { math: 45, reading: 70, english: 60, science: 50, history: 55, status: 'warning' },
      'Lê Thùy Linh': { math: 95, reading: 96, english: 98, science: 92, history: 95, status: 'normal' },
      'Đỗ Hoàng Anh': { math: 75, reading: 65, english: 70, science: 80, history: 72, status: 'normal' }
    };

    const scores = originalScores[student.name] || {
      math: 80 + (student.name.charCodeAt(0) % 16),
      reading: 80 + (student.name.charCodeAt(1) % 16),
      english: 80 + (student.name.charCodeAt(2) % 16),
      science: 80 + (student.name.charCodeAt(3) % 16),
      history: 80 + (student.name.charCodeAt(4) % 16),
      status: 'normal'
    };

    const subjectProgressList = subjectList.map(sub => {
      let defaultScore = 80;
      if (sub === 'Toán') defaultScore = scores.math;
      if (sub === 'Tiếng Việt' || sub === 'T.Việt') defaultScore = scores.reading;
      if (sub === 'Ngoại ngữ 1' || sub === 'Eng') defaultScore = scores.english;
      if (sub === 'Khoa học' || sub === 'K.Học') defaultScore = scores.science;
      if (sub === 'Lịch sử và Địa lí' || sub === 'Lịch Sử') defaultScore = scores.history;

      const averageScore = getStudentSubjectAverage(student.name, sub, defaultScore);
      const completionRate = getStudentSubjectCompletion(student.name, sub);

      return {
        subject: sub,
        averageScore,
        completionRate
      };
    });

    const isWarning = subjectProgressList.some(sp => sp.averageScore < 60 || sp.completionRate < 30);
    const status = isWarning ? 'warning' : scores.status;

    return {
      name: student.name,
      math: subjectProgressList.find(sp => sp.subject === 'Toán')?.averageScore || 80,
      reading: subjectProgressList.find(sp => sp.subject === 'Tiếng Việt')?.averageScore || 80,
      english: subjectProgressList.find(sp => sp.subject === 'Ngoại ngữ 1')?.averageScore || 80,
      science: subjectProgressList.find(sp => sp.subject === 'Khoa học')?.averageScore || 80,
      history: subjectProgressList.find(sp => sp.subject === 'Lịch sử và Địa lí')?.averageScore || 80,
      subjects: subjectProgressList,
      status
    };
  });

  const handleEvaluateWarnings = async () => {
    setIsEvaluatingWarnings(true);
    try {
      const aiConfig = {
        aiProvider: teacherSettings.aiProvider || 'gemini',
        customApiKey: teacherSettings.geminiKey || '',
        openaiKey: teacherSettings.openaiKey || '',
        openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
        openaiModel: teacherSettings.openaiModel || ''
      };

      const prompt = `Dưới đây là bảng dữ liệu học tập của học sinh lớp ${className} gồm tên, điểm số trung bình các môn học và tỷ lệ hoàn thành chặng học (%):
${JSON.stringify(studentsMock)}

Hãy phân tích và đưa ra các cảnh báo sớm (Early Warnings) cho những học sinh có điểm trung bình môn học thấp (< 60), tỷ lệ hoàn thành chặng học chậm (< 30%), hoặc có biểu hiện sút giảm rõ rệt.
Trả về định dạng JSON chính xác theo cấu trúc sau (không bọc markdown, chỉ trả về JSON cấu trúc thô):
{
  "warnings": [
    {
      "student": "Họ và tên học sinh",
      "reason": "Lý do cảnh báo cụ thể, ngắn gọn (ví dụ: Điểm Toán thấp (45%) và hoàn thành lộ trình chậm (15%))",
      "action": "Khuyến nghị hành động thiết thực giúp giáo viên hỗ trợ kịp thời học sinh"
    }
  ]
}`;

      const res = await fetchWithRetry('/api/ai', {
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
      
      if (result && Array.isArray(result.warnings)) {
        setAiEarlyWarnings(result.warnings);
        await localDB.set('es_early_warnings', JSON.stringify(result.warnings));
        alert('Đã cập nhật cảnh báo sớm bằng AI dựa trên bảng điểm mới nhất! 🤖');
      } else {
        alert('AI không trả về cấu trúc cảnh báo hợp lệ. Vui lòng thử lại.');
      }
    } catch (e: any) {
      console.error(e);
      alert(`Không thể đánh giá lại bằng AI: ${e.message || 'Lỗi kết nối API'}`);
    } finally {
      setIsEvaluatingWarnings(false);
    }
  };

  const visibleStudentNames = new Set(filteredStudentsForHeatmap.map(s => s.name));
  const earlyWarnings = aiEarlyWarnings.filter(w => visibleStudentNames.has(w.student));

  const getHeatmapColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 75) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 60) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
  };


  // Get textbook and approved lessons matching current timeline filters
  const getAvailableLessonsForTimeline = () => {
    const list: Array<{ subject: string; title: string; lessonId?: string }> = [];
    const normalizeYear = (year: string) => year.replace(/\s+/g, '');

    // Approved lessons from moderation
    moderationList
      .filter(m => m.grade === timelineGrade && m.status === 'approved' && (!m.schoolYear || normalizeYear(m.schoolYear) === normalizeYear(timelineSchoolYear)))
      .forEach(m => {
        list.push({ subject: m.subject, title: m.title, lessonId: m.content.id });
      });

    return list.sort(sortLessons);
  };

  const timelineAvailableLessons = getAvailableLessonsForTimeline();

  return (
    <div className="space-y-6">
      
      {/* Teacher Header Banner */}
      <div className="p-6 bg-gradient-to-r from-teal-500 via-emerald-500 to-emerald-600 rounded-3xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 rounded-full border-4 border-white/60 bg-white flex items-center justify-center text-3xl shadow">
            👩‍🏫
          </div>
          <div>
            <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Giáo Viên</span>
            <h1 className="text-2xl font-black font-display tracking-tight mt-0.5">Cô giáo {teacherName}</h1>
            <p className="text-xs font-semibold opacity-90">{className} | Trường Tiểu học EduSmart</p>
          </div>
        </div>

        {/* Sync & Connectivity Dashboard */}
        <div className="flex flex-col items-end gap-1.5 bg-white/10 p-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span>{isOnline ? 'Hệ thống trực tuyến' : 'Chế độ Ngoại tuyến'}</span>
          </div>
          <span className="text-[10px] opacity-80">Bộ nhớ đệm: {syncQueue.length} bản ghi chưa đồng bộ</span>
          {syncQueue.length > 0 && (
            <button 
              onClick={clearSyncQueue}
              className="text-[9px] font-black underline bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 cursor-pointer"
            >
              Làm sạch hàng chờ
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu Navigation - New Re-ordered tabs */}
      <div className="flex flex-wrap gap-2 bg-white/40 p-2 rounded-2xl border border-slate-200/50">
        <button 
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'pdf' ? 'bg-emerald-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Upload className="w-4 h-4" />
          Tạo bài học AI PDF
        </button>
        <button 
          onClick={() => setActiveTab('moderation')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
            activeTab === 'moderation' ? 'bg-emerald-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Kiểm duyệt bài học
          {moderationList.some(m => m.status === 'pending') && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'timeline' ? 'bg-emerald-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Thiết kế lộ trình
        </button>
        <button 
          onClick={() => setActiveTab('heatmap')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'heatmap' ? 'bg-emerald-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Activity className="w-4 h-4" />
          Bản đồ nhiệt lớp
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-3 text-center rounded-xl font-extrabold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-emerald-600 text-white shadow' : 'bg-white hover:bg-slate-50 text-slate-600'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Cấu hình API Key
        </button>
      </div>

      {/* Main Tab Panel Content */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 bg-white/80">
        
        {/* TIMELINE BUILDER TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 font-display">Timeline Course Builder (Trộn môn liên kết)</h3>
                <p className="text-xs font-semibold text-slate-500">Giáo viên kéo thả thiết lập các chặng học của các môn theo khối lớp và năm học.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Combined Filters & Create New Roadmap Section */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                {/* Year Selector */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Năm học</label>
                  <select 
                    value={timelineSchoolYear}
                    onChange={(e) => setTimelineSchoolYear(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="2024-2025">2024-2025</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2026-2027">2026-2027</option>
                  </select>
                </div>

                {/* Grade Selector */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Khối lớp</label>
                  <select 
                    value={timelineGrade}
                    onChange={(e) => setTimelineGrade(Number(e.target.value))}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>

                <div className="h-8 w-px bg-slate-200 self-end mx-1 hidden lg:block" />

                {/* Create New Roadmap Section */}
                <div className="flex gap-2 items-center flex-1 min-w-[300px]">
                  <input 
                    type="text" 
                    value={newRoadmapTitle}
                    onChange={(e) => setNewRoadmapTitle(e.target.value)}
                    placeholder="Nhập tên chủ đề (để trống để AI tự đặt)..." 
                    className="flex-1 min-w-[180px] bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 shrink-0 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750">
                    <span className="text-[10px] uppercase font-black text-slate-400">Số bài tối đa:</span>
                    <input 
                      type="number" 
                      min={1} 
                      max={50}
                      value={newRoadmapMaxLessons}
                      onChange={(e) => setNewRoadmapMaxLessons(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-10 text-center font-bold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleCreateNewRoadmap}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-755 hover:to-indigo-755 text-white rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                    Tạo lộ trình bằng AI
                  </button>
                </div>
              </div>

              {/* Danh sách Lộ trình học tập (Sắp xếp dưới lên / Mới nhất trước) */}
              {roadmaps.filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear)).length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Side: Danh sách Lộ trình học tập */}
                  <div className="lg:col-span-7 p-5 bg-slate-50/60 border border-slate-200/80 rounded-3xl space-y-3.5">
                    <div className="flex justify-between items-center gap-4 border-b border-slate-200/50 pb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-display">
                        Danh sách Lộ trình học tập (Khối {timelineGrade} - Năm học {timelineSchoolYear})
                      </span>
                      
                      <div className="flex items-center gap-3.5">
                        {/* Select All Checkbox */}
                        <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={
                              roadmaps.filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear)).length > 0 &&
                              roadmaps
                                .filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear))
                                .every(r => bulkSelectedRoadmapIds.includes(r.id))
                            }
                            onChange={(e) => {
                              const visible = roadmaps.filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear));
                              if (e.target.checked) {
                                setBulkSelectedRoadmapIds(Array.from(new Set([...bulkSelectedRoadmapIds, ...visible.map(r => r.id)])));
                              } else {
                                setBulkSelectedRoadmapIds(bulkSelectedRoadmapIds.filter(id => !visible.some(r => r.id === id)));
                              }
                            }}
                            className="rounded text-emerald-655 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          Chọn tất cả
                        </label>

                        {/* Assigned Filter Dropdown */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Lọc theo:</span>
                          <select 
                            value={filterAssignedStatus}
                            onChange={(e: any) => setFilterAssignedStatus(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                          >
                            <option value="all">Tất cả lộ trình</option>
                            <option value="assigned">Đã gán lớp</option>
                            <option value="unassigned">Chưa gán lớp</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Vertical List Layout */}
                    <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-visible shadow-sm">
                      {roadmaps
                        .filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear))
                        .filter(r => {
                          if (filterAssignedStatus === 'assigned') return !!r.classId;
                          if (filterAssignedStatus === 'unassigned') return !r.classId;
                          return true;
                        })
                        .slice()
                        .reverse() // Sắp xếp dưới lên (Mới nhất trước)
                        .map(roadmap => {
                          const isSelected = roadmap.id === selectedRoadmapId;
                          const assignedClass = virtualClasses.find(c => c.id === roadmap.classId);
                          return (
                            <div 
                              key={roadmap.id}
                              onClick={() => setSelectedRoadmapId(roadmap.id)}
                              className={`p-3.5 flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-slate-50/50 ${
                                isSelected ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {/* Checkbox for bulk select */}
                                <input 
                                  type="checkbox"
                                  checked={bulkSelectedRoadmapIds.includes(roadmap.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setBulkSelectedRoadmapIds([...bulkSelectedRoadmapIds, roadmap.id]);
                                    } else {
                                      setBulkSelectedRoadmapIds(bulkSelectedRoadmapIds.filter(id => id !== roadmap.id));
                                    }
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                                />
                                
                                <div className="min-w-0 flex-1">
                                  {isEditingTitle && isSelected ? (
                                    <div className="flex gap-1.5 items-center">
                                      <input 
                                        type="text"
                                        value={editTitleText}
                                        onChange={(e) => setEditTitleText(e.target.value)}
                                        className="bg-white border border-emerald-450 rounded-xl px-3 py-1 text-xs font-bold text-slate-700 focus:outline-none w-full max-w-sm"
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRenameRoadmap();
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black shadow-xs shrink-0"
                                      >
                                        Lưu
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setIsEditingTitle(false);
                                        }}
                                        className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-black shrink-0"
                                      >
                                        Hủy
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <h4 className="text-xs font-extrabold text-slate-800 truncate">
                                        {roadmap.title}
                                      </h4>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                        Cấp độ: Khối {timelineGrade} • Năm học: {timelineSchoolYear}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                {/* Badges */}
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                  <span className="text-[9px] font-black text-slate-550 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-150">
                                    {roadmap.stages.length} chặng
                                  </span>
                                  {(() => {
                                    const roadmapClassIds = roadmap.classIds || (roadmap.classId ? [roadmap.classId] : []);
                                    const isUnassigning = unassigningRoadmapId === roadmap.id;
                                    const assignedClassNames = roadmapClassIds.map(cid => virtualClasses.find(c => c.id === cid)?.name || cid).filter(Boolean);
                                    const activeClasses = virtualClasses.filter(c => c.grade === timelineGrade && (!c.schoolYear || c.schoolYear === timelineSchoolYear));

                                    return (
                                      <div className="relative">
                                        <span 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setUnassigningRoadmapId(isUnassigning ? null : roadmap.id);
                                          }}
                                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 select-none ${
                                            assignedClassNames.length > 0 
                                              ? 'text-blue-800 bg-blue-50 hover:bg-blue-100 border-blue-100' 
                                              : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-100'
                                          }`}
                                          title="Click để quản lý gán lớp"
                                        >
                                          {assignedClassNames.length > 0 
                                            ? `Lớp: ${assignedClassNames.join(', ')}` 
                                            : 'Chưa gán lớp'}
                                        </span>

                                        {isUnassigning && (
                                          <div className="absolute right-0 top-6 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 z-20 min-w-[200px] text-left space-y-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                                              Quản lý gán lớp học:
                                            </span>
                                            <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                              {activeClasses.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 italic p-1">
                                                  Không có lớp học nào cho khối/năm học này.
                                                </div>
                                              ) : (
                                                activeClasses.map(cls => {
                                                  const isAssigned = roadmapClassIds.includes(cls.id);
                                                  return (
                                                    <label 
                                                      key={cls.id} 
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="flex items-center justify-between gap-3 text-xs bg-slate-50 hover:bg-slate-100/80 p-1.5 rounded-lg border border-slate-100 cursor-pointer select-none"
                                                    >
                                                      <span className="font-bold text-slate-700 truncate">{cls.name}</span>
                                                      <input
                                                        type="checkbox"
                                                        checked={isAssigned}
                                                        onChange={(e) => {
                                                          e.stopPropagation();
                                                          if (isAssigned) {
                                                            const nextIds = roadmapClassIds.filter(id => id !== cls.id);
                                                            updateRoadmap(roadmap.id, {
                                                              classIds: nextIds,
                                                              classId: nextIds[0] || ''
                                                            });
                                                          } else {
                                                            assignRoadmapToClass(roadmap.id, cls.id);
                                                          }
                                                        }}
                                                        className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                                      />
                                                    </label>
                                                  );
                                                })
                                              )}
                                            </div>
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setUnassigningRoadmapId(null);
                                              }}
                                              className="w-full text-center text-[10px] font-black text-slate-500 hover:text-slate-700 pt-1 border-t border-slate-100 cursor-pointer"
                                            >
                                              Đóng
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Actions (Delete, Rename) */}
                                <div className="flex gap-1.5 border-l border-slate-100 pl-3.5">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsEditingTitle(true);
                                      setEditTitleText(roadmap.title);
                                      setSelectedRoadmapId(roadmap.id);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-705 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
                                    title="Sửa tên lộ trình"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm('Bạn có chắc chắn muốn xóa lộ trình này không?')) {
                                        deleteRoadmap(roadmap.id);
                                        setSelectedRoadmapId(roadmaps[0]?.id || '');
                                        alert('Đã xóa lộ trình.');
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:text-red-705 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-all"
                                    title="Xóa lộ trình"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {roadmaps
                        .filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear))
                        .filter(r => {
                          if (filterAssignedStatus === 'assigned') return !!r.classId;
                          if (filterAssignedStatus === 'unassigned') return !r.classId;
                          return true;
                        }).length === 0 && (
                          <div className="p-6 text-center text-xs font-semibold text-slate-400">
                            Không tìm thấy lộ trình nào phù hợp bộ lọc trạng thái.
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Right Side: Gán nhanh lộ trình vào lớp học */}
                  <div className="lg:col-span-5 p-5 bg-slate-50/60 border border-slate-200/80 rounded-3xl space-y-3.5 self-start">
                    <div className="flex justify-between items-center gap-2 border-b border-slate-200/50 pb-2.5">
                      <h4 className="text-[11px] font-black text-slate-800 font-display uppercase tracking-wider flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-blue-650" />
                        Gán nhanh vào lớp học
                      </h4>
                      <select 
                        value={filterClassAssignedStatus}
                        onChange={(e: any) => setFilterClassAssignedStatus(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl px-2 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="all">Tất cả lớp</option>
                        <option value="assigned">Đã gán lộ trình</option>
                        <option value="unassigned">Chưa gán lộ trình</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-0.5">
                      <span>Đã chọn: <strong className="text-emerald-755 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{bulkSelectedRoadmapIds.length} lộ trình</strong></span>
                      <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-700">
                        <input 
                          type="checkbox"
                          checked={
                            virtualClasses
                              .filter(c => c.grade === timelineGrade && (!c.schoolYear || c.schoolYear === timelineSchoolYear))
                              .filter(cls => {
                                const isAssigned = roadmaps.some(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(cls.id));
                                if (filterClassAssignedStatus === 'assigned') return isAssigned;
                                if (filterClassAssignedStatus === 'unassigned') return !isAssigned;
                                return true;
                              }).length > 0 &&
                            virtualClasses
                              .filter(c => c.grade === timelineGrade && (!c.schoolYear || c.schoolYear === timelineSchoolYear))
                              .filter(cls => {
                                const isAssigned = roadmaps.some(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(cls.id));
                                if (filterClassAssignedStatus === 'assigned') return isAssigned;
                                if (filterClassAssignedStatus === 'unassigned') return !isAssigned;
                                return true;
                              })
                              .every(cls => bulkSelectedClassIds.includes(cls.id))
                          }
                          onChange={(e) => {
                            const visibleClasses = virtualClasses
                              .filter(c => c.grade === timelineGrade && (!c.schoolYear || c.schoolYear === timelineSchoolYear))
                              .filter(cls => {
                                const isAssigned = roadmaps.some(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(cls.id));
                                if (filterClassAssignedStatus === 'assigned') return isAssigned;
                                if (filterClassAssignedStatus === 'unassigned') return !isAssigned;
                                return true;
                              });
                            if (e.target.checked) {
                              setBulkSelectedClassIds(Array.from(new Set([...bulkSelectedClassIds, ...visibleClasses.map(c => c.id)])));
                            } else {
                              setBulkSelectedClassIds(bulkSelectedClassIds.filter(id => !visibleClasses.some(c => c.id === id)));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        Chọn tất cả lớp
                      </label>
                    </div>
                    
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase block font-display">
                        Chọn Lớp ảo nhận lộ trình (Khối {timelineGrade} - Năm học {timelineSchoolYear}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {virtualClasses
                          .filter(c => c.grade === timelineGrade && (!c.schoolYear || c.schoolYear === timelineSchoolYear))
                          .filter(cls => {
                            const isAssigned = roadmaps.some(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(cls.id));
                            if (filterClassAssignedStatus === 'assigned') return isAssigned;
                            if (filterClassAssignedStatus === 'unassigned') return !isAssigned;
                            return true;
                          })
                          .map(cls => {
                            const isChecked = bulkSelectedClassIds.includes(cls.id);
                            return (
                              <label 
                                key={cls.id}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                  isChecked 
                                    ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-sm scale-98' 
                                    : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setBulkSelectedClassIds([...bulkSelectedClassIds, cls.id]);
                                    } else {
                                      setBulkSelectedClassIds(bulkSelectedClassIds.filter(id => id !== cls.id));
                                    }
                                  }}
                                  className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                {cls.name} (Sĩ số: {cls.studentsCount})
                              </label>
                            );
                          })}
                        {virtualClasses
                          .filter(c => c.grade === timelineGrade && (!c.schoolYear || c.schoolYear === timelineSchoolYear))
                          .filter(cls => {
                            const isAssigned = roadmaps.some(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(cls.id));
                            if (filterClassAssignedStatus === 'assigned') return isAssigned;
                            if (filterClassAssignedStatus === 'unassigned') return !isAssigned;
                            return true;
                          }).length === 0 && (
                          <span className="text-xs text-slate-400 font-semibold italic">Không có lớp học ảo nào phù hợp bộ lọc.</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleBulkAssign}
                      disabled={bulkSelectedRoadmapIds.length === 0 || bulkSelectedClassIds.length === 0}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Gán {bulkSelectedRoadmapIds.length} lộ trình đã chọn cho {bulkSelectedClassIds.length} lớp
                    </button>
                  </div>
                </div>
              )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left side: Timeline Builder stages list */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Trình tự lộ trình hiện tại</span>

                <div className="space-y-3.5 max-w-xl py-2">
                  {roadmaps.filter(r => (!r.grade || r.grade === timelineGrade) && (!r.schoolYear || r.schoolYear === timelineSchoolYear)).length === 0 ? (
                    <div className="p-8 text-center bg-emerald-50/40 border-2 border-dashed border-emerald-250 rounded-3xl text-slate-600 space-y-4 shadow-sm">
                      <div className="text-4xl animate-bounce-slow">📚</div>
                      <h4 className="text-sm font-black text-slate-800 font-display">Chưa có lộ trình cho Khối {timelineGrade} - Năm học {timelineSchoolYear}</h4>
                      <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                        Hãy khởi tạo lộ trình học tập đầu tiên bằng cách tự động chọn tất cả bài học có sẵn trong sách giáo khoa và các bài giảng đã duyệt.
                      </p>
                      <button
                        onClick={handleCreateNewRoadmap}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-pulse" />
                        Bắt đầu lộ trình (Chọn tất cả bài học)
                      </button>
                    </div>
                  ) : tempStages.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 text-xs font-bold space-y-3 shadow-inner">
                      <p>Lộ trình hiện tại đang trống chặng học.</p>
                      <button
                        onClick={() => setActiveTab('pdf')}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 mx-auto"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
                        Tạo chặng bài học mới bằng AI / PDF
                      </button>
                    </div>
                  ) : (
                    tempStages.map((stage, idx) => (
                      <div key={stage.id} className="relative">
                        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-300 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center border border-slate-200 shadow-sm">
                              {idx + 1}
                            </span>
                            <div>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                stage.subject === 'Toán' ? 'bg-blue-100 text-blue-755' :
                                stage.subject === 'Tiếng Việt' ? 'bg-orange-100 text-orange-755' :
                                stage.subject === 'Ngoại ngữ 1' ? 'bg-indigo-100 text-indigo-755' :
                                stage.subject === 'Khoa học' ? 'bg-emerald-100 text-emerald-755' :
                                'bg-amber-100 text-amber-755'
                              }`}>
                                {stage.subject}
                              </span>
                              <h4 className="text-xs font-black text-slate-800 mt-1">{stage.title}</h4>
                            </div>
                          </div>

                          {/* Sorting & actions */}
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleMoveUp(idx)}
                              disabled={idx === 0}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-lg disabled:opacity-30 cursor-pointer text-xs"
                              title="Di chuyển lên"
                            >
                              ↑
                            </button>
                            <button 
                              onClick={() => handleMoveDown(idx)}
                              disabled={idx === tempStages.length - 1}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-655 rounded-lg disabled:opacity-30 cursor-pointer text-xs"
                              title="Di chuyển xuống"
                            >
                              ↓
                            </button>
                            <button 
                              onClick={() => handleRemoveStage(stage.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer"
                              title="Xóa chặng"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {idx < tempStages.length - 1 && (
                          <div className="w-0.5 h-3.5 bg-slate-200 mx-auto my-0.5 flex justify-center items-center">
                            <ArrowDown className="w-3 h-3 text-slate-300" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Save Timeline Action */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={handleSaveTimeline}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Lưu trình tự lộ trình
                  </button>
                </div>
              </div>

              {/* Right side: Lessons Bank from selected Grade & Year */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Ngân hàng bài học (Khối {timelineGrade})
                </span>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4 max-h-[480px] overflow-y-auto pr-1.5">
                  {timelineAvailableLessons.length === 0 ? (
                    <div className="p-4 text-center text-slate-450 text-xs font-bold leading-relaxed">
                      Không tìm thấy bài học nào. Hãy đăng tải SGK PDF trong tab "Tạo bài học AI PDF" trước.
                    </div>
                  ) : (
                    // Group available lessons by subject for clean display
                    (() => {
                      const gradeSubjects = subjects.filter(s => s.grade === timelineGrade);
                      return gradeSubjects.length > 0
                        ? Array.from(new Set(gradeSubjects.map(s => s.name)))
                        : ['Toán', 'Tiếng Việt', 'Khoa học', 'Ngoại ngữ 1', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
                    })().map(sub => {
                      const lessons = timelineAvailableLessons.filter(l => l.subject === sub);
                      if (lessons.length === 0) return null;
                      
                      return (
                        <div key={sub} className="space-y-1.5">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            sub === 'Toán' ? 'bg-blue-100 text-blue-700' :
                            sub === 'Tiếng Việt' ? 'bg-orange-100 text-orange-700' :
                            sub === 'Ngoại ngữ 1' ? 'bg-indigo-100 text-indigo-700' :
                            sub === 'Khoa học' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {sub}
                          </span>
                          <div className="space-y-1.5 pl-1.5 border-l-2 border-slate-200">
                            {lessons.map((lesson, lIdx) => (
                              <div 
                                key={lIdx} 
                                className="p-2 bg-white border border-slate-150 rounded-xl flex items-center justify-between text-xs hover:border-emerald-250 hover:shadow-xs transition-all"
                              >
                                <span className="font-bold text-slate-700 pr-2 leading-tight">{lesson.title}</span>
                                <button
                                  onClick={() => handleAddStageFromBank(sub, lesson.title, lesson.lessonId)}
                                  className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg cursor-pointer transition-all"
                                  title="Thêm vào chặng"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

        {/* AI PDF PARSER TAB */}
        {activeTab === 'pdf' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div>
              <h3 className="text-lg font-black text-slate-800 font-display">Bộ công cụ Thiết kế chặng học tập bằng AI</h3>
              <p className="text-xs font-semibold text-slate-500">Thiết kế chặng học bằng cách phân tích mục lục Sách giáo khoa PDF hoặc soạn giáo án theo chủ đề tự chọn.</p>
            </div>

            {/* Method Toggle Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/40">
              <button 
                type="button"
                onClick={() => setParseMethod('pdf')}
                className={`py-2 px-1 text-center rounded-xl font-extrabold text-[10px] sm:text-xs transition-all cursor-pointer ${
                  parseMethod === 'pdf' ? 'bg-white shadow text-slate-800 border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📁 SGK PDF
              </button>
              <button 
                type="button"
                onClick={() => setParseMethod('vietjack')}
                className={`py-2 px-1 text-center rounded-xl font-extrabold text-[10px] sm:text-xs transition-all cursor-pointer ${
                  parseMethod === 'vietjack' ? 'bg-white shadow text-emerald-700 border border-slate-200/50 scale-[1.01]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📚 VietJack Presets
              </button>
              <button 
                type="button"
                onClick={() => setParseMethod('topic')}
                className={`py-2 px-1 text-center rounded-xl font-extrabold text-[10px] sm:text-xs transition-all cursor-pointer ${
                  parseMethod === 'topic' ? 'bg-white shadow text-slate-800 border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                ✏️ Chủ đề tự chọn
              </button>
            </div>

            {/* Input fields */}
            <div className="space-y-4">
              {/* Filters for both methods */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 uppercase">Năm học tương ứng</label>
                  <select 
                    value={parseSchoolYear} 
                    onChange={(e: any) => setParseSchoolYear(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="2024-2025">2024 - 2025</option>
                    <option value="2025-2026">2025 - 2026</option>
                    <option value="2026-2027">2026 - 2027</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 uppercase">Khối lớp</label>
                  <select 
                    value={parseGrade} 
                    onChange={(e: any) => setParseGrade(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    <option value={1}>Khối 1</option>
                    <option value={2}>Khối 2</option>
                    <option value={3}>Khối 3</option>
                    <option value={4}>Khối 4</option>
                    <option value={5}>Khối 5</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 uppercase">Môn học tương ứng</label>
                  <select 
                    value={parseSubject} 
                    onChange={(e: any) => setParseSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {(() => {
                      const gradeSubjects = subjects.filter(s => s.grade === parseGrade);
                      const list = gradeSubjects.length > 0 
                        ? gradeSubjects.map(s => s.name)
                        : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
                      const fullList = ['Tất cả', ...list];
                      return fullList.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {parseMethod === 'vietjack' && (
                <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Sliders className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block font-display">
                      Bộ sách Giáo khoa Tiểu học (VietJack Presets)
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Kết nối tri thức */}
                    <button
                      type="button"
                      onClick={() => setSelectedBookSeries('Kết nối tri thức')}
                      className={`p-3 rounded-xl border text-left transition-all hover:shadow-xs relative ${
                        selectedBookSeries === 'Kết nối tri thức' 
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-400/20' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-extrabold text-slate-800">KNTT với cuộc sống</span>
                        <span className="bg-emerald-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Dạy & Học chính
                        </span>
                      </div>
                      <p className="text-[9px] font-semibold text-slate-500 mt-1 leading-relaxed">
                        Bộ sách chính thức cho chương trình dạy học EduSmart.
                      </p>
                    </button>

                    {/* Chân trời sáng tạo */}
                    <button
                      type="button"
                      onClick={() => setSelectedBookSeries('Chân trời sáng tạo')}
                      className={`p-3 rounded-xl border text-left transition-all hover:shadow-xs relative ${
                        selectedBookSeries === 'Chân trời sáng tạo' 
                          ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/20' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-extrabold text-slate-800">Chân trời sáng tạo</span>
                        <span className="bg-slate-400 text-white font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Tham khảo
                        </span>
                      </div>
                      <p className="text-[9px] font-semibold text-slate-500 mt-1 leading-relaxed">
                        Tài liệu học liệu tham khảo bổ trợ.
                      </p>
                    </button>

                    {/* Cánh diều */}
                    <button
                      type="button"
                      onClick={() => setSelectedBookSeries('Cánh diều')}
                      className={`p-3 rounded-xl border text-left transition-all hover:shadow-xs relative ${
                        selectedBookSeries === 'Cánh diều' 
                          ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/20' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs font-extrabold text-slate-800">Cánh diều</span>
                        <span className="bg-slate-400 text-white font-bold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Tham khảo
                        </span>
                      </div>
                      <p className="text-[9px] font-semibold text-slate-500 mt-1 leading-relaxed">
                        Tài liệu học liệu tham khảo bổ trợ.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {parseMethod === 'pdf' && (
                <div className="p-6 border-2 border-dashed border-emerald-300 rounded-3xl text-center bg-emerald-50/50 flex flex-col items-center justify-center gap-2.5">
                  <BookOpen className="w-8 h-8 text-emerald-500" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex gap-2">
                      <label className="bg-emerald-500 border border-emerald-600 rounded-xl px-4 py-2 text-xs font-black text-white shadow-sm cursor-pointer hover:bg-emerald-600 transition-all inline-block">
                        Chọn File PDF Sách Đầy Đủ
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={handlePdfUpload} 
                          className="hidden" 
                        />
                      </label>
                      <button 
                        onClick={() => setIsLibraryModalOpen(true)}
                        className="bg-white border border-emerald-300 text-emerald-700 rounded-xl px-4 py-2 text-xs font-black shadow-sm cursor-pointer hover:bg-emerald-50 transition-all inline-block"
                      >
                        Hoặc chọn từ Thư viện trường
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-600/70 mt-1.5">Tải lên toàn bộ cuốn sách để AI tự động quét Mục lục và soạn bài</p>
                  </div>
                  {pdfFile && (
                    <p className="text-xs font-black text-emerald-700 flex items-center gap-1 mt-2 bg-emerald-100 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      Đã nạp: {pdfFile}
                    </p>
                  )}
                </div>
              )}

              {/* Dynamic simulated SGK table of contents checklist (For PDF or VietJack methods) */}
              {((parseMethod === 'pdf' && pdfFile) || parseMethod === 'vietjack') && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">
                      {parseMethod === 'vietjack' 
                        ? `📚 Bài học mẫu Presets VietJack (${parseSubject} - Khối ${parseGrade} - Bộ sách: ${selectedBookSeries})`
                        : `📚 Phát hiện Mục lục SGK (${parseSubject} - Khối ${parseGrade})`
                      }
                    </span>
                    {isExtractingTOC && parseMethod === 'pdf' && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        AI đang đọc PDF...
                      </span>
                    )}
                  </div>
                  
                  {parseMethod === 'pdf' && (
                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 w-44">Trang 1 của Sách nằm ở trang PDF số:</span>
                        <input 
                          type="number" 
                          min={1}
                          max={50}
                          value={pageOneOffset}
                          onChange={(e) => setPageOneOffset(Number(e.target.value))}
                          className="w-16 px-2 py-1 text-sm font-bold border border-slate-300 rounded-lg text-center"
                        />
                        <span className="text-[10px] text-slate-450 italic">(Dùng để tính độ lệch trang)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 w-44">Trang kết thúc của Mục Lục:</span>
                        <input 
                          type="number" 
                          min={1}
                          max={100}
                          value={tocEndPage}
                          onChange={(e) => setTocEndPage(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-sm font-bold border border-slate-300 rounded-lg text-center"
                        />
                        <span className="text-[10px] text-slate-450 italic">(AI sẽ chỉ đọc đến trang này)</span>
                      </div>
                    </div>
                  )}

                  {isExtractingTOC && parseMethod === 'pdf' ? (
                    <div className="py-8 text-center text-xs font-bold text-slate-400 animate-pulse">
                      Đang phân tích cấu trúc trang mục lục của sách giáo khoa...
                    </div>
                  ) : (extractedLessons.length === 0 && parseMethod === 'pdf') ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2">
                      <p className="text-xs font-bold text-slate-450 text-center">Mục lục sách giáo khoa chưa được phân tích.</p>
                      <button
                        type="button"
                        onClick={() => handleExtractTOCFromPDF(pdfFile!)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-350 fill-yellow-350" />
                        Phát hiện Mục lục SGK bằng AI
                      </button>
                    </div>
                  ) : extractedLessons.length === 0 && parseMethod === 'vietjack' ? (
                    <div className="py-6 text-center text-xs font-bold text-slate-400">
                      Không tìm thấy dữ liệu mẫu cho cấu hình môn học này.
                    </div>
                  ) : (
                    <>
                      {parseMethod === 'pdf' && (
                        <div className="flex justify-end pb-1 border-b border-slate-100">
                          <button
                            type="button"
                            disabled={isExtractingTOC}
                            onClick={() => handleExtractTOCFromPDF(pdfFile!)}
                            className="text-[10px] font-black text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            Quét lại Mục lục (Bỏ qua Cache)
                          </button>
                        </div>
                      )}
                      {parseMethod === 'vietjack' && (
                        <div className="flex justify-end pb-1 border-b border-slate-100">
                          <button
                            type="button"
                            disabled={isExtractingTOC}
                            onClick={handleScanVietJackTOC}
                            className="text-[10px] font-black text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                            title="Yêu cầu AI Agent quét lại toàn bộ bài học và cập nhật mục lục mới nhất từ VietJack"
                          >
                            <RefreshCw className={`w-2.5 h-2.5 ${isExtractingTOC ? 'animate-spin' : ''}`} />
                            Quét lại Mục lục bằng AI (Bỏ qua Cache)
                          </button>
                        </div>
                      )}
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {extractedLessons.map((lesson: ExtractedLesson) => {
                          const isChecked = selectedLessons.some(l => l.title === lesson.title);
                          const cacheKey = `${parseSubject}_${parseGrade}_${lesson.title}`;
                          const isCached = !!lessonCache[cacheKey];
                          const isGenerating = !!lessonsGenerating[lesson.title];
                          const inModeration = moderationList.some(
                            m => m.title === lesson.title && m.subject === parseSubject && m.grade === parseGrade
                          );

                          return (
                            <div 
                              key={lesson.title} 
                              className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-150 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all"
                            >
                              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer flex-1">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedLessons(selectedLessons.filter(l => l.title !== lesson.title));
                                    } else {
                                      setSelectedLessons([...selectedLessons, lesson]);
                                    }
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <span className="leading-tight">
                                  {lesson.title}
                                  {parseMethod === 'pdf' && (
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                      (Trang {lesson.startPage} - {lesson.endPage})
                                    </span>
                                  )}
                                </span>
                              </label>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Cache Status Badge */}
                                {isGenerating ? (
                                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-0.5">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    Đang tạo...
                                  </span>
                                ) : inModeration ? (
                                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                    Đã đưa vào duyệt
                                  </span>
                                ) : isCached ? (
                                  <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                    Đã có dữ liệu
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-150">
                                    Chưa tạo
                                  </span>
                                )}

                                {/* Action Button */}
                                {isGenerating ? null : inModeration ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCachedLesson(lesson.title)}
                                    className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black transition-all cursor-pointer"
                                    title="Xóa khỏi danh sách duyệt và bộ nhớ tạm để tạo lại"
                                  >
                                    Xóa & Tải lại
                                  </button>
                                ) : isCached ? (
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleRestoreCachedLesson(lesson)}
                                      className="px-2 py-1 bg-indigo-55 text-indigo-650 hover:bg-indigo-500 hover:text-white rounded-lg text-[9px] font-black transition-all cursor-pointer"
                                      title="Đưa nội dung đã có trong bộ nhớ tạm vào danh sách kiểm duyệt"
                                    >
                                      Đưa vào duyệt
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCachedLesson(lesson.title)}
                                      className="px-1.5 py-1 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-[9px] font-black transition-all cursor-pointer"
                                      title="Xóa bộ nhớ tạm của bài học này"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={isGenerating}
                                    onClick={() => handleGenerateSingleLesson(lesson)}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg text-[9px] font-black transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    Tạo
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-3 pt-1 border-t border-slate-200/50 items-center justify-end">
                        <button 
                          type="button"
                          onClick={() => setSelectedLessons(extractedLessons)}
                          className="text-[10px] font-black text-emerald-600 hover:underline cursor-pointer"
                        >
                          Chọn tất cả bài học
                        </button>
                        <span className="text-slate-355 text-[10px]">|</span>
                        <button 
                          type="button"
                          onClick={() => setSelectedLessons([])}
                          className="text-[10px] font-black text-red-500 hover:underline cursor-pointer"
                        >
                          Bỏ chọn tất cả
                        </button>
                        <span className="text-slate-355 text-[10px]">|</span>
                        <button 
                          type="button"
                          onClick={handleRestoreSelectedLessons}
                          className="text-[10px] font-black text-indigo-600 hover:underline cursor-pointer"
                        >
                          Đưa vào duyệt các mục đã chọn
                        </button>
                        <span className="text-slate-355 text-[10px]">|</span>
                        {(parseMethod === 'pdf' || parseMethod === 'vietjack') && (
                          <>
                            <span className="text-slate-355 text-[10px]">|</span>
                            <button 
                              type="button"
                              onClick={handleSaveTOC}
                              className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                              title="Lưu mục lục này để sử dụng ở lần sau"
                            >
                              <Save className="w-3 h-3" />
                              Lưu mục lục
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Weekly Practice Worksheet List (Only for VietJack presets method) */}
              {parseMethod === 'vietjack' && (
                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block font-display flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      📝 Đề ôn tập cuối tuần (VietJack Presets)
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      Khối {parseGrade} • {selectedBookSeries}
                    </span>
                  </div>

                  {(() => {
                    const preset = getVietJackPreset(parseSubject, parseGrade, selectedBookSeries);
                    const weeklyPractice = preset?.weeklyPractice || [];

                    if (weeklyPractice.length === 0) {
                      return (
                        <div className="py-4 text-center text-xs font-semibold text-slate-400">
                          Không có bài tập cuối tuần định sẵn cho môn học này.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {weeklyPractice.map((week) => {
                          const cacheKey = `weekly_${parseSubject}_${parseGrade}_week${week.week}`;
                          const isCached = !!lessonCache[cacheKey];
                          const isGenerating = !!lessonsGenerating[cacheKey];

                          return (
                            <div 
                              key={week.week}
                              className="p-3 bg-white border border-slate-150 rounded-xl flex items-center justify-between gap-4 hover:border-emerald-300 hover:shadow-xs transition-all"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                                    Tuần {week.week}
                                  </span>
                                  <h4 className="text-xs font-black text-slate-800 truncate">
                                    {week.title}
                                  </h4>
                                </div>
                                <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">
                                  {week.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isGenerating ? (
                                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 flex items-center gap-1.5">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    AI đang soạn...
                                  </span>
                                ) : isCached ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-250 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                                      Đã xuất bản
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCachedLesson(week.title)}
                                      className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-550 hover:text-white rounded-lg text-[9px] font-black transition-all cursor-pointer border border-red-100"
                                      title="Xóa đề ôn tập này"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateWeeklyWorksheet(week)}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:scale-103 active:scale-97"
                                  >
                                    <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500 animate-pulse" />
                                    Tạo đề bằng AI
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}



              {/* Topic Manual Input (Only for Topic method) */}
              {parseMethod === 'topic' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-600 uppercase">Tên bài học hoặc chủ đề mong muốn</label>
                  <input 
                    type="text" 
                    value={parseLessonTitle}
                    onChange={(e) => setParseLessonTitle(e.target.value)}
                    placeholder="Ví dụ: Bài 4: Các nguồn năng lượng sạch"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              )}
            </div>

            {/* Progress indicator */}
            {isParsing && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs font-extrabold text-emerald-800">{parseProgress}</p>
                <div className="w-full bg-emerald-200/50 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full animate-loading-bar" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}

            {/* Options to ignore cache */}
            <div className="flex items-center gap-2 mb-3 mt-1 select-none">
              <input
                type="checkbox"
                id="ignoreOldData"
                checked={ignoreOldData}
                onChange={(e) => setIgnoreOldData(e.target.checked)}
                className="rounded text-emerald-650 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="ignoreOldData" className="text-[11px] font-black text-slate-600 cursor-pointer flex items-center gap-1">
                🔄 Soạn lại bài giảng mới hoàn toàn (bỏ qua dữ liệu cũ)
              </label>
            </div>

            <button 
              onClick={handleStartParse}
              disabled={isParsing}
              className={`w-full py-3 text-white rounded-xl text-xs font-black shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer flex items-center justify-center gap-1.5 ${
                parseSubject === 'Tất cả'
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              {parseSubject === 'Tất cả'
                ? `⚡ AI Tự động Tạo Giáo án Tất cả các môn (Khối ${parseGrade})`
                : parseMethod === 'pdf' 
                ? 'Bắt đầu AI phân tích & sinh bài tập từ SGK' 
                : parseMethod === 'vietjack'
                ? 'Bắt đầu AI tạo chặng bài giảng từ Presets'
                : 'Bắt đầu AI tạo chặng bài giảng tự chọn'
              }
            </button>
          </div>
        )}

        {/* CONTENT MODERATION STUDIO TAB */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 font-display">Content Moderation Studio (Kiểm duyệt giáo án AI)</h3>
              <p className="text-xs font-semibold text-slate-500">Phê duyệt hoặc tùy biến nội dung học tập do AI tự soạn thảo trước khi gán cho học sinh.</p>
            </div>

            {moderationList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200/50 text-slate-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold">Không có bài viết nào chờ phê duyệt.</p>
                <p className="text-xs font-medium">Nhấn "AI PDF Parser" để tạo bài viết mới từ tài liệu SGK.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Moderation List Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Combobox Filters */}
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60 space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Bộ lọc tìm kiếm</span>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Năm học */}
                        <div>
                          <label className="text-[9px] font-black text-slate-455 uppercase block mb-1">Năm học</label>
                          <select 
                            value={filterSchoolYear}
                            onChange={(e) => setFilterSchoolYear(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                          >
                            <option value="2024-2025">2024-2025</option>
                            <option value="2025-2026">2025-2026</option>
                            <option value="2026-2027">2026-2027</option>
                          </select>
                        </div>

                        {/* Khối lớp */}
                        <div>
                          <label className="text-[9px] font-black text-slate-455 uppercase block mb-1">Khối lớp</label>
                          <select 
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                          >
                            <option value="all">Tất cả</option>
                            <option value="1">Lớp 1</option>
                            <option value="2">Lớp 2</option>
                            <option value="3">Lớp 3</option>
                            <option value="4">Lớp 4</option>
                            <option value="5">Lớp 5</option>
                          </select>
                        </div>
                      </div>

                      {/* Môn học */}
                      <div>
                        <label className="text-[9px] font-black text-slate-455 uppercase block mb-1">Môn học</label>
                        <select 
                          value={filterSubject}
                          onChange={(e) => setFilterSubject(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                        >
                          <option value="all">Tất cả</option>
                          {(() => {
                            const activeGradeVal = filterGrade === 'all' ? undefined : Number(filterGrade);
                            const gradeSubjects = activeGradeVal ? subjects.filter(s => s.grade === activeGradeVal) : subjects;
                            const uniqueNames = Array.from(new Set(gradeSubjects.map(s => s.name)));
                            const list = uniqueNames.length > 0
                              ? uniqueNames
                              : ['Toán', 'Tiếng Việt', 'Khoa học', 'Ngoại ngữ 1', 'Lịch sử và Địa lí', 'Tin học và Công nghệ'];
                            return list.map(name => (
                              <option key={name} value={name}>{name}</option>
                            ));
                          })()}
                        </select>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const filteredList = moderationList.filter(mod => {
                      const normalizeYear = (year: string) => year.replace(/\s+/g, '');
                      const matchYear = !mod.schoolYear || normalizeYear(mod.schoolYear) === normalizeYear(filterSchoolYear);
                      const matchGrade = filterGrade === 'all' || String(mod.grade) === filterGrade;
                      const matchSubject = filterSubject === 'all' || mod.subject === filterSubject;
                      return matchYear && matchGrade && matchSubject;
                    });
                    filteredList.sort(sortLessons);

                    if (filteredList.length === 0) {
                      return (
                        <>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Danh sách chờ duyệt</span>
                          <div className="p-4 text-center bg-slate-50 rounded-2xl border border-slate-200/50 text-slate-400 text-xs font-semibold">
                            Không có bài học nào phù hợp bộ lọc.
                          </div>
                        </>
                      );
                    }

                    const grouped: Record<string, Record<string, typeof moderationList>> = {};
                    filteredList.forEach(mod => {
                      const gradeKey = `Lớp ${mod.grade}`;
                      const subjectKey = mod.subject;
                      if (!grouped[gradeKey]) {
                        grouped[gradeKey] = {};
                      }
                      if (!grouped[gradeKey][subjectKey]) {
                        grouped[gradeKey][subjectKey] = [];
                      }
                      grouped[gradeKey][subjectKey].push(mod);
                    });



                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50 gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider">Danh sách chờ duyệt</span>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 cursor-pointer hover:text-slate-700 select-none">
                              <input 
                                type="checkbox"
                                checked={
                                  filteredList.length > 0 &&
                                  filteredList.every(mod => selectedModIds.includes(mod.id))
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedModIds(Array.from(new Set([...selectedModIds, ...filteredList.map(mod => mod.id)])));
                                  } else {
                                    setSelectedModIds(selectedModIds.filter(id => !filteredList.some(mod => mod.id === id)));
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              Chọn tất cả
                            </label>
                            
                            {selectedModIds.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                <button
                                  onClick={() => {
                                    setModerationList(prev => prev.map(m => 
                                      selectedModIds.includes(m.id) ? { ...m, status: 'approved' as const } : m
                                    ));
                                    alert(`Đã phê duyệt nhanh ${selectedModIds.length} bài học thành công!`);
                                    setSelectedModIds([]);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <CheckCircle className="w-3 h-3 text-white" />
                                  Duyệt nhanh ({selectedModIds.length})
                                </button>
                                <button
                                  onClick={() => {
                                    setModerationList(prev => prev.map(m => 
                                      selectedModIds.includes(m.id) ? { ...m, status: 'pending' as const } : m
                                    ));
                                    alert(`Đã huỷ duyệt nhanh ${selectedModIds.length} bài học thành công!`);
                                    setSelectedModIds([]);
                                  }}
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[9px] font-black shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <XCircle className="w-3 h-3 text-white" />
                                  Huỷ duyệt nhanh ({selectedModIds.length})
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc chắn muốn rút nhanh ${selectedModIds.length} bài học đã chọn khỏi danh sách kiểm duyệt? (Dữ liệu các bài học đã tạo vẫn được giữ lại ở trạng thái chưa duyệt).`)) {
                                      setModerationList(prev => prev.filter(m => !selectedModIds.includes(m.id)));
                                      setSelectedModIds([]);
                                      if (editingModId && selectedModIds.includes(editingModId)) {
                                        setEditingModId(null);
                                      }
                                      alert('Đã rút nhanh các bài giảng khỏi danh sách kiểm duyệt thành công!');
                                    }
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black shadow-sm transition-all cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <Trash className="w-3 h-3 text-white" />
                                  Xoá nhanh ({selectedModIds.length})
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {Object.keys(grouped).sort().map(gradeKey => (
                          <div key={gradeKey} className="space-y-2 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                {gradeKey}
                              </span>
                              <div className="h-px flex-1 bg-slate-200/50" />
                            </div>
                            
                            <div className="space-y-3 pl-1">
                              {Object.keys(grouped[gradeKey]).sort().map(subjectKey => (
                                <div key={subjectKey} className="space-y-1.5">
                                  <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {subjectKey}
                                  </span>
                                  <div className="space-y-2 pl-2 border-l-2 border-emerald-100">
                                    {grouped[gradeKey][subjectKey].map(mod => {
                                      const isChecked = selectedModIds.includes(mod.id);
                                      return (
                                        <div key={mod.id} className="flex items-center gap-2">
                                          <input 
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedModIds([...selectedModIds, mod.id]);
                                              } else {
                                                setSelectedModIds(selectedModIds.filter(id => id !== mod.id));
                                              }
                                            }}
                                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer shrink-0"
                                          />
                                          <button 
                                            onClick={() => handleStartEdit(mod)}
                                            className={`flex-1 text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                                              editingModId === mod.id 
                                                ? 'bg-emerald-50 border-emerald-400 shadow-sm' 
                                                : 'bg-white border-slate-200 hover:bg-slate-50'
                                            }`}
                                          >
                                            <div className="flex justify-between items-start gap-2 w-full">
                                              <h4 className="text-xs font-bold text-slate-800 leading-snug">{mod.title}</h4>
                                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                                mod.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                              }`}>
                                                {mod.status === 'approved' ? 'Duyệt' : 'Chờ'}
                                              </span>
                                            </div>
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Moderation Workspace Editor */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  {editingModId ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                        <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                          <Edit3 className="w-4 h-4 text-emerald-600" />
                          Không gian biên tập
                        </h4>
                        <div className="flex gap-2">
                          <button 
                            disabled={isRegenerating}
                            onClick={() => handleRegenerateLessonSchema(editingModId)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-violet-650 to-indigo-650 hover:from-violet-750 hover:to-indigo-750 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 disabled:opacity-55"
                            title="Khởi tạo lại toàn bộ cấu trúc bài học và ngân hàng bài tập thích ứng"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-yellow-350 fill-yellow-350 animate-pulse" />
                            Tạo lại Schema mới
                          </button>
                          <button 
                            disabled={isRegenerating}
                            onClick={() => handleSaveEdit(editingModId)}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 disabled:opacity-55"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Ghi nhận sửa đổi
                          </button>
                          {moderationList.find(m => m.id === editingModId)?.status === 'approved' ? (
                            <button 
                              disabled={isRegenerating}
                              onClick={() => handleUnapproveContent(editingModId)}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 disabled:opacity-55"
                              title="Hủy bỏ trạng thái phê duyệt của bài giảng này"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Hủy duyệt
                            </button>
                          ) : (
                            <button 
                              disabled={isRegenerating}
                              onClick={() => handleApproveContent(editingModId)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 disabled:opacity-55"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Duyệt & Đăng bài
                            </button>
                          )}
                          <button 
                            disabled={isRegenerating}
                            onClick={() => handleDeleteContent(editingModId)}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 disabled:opacity-55"
                            title="Xóa bài học này khỏi hệ thống kiểm duyệt"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            Xóa bài
                          </button>
                        </div>
                      </div>

                      {/* Fields aligned with Student's 4-step structure */}
                      {isRegenerating ? (
                        <div className="p-20 text-center space-y-4 bg-slate-50/50 rounded-3xl border border-slate-150 animate-pulse">
                          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <div className="space-y-1.5">
                            <p className="text-xs font-black text-slate-700">{regenerateProgress}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI đang tái cấu trúc bài giảng...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
                          
                          {/* Common Lesson Title */}
                          <div className="space-y-1 bg-slate-55/40 p-3 rounded-2xl border border-slate-100">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Tên chặng bài học</label>
                            <input 
                              type="text" 
                              value={modTitle} 
                              onChange={(e) => setModTitle(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                            />
                          </div>

                          {/* SECTION 1: KHỞI ĐỘNG */}
                          <div className="space-y-3 bg-orange-50/30 p-4 rounded-2xl border border-orange-100/70">
                            <h5 className="text-xs font-black text-orange-700 flex items-center gap-1">
                              <span>🚀</span> 1. Khởi động (Warm Up)
                            </h5>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Kịch bản / Câu chuyện khởi động</label>
                                <textarea 
                                  value={modWarmUpStory} 
                                  onChange={(e) => setModWarmUpStory(e.target.value)}
                                  rows={3}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Câu đố khởi động</label>
                                <input 
                                  type="text" 
                                  value={modWarmUpQuestion} 
                                  onChange={(e) => setModWarmUpQuestion(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Các phương án trả lời câu đố khởi động (phân tách bằng dấu phẩy)</label>
                                <input 
                                  type="text" 
                                  value={modWarmUpOptionsText} 
                                  onChange={(e) => setModWarmUpOptionsText(e.target.value)}
                                  placeholder="Ví dụ: Miệng, Thực quản, Dạ dày, Ruột non"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* SECTION 2: KHÁM PHÁ */}
                          <div className="space-y-3 bg-blue-50/30 p-4 rounded-2xl border border-blue-100/70">
                            <h5 className="text-xs font-black text-blue-700 flex items-center gap-1">
                              <span>📖</span> 2. Khám phá (Discovery & Theory)
                            </h5>
                            <div className="space-y-2.5">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Lý thuyết trọng tâm</label>
                                <textarea 
                                  value={modExplanationContent} 
                                  onChange={(e) => setModExplanationContent(e.target.value)}
                                  rows={5}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase">Gợi ý trực quan (Visual Hint)</label>
                                  <input 
                                    type="text" 
                                    value={modExplanationVisualHint} 
                                    onChange={(e) => setModExplanationVisualHint(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase">Ví dụ thực tế (Example Problem)</label>
                                  <input 
                                    type="text" 
                                    value={modExampleProblem} 
                                    onChange={(e) => setModExampleProblem(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase">Các bước giải ví dụ (mỗi dòng một bước)</label>
                                  <textarea 
                                    value={modExampleSolution} 
                                    onChange={(e) => setModExampleSolution(e.target.value)}
                                    rows={3}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 uppercase">Đáp án ví dụ mẫu</label>
                                  <input 
                                    type="text" 
                                    value={modExampleAnswer} 
                                    onChange={(e) => setModExampleAnswer(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SECTION 3: VẬN DỤNG */}
                          <div className="space-y-3 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/70">
                            <h5 className="text-xs font-black text-emerald-700 flex items-center gap-1">
                              <span>🌱</span> 3. Vận dụng (Application)
                            </h5>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-550 uppercase">Liên hệ thế giới thực tế</label>
                                <textarea 
                                  value={modApplicationConnection} 
                                  onChange={(e) => setModApplicationConnection(e.target.value)}
                                  rows={2.5}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-550 uppercase">Câu hỏi thử thách vận dụng</label>
                                <input 
                                  type="text" 
                                  value={modApplicationChallenge} 
                                  onChange={(e) => setModApplicationChallenge(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          {/* SECTION 4: LUYỆN TẬP */}
                          <div className="space-y-3 bg-purple-50/30 p-4 rounded-2xl border border-purple-100/70">
                            <h5 className="text-xs font-black text-purple-700 flex items-center gap-1">
                              <span>✏️</span> 4. Luyện tập (Adaptable Practice & Exercises)
                            </h5>
                            <div className="space-y-4">
                              {modPracticeQuestions.map((q, idx) => (
                                <div key={q.id} className="p-3.5 bg-white border border-purple-100 rounded-xl space-y-2.5 shadow-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-purple-800">CÂU HỎI {idx + 1}</span>
                                    <div className="flex gap-2">
                                      <select
                                        value={q.difficulty || 'medium'}
                                        onChange={(e) => {
                                          const updated = [...modPracticeQuestions];
                                          updated[idx] = { ...updated[idx], difficulty: e.target.value };
                                          setModPracticeQuestions(updated);
                                        }}
                                        className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-[9px] font-bold text-slate-600 focus:outline-none"
                                      >
                                        <option value="easy">Dễ</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="hard">Khó</option>
                                      </select>
                                      <select
                                        value={q.type}
                                        onChange={(e) => {
                                          const updated = [...modPracticeQuestions];
                                          updated[idx] = { ...updated[idx], type: e.target.value };
                                          setModPracticeQuestions(updated);
                                        }}
                                        className="bg-slate-55 border border-slate-200 rounded-lg px-2 py-0.5 text-[9px] font-bold text-slate-600 focus:outline-none"
                                      >
                                        <option value="multiple_choice">Trắc nghiệm</option>
                                        <option value="fill_blank">Điền từ</option>
                                        <option value="drag_drop">Kéo thả</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">Nội dung câu hỏi</label>
                                    <input 
                                      type="text"
                                      value={q.question_text || q.question || ''}
                                      onChange={(e) => {
                                        const updated = [...modPracticeQuestions];
                                        updated[idx] = { ...updated[idx], question: e.target.value, question_text: e.target.value };
                                        setModPracticeQuestions(updated);
                                      }}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-xs font-semibold text-slate-400 italic">
                      Chọn một bài học từ danh sách bên trái để biên tập nội dung.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* CLASS HEATMAP & EARLY WARNINGS TAB */}
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            
            {/* Early Warnings Panel (Full Width at Top) */}
            <div className="bg-red-50/50 border border-red-200 p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b border-red-150 pb-2">
                <h3 className="font-extrabold text-sm text-red-805 flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-red-650 animate-bounce" />
                  Hệ thống Cảnh báo Sớm AI
                </h3>
                <button
                  type="button"
                  disabled={isEvaluatingWarnings}
                  onClick={handleEvaluateWarnings}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-55 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                  title="Chạy AI phân tích lại bảng điểm hiện tại"
                >
                  <RefreshCw className={`w-3 h-3 ${isEvaluatingWarnings ? 'animate-spin' : ''}`} />
                  Đánh giá lại
                </button>
              </div>
              
              {isEvaluatingWarnings ? (
                <div className="py-8 text-center text-xs font-bold text-red-600/70 animate-pulse flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  AI đang phân tích bảng điểm...
                </div>
              ) : earlyWarnings.length === 0 ? (
                <div className="py-6 text-center text-xs font-semibold text-slate-400">
                  Tất cả học sinh đều đang có phong độ học tập tốt. Không có cảnh báo đỏ! 🎉
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earlyWarnings.map((warn, i) => (
                    <div key={i} className="p-3.5 bg-white border border-red-100 rounded-2xl space-y-2 shadow-sm animate-fade-in flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-red-700">{warn.student}</span>
                          <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded">Cảnh báo đỏ</span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{warn.reason}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed font-semibold mt-2">
                        <strong className="text-emerald-700 block mb-0.5">Khuyến nghị hành động:</strong>
                        {warn.action}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter and Heatmap Section (Below, Full Width) */}
            <div className="space-y-4">
              {/* Bộ lọc Heatmap */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/50 flex flex-wrap gap-4 items-center text-xs font-bold text-slate-700">
                <span className="text-[10px] font-black text-slate-550 uppercase tracking-wider mr-2 font-display">Lọc danh sách học sinh:</span>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Năm học:</span>
                  <select
                    value={heatmapYear}
                    onChange={(e) => {
                      setHeatmapYear(e.target.value);
                      setHeatmapClassId('all');
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">Tất cả năm học</option>
                    <option value="2024-2025">2024 - 2025</option>
                    <option value="2025-2026">2025 - 2026</option>
                    <option value="2026-2027">2026 - 2027</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Khối lớp:</span>
                  <select
                    value={heatmapGrade}
                    onChange={(e) => {
                      setHeatmapGrade(e.target.value);
                      setHeatmapClassId('all');
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">Tất cả khối</option>
                    <option value="1">Khối 1</option>
                    <option value="2">Khối 2</option>
                    <option value="3">Khối 3</option>
                    <option value="4">Khối 4</option>
                    <option value="5">Khối 5</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">Lớp học:</span>
                  <select
                    value={heatmapClassId}
                    onChange={(e) => setHeatmapClassId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="all">Tất cả lớp học</option>
                    {virtualClasses
                      .filter(c => {
                        if (heatmapYear !== 'all' && c.schoolYear !== heatmapYear) return false;
                        if (heatmapGrade !== 'all' && String(c.grade) !== heatmapGrade) return false;
                        return true;
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.schoolYear})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-base font-black text-slate-800 font-display">Bản đồ nhiệt năng lực lớp học (Class Heatmap)</h3>
                <p className="text-xs font-semibold text-slate-500">Giám sát mức độ tiếp thu và chất lượng điểm số trung bình của từng học sinh.</p>
              </div>

              {/* Heatmap Grid table */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-sm bg-white">
                <table className="w-full border-collapse text-left text-xs font-bold">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                      <th className="p-3">Học sinh</th>
                      {(() => {
                        const classGrade = assignedClass?.grade || 3;
                        const gradeSubjects = subjects.filter(s => s.grade === classGrade);
                        const subjectList = gradeSubjects.length > 0 
                          ? gradeSubjects.map(s => s.name)
                          : ['Toán', 'Tiếng Việt', 'Ngoại ngữ 1', 'Khoa học', 'Lịch sử và Địa lí'];
                        return subjectList.map(sub => (
                          <th key={sub} className="p-3 text-center">{sub === 'Ngoại ngữ 1' ? 'Ngoại ngữ 1 (Anh)' : sub}</th>
                        ));
                      })()}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentsMock.map(student => (
                      <tr key={student.name} className="hover:bg-slate-50">
                        <td className="p-3 font-extrabold text-slate-750 flex items-center gap-1.5">
                          {student.status === 'warning' ? '⚠️' : '👦'}
                          {student.name}
                        </td>
                        {student.subjects.map(sp => (
                          <td key={sp.subject} className="p-2 text-center">
                            <span className={`px-3 py-1.5 rounded-xl border font-black text-xs block ${getHeatmapColor(sp.averageScore)}`}>
                              {sp.averageScore}%
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4.5 justify-end text-[10px] font-black text-slate-500 uppercase tracking-wide">
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-200"></span>
                  Tốt (≥90%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-blue-100 border border-blue-200"></span>
                  Khá (75-89%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-200"></span>
                  Trung bình (60-74%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-200 animate-pulse"></span>
                  Nguy cơ (&lt;60%)
                </span>
              </div>
            </div>

          </div>
        )}

        {/* TEACHER SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-800 font-display flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  Cấu hình API Key Cá Nhân
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Key được lưu vào hồ sơ và đồng bộ lên Supabase — tự động áp dụng cho học sinh trong lớp.
                </p>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                currentUser?.geminiKey || currentUser?.openaiKey
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}>
                {currentUser?.geminiKey || currentUser?.openaiKey ? (
                  <><Cloud className="w-3.5 h-3.5" /> Đã có key riêng</>
                ) : (
                  <><CloudOff className="w-3.5 h-3.5" /> Dùng key hệ thống</>
                )}
              </div>
            </div>

            {/* AI Provider Toggle */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">Nhà cung cấp AI đang dùng</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setLocalAiProvider('gemini')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    localAiProvider === 'gemini'
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100 scale-[1.01]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>♊</span> Google Gemini
                </button>
                <button
                  type="button"
                  onClick={() => setLocalAiProvider('openai')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    localAiProvider === 'openai'
                      ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100 scale-[1.01]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>🤖</span> OpenAI / CocoLink
                </button>
              </div>
            </div>

            {/* Gemini Card */}
            <div className={`p-5 rounded-3xl border transition-all duration-300 space-y-4 ${
              localAiProvider === 'gemini'
                ? 'bg-emerald-50/40 border-emerald-200 ring-2 ring-emerald-50'
                : 'bg-slate-50/50 border-slate-200 opacity-50 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">♊</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Google Gemini API Key</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Xử lý nội dung Tiếng Việt và gia sư Socratic.</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={localGeminiKey}
                  onChange={(e) => setLocalGeminiKey(e.target.value)}
                  placeholder="AIza... (bỏ trống để dùng key hệ thống)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {localGeminiKey && (
                <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Key cá nhân sẽ được dùng thay key hệ thống
                </p>
              )}
            </div>

            {/* OpenAI Card */}
            <div className={`p-5 rounded-3xl border transition-all duration-300 space-y-4 ${
              localAiProvider === 'openai'
                ? 'bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-50'
                : 'bg-slate-50/50 border-slate-200 opacity-50 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">OpenAI / CocoLink</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Proxy tương thích OpenAI hoặc key riêng.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">API Key</label>
                  <div className="relative">
                    <input
                      type={showOpenaiKey ? 'text' : 'password'}
                      value={localOpenaiKey}
                      onChange={(e) => setLocalOpenaiKey(e.target.value)}
                      placeholder="sk-... (bỏ trống để dùng key hệ thống)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenaiKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Base URL</label>
                  <input
                    type="text"
                    value={localOpenaiBaseUrl}
                    onChange={(e) => setLocalOpenaiBaseUrl(e.target.value)}
                    placeholder="https://www.cocolink.ai/ hoặc https://api.openai.com/v1"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Model</label>
                  <input
                    type="text"
                    value={localOpenaiModel}
                    onChange={(e) => setLocalOpenaiModel(e.target.value)}
                    placeholder="gpt-4o, gpt-3.5-turbo, ..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveApiKeys}
              className={`w-full py-3 rounded-xl text-sm font-black shadow transition-all cursor-pointer flex items-center justify-center gap-2 ${
                apiKeySaveStatus === 'saved'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {apiKeySaveStatus === 'saved' ? (
                <><CheckCircle className="w-4 h-4" /> Đã lưu vào hồ sơ &amp; đồng bộ Supabase! ✓</>
              ) : (
                <><Save className="w-4 h-4" /> Lưu cấu hình API Key</>
              )}
            </button>

            {/* Security note */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
              <h4 className="text-xs font-black text-amber-800 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                Lưu ý bảo mật &amp; phân quyền
              </h4>
              <ul className="text-[10px] font-semibold text-slate-600 leading-relaxed space-y-1 list-disc list-inside">
                <li>Key cá nhân được mã hóa và lưu vào hồ sơ tài khoản trên Supabase.</li>
                <li>Học sinh trong lớp sẽ tự động dùng key của giáo viên phụ trách.</li>
                <li>Để dùng lại key hệ thống, xóa trắng ô key và bấm Lưu.</li>
              </ul>
            </div>
          </div>
        )}

      </div>

      {/* Library Selection Modal */}
      {isLibraryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsLibraryModalOpen(false)} />
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl z-10 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800">Thư viện Sách Giáo Khoa</h2>
              <button onClick={() => setIsLibraryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {textbooks.filter(tb => tb.grade === parseGrade && tb.subject === parseSubject).length === 0 ? (
                <div className="text-center p-8 text-slate-500 font-bold text-sm bg-slate-50 rounded-2xl">
                  Không tìm thấy sách nào cho {parseSubject} lớp {parseGrade} trong thư viện.
                </div>
              ) : textbooks.filter(tb => tb.grade === parseGrade && tb.subject === parseSubject).map(tb => (
                <div key={tb.id} className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h4 className="text-sm font-black text-slate-700">{tb.name}</h4>
                      <div className="text-[11px] text-slate-400 font-bold mt-1">
                        Năm học: {tb.schoolYear} • Dung lượng: {tb.size} • Trạng thái: {tb.status === 'active' ? 'Đang sử dụng' : 'Lưu trữ'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSelectFromLibrary(tb)}
                    className="px-4 py-2 bg-emerald-500 text-white font-black text-xs rounded-xl hover:bg-emerald-600 shadow-sm"
                  >
                    Chọn sách này
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
