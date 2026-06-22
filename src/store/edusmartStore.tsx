'use client';
import { localDB } from '@/lib/localDB';
import { supabase } from '@/lib/supabaseClient';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type Role = 'student' | 'teacher' | 'parent' | 'academic' | 'admin';

export interface StudentStats {
  xp: number;
  coins: number;
  level: number;
  streak: number;
  lastActive: string | null;
}

export interface AIPet {
  name: string;
  type: 'owl' | 'bear' | 'dragon';
  level: number;
  xp: number;
  xpNeeded: number;
  happiness: number;
  equippedAccessories: string[];
}

export interface Sticker {
  id: string;
  name: string;
  image: string;
  description: string;
  category: 'landmark' | 'science' | 'history';
}

export interface StickerAlbum {
  unlockedIds: string[];
  packsCount: number;
}

export interface Quest {
  id: string;
  description: string;
  xpReward: number;
  coinsReward: number;
  completed: boolean;
}

export interface RealWorldReward {
  id: string;
  description: string;
  cost: number;
  status: 'available' | 'pending' | 'approved' | 'rejected';
  expiresAt?: string;
}

export interface LearningStage {
  id: string;
  subject: 'Toán' | 'Tiếng Việt' | 'Ngoại ngữ 1' | 'Khoa học' | 'Lịch sử và Địa lí' | 'Tin học và Công nghệ';
  title: string;
  lessonId: string;
  status: 'locked' | 'available' | 'completed';
  grade: number;
  score?: number;
  nextReviewDate?: string;
  spacedRepetitionInterval?: number;
}

export interface Roadmap {
  id: string;
  title: string;
  stages: LearningStage[];
  status: 'locked' | 'active' | 'completed';
  grade?: number;
  schoolYear?: string;
  classId?: string;
  classIds?: string[];
}

export interface VirtualClass {
  id: string;
  name: string;
  teacher: string;
  teacherId?: string;
  studentsCount: number;
  grade: number;
  schoolYear?: string;
  maxStudents?: number;
}

export interface Textbook {
  id: string;
  name: string;
  subject: string;
  grade: number;
  schoolYear: string;
  status: 'active' | 'archived';
  size: string;
  fileBase64?: string;
}

export interface Subject {
  id: string;
  name: string;
  grade: number;
  schoolYear: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  password?: string;
  parentId?: string;
  classId?: string;
  birthYear?: number;
  gender?: string;
  grade?: number;
  schoolYear?: string;
  aiProvider?: 'gemini' | 'openai';
  geminiKey?: string;
  openaiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
}

export interface StudentProgress {
  stats: StudentStats;
  pet: AIPet;
  album: StickerAlbum;
  quests: Quest[];
  rewards: RealWorldReward[];
  roadmaps: Roadmap[];
  socraticChat: ChatMessage[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface LessonContent {
  id: string;
  title: string;
  warmUp: { story: string; question: string; options?: string[] };
  explanation: { mainContent: string; visualHint: string };
  examples: { problem: string; solutionSteps: string[]; answer: string }[];
  application: { realWorldConnection: string; challengeQuestion: string };
    practice: {
      id: string;
      type: 'multiple_choice' | 'fill_blank' | 'drag_drop';
      question: string;
      question_text?: string;
      difficulty?: 'easy' | 'medium' | 'hard';
      options?: string[];
      correctAnswer: string | string[];
      userAnswer?: string | string[];
      isCorrect?: boolean;
      explanation: string;
      hint: string;
    }[];
}

export interface SyncLog {
  id: string;
  action: string;
  timestamp: string;
  status: 'queued' | 'synced';
}

export interface TeacherSettings {
  aiProvider: 'gemini' | 'openai';
  geminiKey: string;
  openaiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
}

// Initial Mock Data
const DEFAULT_STICKERS: Sticker[] = [
  { id: 'hl', name: 'Vịnh Hạ Long', image: '🐉', description: 'Kỳ quan thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi kỳ vĩ.', category: 'landmark' },
  { id: 'ta', name: 'Quần thể Tràng An', image: '🚣', description: 'Di sản thế giới hỗn hợp đầu tiên của Việt Nam với các hang động tự nhiên.', category: 'landmark' },
  { id: 'vm', name: 'Văn Miếu Quốc Tử Giám', image: '🐢', description: 'Trường Đại học đầu tiên của Việt Nam, xây dựng từ năm 1070.', category: 'history' },
  { id: 'mc', name: 'Chùa Một Cột', image: '🪷', description: 'Ngôi chùa cổ kính độc đáo có hình dáng như một đóa hoa sen nở trên mặt nước.', category: 'history' },
  { id: 'pn', name: 'Động Phong Nha', image: '⛰️', description: 'Được mệnh danh là Kỳ quan đệ nhất động với hang sông ngầm dài nhất.', category: 'landmark' },
  { id: 'vn', name: 'Bản đồ Việt Nam', image: '🇻🇳', description: 'Bản đồ hình chữ S thân yêu cùng với hai quần đảo Hoàng Sa và Trường Sa.', category: 'history' },
];

const DEFAULT_ROADMAPS: Roadmap[] = [
  {
    id: 'roadmap-1',
    title: 'Lộ trình 1: Khởi động thông thái',
    status: 'active',
    stages: [
      { id: 'stage-1-1', subject: 'Tiếng Việt', title: 'Tập đọc: Thư gửi các học sinh', lessonId: 'viet_g3_lesson1', status: 'completed', grade: 3 },
      { id: 'stage-1-2', subject: 'Toán', title: 'Phép nhân trong phạm vi 1000', lessonId: 'math_g3_lesson1', status: 'completed', grade: 3 },
      { id: 'stage-1-3', subject: 'Khoa học', title: 'Các bộ phận của thực vật', lessonId: 'sci_g3_lesson1', status: 'available', grade: 3 },
      { id: 'stage-1-4', subject: 'Ngoại ngữ 1', title: 'Unit 1: Hello & Greetings', lessonId: 'eng_g3_lesson1', status: 'locked', grade: 3 },
      { id: 'stage-1-5', subject: 'Lịch sử và Địa lí', title: 'Bài 1: Bản đồ Việt Nam', lessonId: 'hist_g3_lesson1', status: 'locked', grade: 3 },
      { id: 'stage-1-6', subject: 'Tin học và Công nghệ', title: 'Bài 1: Máy tính quanh ta', lessonId: 'tech_g3_lesson1', status: 'locked', grade: 3 },
    ]
  },
  {
    id: 'roadmap-2',
    title: 'Lộ trình 2: Bứt phá tư duy',
    status: 'locked',
    stages: [
      { id: 'stage-2-1', subject: 'Toán', title: 'Phép chia hết & phép chia có dư', lessonId: 'math_g3_lesson2', status: 'locked', grade: 3 },
      { id: 'stage-2-2', subject: 'Tiếng Việt', title: 'Từ chỉ hoạt động, trạng thái', lessonId: 'viet_g3_lesson2', status: 'locked', grade: 3 },
      { id: 'stage-2-3', subject: 'Khoa học', title: 'Động vật quanh ta ăn gì?', lessonId: 'sci_g3_lesson2', status: 'locked', grade: 3 },
      { id: 'stage-2-4', subject: 'Ngoại ngữ 1', title: 'Unit 2: My Family & Friends', lessonId: 'eng_g3_lesson2', status: 'locked', grade: 3 },
      { id: 'stage-2-5', subject: 'Lịch sử và Địa lí', title: 'Bài 2: Gia đình & Trường học', lessonId: 'hist_g3_lesson2', status: 'locked', grade: 3 },
      { id: 'stage-2-6', subject: 'Tin học và Công nghệ', title: 'Bài 2: Làm quen với Internet', lessonId: 'tech_g3_lesson2', status: 'locked', grade: 3 },
    ]
  }
];

const DEFAULT_VIRTUAL_CLASSES: VirtualClass[] = [
  { id: 'c1', name: 'Lớp 3A', teacher: 'Lê Thị Mai', studentsCount: 32, grade: 3, schoolYear: '2025-2026', maxStudents: 35 },
  { id: 'c2', name: 'Lớp 3B', teacher: 'Nguyễn Văn Hùng', studentsCount: 28, grade: 3, schoolYear: '2025-2026', maxStudents: 35 },
  { id: 'c3', name: 'Lớp 4A', teacher: 'Trần Thị Thuỷ', studentsCount: 35, grade: 4, schoolYear: '2025-2026', maxStudents: 35 }
];

const DEFAULT_TEXTBOOKS: Textbook[] = [
  { id: 'tb-1', name: 'Sách giáo khoa Toán 3 - Tập 1.pdf', subject: 'Toán', grade: 3, schoolYear: '2025-2026', status: 'active', size: '12.4 MB' },
  { id: 'tb-2', name: 'Sách giáo khoa Tiếng Việt 3 - Tập 1.pdf', subject: 'Tiếng Việt', grade: 3, schoolYear: '2025-2026', status: 'active', size: '18.1 MB' },
  { id: 'tb-3', name: 'Sách giáo khoa Khoa học 3.pdf', subject: 'Khoa học', grade: 3, schoolYear: '2025-2026', status: 'active', size: '9.6 MB' }
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Toán', grade: 3, schoolYear: '2025-2026' },
  { id: 'sub-2', name: 'Tiếng Việt', grade: 3, schoolYear: '2025-2026' },
  { id: 'sub-3', name: 'Ngoại ngữ 1', grade: 3, schoolYear: '2025-2026' },
  { id: 'sub-4', name: 'Khoa học', grade: 3, schoolYear: '2025-2026' },
  { id: 'sub-5', name: 'Lịch sử và Địa lí', grade: 3, schoolYear: '2025-2026' },
  { id: 'sub-6', name: 'Tin học và Công nghệ', grade: 3, schoolYear: '2025-2026' },
  
  { id: 'sub-7', name: 'Toán', grade: 4, schoolYear: '2025-2026' },
  { id: 'sub-8', name: 'Tiếng Việt', grade: 4, schoolYear: '2025-2026' },
  { id: 'sub-9', name: 'Ngoại ngữ 1', grade: 4, schoolYear: '2025-2026' },
  { id: 'sub-10', name: 'Khoa học', grade: 4, schoolYear: '2025-2026' },
  { id: 'sub-11', name: 'Lịch sử và Địa lí', grade: 4, schoolYear: '2025-2026' },
  { id: 'sub-12', name: 'Tin học và Công nghệ', grade: 4, schoolYear: '2025-2026' },
];

const DEFAULT_USERS: User[] = [
  { id: '2026000010', name: 'Lê Nguyễn Gia Hân', role: 'student', email: 'han.lng@edusmart.vn', password: '123', parentId: '2026000003', classId: 'c1', grade: 3, schoolYear: '2025-2026', gender: 'Nữ' },
  { id: '2026000001', name: 'Nguyễn Văn Minh', role: 'student', email: 'minh.nv@edusmart.vn', password: '123', parentId: '2026000003', classId: 'c1', grade: 3, schoolYear: '2025-2026', gender: 'Nam' },
  { id: '2026000002', name: 'Lê Thị Mai', role: 'teacher', email: 'mai.lt@edusmart.vn', password: '123' },
  { id: '2026000003', name: 'Nguyễn Thu Hương', role: 'parent', email: 'huong.nt@gmail.com', password: '123' },
  { id: '2026000004', name: 'Hoàng Minh Quân', role: 'academic', email: 'quan.hm@edusmart.vn', password: '123' },
  { id: '2026000005', name: 'Quản trị viên', role: 'admin', email: 'admin@edusmart.vn', password: '123' },
  { id: '2026000006', name: 'Trần Thu Trang', role: 'student', email: 'trang.tt@edusmart.vn', password: '123', grade: 3, schoolYear: '2025-2026', gender: 'Nữ' },
  { id: '2026000007', name: 'Phạm Hải Nam', role: 'student', email: 'nam.ph@edusmart.vn', password: '123', grade: 4, schoolYear: '2025-2026', gender: 'Nam' },
  { id: '2026000008', name: 'Lê Thùy Linh', role: 'student', email: 'linh.lt@edusmart.vn', password: '123', grade: 3, schoolYear: '2024-2025', gender: 'Nữ' },
  { id: '2026000009', name: 'Đỗ Hoàng Anh', role: 'student', email: 'anh.dh@edusmart.vn', password: '123', grade: 5, schoolYear: '2025-2026', gender: 'Nam' }
];

const DEFAULT_LESSON: LessonContent = {
  id: 'sci_g3_lesson1',
  title: 'Các bộ phận của thực vật',
  warmUp: {
    story: 'Hôm nay chúng mình cùng ghé thăm khu vườn kỳ diệu của bạn Cú thông thái nhé! Ở đây có rất nhiều loài hoa đẹp và cây trĩu quả. Các bạn nhỏ có biết nhờ đâu mà cây có thể đứng vững và hút nước từ đất lên không nào?',
    question: 'Hãy chọn bộ phận giúp cây bám chặt vào lòng đất nhé!',
    options: ['Thân cây', 'Lá cây', 'Rễ cây', 'Quả']
  },
  explanation: {
    mainContent: `Cây cối quanh ta thường gồm 5 bộ phận chính: Rễ, Thân, Lá, Hoa và Quả. 
- **Rễ**: Ở dưới lòng đất, giúp cây đứng vững, hút nước và chất dinh dưỡng.
- **Thân**: Nâng đỡ cành lá và dẫn nước lên nuôi cây.
- **Lá**: Giúp cây thở (hô hấp) và chế tạo thức ăn dưới ánh nắng mặt trời.
- **Hoa**: Có màu sắc rực rỡ để thu hút ong bướm, giúp cây tạo quả.
- **Quả**: Chứa hạt để mọc thành những cây con mới!`,
    visualHint: '🌱 (Rễ nằm dưới đất) -> 🪵 (Thân đứng thẳng) -> 🍃 (Lá màu xanh trên cành) -> 🌸 (Hoa khoe sắc) -> 🍎 (Quả chín mọng)'
  },
  examples: [
    {
      problem: 'Cây cà rốt có rễ phình to thành củ cà rốt mà chúng ta hay ăn hàng ngày. Đây gọi là rễ củ!',
      solutionSteps: [
        'Bước 1: Rễ hút chất dinh dưỡng dự trữ dưới lòng đất.',
        'Bước 2: Chất dinh dưỡng phình to ra tạo thành củ.',
        'Bước 3: Chúng ta thu hoạch củ cà rốt chính là ăn bộ phận rễ của cây!'
      ],
      answer: 'Rễ củ'
    }
  ],
  application: {
    realWorldConnection: 'Cây xanh cung cấp oxy cho chúng ta thở và quả ngọt để ăn. Hãy cùng bố mẹ trồng một cái cây nhỏ hoặc tưới nước cho cây trong nhà vào cuối tuần nhé!',
    challengeQuestion: 'Hãy kể tên 2 loại rau ăn lá mà con thích nhất!'
  },
  practice: [
    {
      id: 'q1',
      type: 'multiple_choice',
      question: 'Bộ phận nào của cây làm nhiệm vụ hút nước và muối khoáng từ lòng đất?',
      options: ['Lá cây', 'Thân cây', 'Rễ cây', 'Hoa'],
      correctAnswer: 'Rễ cây',
      explanation: 'Chính xác! Rễ cây ăn sâu vào lòng đất để hút nước và chất dinh dưỡng nuôi cây.',
      hint: 'Nó nằm ẩn phía dưới mặt đất đó con!'
    },
    {
      id: 'q2',
      type: 'fill_blank',
      question: 'Lá cây giúp cây hô hấp nhờ các lỗ khí và hấp thụ ánh sáng để quang hợp, lá cây thường có màu _______ (Điền một từ duy nhất)',
      correctAnswer: 'xanh',
      explanation: 'Đúng rồi! Chất diệp lục trong lá làm cho lá có màu xanh lục nổi bật.',
      hint: 'Màu của rừng cây, màu của cỏ xanh...'
    },
    {
      id: 'q3',
      type: 'drag_drop',
      question: 'Ghép nối bộ phận với chức năng thích hợp (Nối: Quả - Chứa hạt gieo mầm; Hoa - Duy trì nòi giống bằng cách thụ phấn)',
      options: ['Quả', 'Hoa'],
      correctAnswer: ['Quả - Chứa hạt gieo mầm', 'Hoa - Duy trì nòi giống bằng cách thụ phấn'],
      explanation: 'Tuyệt vời! Hoa thụ phấn để tạo quả, quả chứa hạt giúp cây duy trì giống nòi.',
      hint: 'Hãy chú ý nhiệm vụ của quả là giữ các hạt nhỏ.'
    }
  ]
};

// Context setup
interface EduSmartContextType {
  role: Role;
  setRole: (role: Role) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  stats: StudentStats;
  updateStats: (xpGained: number, coinsGained: number) => void;
  pet: AIPet;
  feedPet: (foodXp: number, cost: number) => boolean;
  buyAccessory: (id: string, cost: number) => boolean;
  stickers: Sticker[];
  album: StickerAlbum;
  openStickerPack: () => void;
  quests: Quest[];
  completeQuest: (id: string) => void;
  rewards: RealWorldReward[];
  requestReward: (id: string) => void;
  approveReward: (id: string) => void;
  rejectReward: (id: string) => void;
  addReward: (desc: string, cost: number, expiresAt?: string) => void;
  updateReward: (id: string, updatedData: Partial<Omit<RealWorldReward, 'id'>>) => void;
  deleteReward: (id: string) => void;
  roadmaps: Roadmap[];
  completeStage: (roadmapId: string, stageId: string, score: number) => void;
  createRoadmap: (title: string, grade: number, schoolYear: string, stages: LearningStage[]) => string;
  updateRoadmap: (id: string, updatedData: Partial<Roadmap>) => void;
  deleteRoadmap: (id: string) => void;
  assignRoadmapToClass: (roadmapId: string, classId: string) => void;
  activeLesson: LessonContent;
  setActiveLesson: (lesson: LessonContent) => void;
  socraticChat: ChatMessage[];
  addSocraticMessage: (sender: 'user' | 'ai', text: string) => void;
  syncQueue: SyncLog[];
  clearSyncQueue: () => void;
  teacherSettings: TeacherSettings;
  updateTeacherSettings: (settings: Partial<TeacherSettings>) => void;
  selectedStudent: string;
  setSelectedStudent: (student: string) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  ttsMode: 'tts' | 'ai';
  setTtsMode: (mode: 'tts' | 'ai') => void;
  ttsLimits: { parentLimit: number; teacherLimit: number };
  setTtsLimits: (limits: { parentLimit: number; teacherLimit: number }) => void;
  ttsUsage: Record<string, number>;
  recordTtsUsage: (userId: string, count: number) => void;
  resetTtsUsage: () => void;
  ttsLanguage: 'vi' | 'en';
  setTtsLanguage: (lang: 'vi' | 'en') => void;
  ttsEngine: 'native' | 'google' | 'f5tts' | 'capcut';
  setTtsEngine: (engine: 'native' | 'google' | 'f5tts' | 'capcut') => void;
  ttsVoiceProfile: string;
  setTtsVoiceProfile: (profile: string) => void;
  ttsPitch: number;
  setTtsPitch: (pitch: number) => void;
  ttsRate: number;
  setTtsRate: (rate: number) => void;
  virtualClasses: VirtualClass[];
  createVirtualClass: (vc: Omit<VirtualClass, 'id'>) => void;
  updateVirtualClass: (id: string, updatedData: Partial<Omit<VirtualClass, 'id'>>) => void;
  deleteVirtualClass: (id: string) => void;
  textbooks: Textbook[];
  addTextbook: (tb: Omit<Textbook, 'id'>) => void;
  deleteTextbook: (id: string) => void;
  subjects: Subject[];
  createSubject: (name: string, grade: number, schoolYear: string) => void;
  updateSubject: (id: string, name: string, grade: number, schoolYear: string) => void;
  deleteSubject: (id: string) => void;
  users: User[];
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  createUser: (name: string, email: string, role: Role, password?: string, parentId?: string, classId?: string, birthYear?: number, gender?: string, grade?: number) => void;
  updateUser: (id: string, updatedData: Partial<Omit<User, 'id'>>) => void;
  deleteUser: (id: string) => void;
  assignStudentToClass: (studentId: string, classId: string) => void;
  bulkAssignStudents: (assignments: { studentId: string; classId: string }[]) => void;
  moderationList: any[];
  setModerationList: React.Dispatch<React.SetStateAction<any[]>>;
  progressMap: Record<string, StudentProgress>;
}

const EduSmartContext = createContext<EduSmartContextType | undefined>(undefined);


const getInitialProgress = (studentName: string, isDemo: boolean = false): StudentProgress => {
  if (isDemo || studentName === 'Nguyễn Văn Minh' || studentName === 'Lê Nguyễn Gia Hân') {
    const isGiaHan = studentName === 'Lê Nguyễn Gia Hân';
    return {
      stats: {
        xp: isGiaHan ? 450 : 240,
        coins: isGiaHan ? 250 : 120,
        level: isGiaHan ? 4 : 3,
        streak: isGiaHan ? 12 : 5,
        lastActive: new Date().toISOString()
      },
      pet: {
        name: isGiaHan ? 'Phượng Hoàng Lửa' : 'Cú Học Thức',
        type: isGiaHan ? 'dragon' : 'owl',
        level: isGiaHan ? 3 : 2,
        xp: isGiaHan ? 75 : 45,
        xpNeeded: isGiaHan ? 150 : 100,
        happiness: isGiaHan ? 95 : 90,
        equippedAccessories: isGiaHan ? ['Mũ cử nhân'] : []
      },
      album: {
        unlockedIds: isGiaHan ? ['hl', 'ta', 'vm'] : ['hl'],
        packsCount: isGiaHan ? 3 : 2
      },
      quests: [
        { id: 'q1', description: 'Hoàn thành 1 chặng học bất kỳ', xpReward: 30, coinsReward: 20, completed: isGiaHan },
        { id: 'q2', description: 'Đạt điểm tuyệt đối 100% trong bài tập', xpReward: 50, coinsReward: 30, completed: false },
        { id: 'q3', description: 'Tương tác thảo luận với Gia sư Socratic AI', xpReward: 20, coinsReward: 10, completed: isGiaHan }
      ],
      rewards: [
        { id: 'r1', description: 'Đổi 30 phút xem hoạt hình cuối tuần', cost: 100, status: isGiaHan ? 'approved' : 'available' },
        { id: 'r2', description: 'Một buổi đi chơi công viên nước cùng gia đình', cost: 300, status: 'available' },
        { id: 'r3', description: 'Một cuốn truyện tranh Doraemon tập mới nhất', cost: 200, status: 'available' }
      ],
      roadmaps: JSON.parse(JSON.stringify(DEFAULT_ROADMAPS)),
      socraticChat: [
        { sender: 'ai', text: 'Chào con! Ta là Gia sư Socratic. Con đang gặp khó khăn gì ở bài "Các bộ phận của thực vật" thế? Ta sẽ cùng tìm ra lời giải nhé!', timestamp: new Date().toLocaleTimeString() }
      ]
    };
  }

  return {
    stats: {
      xp: 0,
      coins: 0,
      level: 1,
      streak: 0,
      lastActive: new Date().toISOString()
    },
    pet: {
      name: 'Thú Cưng',
      type: 'owl',
      level: 1,
      xp: 0,
      xpNeeded: 100,
      happiness: 80,
      equippedAccessories: []
    },
    album: {
      unlockedIds: [],
      packsCount: 1
    },
    quests: [
      { id: 'q1', description: 'Hoàn thành 1 chặng học bất kỳ', xpReward: 30, coinsReward: 20, completed: false },
      { id: 'q2', description: 'Đạt điểm tuyệt đối 100% trong bài tập', xpReward: 50, coinsReward: 30, completed: false },
      { id: 'q3', description: 'Tương tác thảo luận với Gia sư Socratic AI', xpReward: 20, coinsReward: 10, completed: false }
    ],
    rewards: [
      { id: 'r1', description: 'Đổi 30 phút xem hoạt hình cuối tuần', cost: 100, status: 'available' },
      { id: 'r2', description: 'Một buổi đi chơi công viên nước cùng gia đình', cost: 300, status: 'available' },
      { id: 'r3', description: 'Một cuốn truyện tranh Doraemon tập mới nhất', cost: 200, status: 'available' }
    ],
    roadmaps: JSON.parse(JSON.stringify(DEFAULT_ROADMAPS)),
    socraticChat: [
      { sender: 'ai', text: 'Chào con! Ta là Gia sư Socratic. Con đang gặp khó khăn gì ở bài "Các bộ phận của thực vật" thế? Ta sẽ cùng tìm ra lời giải nhé!', timestamp: new Date().toLocaleTimeString() }
    ]
  };
};

export const EduSmartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>('student');
  const [isOnline, setIsOnlineState] = useState<boolean>(true);
  const [selectedStudent, setSelectedStudent] = useState<string>('Lê Nguyễn Gia Hân');
  const [loadedStudent, setLoadedStudent] = useState<string>('Lê Nguyễn Gia Hân');
  const [ttsEnabled, setTtsEnabledState] = useState<boolean>(true);
  const [ttsMode, setTtsModeState] = useState<'tts' | 'ai'>('tts');
  const [ttsLimits, setTtsLimitsState] = useState<{ parentLimit: number; teacherLimit: number }>({
    parentLimit: 50000,
    teacherLimit: 100000
  });
  const [ttsUsage, setTtsUsageState] = useState<Record<string, number>>({});
  const [ttsLanguage, setTtsLanguageState] = useState<'vi' | 'en'>('vi');
  const [ttsEngine, setTtsEngineState] = useState<'native' | 'google' | 'f5tts' | 'capcut'>('native');
  const [ttsVoiceProfile, setTtsVoiceProfileState] = useState<string>('vi-northern');
  const [ttsPitch, setTtsPitchState] = useState<number>(1.0);
  const [ttsRate, setTtsRateState] = useState<number>(1.0);
  
  // Master progress map for switching children
  const [progressMap, setProgressMap] = useState<Record<string, StudentProgress>>({});
  
  // Game & Learning states (acting as the active buffer for the selected student)
  const [stats, setStats] = useState<StudentStats>({
    xp: 450,
    coins: 250,
    level: 4,
    streak: 12,
    lastActive: new Date().toISOString()
  });

  const [pet, setPet] = useState<AIPet>({
    name: 'Phượng Hoàng Lửa',
    type: 'dragon',
    level: 3,
    xp: 75,
    xpNeeded: 150,
    happiness: 95,
    equippedAccessories: ['Mũ cử nhân']
  });

  const [album, setAlbum] = useState<StickerAlbum>({
    unlockedIds: ['hl', 'ta', 'vm'],
    packsCount: 3
  });

  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', description: 'Hoàn thành 1 chặng học bất kỳ', xpReward: 30, coinsReward: 20, completed: true },
    { id: 'q2', description: 'Đạt điểm tuyệt đối 100% trong bài tập', xpReward: 50, coinsReward: 30, completed: false },
    { id: 'q3', description: 'Tương tác thảo luận với Gia sư Socratic AI', xpReward: 20, coinsReward: 10, completed: true }
  ]);

  const [rewards, setRewards] = useState<RealWorldReward[]>([
    { id: 'r1', description: 'Đổi 30 phút xem hoạt hình cuối tuần', cost: 100, status: 'available' },
    { id: 'r2', description: 'Một buổi đi chơi công viên nước cùng gia đình', cost: 300, status: 'available' },
    { id: 'r3', description: 'Một cuốn truyện tranh Doraemon tập mới nhất', cost: 200, status: 'available' }
  ]);

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(DEFAULT_ROADMAPS);
  const [activeLesson, setActiveLesson] = useState<LessonContent>(DEFAULT_LESSON);
  const [socraticChat, setSocraticChat] = useState<ChatMessage[]>([
    { sender: 'ai', text: 'Chào con! Ta là Gia sư Socratic. Con đang gặp khó khăn gì ở bài "Các bộ phận của thực vật" thế? Ta sẽ cùng tìm ra lời giải nhé!', timestamp: new Date().toLocaleTimeString() }
  ]);

  const [syncQueue, setSyncQueue] = useState<SyncLog[]>([]);
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>({
    aiProvider: 'gemini',
    geminiKey: '',
    openaiKey: '',
    openaiBaseUrl: 'https://www.cocolink.ai/',
    openaiModel: 'gpt-3.5-turbo'
  });
  const [virtualClasses, setVirtualClasses] = useState<VirtualClass[]>(DEFAULT_VIRTUAL_CLASSES);
  const [textbooks, setTextbooks] = useState<Textbook[]>(DEFAULT_TEXTBOOKS);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  const [moderationList, setModerationList] = useState<any[]>([
    {
      id: 'mod-1',
      subject: 'Khoa học',
      grade: 3,
      title: 'Hệ tiêu hóa của con người',
      status: 'pending',
      schoolYear: '2025-2026',
      content: {
        id: 'sci_g3_digestive',
        title: 'Hệ tiêu hóa của con người',
        warmUp: {
          story: 'Bạn Cú đố các bé nhé: Khi chúng mình ăn một quả táo chín mọng, quả táo sẽ đi qua những cơ quan nào trong bụng để biến thành năng lượng giúp chúng mình chạy nhảy?',
          question: 'Bộ phận nào nhai và nghiền nát thức ăn đầu tiên?',
          options: ['Miệng', 'Thực quản', 'Dạ dày', 'Ruột non']
        },
        explanation: {
          mainContent: `Hệ tiêu hóa gồm nhiều bộ phận nối tiếp nhau:
- **Miệng**: Nhai kỹ và trộn thức ăn với nước bọt.
- **Thực quản**: Ống dẫn đưa thức ăn xuống dạ dày.
- **Dạ dày**: Nhào trộn thức ăn như một chiếc máy xay sinh tố.
- **Ruột non**: Hấp thụ tất cả chất dinh dưỡng có ích nuôi cơ thể.
- **Ruột già**: Đào thải chất cặn bã ra ngoài.`,
          visualHint: '👄 (Miệng nhai) -> 🦒 (Thực quản) -> 🎒 (Dạ dày xay) -> 🌀 (Ruột non hấp thụ) -> 🧻 (Ruột già đào thải)'
        },
        examples: [
          {
            problem: 'Khi ăn cơm, nếu nhai thật kỹ con sẽ thấy cơm có vị ngọt nhẹ. Tại sao vậy?',
            solutionSteps: [
              'Bước 1: Nước bọt trong miệng chứa men tiêu hóa.',
              'Bước 2: Men tiêu hóa biến đổi tinh bột trong cơm thành đường.',
              'Bước 3: Nhai kỹ giúp thức ăn trộn đều với nước bọt nên con cảm giác ngọt!'
            ],
            answer: 'Men tiêu hóa biến đổi tinh bột thành đường'
          }
        ],
        application: {
          realWorldConnection: 'Để bảo vệ dạ dày và giúp cơ thể hấp thụ chất dinh dưỡng tốt nhất, con nhớ "Ăn chín, uống sôi" và "Nhai thật kỹ, không vừa ăn vừa xem tivi" nhé!',
          challengeQuestion: 'Hãy kể tên 1 thói quen tốt cho hệ tiêu hóa của con!'
        },
        practice: [
          {
            id: 'modq1',
            type: 'multiple_choice',
            question: 'Ruột non làm nhiệm vụ chính là gì?',
            options: ['Nghiền nát thức ăn', 'Hấp thụ chất dinh dưỡng', 'Đào thải chất cặn bã', 'Dẫn thức ăn xuống dạ dày'],
            correctAnswer: 'Hấp thụ chất dinh dưỡng',
            explanation: 'Chính xác! Ruột non là nơi hấp thụ phần lớn các chất dinh dưỡng bổ dưỡng để đưa vào máu nuôi cơ thể.',
            hint: 'Đây là đoạn ruột dài nhất nằm cuộn trong bụng của con.'
          }
        ]
      }
    }
  ]);
  
  // User Authentication & Management states
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load state from local storage / IndexedDB / Supabase on mount
  useEffect(() => {
    const loadFromDB = async () => {
      // 1. Load standalone config/offline fields from IndexedDB first
      const cachedRole = await localDB.get<string>('es_role');
      if (cachedRole) setRoleState(cachedRole as Role);
      
      const cachedSettings = await localDB.get<string>('es_teacher_settings');
      if (cachedSettings) setTeacherSettings(JSON.parse(cachedSettings));
      
      const cachedSync = await localDB.get<string>('es_sync_queue');
      if (cachedSync) setSyncQueue(JSON.parse(cachedSync));

      const cachedTts = await localDB.get<string>('es_tts_enabled');
      if (cachedTts) setTtsEnabledState(cachedTts === 'true');

      const cachedTtsMode = await localDB.get<string>('es_tts_mode');
      if (cachedTtsMode) setTtsModeState(cachedTtsMode as 'tts' | 'ai');

      const cachedLimits = await localDB.get<string>('es_tts_limits');
      if (cachedLimits) setTtsLimitsState(JSON.parse(cachedLimits));

      const cachedUsage = await localDB.get<string>('es_tts_usage');
      if (cachedUsage) setTtsUsageState(JSON.parse(cachedUsage));

      const cachedTtsLang = await localDB.get<string>('es_tts_language');
      if (cachedTtsLang) setTtsLanguageState(cachedTtsLang as 'vi' | 'en');

      const cachedTtsEngine = await localDB.get<string>('es_tts_engine');
      if (cachedTtsEngine) setTtsEngineState(cachedTtsEngine as 'native' | 'google' | 'f5tts' | 'capcut');

      const cachedTtsVoiceProfile = await localDB.get<string>('es_tts_voice_profile');
      if (cachedTtsVoiceProfile) setTtsVoiceProfileState(cachedTtsVoiceProfile);

      const cachedTtsPitch = await localDB.get<string>('es_tts_pitch');
      if (cachedTtsPitch) setTtsPitchState(Number(cachedTtsPitch));

      const cachedTtsRate = await localDB.get<string>('es_tts_rate');
      if (cachedTtsRate) setTtsRateState(Number(cachedTtsRate));

      let loadedUsers: User[] = [];
      let loadedClasses: VirtualClass[] = [];
      let loadedTextbooks: Textbook[] = [];
      let currentMods: any[] = [];
      let loadedRoadmaps: Roadmap[] = [];
      let loadedProgressMap: Record<string, StudentProgress> = {};
      let hasSupabaseData = false;

      // 2. Try to fetch dynamic app data from Supabase if online
      const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
      if (!FORCE_OFFLINE && navigator.onLine) {
        try {
          console.log("Loading initial data from Supabase...");
          
          // Users
          const { data: usersData } = await supabase.from('users').select('*');
          if (usersData && usersData.length > 0) {
            loadedUsers = usersData.map((u: any) => ({
              id: u.id,
              name: u.name,
              role: u.role as Role,
              email: u.email,
              password: u.password_hash,
              parentId: u.parent_id || undefined,
              classId: u.class_id || undefined,
              birthYear: u.birth_year || undefined,
              gender: u.gender || undefined,
              grade: u.grade || undefined,
              schoolYear: u.school_year || undefined,
              aiProvider: (u.ai_provider === 'gemini' || u.ai_provider === 'openai') ? u.ai_provider : undefined,
              geminiKey: u.gemini_key || undefined,
              openaiKey: u.openai_key || undefined,
              openaiBaseUrl: u.openai_base_url || undefined,
              openaiModel: u.openai_model || undefined
            }));
          }

          // Classes
          const { data: classesData } = await supabase.from('virtual_classes').select('*');
          if (classesData && classesData.length > 0) {
            loadedClasses = classesData.map((c: any) => ({
              id: c.id,
              name: c.name,
              teacher: c.teacher_name || '',
              teacherId: c.teacher_id || undefined,
              studentsCount: c.students_count || 0,
              grade: c.grade,
              schoolYear: c.school_year,
              maxStudents: c.max_students
            }));
          }

          // Textbooks
          const { data: textbooksData } = await supabase.from('textbooks').select('*');
          if (textbooksData && textbooksData.length > 0) {
            loadedTextbooks = textbooksData.map((tb: any) => ({
              id: tb.id,
              name: tb.name,
              subject: tb.subject,
              grade: tb.grade,
              schoolYear: tb.school_year,
              status: tb.status as 'active' | 'archived',
              size: tb.size || '',
              fileBase64: tb.file_base_64 || undefined
            }));
          }

          // Moderation list
          const { data: modsData } = await supabase.from('moderation_list').select('*');
          if (modsData) {
            currentMods = modsData.map((m: any) => ({
              id: m.id,
              subject: m.subject,
              grade: m.grade,
              title: m.title,
              status: m.status as 'pending' | 'approved' | 'rejected',
              schoolYear: m.school_year,
              content: m.content
            }));
          }

          // Roadmaps & Stages & Class Assignments
          const { data: roadmapsData } = await supabase.from('roadmaps').select('*');
          const { data: stagesData } = await supabase.from('roadmap_stages').select('*');
          const { data: assignmentsData } = await supabase.from('roadmap_class_assignments').select('*');

          if (roadmapsData) {
            loadedRoadmaps = roadmapsData.map((r: any) => {
              const stages = (stagesData || [])
                .filter((s: any) => s.roadmap_id === r.id)
                .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                .map((s: any) => ({
                  id: s.id,
                  subject: s.subject as any,
                  title: s.title,
                  lessonId: s.lesson_id || '',
                  status: s.status as 'locked' | 'available' | 'completed',
                  grade: s.grade,
                  score: s.score || undefined,
                  nextReviewDate: s.next_review_date || undefined,
                  spacedRepetitionInterval: s.spaced_repetition_interval || undefined
                }));
              
              const classIds = (assignmentsData || [])
                .filter((a: any) => a.roadmap_id === r.id)
                .map((a: any) => a.class_id);

              return {
                id: r.id,
                title: r.title,
                status: r.status as 'locked' | 'active' | 'completed',
                grade: r.grade || undefined,
                schoolYear: r.school_year || undefined,
                classId: r.class_id || undefined,
                classIds: classIds.length > 0 ? classIds : (r.class_id ? [r.class_id] : []),
                stages
              };
            });
          }

          // Student Progress Map
          const { data: statsData } = await supabase.from('student_stats').select('*');
          const { data: petsData } = await supabase.from('student_pets').select('*');
          const { data: albumsData } = await supabase.from('student_albums').select('*');
          const { data: questsData } = await supabase.from('student_quests').select('*');
          const { data: rewardsData } = await supabase.from('student_rewards').select('*');
          const { data: chatsData } = await supabase.from('student_socratic_chats').select('*');

          loadedUsers.filter(u => u.role === 'student').forEach(user => {
            const sStats = statsData?.find((s: any) => s.student_id === user.id);
            const sPet = petsData?.find((p: any) => p.student_id === user.id);
            const sAlbum = albumsData?.find((a: any) => a.student_id === user.id);
            const sQuests = questsData?.filter((q: any) => q.student_id === user.id) || [];
            const sRewards = rewardsData?.filter((r: any) => r.student_id === user.id) || [];
            const sChat = chatsData?.find((c: any) => c.student_id === user.id);

            const defaultProgress = getInitialProgress(user.name, user.email === 'minh.nv@edusmart.vn');

            loadedProgressMap[user.name] = {
              stats: sStats ? {
                xp: sStats.xp,
                coins: sStats.coins,
                level: sStats.level,
                streak: sStats.streak,
                lastActive: sStats.last_active
              } : defaultProgress.stats,
              pet: sPet ? {
                name: sPet.name,
                type: sPet.type as any,
                level: sPet.level,
                xp: sPet.xp,
                xpNeeded: sPet.xp_needed,
                happiness: sPet.happiness,
                equippedAccessories: sPet.equipped_accessories || []
              } : defaultProgress.pet,
              album: sAlbum ? {
                unlockedIds: sAlbum.unlocked_sticker_ids || [],
                packsCount: sAlbum.packs_count
              } : defaultProgress.album,
              quests: sQuests.length > 0 ? sQuests.map((q: any) => ({
                id: q.id.split('_')[0],
                description: q.description,
                xpReward: q.xp_reward,
                coinsReward: q.coins_reward,
                completed: q.completed
              })) : defaultProgress.quests,
              rewards: sRewards.length > 0 ? (() => {
                const unique: Record<string, RealWorldReward> = {};
                sRewards.forEach((r: any) => {
                  const baseId = r.id.split('_')[0];
                  if (!unique[baseId] || r.status !== 'available') {
                    unique[baseId] = {
                      id: baseId,
                      description: r.description,
                      cost: r.cost,
                      status: r.status as any,
                      expiresAt: r.expires_at || undefined
                    };
                  }
                });
                return Object.values(unique);
              })() : defaultProgress.rewards,
              roadmaps: JSON.parse(JSON.stringify(loadedRoadmaps)),
              socraticChat: sChat ? sChat.chat_history : defaultProgress.socraticChat
            };
          });

          hasSupabaseData = true;
          console.log("Successfully loaded initial data from Supabase.");
        } catch (supabaseError) {
          console.error("Failed to load from Supabase. Falling back to IndexedDB...", supabaseError);
        }
      }

      // 3. Fallback / LocalDB loading if offline or Supabase load failed
      if (!hasSupabaseData) {
        console.log("Loading data from local IndexedDB cache...");
        
        const cachedUsers = await localDB.get<string>('es_users');
        if (cachedUsers) loadedUsers = JSON.parse(cachedUsers);

        const cachedClasses = await localDB.get<string>('es_virtual_classes');
        if (cachedClasses) loadedClasses = JSON.parse(cachedClasses);

        const cachedTextbooks = await localDB.get<string>('es_textbooks');
        if (cachedTextbooks) loadedTextbooks = JSON.parse(cachedTextbooks);

        const cachedRoadmaps = await localDB.get<string>('es_roadmaps');
        if (cachedRoadmaps) loadedRoadmaps = JSON.parse(cachedRoadmaps);

        const cachedProgressMap = await localDB.get<string>('es_progress_map');
        if (cachedProgressMap) loadedProgressMap = JSON.parse(cachedProgressMap);

        const cachedModerations = await localDB.get<string>('es_moderation_list');
        if (cachedModerations) currentMods = JSON.parse(cachedModerations);
      } else {
        // Cache Supabase data to IndexedDB to keep offline cache up-to-date
        await localDB.set('es_users', JSON.stringify(loadedUsers));
        await localDB.set('es_virtual_classes', JSON.stringify(loadedClasses));
        await localDB.set('es_textbooks', JSON.stringify(loadedTextbooks));
        await localDB.set('es_roadmaps', JSON.stringify(loadedRoadmaps));
        await localDB.set('es_progress_map', JSON.stringify(loadedProgressMap));
        await localDB.set('es_moderation_list', JSON.stringify(currentMods));
      }


      // Initialize state variables with loaded values
      setUsers(loadedUsers);
      setVirtualClasses(loadedClasses);
      setTextbooks(loadedTextbooks);
      setRoadmaps(loadedRoadmaps);
      setProgressMap(loadedProgressMap);

      let loadedSubjects = DEFAULT_SUBJECTS;
      const cachedSubjects = await localDB.get<string>('es_subjects');
      if (cachedSubjects) {
        loadedSubjects = JSON.parse(cachedSubjects);
      } else {
        await localDB.set('es_subjects', JSON.stringify(DEFAULT_SUBJECTS));
      }
      setSubjects(loadedSubjects);

      // Socratic Chat, Stats, Pet, etc. for selected student
      const cachedSelectedStudent = await localDB.get<string>('es_selected_student');
      let studentToLoad = 'Lê Nguyễn Gia Hân';
      if (cachedSelectedStudent && loadedUsers.some(u => u.name === cachedSelectedStudent && u.role === 'student')) {
        studentToLoad = cachedSelectedStudent;
      }
      setSelectedStudent(studentToLoad);
      setLoadedStudent(studentToLoad);

      const demoStudentUser = loadedUsers.find(u => u.email === 'han.lng@edusmart.vn' || u.email === 'minh.nv@edusmart.vn');
      const isDemo = studentToLoad === 'Lê Nguyễn Gia Hân' || studentToLoad === 'Nguyễn Văn Minh' || (demoStudentUser && studentToLoad === demoStudentUser.name);
      const studentProgress = loadedProgressMap[studentToLoad] || getInitialProgress(studentToLoad, isDemo);

      setStats(studentProgress.stats);
      setPet(studentProgress.pet);
      setAlbum(studentProgress.album);
      setQuests(studentProgress.quests);
      setRewards(studentProgress.rewards);
      setSocraticChat(studentProgress.socraticChat);

      // Current logged in user
      const cachedCurrentUser = await localDB.get<string>('es_current_user');
      if (cachedCurrentUser) {
        const parsed = JSON.parse(cachedCurrentUser);
        const latestUser = loadedUsers.find(u => u.id === parsed.id);
        const userToSet = latestUser || parsed;
        setCurrentUser(userToSet);
        setRoleState(userToSet.role);
        
        if (userToSet.role === 'teacher') {
          setTeacherSettings({
            aiProvider: userToSet.openaiKey ? 'openai' : 'gemini',
            geminiKey: userToSet.geminiKey || '',
            openaiKey: userToSet.openaiKey || '',
            openaiBaseUrl: userToSet.openaiBaseUrl || 'https://www.cocolink.ai/',
            openaiModel: userToSet.openaiModel || 'gpt-3.5-turbo'
          });
        }
      }

      // Default moderations list fallback if empty
      if (currentMods.length === 0 && loadedUsers.length === 0) {
        currentMods = [
          {
            id: 'mod-1',
            subject: 'Khoa học',
            grade: 3,
            title: 'Hệ tiêu hóa của con người',
            status: 'pending',
            schoolYear: '2025-2026',
            content: {
              id: 'sci_g3_digestive',
              title: 'Hệ tiêu hóa của con người',
              warmUp: {
                story: 'Bạn Cú đố các bé nhé: Khi chúng mình ăn một quả táo chín mọng, quả táo sẽ đi qua những cơ quan nào trong bụng để biến thành năng lượng giúp chúng mình chạy nhảy?',
                question: 'Bộ phận nào nhai và nghiền nát thức ăn đầu tiên?',
                options: ['Miệng', 'Thực quản', 'Dạ dày', 'Ruột non']
              },
              explanation: {
                mainContent: `Hệ tiêu hóa gồm nhiều bộ phận nối tiếp nhau:
- **Miệng**: Nhai kỹ và trộn thức ăn với nước bọt.
- **Thực quản**: Ống dẫn đưa thức ăn xuống dạ dày.
- **Dạ dày**: Nhào trộn thức ăn như một chiếc máy xay sinh tố.
- **Ruột non**: Hấp thụ tất cả chất dinh dưỡng có ích nuôi cơ thể.
- **Ruột già**: Đào thải chất cặn bã ra ngoài.`,
                visualHint: '👄 (Miệng nhai) -> 🦒 (Thực quản) -> 🎒 (Dạ dày xay) -> 🌀 (Ruột non hấp thụ) -> 🧻 (Ruột già đào thải)'
              },
              examples: [
                {
                  problem: 'Khi ăn cơm, nếu nhai thật kỹ con sẽ thấy cơm có vị ngọt nhẹ. Tại sao vậy?',
                  solutionSteps: [
                    'Bước 1: Nước bọt trong miệng chứa men tiêu hóa.',
                    'Bước 2: Men tiêu hóa biến đổi tinh bột trong cơm thành đường.',
                    'Bước 3: Nhai kỹ giúp thức ăn trộn đều với nước bọt nên con cảm giác ngọt!'
                  ],
                  answer: 'Men tiêu hóa biến đổi tinh bột thành đường'
                }
              ],
              application: {
                realWorldConnection: 'Để bảo vệ dạ dày và giúp cơ thể hấp thụ chất dinh dưỡng tốt nhất, con nhớ "Ăn chín, uống sôi" và "Nhai thật kỹ, không vừa ăn vừa xem tivi" nhé!',
                challengeQuestion: 'Hãy kể tên 1 thói quen tốt cho hệ tiêu hóa của con!'
              },
              practice: [
                {
                  id: 'modq1',
                  type: 'multiple_choice',
                  question: 'Ruột non làm nhiệm vụ chính là gì?',
                  options: ['Nghiền nát thức ăn', 'Hấp thụ chất dinh dưỡng', 'Đào thải chất cặn bã', 'Dẫn thức ăn xuống dạ dày'],
                  correctAnswer: 'Hấp thụ chất dinh dưỡng',
                  explanation: 'Chính xác! Ruột non là nơi hấp thụ phần lớn các chất dinh dưỡng bổ dưỡng để đưa vào máu nuôi cơ thể.',
                  hint: 'Đây là đoạn ruột dài nhất nằm cuộn trong bụng của con.'
                }
              ]
            }
          }
        ];
      }

      // Automatically sync cached lessons from localStorage if missing in moderationList
      const cachedLessonsJson = localStorage.getItem('es_lesson_cache');
      if (cachedLessonsJson) {
        try {
          const cachedLessons = JSON.parse(cachedLessonsJson);
          let updated = false;
          Object.entries(cachedLessons).forEach(([cacheKey, lessonContent]: [string, any]) => {
            const parts = cacheKey.split('_');
            if (parts.length >= 3) {
              const subject = parts[0];
              const grade = Number(parts[1]);
              const title = parts.slice(2).join('_');

              const exists = currentMods.some((m: any) => 
                m.subject === subject && 
                m.grade === grade && 
                m.title === title
              );

              if (!exists) {
                const newMod = {
                  id: 'mod-' + Math.random().toString(36).substring(7),
                  subject,
                  grade,
                  title,
                  status: 'pending' as const,
                  schoolYear: '2025-2026',
                  content: lessonContent
                };
                currentMods.push(newMod);
                updated = true;
              }
            }
          });
          if (updated) {
            await localDB.set('es_moderation_list', JSON.stringify(currentMods));
            if (!FORCE_OFFLINE && navigator.onLine) {
              // Upsert added lessons to Supabase
              const addedMods = currentMods.filter(m => m.id.startsWith('mod-') && m.id.length > 5);
              const modsToUpsert = addedMods.map(m => ({
                id: m.id,
                subject: m.subject,
                grade: m.grade,
                title: m.title,
                status: m.status,
                school_year: m.schoolYear,
                content: m.content
              }));
              await supabase.from('moderation_list').upsert(modsToUpsert);
            }
          }
        } catch (e) {
          console.error("Error auto-syncing cached lessons:", e);
        }
      }

      setModerationList(currentMods);
      setIsDbLoaded(true);
    };

    if (typeof window !== 'undefined') {
      loadFromDB();
    }
  }, []);

  // Listen to browser network changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => {
      setIsOnlineState(true);
    };
    const handleOffline = () => {
      setIsOnlineState(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial connection status
    setIsOnlineState(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isDbLoaded) {
      localDB.set('es_moderation_list', JSON.stringify(moderationList));
    }
  }, [moderationList, isDbLoaded]);

  // Automatically sync virtual class student counts when users array changes
  useEffect(() => {
    if (users.length > 0 && isDbLoaded) {
      setVirtualClasses(prevClasses => {
        const updated = prevClasses.map(c => {
          const count = users.filter(u => u.role === 'student' && u.classId === c.id).length;
          return { ...c, studentsCount: count };
        });
        if (typeof window !== 'undefined') {
          localDB.set('es_virtual_classes', JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [users, isDbLoaded]);

  // Automatically sync teacherSettings for students from their teacher's profile in the users list
  useEffect(() => {
    if (!isDbLoaded || !currentUser) return;
    if (currentUser.role === 'student') {
      const studentClass = virtualClasses.find(c => c.id === currentUser.classId);
      if (studentClass) {
        const teacherUser = users.find(u => u.role === 'teacher' && (u.id === studentClass.teacherId || u.name === studentClass.teacher));
        if (teacherUser) {
          setTeacherSettings({
            aiProvider: teacherUser.aiProvider || (teacherUser.openaiKey ? 'openai' : 'gemini'),
            geminiKey: teacherUser.geminiKey || '',
            openaiKey: teacherUser.openaiKey || '',
            openaiBaseUrl: teacherUser.openaiBaseUrl || 'https://www.cocolink.ai/',
            openaiModel: teacherUser.openaiModel || 'gpt-3.5-turbo'
          });
        }
      }
    }
  }, [currentUser, users, virtualClasses, isDbLoaded]);

  // Switch student progress when selectedStudent changes
  useEffect(() => {
    if (!isDbLoaded) return;
    if (selectedStudent === loadedStudent) return;

    // Load target student progress from progressMap or fallback
    const demoStudentUser = users.find(u => u.email === 'minh.nv@edusmart.vn');
    const isDemo = selectedStudent === 'Nguyễn Văn Minh' || (demoStudentUser && selectedStudent === demoStudentUser.name);
    const targetProgress = progressMap[selectedStudent] || getInitialProgress(selectedStudent, isDemo);
    
    // Set the state variables
    setStats(targetProgress.stats);
    setPet(targetProgress.pet);
    setAlbum(targetProgress.album);
    setQuests(targetProgress.quests);
    setRewards(targetProgress.rewards);
    setRoadmaps(targetProgress.roadmaps);
    setSocraticChat(targetProgress.socraticChat);
    
    // Set loadedStudent to match
    setLoadedStudent(selectedStudent);

    // Also persist selection
    if (typeof window !== 'undefined') {
      localDB.set('es_selected_student', selectedStudent);
    }
  }, [selectedStudent, loadedStudent, progressMap, isDbLoaded]);

  // Sync active states to progressMap under the currently loadedStudent
  useEffect(() => {
    if (!loadedStudent || !isDbLoaded) return;
    
    setProgressMap(prevMap => {
      // Check if there is an actual change to avoid unnecessary state updates
      const current = prevMap[loadedStudent];
      if (
        current &&
        current.stats === stats &&
        current.pet === pet &&
        current.album === album &&
        current.quests === quests &&
        current.rewards === rewards &&
        current.roadmaps === roadmaps &&
        current.socraticChat === socraticChat
      ) {
        return prevMap;
      }

      const updatedMap = {
        ...prevMap,
        [loadedStudent]: {
          stats,
          pet,
          album,
          quests,
          rewards,
          roadmaps,
          socraticChat
        }
      };
      
      if (typeof window !== 'undefined') {
        localDB.set('es_progress_map', JSON.stringify(updatedMap));
      }
      return updatedMap;
    });
  }, [stats, pet, album, quests, rewards, roadmaps, socraticChat, loadedStudent, isDbLoaded]);

  // Supabase User Synchronization
  useEffect(() => {
    if (!isDbLoaded) return;
    const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
    if (typeof window !== 'undefined') {
      localDB.set('es_users', JSON.stringify(users));
    }
    
    if (!FORCE_OFFLINE && isOnline && navigator.onLine) {
      const syncUsers = async () => {
        try {
          const usersToUpsert = users.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role,
            email: u.email,
            password_hash: u.password || '123',
            parent_id: u.parentId || null,
            class_id: u.classId || null,
            birth_year: u.birthYear || null,
            gender: u.gender || null,
            grade: u.grade || null,
            school_year: u.schoolYear || null,
            ai_provider: u.aiProvider || null,
            gemini_key: u.geminiKey || null,
            openai_key: u.openaiKey || null,
            openai_base_url: u.openaiBaseUrl || null,
            openai_model: u.openaiModel || null
          }));
          await supabase.from('users').upsert(usersToUpsert);

          // Handle deletes
          const { data: dbUsers } = await supabase.from('users').select('id');
          if (dbUsers) {
            const localIds = new Set(users.map(u => u.id));
            const idsToDelete = dbUsers.map((u: any) => u.id).filter((id: any) => !localIds.has(id));
            if (idsToDelete.length > 0) {
              await supabase.from('users').delete().in('id', idsToDelete);
            }
          }
        } catch (e) {
          console.error("Error syncing users to Supabase:", e);
        }
      };
      syncUsers();
    }
  }, [users, isDbLoaded, isOnline]);

  // Supabase Virtual Classes Synchronization
  useEffect(() => {
    if (!isDbLoaded) return;
    const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
    
    if (!FORCE_OFFLINE && isOnline && navigator.onLine) {
      const syncClasses = async () => {
        try {
          const classesToUpsert = virtualClasses.map(c => ({
            id: c.id,
            name: c.name,
            teacher_name: c.teacher || null,
            teacher_id: c.teacherId || users.find(u => u.name === c.teacher && u.role === 'teacher')?.id || null,
            students_count: c.studentsCount || 0,
            grade: c.grade,
            school_year: c.schoolYear || '2025-2026',
            max_students: c.maxStudents || 35
          }));
          await supabase.from('virtual_classes').upsert(classesToUpsert);

          // Handle deletes
          const { data: dbClasses } = await supabase.from('virtual_classes').select('id');
          if (dbClasses) {
            const localIds = new Set(virtualClasses.map(c => c.id));
            const idsToDelete = dbClasses.map((c: any) => c.id).filter((id: any) => !localIds.has(id));
            if (idsToDelete.length > 0) {
              await supabase.from('virtual_classes').delete().in('id', idsToDelete);
            }
          }
        } catch (e) {
          console.error("Error syncing classes to Supabase:", e);
        }
      };
      syncClasses();
    }
  }, [virtualClasses, users, isDbLoaded, isOnline]);

  // Supabase Textbooks Synchronization
  useEffect(() => {
    if (!isDbLoaded) return;
    const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
    
    if (!FORCE_OFFLINE && isOnline && navigator.onLine) {
      const syncTextbooks = async () => {
        try {
          const textbooksToUpsert = textbooks.map(tb => ({
            id: tb.id,
            name: tb.name,
            subject: tb.subject,
            grade: tb.grade,
            school_year: tb.schoolYear,
            status: tb.status || 'active',
            size: tb.size || null,
            file_base64: tb.fileBase64 || null
          }));
          await supabase.from('textbooks').upsert(textbooksToUpsert);

          // Handle deletes
          const { data: dbTbs } = await supabase.from('textbooks').select('id');
          if (dbTbs) {
            const localIds = new Set(textbooks.map(t => t.id));
            const idsToDelete = dbTbs.map((t: any) => t.id).filter((id: any) => !localIds.has(id));
            if (idsToDelete.length > 0) {
              await supabase.from('textbooks').delete().in('id', idsToDelete);
            }
          }
        } catch (e) {
          console.error("Error syncing textbooks to Supabase:", e);
        }
      };
      syncTextbooks();
    }
  }, [textbooks, isDbLoaded, isOnline]);

  // Supabase Moderation List Synchronization
  useEffect(() => {
    if (!isDbLoaded) return;
    const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
    
    if (!FORCE_OFFLINE && isOnline && navigator.onLine) {
      const syncModeration = async () => {
        try {
          const modsToUpsert = moderationList.map(m => ({
            id: m.id,
            subject: m.subject,
            grade: m.grade,
            title: m.title,
            status: m.status || 'pending',
            school_year: m.schoolYear || '2025-2026',
            content: m.content
          }));
          await supabase.from('moderation_list').upsert(modsToUpsert);

          // Handle deletes
          const { data: dbMods } = await supabase.from('moderation_list').select('id');
          if (dbMods) {
            const localIds = new Set(moderationList.map(m => m.id));
            const idsToDelete = dbMods.map((m: any) => m.id).filter((id: any) => !localIds.has(id));
            if (idsToDelete.length > 0) {
              await supabase.from('moderation_list').delete().in('id', idsToDelete);
            }
          }
        } catch (e) {
          console.error("Error syncing moderation list to Supabase:", e);
        }
      };
      syncModeration();
    }
  }, [moderationList, isDbLoaded, isOnline]);

  // Supabase Roadmaps Synchronization
  useEffect(() => {
    if (!isDbLoaded) return;
    const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
    if (typeof window !== 'undefined') {
      localDB.set('es_roadmaps', JSON.stringify(roadmaps));
    }
    
    if (!FORCE_OFFLINE && isOnline && navigator.onLine) {
      const syncRoadmaps = async () => {
        try {
          // 1. Roadmaps
          const roadmapsToUpsert = roadmaps.map(r => ({
            id: r.id,
            title: r.title,
            status: r.status,
            grade: r.grade || null,
            school_year: r.schoolYear || null,
            class_id: r.classId || null
          }));
          await supabase.from('roadmaps').upsert(roadmapsToUpsert);

          // Handle deletes
          const { data: dbRoadmaps } = await supabase.from('roadmaps').select('id');
          if (dbRoadmaps) {
            const localIds = new Set(roadmaps.map(r => r.id));
            const idsToDelete = dbRoadmaps.map((r: any) => r.id).filter((id: any) => !localIds.has(id));
            if (idsToDelete.length > 0) {
              await supabase.from('roadmaps').delete().in('id', idsToDelete);
            }
          }

          // 2. Stages
          const allStages: any[] = [];
          roadmaps.forEach(r => {
            if (r.stages) {
              r.stages.forEach((s, idx) => {
                allStages.push({
                  id: s.id,
                  roadmap_id: r.id,
                  subject: s.subject,
                  title: s.title,
                  lesson_id: s.lessonId || null,
                  status: s.status,
                  grade: s.grade,
                  position: idx + 1,
                  score: s.score || null,
                  next_review_date: s.nextReviewDate || null,
                  spaced_repetition_interval: s.spacedRepetitionInterval || null
                });
              });
            }
          });
          if (allStages.length > 0) {
            await supabase.from('roadmap_stages').upsert(allStages);
          }

          // Handle stage deletes
          const { data: dbStages } = await supabase.from('roadmap_stages').select('id');
          if (dbStages) {
            const localStageIds = new Set(allStages.map(s => s.id));
            const idsToDelete = dbStages.map((s: any) => s.id).filter((id: any) => !localStageIds.has(id));
            if (idsToDelete.length > 0) {
              await supabase.from('roadmap_stages').delete().in('id', idsToDelete);
            }
          }

          // 3. Assignments
          const allAssignments: any[] = [];
          roadmaps.forEach(r => {
            const assigned = r.classIds || (r.classId ? [r.classId] : []);
            assigned.forEach(cid => {
              allAssignments.push({ roadmap_id: r.id, class_id: cid });
            });
          });
          
          const roadmapIds = roadmaps.map(r => r.id);
          if (roadmapIds.length > 0) {
            await supabase.from('roadmap_class_assignments').delete().in('roadmap_id', roadmapIds);
            if (allAssignments.length > 0) {
              await supabase.from('roadmap_class_assignments').insert(allAssignments);
            }
          }
        } catch (e) {
          console.error("Error syncing roadmaps to Supabase:", e);
        }
      };
      syncRoadmaps();
    }
  }, [roadmaps, isDbLoaded, isOnline]);

  // Supabase Student Progress Synchronization
  useEffect(() => {
    if (!isDbLoaded || !loadedStudent) return;
    const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
    
    const student = users.find(u => u.name === loadedStudent && u.role === 'student');
    if (!student) return;
    const studentId = student.id;

    if (!FORCE_OFFLINE && isOnline && navigator.onLine) {
      const syncStudentProgress = async () => {
        try {
          // stats
          await supabase.from('student_stats').upsert({
            student_id: studentId,
            xp: stats.xp,
            coins: stats.coins,
            level: stats.level,
            streak: stats.streak,
            last_active: stats.lastActive
          });

          // pet
          await supabase.from('student_pets').upsert({
            student_id: studentId,
            name: pet.name,
            type: pet.type,
            level: pet.level,
            xp: pet.xp,
            xp_needed: pet.xpNeeded,
            happiness: pet.happiness,
            equipped_accessories: pet.equippedAccessories
          });

          // album
          await supabase.from('student_albums').upsert({
            student_id: studentId,
            unlocked_sticker_ids: album.unlockedIds,
            packs_count: album.packsCount
          });

          // quests
          if (quests.length > 0) {
            const questsToUpsert = quests.map(q => ({
              id: q.id.includes('_') ? q.id : `${q.id}_${studentId}`,
              student_id: studentId,
              description: q.description,
              xp_reward: q.xpReward,
              coins_reward: q.coinsReward,
              completed: q.completed
            }));
            await supabase.from('student_quests').upsert(questsToUpsert);
          }

          // rewards sync and delete
          const rewardsToUpsert = rewards.map(r => ({
            id: r.id.includes('_') ? r.id : `${r.id}_${studentId}`,
            student_id: studentId,
            description: r.description,
            cost: r.cost,
            status: r.status,
            expires_at: r.expiresAt || null
          }));
          if (rewardsToUpsert.length > 0) {
            await supabase.from('student_rewards').upsert(rewardsToUpsert);
          }

          // Delete rewards from Supabase that are no longer in client
          const { data: dbRewards } = await supabase.from('student_rewards').select('id').eq('student_id', studentId);
          if (dbRewards) {
            const localIds = new Set(rewards.map(r => r.id.includes('_') ? r.id : `${r.id}_${studentId}`));
            const idsToDelete = dbRewards.map((r: any) => r.id).filter((id: any) => !localIds.has(id));
            if (idsToDelete.length > 0) {
              await supabase.from('student_rewards').delete().in('id', idsToDelete);
            }
          }

          // chat
          await supabase.from('student_socratic_chats').upsert({
            student_id: studentId,
            chat_history: socraticChat
          });
        } catch (e) {
          console.error('Error syncing student progress to Supabase:', e);
        }
      };
      syncStudentProgress();
    }
  }, [stats, pet, album, quests, rewards, socraticChat, loadedStudent, isDbLoaded, users, isOnline]);

  const setTtsEnabled = (enabled: boolean) => {
    setTtsEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_enabled', String(enabled));
    }
  };

  const setTtsMode = (mode: 'tts' | 'ai') => {
    setTtsModeState(mode);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_mode', mode);
    }
  };

  const setTtsLimits = (limits: { parentLimit: number; teacherLimit: number }) => {
    setTtsLimitsState(limits);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_limits', JSON.stringify(limits));
    }
  };

  const recordTtsUsage = (userId: string, count: number) => {
    setTtsUsageState(prev => {
      const updated = { ...prev, [userId]: (prev[userId] || 0) + count };
      if (typeof window !== 'undefined') {
        localDB.set('es_tts_usage', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const resetTtsUsage = () => {
    setTtsUsageState({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('es_tts_usage');
    }
  };

  const setTtsLanguage = (lang: 'vi' | 'en') => {
    setTtsLanguageState(lang);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_language', lang);
    }
  };

  const setTtsEngine = (engine: 'native' | 'google' | 'f5tts' | 'capcut') => {
    setTtsEngineState(engine);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_engine', engine);
    }
  };

  const setTtsVoiceProfile = (profile: string) => {
    setTtsVoiceProfileState(profile);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_voice_profile', profile);
    }
  };

  const setTtsPitch = (pitch: number) => {
    setTtsPitchState(pitch);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_pitch', String(pitch));
    }
  };

  const setTtsRate = (rate: number) => {
    setTtsRateState(rate);
    if (typeof window !== 'undefined') {
      localDB.set('es_tts_rate', String(rate));
    }
  };

  // Helper to persist and queue sync actions
  const logAction = (actionName: string, stateToSave: string, data: any) => {
    localDB.set(stateToSave, JSON.stringify(data));
    
    const newLog: SyncLog = {
      id: Math.random().toString(36).substring(7),
      action: actionName,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'synced' : 'queued'
    };

    setSyncQueue(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // limit to 50 logs
      localDB.set('es_sync_queue', JSON.stringify(updated));
      return updated;
    });
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localDB.set('es_role', newRole);
  };

  const setIsOnline = (online: boolean) => {
    setIsOnlineState(online);
    if (online && syncQueue.some(log => log.status === 'queued')) {
      // Flush offline queue to simulated server
      setSyncQueue(prev => {
        const flushed = prev.map(log => ({ ...log, status: 'synced' as const }));
        localDB.set('es_sync_queue', JSON.stringify(flushed));
        return flushed;
      });
    }
  };

  const updateStats = (xpGained: number, coinsGained: number) => {
    setStats(prev => {
      let newXp = prev.xp + xpGained;
      let newLevel = prev.level;
      let levelUp = false;
      
      // Basic leveling logic: Level x 200 XP needed
      const xpNeeded = newLevel * 200;
      if (newXp >= xpNeeded) {
        newXp -= xpNeeded;
        newLevel += 1;
        levelUp = true;
      }
      
      const updated = {
        ...prev,
        xp: newXp,
        coins: prev.coins + coinsGained,
        level: newLevel,
        streak: prev.streak, // handled elsewhere or incremented
        lastActive: new Date().toISOString()
      };
      
      logAction(`Đạt ${xpGained} XP và ${coinsGained} xu${levelUp ? ' (Lên Cấp!)' : ''}`, 'es_stats', updated);
      return updated;
    });
  };

  const feedPet = (foodXp: number, cost: number): boolean => {
    if (stats.coins < cost) return false;
    
    // Deduct coins
    setStats(prev => {
      const updated = { ...prev, coins: prev.coins - cost };
      localDB.set('es_stats', JSON.stringify(updated));
      return updated;
    });

    setPet(prev => {
      let newXp = prev.xp + foodXp;
      let newLevel = prev.level;
      let newNeeded = prev.xpNeeded;
      
      if (newXp >= newNeeded) {
        newXp -= newNeeded;
        newLevel += 1;
        newNeeded = Math.round(newNeeded * 1.5);
      }
      
      const updated = {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpNeeded: newNeeded,
        happiness: Math.min(prev.happiness + 15, 100)
      };
      
      logAction(`Cho linh vật ăn, cộng ${foodXp} XP vật nuôi`, 'es_pet', updated);
      return updated;
    });

    return true;
  };

  const buyAccessory = (id: string, cost: number): boolean => {
    if (stats.coins < cost || pet.equippedAccessories.includes(id)) return false;

    setStats(prev => {
      const updated = { ...prev, coins: prev.coins - cost };
      localDB.set('es_stats', JSON.stringify(updated));
      return updated;
    });

    setPet(prev => {
      const updated = {
        ...prev,
        equippedAccessories: [...prev.equippedAccessories, id],
        happiness: Math.min(prev.happiness + 20, 100)
      };
      logAction(`Mua trang bị '${id}' cho vật nuôi`, 'es_pet', updated);
      return updated;
    });

    return true;
  };

  const openStickerPack = () => {
    if (album.packsCount <= 0) return;

    // Pick a random sticker from DEFAULT_STICKERS that is not unlocked yet
    const lockedStickers = DEFAULT_STICKERS.filter(s => !album.unlockedIds.includes(s.id));
    let stickerIdToUnlock = '';
    
    if (lockedStickers.length > 0) {
      const randomIndex = Math.floor(Math.random() * lockedStickers.length);
      stickerIdToUnlock = lockedStickers[randomIndex].id;
    } else {
      // Unlock a random one duplicate
      const randomIndex = Math.floor(Math.random() * DEFAULT_STICKERS.length);
      stickerIdToUnlock = DEFAULT_STICKERS[randomIndex].id;
    }

    setAlbum(prev => {
      const newUnlocked = prev.unlockedIds.includes(stickerIdToUnlock)
        ? prev.unlockedIds
        : [...prev.unlockedIds, stickerIdToUnlock];
      
      const updated = {
        unlockedIds: newUnlocked,
        packsCount: prev.packsCount - 1
      };
      
      logAction(`Mở gói sticker: Nhận ${stickerIdToUnlock}`, 'es_album', updated);
      return updated;
    });
  };

  const completeQuest = (id: string) => {
    setQuests(prev => {
      const quest = prev.find(q => q.id === id);
      if (!quest || quest.completed) return prev;
      
      const updated = prev.map(q => q.id === id ? { ...q, completed: true } : q);
      updateStats(quest.xpReward, quest.coinsReward);
      logAction(`Hoàn thành nhiệm vụ: ${quest.description}`, 'es_quests', updated);
      return updated;
    });
  };

  const requestReward = (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward || reward.status !== 'available' || stats.coins < reward.cost) return;

    // Deduct coins and put request in pending
    setStats(prev => {
      const updated = { ...prev, coins: prev.coins - reward.cost };
      localDB.set('es_stats', JSON.stringify(updated));
      return updated;
    });

    setRewards(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: 'pending' as const } : r);
      logAction(`Học sinh yêu cầu đổi quà: ${reward.description}`, 'es_rewards', updated);
      return updated;
    });
  };

  const approveReward = (id: string) => {
    setRewards(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: 'approved' as const } : r);
      logAction(`Phụ huynh duyệt yêu cầu quà: ${id}`, 'es_rewards', updated);
      return updated;
    });
  };

  const rejectReward = (id: string) => {
    const reward = rewards.find(r => r.id === id);
    if (!reward) return;

    // Refund coins
    setStats(prev => {
      const updated = { ...prev, coins: prev.coins + reward.cost };
      localDB.set('es_stats', JSON.stringify(updated));
      return updated;
    });

    setRewards(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r);
      logAction(`Phụ huynh từ chối yêu cầu quà: ${id} (Đã hoàn xu)`, 'es_rewards', updated);
      return updated;
    });
  };

  const addReward = (desc: string, cost: number, expiresAt?: string) => {
    setRewards(prev => {
      const newReward: RealWorldReward = {
        id: 'r-' + Math.random().toString(36).substring(7),
        description: desc,
        cost,
        status: 'available',
        expiresAt
      };
      const updated = [...prev, newReward];
      logAction(`Phụ huynh thêm quà mới: ${desc}`, 'es_rewards', updated);
      return updated;
    });
  };

  const updateReward = (id: string, updatedData: Partial<Omit<RealWorldReward, 'id'>>) => {
    setRewards(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updatedData } : r);
      logAction(`Phụ huynh cập nhật quà: ${id}`, 'es_rewards', updated);
      return updated;
    });
  };

  const deleteReward = (id: string) => {
    setRewards(prev => {
      const updated = prev.filter(r => r.id !== id);
      logAction(`Phụ huynh xóa quà: ${id}`, 'es_rewards', updated);
      return updated;
    });
  };

  const completeStage = (roadmapId: string, stageId: string, score: number) => {
    setRoadmaps(prev => {
      const updatedRoadmaps = prev.map(roadmap => {
        if (roadmap.id !== roadmapId) return roadmap;
        
        let foundIndex = -1;
        const updatedStages = roadmap.stages.map((stage, idx) => {
          if (stage.id === stageId) {
            foundIndex = idx;
            let nextReviewDate: string | undefined = undefined;
            let interval = 1; // default interval in days
            if (stage.subject === 'Toán') {
              if (score >= 90) interval = 7;
              else if (score >= 70) interval = 3;
              else interval = 1;
              const nextDate = new Date();
              nextDate.setDate(nextDate.getDate() + interval);
              nextReviewDate = nextDate.toISOString();
            }
            return { 
              ...stage, 
              status: 'completed' as const, 
              score,
              nextReviewDate,
              spacedRepetitionInterval: interval
            };
          }
          return stage;
        });

        // Unlock next stage in roadmap
        if (foundIndex !== -1 && foundIndex + 1 < updatedStages.length) {
          const nextStage = updatedStages[foundIndex + 1];
          if (nextStage.status === 'locked') {
            updatedStages[foundIndex + 1] = { ...nextStage, status: 'available' as const };
          }
        }

        // Check if roadmap is 100% complete
        const allCompleted = updatedStages.every(s => s.status === 'completed');
        const roadmapStatus = allCompleted ? 'completed' as const : 'active' as const;

        return {
          ...roadmap,
          status: roadmapStatus,
          stages: updatedStages
        };
      });

      // Unlock NEXT roadmap if current roadmap completed
      const currentRoadmap = updatedRoadmaps.find(r => r.id === roadmapId);
      if (currentRoadmap && currentRoadmap.status === 'completed') {
        const nextRoadmapIndex = updatedRoadmaps.findIndex(r => r.id === roadmapId) + 1;
        if (nextRoadmapIndex < updatedRoadmaps.length) {
          const nextRoadmap = updatedRoadmaps[nextRoadmapIndex];
          if (nextRoadmap.status === 'locked') {
            updatedRoadmaps[nextRoadmapIndex] = {
              ...nextRoadmap,
              status: 'active',
              stages: nextRoadmap.stages.map((s, idx) => idx === 0 ? { ...s, status: 'available' } : s)
            };
          }
        }
      }

      // Quest: complete 1 stage
      setQuests(qPrev => {
        const q1 = qPrev.find(q => q.id === 'q1');
        const q2 = qPrev.find(q => q.id === 'q2');
        let newQuests = [...qPrev];
        
        if (q1 && !q1.completed) {
          newQuests = newQuests.map(q => q.id === 'q1' ? { ...q, completed: true } : q);
          updateStats(q1.xpReward, q1.coinsReward);
        }
        if (q2 && !q2.completed && score === 100) {
          newQuests = newQuests.map(q => q.id === 'q2' ? { ...q, completed: true } : q);
          updateStats(q2.xpReward, q2.coinsReward);
        }
        localDB.set('es_quests', JSON.stringify(newQuests));
        return newQuests;
      });

      // Award stage completion points
      const baseXP = score >= 80 ? 50 : 30;
      const baseCoins = score >= 80 ? 25 : 15;
      
      // Auto-unlock sticker pack for high score!
      let newPacksCount = album.packsCount;
      if (score >= 80) {
        newPacksCount += 1;
        setAlbum(a => {
          const updated = { ...a, packsCount: a.packsCount + 1 };
          localDB.set('es_album', JSON.stringify(updated));
          return updated;
        });
      }

      updateStats(baseXP, baseCoins);
      logAction(`Hoàn thành chặng '${stageId}' với điểm số ${score}/100`, 'es_roadmaps', updatedRoadmaps);
      return updatedRoadmaps;
    });
  };

  const createRoadmap = (title: string, grade: number, schoolYear: string, stages: LearningStage[]) => {
    const newId = 'roadmap-' + Math.random().toString(36).substring(7);
    setRoadmaps(prev => {
      const newRoadmap: Roadmap = {
        id: newId,
        title,
        status: 'active',
        stages: stages.map((s, idx) => ({ ...s, status: idx === 0 ? 'available' : 'locked' })),
        grade,
        schoolYear
      };
      const updated = [...prev, newRoadmap];
      if (typeof window !== 'undefined') {
        localDB.set('es_roadmaps', JSON.stringify(updated));
      }
      return updated;
    });
    return newId;
  };

  const updateRoadmap = (id: string, updatedData: Partial<Roadmap>) => {
    setRoadmaps(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, ...updatedData } : r);
      if (typeof window !== 'undefined') {
        localDB.set('es_roadmaps', JSON.stringify(updated));
      }

      // Propagate update to progressMap for students
      const targetRoadmap = updated.find(r => r.id === id);
      if (targetRoadmap) {
        const assignedClassIds = targetRoadmap.classIds || (targetRoadmap.classId ? [targetRoadmap.classId] : []);
        if (assignedClassIds.length > 0) {
          setUsers(prevUsers => {
            const studentNamesInClasses = prevUsers
              .filter(u => u.role === 'student' && u.classId && assignedClassIds.includes(u.classId))
              .map(u => u.name);

            setProgressMap(prevMap => {
              const updatedMap = { ...prevMap };
              studentNamesInClasses.forEach(name => {
                const demoStudentUser = users.find(u => u.email === 'minh.nv@edusmart.vn');
                const isDemo = name === 'Nguyễn Văn Minh' || (demoStudentUser && name === demoStudentUser.name);
                const studentProgress = updatedMap[name] || getInitialProgress(name, isDemo);
                studentProgress.roadmaps = studentProgress.roadmaps.map(r => 
                  r.id === id ? { 
                    ...r, 
                    title: targetRoadmap.title, 
                    stages: targetRoadmap.stages,
                    classId: targetRoadmap.classId,
                    classIds: targetRoadmap.classIds,
                    status: targetRoadmap.status,
                    grade: targetRoadmap.grade,
                    schoolYear: targetRoadmap.schoolYear
                  } : r
                );
                updatedMap[name] = studentProgress;
              });
              if (typeof window !== 'undefined') {
                localDB.set('es_progress_map', JSON.stringify(updatedMap));
              }
              return updatedMap;
            });
            return prevUsers;
          });
        }
      }

      return updated;
    });
  };

  const deleteRoadmap = (id: string) => {
    setRoadmaps(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (typeof window !== 'undefined') {
        localDB.set('es_roadmaps', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const assignRoadmapToClass = (roadmapId: string, classId: string) => {
    const cls = virtualClasses.find(c => c.id === classId);
    if (!cls) return;
    setRoadmaps(prev => {
      const updated = prev.map(r => {
        if (r.id === roadmapId) {
          const currentClassIds = r.classIds || (r.classId ? [r.classId] : []);
          const nextClassIds = currentClassIds.includes(classId) ? currentClassIds : [...currentClassIds, classId];
          return {
            ...r,
            classId,
            classIds: nextClassIds,
            grade: cls.grade,
            schoolYear: cls.schoolYear
          };
        }
        return r;
      });
      if (typeof window !== 'undefined') {
        localDB.set('es_roadmaps', JSON.stringify(updated));
      }
      
      // Update progressMap for students of this class
      setUsers(prevUsers => {
        const studentNamesInClass = prevUsers
          .filter(u => u.role === 'student' && u.classId === classId)
          .map(u => u.name);

        setProgressMap(prevMap => {
          const updatedMap = { ...prevMap };
          studentNamesInClass.forEach(name => {
            const demoStudentUser = users.find(u => u.email === 'minh.nv@edusmart.vn');
            const isDemo = name === 'Nguyễn Văn Minh' || (demoStudentUser && name === demoStudentUser.name);
            const studentProgress = updatedMap[name] || getInitialProgress(name, isDemo);
            const hasRoadmap = studentProgress.roadmaps.some(r => r.id === roadmapId);
            const targetRoadmap = updated.find(r => r.id === roadmapId);
            if (targetRoadmap) {
              if (hasRoadmap) {
                studentProgress.roadmaps = studentProgress.roadmaps.map(r => 
                  r.id === roadmapId ? { 
                    ...r, 
                    title: targetRoadmap.title, 
                    stages: targetRoadmap.stages,
                    classId: targetRoadmap.classId,
                    classIds: targetRoadmap.classIds,
                    status: targetRoadmap.status,
                    grade: targetRoadmap.grade,
                    schoolYear: targetRoadmap.schoolYear
                  } : r
                );
              } else {
                studentProgress.roadmaps = [...studentProgress.roadmaps, JSON.parse(JSON.stringify(targetRoadmap))];
              }
            }
            updatedMap[name] = studentProgress;
          });
          if (typeof window !== 'undefined') {
            localDB.set('es_progress_map', JSON.stringify(updatedMap));
          }
          return updatedMap;
        });
        return prevUsers;
      });

      return updated;
    });
  };

  const addSocraticMessage = (sender: 'user' | 'ai', text: string) => {
    setSocraticChat(prev => {
      const updated = [...prev, { sender, text, timestamp: new Date().toLocaleTimeString() }];
      
      // Update Quest: discuss with AI
      if (sender === 'user') {
        setQuests(qPrev => {
          const q3 = qPrev.find(q => q.id === 'q3');
          if (q3 && !q3.completed) {
            const newQuests = qPrev.map(q => q.id === 'q3' ? { ...q, completed: true } : q);
            updateStats(q3.xpReward, q3.coinsReward);
            localDB.set('es_quests', JSON.stringify(newQuests));
            return newQuests;
          }
          return qPrev;
        });
      }

      return updated;
    });
  };

  const clearSyncQueue = async () => {
    try {
      console.log("Synchronizing offline queue with Supabase Database...");
      
      const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
      if (FORCE_OFFLINE || !navigator.onLine) {
        alert("Không thể đồng bộ khi đang ở chế độ ngoại tuyến.");
        return;
      }

      // Sync Users
      const usersToUpsert = users.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        email: u.email,
        password_hash: u.password || '123',
        parent_id: u.parentId || null,
        class_id: u.classId || null,
        birth_year: u.birthYear || null,
        gender: u.gender || null,
        grade: u.grade || null,
        school_year: u.schoolYear || null
      }));
      await supabase.from('users').upsert(usersToUpsert);

      // Sync Classes
      const classesToUpsert = virtualClasses.map(c => ({
        id: c.id,
        name: c.name,
        teacher_name: c.teacher || null,
        teacher_id: users.find(u => u.name === c.teacher && u.role === 'teacher')?.id || null,
        students_count: c.studentsCount || 0,
        grade: c.grade,
        school_year: c.schoolYear || '2025-2026',
        max_students: c.maxStudents || 35
      }));
      await supabase.from('virtual_classes').upsert(classesToUpsert);

      // Sync Textbooks
      const textbooksToUpsert = textbooks.map(tb => ({
        id: tb.id,
        name: tb.name,
        subject: tb.subject,
        grade: tb.grade,
        school_year: tb.schoolYear,
        status: tb.status || 'active',
        size: tb.size || null,
        file_base64: tb.fileBase64 || null
      }));
      await supabase.from('textbooks').upsert(textbooksToUpsert);

      // Sync Moderations
      const modsToUpsert = moderationList.map(m => ({
        id: m.id,
        subject: m.subject,
        grade: m.grade,
        title: m.title,
        status: m.status || 'pending',
        school_year: m.schoolYear || '2025-2026',
        content: m.content
      }));
      await supabase.from('moderation_list').upsert(modsToUpsert);

      // Sync Roadmaps & Stages & Assignments
      const roadmapsToUpsert = roadmaps.map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        grade: r.grade || null,
        school_year: r.schoolYear || null,
        class_id: r.classId || null
      }));
      await supabase.from('roadmaps').upsert(roadmapsToUpsert);

      const allStages: any[] = [];
      roadmaps.forEach(r => {
        if (r.stages) {
          r.stages.forEach((s, idx) => {
            allStages.push({
              id: s.id,
              roadmap_id: r.id,
              subject: s.subject,
              title: s.title,
              lesson_id: s.lessonId || null,
              status: s.status,
              grade: s.grade,
              position: idx + 1
            });
          });
        }
      });
      if (allStages.length > 0) {
        await supabase.from('roadmap_stages').upsert(allStages);
      }

      const allAssignments: any[] = [];
      roadmaps.forEach(r => {
        const assigned = r.classIds || (r.classId ? [r.classId] : []);
        assigned.forEach(cid => {
          allAssignments.push({ roadmap_id: r.id, class_id: cid });
        });
      });
      
      const roadmapIds = roadmaps.map(r => r.id);
      if (roadmapIds.length > 0) {
        await supabase.from('roadmap_class_assignments').delete().in('roadmap_id', roadmapIds);
        if (allAssignments.length > 0) {
          await supabase.from('roadmap_class_assignments').insert(allAssignments);
        }
      }

      // Sync current student progress
      if (loadedStudent) {
        const student = users.find(u => u.name === loadedStudent && u.role === 'student');
        if (student) {
          const studentId = student.id;
          await supabase.from('student_stats').upsert({
            student_id: studentId,
            xp: stats.xp,
            coins: stats.coins,
            level: stats.level,
            streak: stats.streak,
            last_active: stats.lastActive
          });

          await supabase.from('student_pets').upsert({
            student_id: studentId,
            name: pet.name,
            type: pet.type,
            level: pet.level,
            xp: pet.xp,
            xp_needed: pet.xpNeeded,
            happiness: pet.happiness,
            equipped_accessories: pet.equippedAccessories
          });

          await supabase.from('student_albums').upsert({
            student_id: studentId,
            unlocked_sticker_ids: album.unlockedIds,
            packs_count: album.packsCount
          });

          if (quests.length > 0) {
            const questsToUpsert = quests.map(q => ({
              id: q.id.includes('_') ? q.id : `${q.id}_${studentId}`,
              student_id: studentId,
              description: q.description,
              xp_reward: q.xpReward,
              coins_reward: q.coinsReward,
              completed: q.completed
            }));
            await supabase.from('student_quests').upsert(questsToUpsert);
          }

          if (rewards.length > 0) {
            const rewardsToUpsert = rewards.map(r => ({
              id: r.id.includes('_') ? r.id : `${r.id}_${studentId}`,
              student_id: studentId,
              description: r.description,
              cost: r.cost,
              status: r.status,
              expires_at: r.expiresAt || null
            }));
            await supabase.from('student_rewards').upsert(rewardsToUpsert);
          }

          await supabase.from('student_socratic_chats').upsert({
            student_id: studentId,
            chat_history: socraticChat
          });
        }
      }

      setSyncQueue([]);
      localStorage.removeItem('es_sync_queue');
      alert("Đồng bộ dữ liệu cục bộ với cơ sở dữ liệu Supabase hoàn tất! Hàng chờ đồng bộ đã được làm sạch.");
    } catch (e) {
      console.error("Lỗi đồng bộ Supabase:", e);
      alert("Lỗi khi đồng bộ dữ liệu với cơ sở dữ liệu Supabase.");
    }
  };

  const updateTeacherSettings = (settings: Partial<TeacherSettings>) => {
    setTeacherSettings(prev => {
      const updated = { ...prev, ...settings };
      localDB.set('es_teacher_settings', JSON.stringify(updated));
      return updated;
    });

    if (currentUser && currentUser.role === 'teacher') {
      updateUser(currentUser.id, {
        aiProvider: settings.aiProvider,
        geminiKey: settings.geminiKey,
        openaiKey: settings.openaiKey,
        openaiBaseUrl: settings.openaiBaseUrl,
        openaiModel: settings.openaiModel
      });
    }
  };

  const createVirtualClass = (vc: Omit<VirtualClass, 'id'>) => {
    setVirtualClasses(prev => {
      const teacherId = users.find(u => u.name === vc.teacher && u.role === 'teacher')?.id;
      const newClass = { ...vc, teacherId, id: 'class-' + Math.random().toString(36).substring(7) };
      const updated = [...prev, newClass];
      logAction(`Thành lập lớp học ảo: ${vc.name}`, 'es_virtual_classes', updated);
      return updated;
    });
  };

  const updateVirtualClass = (id: string, updatedData: Partial<Omit<VirtualClass, 'id'>>) => {
    setVirtualClasses(prev => {
      const updated = prev.map(c => {
        if (c.id === id) {
          const nextData = { ...c, ...updatedData };
          if (updatedData.teacher !== undefined) {
            nextData.teacherId = users.find(u => u.name === updatedData.teacher && u.role === 'teacher')?.id;
          }
          return nextData;
        }
        return c;
      });
      logAction(`Cập nhật lớp học ảo: ${id}`, 'es_virtual_classes', updated);
      return updated;
    });
  };

  const deleteVirtualClass = (id: string) => {
    setVirtualClasses(prev => {
      const updated = prev.filter(c => c.id !== id);
      logAction(`Xóa lớp học ảo: ${id}`, 'es_virtual_classes', updated);
      return updated;
    });
  };

  const addTextbook = (tb: Omit<Textbook, 'id'>) => {
    setTextbooks(prev => {
      const newTb: Textbook = { ...tb, id: 'tb-' + Date.now().toString(36) };
      const updated = [newTb, ...prev];
      // Do not store base64 strings in local storage to prevent quota errors
      const strippedData = updated.map(t => ({...t, fileBase64: undefined}));
      if (typeof window !== 'undefined') {
        localDB.set('es_textbooks', JSON.stringify(strippedData));
      }
      return updated;
    });
  };

  const deleteTextbook = (id: string) => {
    setTextbooks(prev => {
      const updated = prev.filter(t => t.id !== id);
      const strippedData = updated.map(t => ({...t, fileBase64: undefined}));
      if (typeof window !== 'undefined') {
        localDB.set('es_textbooks', JSON.stringify(strippedData));
      }
      return updated;
    });
  };

  const login = (email: string, password: string): boolean => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setCurrentUser(foundUser);
      setRoleState(foundUser.role);
      if (foundUser.role === 'student') {
        setSelectedStudent(foundUser.name);
        setLoadedStudent(foundUser.name);
      }
      if (foundUser.role === 'teacher') {
        setTeacherSettings({
          aiProvider: foundUser.aiProvider || (foundUser.openaiKey ? 'openai' : 'gemini'),
          geminiKey: foundUser.geminiKey || '',
          openaiKey: foundUser.openaiKey || '',
          openaiBaseUrl: foundUser.openaiBaseUrl || 'https://www.cocolink.ai/',
          openaiModel: foundUser.openaiModel || 'gpt-3.5-turbo'
        });
      }
      if (typeof window !== 'undefined') {
        localDB.set('es_current_user', JSON.stringify(foundUser));
        localDB.set('es_role', foundUser.role);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localDB.remove('es_current_user');
      localDB.remove('es_role');
      localDB.remove('es_selected_student');
    }
  };

  const generateNextUserId = (currentUsers: User[]): string => {
    const currentYear = new Date().getFullYear().toString();
    const matchingIds = currentUsers
      .map(u => u.id)
      .filter(id => id.startsWith(currentYear) && id.length === 10 && !isNaN(Number(id.substring(4))));
    
    if (matchingIds.length === 0) {
      return `${currentYear}000001`;
    }
    
    const numbers = matchingIds.map(id => Number(id.substring(4)));
    const maxNum = Math.max(...numbers);
    const nextNum = maxNum + 1;
    
    return `${currentYear}${String(nextNum).padStart(6, '0')}`;
  };

  const createUser = (name: string, email: string, userRole: Role, password?: string, parentId?: string, classId?: string, birthYear?: number, gender?: string, grade?: number, schoolYear?: string) => {
    setUsers(prev => {
      const nextId = generateNextUserId(prev);
      const newUser: User = {
        id: nextId,
        name,
        email,
        role: userRole,
        password: password || '123456',
        parentId,
        classId,
        birthYear,
        gender,
        grade,
        schoolYear: schoolYear || (userRole === 'student' ? '2025-2026' : undefined)
      };
      const updated = [...prev, newUser];
      if (typeof window !== 'undefined') {
        localDB.set('es_users', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateUser = (id: string, updatedData: Partial<Omit<User, 'id'>>) => {
    let studentName: string | undefined;
    let oldStudentName: string | undefined;
    let newStudentName: string | undefined;
    let isStudentRole = false;
    let targetClassId = updatedData.classId;

    setUsers(prev => {
      const studentUser = prev.find(u => u.id === id);
      if (studentUser) {
        studentName = studentUser.name;
        isStudentRole = studentUser.role === 'student';
        if (isStudentRole && updatedData.name && updatedData.name.trim() !== studentUser.name) {
          oldStudentName = studentUser.name;
          newStudentName = updatedData.name.trim();
        }
      }

      const updated = prev.map(u => u.id === id ? { ...u, ...updatedData } : u);
      if (typeof window !== 'undefined') {
        localDB.set('es_users', JSON.stringify(updated));
      }
      return updated;
    });

    // Rename progressMap entry if name changed
    if (isStudentRole && oldStudentName && newStudentName) {
      const oldName = oldStudentName;
      const newName = newStudentName;
      setProgressMap(prevMap => {
        const updatedMap = { ...prevMap };
        if (updatedMap[oldName]) {
          updatedMap[newName] = updatedMap[oldName];
          delete updatedMap[oldName];
        }
        if (typeof window !== 'undefined') {
          localDB.set('es_progress_map', JSON.stringify(updatedMap));
        }
        return updatedMap;
      });

      if (selectedStudent === oldName) {
        setSelectedStudent(newName);
      }
      if (loadedStudent === oldName) {
        setLoadedStudent(newName);
      }
      // Update studentName for classId propagation below if it matches
      studentName = newName;
    }

    // Propagate roadmaps sync on classId change
    if (studentName && targetClassId !== undefined) {
      const classId = targetClassId;
      setProgressMap(prevMap => {
        const classRoadmaps = roadmaps.filter(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(classId));
        const updatedMap = { ...prevMap };
        const demoStudentUser = users.find(u => u.email === 'minh.nv@edusmart.vn');
        const isDemo = studentName === 'Nguyễn Văn Minh' || (demoStudentUser && studentName === demoStudentUser.name);
        const studentProgress = updatedMap[studentName!] || getInitialProgress(studentName!, isDemo);
        studentProgress.roadmaps = classRoadmaps.map(cr => {
          const existing = studentProgress.roadmaps.find(r => r.id === cr.id);
          if (existing) {
            return {
              ...cr,
              status: existing.status,
              stages: cr.stages.map(stage => {
                const existingStage = existing.stages.find(s => s.id === stage.id);
                return existingStage ? { ...stage, status: existingStage.status } : stage;
              })
            };
          }
          return JSON.parse(JSON.stringify(cr));
        });
        updatedMap[studentName!] = studentProgress;
        if (typeof window !== 'undefined') {
          localDB.set('es_progress_map', JSON.stringify(updatedMap));
        }
        return updatedMap;
      });
    }

    // Sync currentUser if currently logged in user is updated
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const nextUser = { ...prev, ...updatedData };
        if (typeof window !== 'undefined') {
          localDB.set('es_current_user', JSON.stringify(nextUser));
        }
        return nextUser;
      });
    }
  };

  const deleteUser = (id: string) => {
    let userNameToDelete: string | undefined;

    setUsers(prev => {
      const user = prev.find(u => u.id === id);
      if (user) {
        userNameToDelete = user.name;
      }
      const updated = prev.filter(u => u.id !== id);
      if (typeof window !== 'undefined') {
        localDB.set('es_users', JSON.stringify(updated));
      }
      return updated;
    });

    // Clean up student progress map for the deleted user
    if (userNameToDelete) {
      setProgressMap(prevMap => {
        const updatedMap = { ...prevMap };
        delete updatedMap[userNameToDelete!];
        if (typeof window !== 'undefined') {
          localDB.set('es_progress_map', JSON.stringify(updatedMap));
        }
        return updatedMap;
      });
    }

    // Direct delete from Supabase if online
    const FORCE_OFFLINE = process.env.NEXT_PUBLIC_FORCE_OFFLINE === 'true';
    if (!FORCE_OFFLINE && navigator.onLine) {
      supabase.from('users').delete().eq('id', id).then(({ error }: { error: any }) => {
        if (error) console.error("Error deleting user from Supabase:", error);
      });
    } else {
      // Log offline delete action
      logAction(`Xóa người dùng ID ${id}`, 'es_users_delete', id);
    }
  };

  const assignStudentToClass = (studentId: string, classId: string) => {
    let studentName: string | undefined;

    setUsers(prevUsers => {
      const studentUser = prevUsers.find(u => u.id === studentId);
      if (studentUser) {
        studentName = studentUser.name;
      }
      const updatedUsers = prevUsers.map(u => u.id === studentId ? { ...u, classId } : u);
      if (typeof window !== 'undefined') {
        localDB.set('es_users', JSON.stringify(updatedUsers));
      }
      return updatedUsers;
    });

    // Propagate roadmaps sync to progressMap
    if (studentName) {
      setProgressMap(prevMap => {
        const classRoadmaps = roadmaps.filter(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(classId));
        const updatedMap = { ...prevMap };
        const demoStudentUser = users.find(u => u.email === 'minh.nv@edusmart.vn');
        const isDemo = studentName === 'Nguyễn Văn Minh' || (demoStudentUser && studentName === demoStudentUser.name);
        const studentProgress = updatedMap[studentName!] || getInitialProgress(studentName!, isDemo);
        studentProgress.roadmaps = classRoadmaps.map(cr => {
          const existing = studentProgress.roadmaps.find(r => r.id === cr.id);
          if (existing) {
            return {
              ...cr,
              status: existing.status,
              stages: cr.stages.map(stage => {
                const existingStage = existing.stages.find(s => s.id === stage.id);
                return existingStage ? { ...stage, status: existingStage.status } : stage;
              })
            };
          }
          return JSON.parse(JSON.stringify(cr));
        });
        updatedMap[studentName!] = studentProgress;
        if (typeof window !== 'undefined') {
          localDB.set('es_progress_map', JSON.stringify(updatedMap));
        }
        return updatedMap;
      });
    }

    // Sync currentUser class assignment
    if (currentUser && currentUser.id === studentId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const nextUser = { ...prev, classId };
        if (typeof window !== 'undefined') {
          localDB.set('es_current_user', JSON.stringify(nextUser));
        }
        return nextUser;
      });
    }
  };

  const bulkAssignStudents = (assignments: { studentId: string; classId: string }[]) => {
    const affectedStudents: { name: string; classId: string }[] = [];

    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(u => {
        const found = assignments.find(a => a.studentId === u.id);
        if (found) {
          affectedStudents.push({ name: u.name, classId: found.classId });
          return { ...u, classId: found.classId };
        }
        return u;
      });
      if (typeof window !== 'undefined') {
        localDB.set('es_users', JSON.stringify(updatedUsers));
      }
      return updatedUsers;
    });

    // Propagate roadmaps sync to progressMap for all affected students
    if (affectedStudents.length > 0) {
      setProgressMap(prevMap => {
        const updatedMap = { ...prevMap };
        const demoStudentUser = users.find(u => u.email === 'minh.nv@edusmart.vn');
        affectedStudents.forEach(({ name, classId }) => {
          const classRoadmaps = roadmaps.filter(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(classId));
          const isDemo = name === 'Nguyễn Văn Minh' || (demoStudentUser && name === demoStudentUser.name);
          const studentProgress = updatedMap[name] || getInitialProgress(name, isDemo);
          studentProgress.roadmaps = classRoadmaps.map(cr => {
            const existing = studentProgress.roadmaps.find(r => r.id === cr.id);
            if (existing) {
              return {
                ...cr,
                status: existing.status,
                stages: cr.stages.map(stage => {
                  const existingStage = existing.stages.find(s => s.id === stage.id);
                  return existingStage ? { ...stage, status: existingStage.status } : stage;
                })
              };
            }
            return JSON.parse(JSON.stringify(cr));
          });
          updatedMap[name] = studentProgress;
        });
        if (typeof window !== 'undefined') {
          localDB.set('es_progress_map', JSON.stringify(updatedMap));
        }
        return updatedMap;
      });
    }

    // Sync currentUser in bulk assignments
    if (currentUser) {
      const match = assignments.find(a => a.studentId === currentUser.id);
      if (match) {
        setCurrentUser(prev => {
          if (!prev) return null;
          const nextUser = { ...prev, classId: match.classId };
          if (typeof window !== 'undefined') {
            localDB.set('es_current_user', JSON.stringify(nextUser));
          }
          return nextUser;
        });
      }
    }
  };

  const createSubject = (name: string, grade: number, schoolYear: string) => {
    setSubjects(prev => {
      const newSubject: Subject = {
        id: 'sub-' + Math.random().toString(36).substring(7),
        name,
        grade,
        schoolYear
      };
      const updated = [...prev, newSubject];
      if (typeof window !== 'undefined') {
        localDB.set('es_subjects', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateSubject = (id: string, name: string, grade: number, schoolYear: string) => {
    setSubjects(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, name, grade, schoolYear } : s);
      if (typeof window !== 'undefined') {
        localDB.set('es_subjects', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => {
      const updated = prev.filter(s => s.id !== id);
      if (typeof window !== 'undefined') {
        localDB.set('es_subjects', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return (
    <EduSmartContext.Provider value={{
      role,
      setRole,
      isOnline,
      setIsOnline,
      stats,
      updateStats,
      pet,
      feedPet,
      buyAccessory,
      stickers: DEFAULT_STICKERS,
      album,
      openStickerPack,
      quests,
      completeQuest,
      rewards,
      requestReward,
      approveReward,
      rejectReward,
      addReward,
      updateReward,
      deleteReward,
      roadmaps,
      completeStage,
      createRoadmap,
      updateRoadmap,
      deleteRoadmap,
      assignRoadmapToClass,
      activeLesson,
      setActiveLesson,
      socraticChat,
      addSocraticMessage,
      syncQueue,
      clearSyncQueue,
      teacherSettings,
      updateTeacherSettings,
      selectedStudent,
      setSelectedStudent,
      ttsEnabled,
      setTtsEnabled,
      ttsMode,
      setTtsMode,
      ttsLimits,
      setTtsLimits,
      ttsUsage,
      recordTtsUsage,
      resetTtsUsage,
      ttsLanguage,
      setTtsLanguage,
      ttsEngine,
      setTtsEngine,
      ttsVoiceProfile,
      setTtsVoiceProfile,
      ttsPitch,
      setTtsPitch,
      ttsRate,
      setTtsRate,
      virtualClasses,
      createVirtualClass,
      updateVirtualClass,
      deleteVirtualClass,
      textbooks,
      addTextbook,
      deleteTextbook,
      subjects,
      createSubject,
      updateSubject,
      deleteSubject,
      users,
      currentUser,
      login,
      logout,
      createUser,
      updateUser,
      deleteUser,
      assignStudentToClass,
      bulkAssignStudents,
      moderationList,
      setModerationList,
      progressMap
    }}>
      {children}
    </EduSmartContext.Provider>
  );
};

export const useEduSmart = () => {
  const context = useContext(EduSmartContext);
  if (context === undefined) {
    throw new Error('useEduSmart must be used within an EduSmartProvider');
  }
  return context;
};