'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEduSmart, LearningStage, LessonContent } from '@/store/edusmartStore';
import { Volume2, ChevronRight, Award, Star, CheckCircle, HelpCircle, ArrowLeft, Send } from 'lucide-react';

interface LessonPlayerProps {
  stage: LearningStage;
  roadmapId: string;
  onBack: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ stage, roadmapId, onBack }) => {
  const { 
    activeLesson, 
    completeStage, 
    ttsEnabled,
    ttsLanguage,
    ttsEngine,
    ttsVoiceProfile,
    ttsPitch,
    ttsRate,
    users,
    currentUser,
    ttsLimits,
    ttsUsage,
    recordTtsUsage
  } = useEduSmart();
  const [activeStep, setActiveStep] = useState<'warmup' | 'discover' | 'application' | 'practice'>('warmup');
  
  // Quiz states
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [dragMatches, setDragMatches] = useState<Record<string, string>>({});
  const [selectedDragOption, setSelectedDragOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [completedScreen, setCompletedScreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Subject-specific states
  const [activeRecallRevealed, setActiveRecallRevealed] = useState(false);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [flippedFlashcards, setFlippedFlashcards] = useState<Record<number, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [shadowingScore, setShadowingScore] = useState<number | null>(null);

  // Pomodoro timer effect
  useEffect(() => {
    let timer: any;
    if (pomodoroRunning && pomodoroSeconds > 0) {
      timer = setInterval(() => {
        setPomodoroSeconds(prev => prev - 1);
      }, 1000);
    } else if (pomodoroSeconds === 0) {
      setPomodoroRunning(false);
      alert("⏱️ Đã hoàn thành 25 phút học tập Pomodoro tập trung! Con hãy nghỉ ngơi 5 phút nhé.");
    }
    return () => clearInterval(timer);
  }, [pomodoroRunning, pomodoroSeconds]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const lesson = activeLesson;

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playNativeSpeech = (cleanText: string) => {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    let bestVoice: SpeechSynthesisVoice | null = null;
    
    if (ttsLanguage === 'vi') {
      const viVoices = voices.filter(v => v.lang.startsWith('vi'));
      if (viVoices.length > 0) {
        if (ttsVoiceProfile.includes('southern')) {
          bestVoice = viVoices.find(v => v.name.toLowerCase().includes('south') || v.name.toLowerCase().includes('nam') || v.name.toLowerCase().includes('hoài my')) || viVoices[0];
        } else if (ttsVoiceProfile.includes('central')) {
          bestVoice = viVoices.find(v => v.name.toLowerCase().includes('central') || v.name.toLowerCase().includes('trung') || v.name.toLowerCase().includes('ba')) || viVoices[0];
        } else {
          bestVoice = viVoices.find(v => v.name.toLowerCase().includes('north') || v.name.toLowerCase().includes('an') || v.name.toLowerCase().includes('tiếng việt')) || viVoices[0];
        }
      }
      utterance.lang = 'vi-VN';
    } else {
      const enVoices = voices.filter(v => v.lang.startsWith('en'));
      if (enVoices.length > 0) {
        if (ttsVoiceProfile === 'en-gb') {
          bestVoice = enVoices.find(v => v.lang.includes('GB') || v.name.toLowerCase().includes('uk') || v.name.toLowerCase().includes('great britain')) || enVoices[0];
        } else {
          bestVoice = enVoices.find(v => v.lang.includes('US') || v.name.toLowerCase().includes('us') || v.name.toLowerCase().includes('united states')) || enVoices[0];
        }
      }
      utterance.lang = 'en-US';
    }

    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Text-To-Speech function using browser SpeechSynthesis with engine configurations
  const speakText = async (text: string) => {
    if (typeof window === 'undefined') return;
    if (!ttsEnabled) return;
    
    // Stop any active audio/speech
    if (isSpeaking) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#`\-]/g, ''); // strip formatting

    // Check limits and extract parent API key if custom AI engine is selected
    let parentApiKey = '';
    if (ttsEngine !== 'native') {
      const isStudent = currentUser?.role === 'student';
      const isTeacher = currentUser?.role === 'teacher';

      if (isStudent) {
        const parentUser = users.find(u => u.id === currentUser?.parentId);
        if (parentUser?.geminiKey) {
          parentApiKey = parentUser.geminiKey;
        } else {
          // Use .env, check parent limit
          const usageId = parentUser?.id || currentUser?.id || 'unknown';
          const currentUsage = ttsUsage[usageId] || 0;
          const limit = ttsLimits.parentLimit || 50000;
          if (currentUsage + cleanText.length > limit) {
            alert(`Hạn mức giọng đọc AI tháng này của tài khoản đã hết (${currentUsage.toLocaleString()} / ${limit.toLocaleString()} ký tự).\n\nHệ thống tự động chuyển sang giọng đọc mặc định của thiết bị. Phụ huynh có thể tự cấu hình API Key riêng trong Cài đặt Phụ huynh để không bị giới hạn.`);
            playNativeSpeech(cleanText);
            return;
          }
        }
      } else if (isTeacher) {
        const hasCustomKey = currentUser?.geminiKey;
        if (hasCustomKey) {
          parentApiKey = hasCustomKey;
        } else {
          // Use .env, check teacher limit
          const usageId = currentUser?.id || 'unknown';
          const currentUsage = ttsUsage[usageId] || 0;
          const limit = ttsLimits.teacherLimit || 100000;
          if (currentUsage + cleanText.length > limit) {
            alert(`Hạn mức giọng đọc AI tháng này của giáo viên đã hết (${currentUsage.toLocaleString()} / ${limit.toLocaleString()} ký tự).\n\nHệ thống tự động chuyển sang giọng đọc thiết bị. Vui lòng liên hệ Quản trị viên để nâng hạn mức.`);
            playNativeSpeech(cleanText);
            return;
          }
        }
      }

      try {
        setIsSpeaking(true);
        abortControllerRef.current = new AbortController();
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortControllerRef.current.signal,
          body: JSON.stringify({
            text: cleanText,
            lang: ttsLanguage,
            voiceProfile: ttsVoiceProfile,
            engine: ttsEngine,
            parentApiKey: parentApiKey
          })
        });

        const data = await response.json();
        if (data.error) {
          console.error("TTS API Error, falling back to native:", data.error);
          alert(`Lỗi phát giọng AI: ${data.error}. Hệ thống tự động chuyển sang giọng đọc thiết bị.`);
          playNativeSpeech(cleanText);
          return;
        }

        if (data.audioContent) {
          // Record usage if we used system key (.env)
          if (!parentApiKey) {
            const isStudent = currentUser?.role === 'student';
            const parentUser = users.find(u => u.id === currentUser?.parentId);
            const usageId = isStudent ? (parentUser?.id || currentUser?.id || 'unknown') : (currentUser?.id || 'unknown');
            recordTtsUsage(usageId, cleanText.length);
          }

          const mimeType = ttsEngine === 'google' ? 'audio/wav' : 'audio/mp3';
          const audio = new Audio(`data:${mimeType};base64,${data.audioContent}`);
          activeAudioRef.current = audio;
          
          audio.onended = () => {
            setIsSpeaking(false);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            console.error("Audio playback error, falling back to native SpeechSynthesis");
            playNativeSpeech(cleanText);
          };
          
          await audio.play();
        } else {
          playNativeSpeech(cleanText);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log("TTS fetch aborted by user.");
          return;
        }
        console.error("TTS fetch error, falling back to native:", err);
        playNativeSpeech(cleanText);
      }
      return;
    }

    // Default Web Speech API
    playNativeSpeech(cleanText);
  };

  const handleSelectMultipleChoice = (qId: string, option: string) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleFillBlankChange = (qId: string, text: string) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: text }));
  };

  // Click-to-connect Drag & Drop simulation
  const handleSelectDragSource = (source: string) => {
    if (quizSubmitted) return;
    setSelectedDragOption(source);
  };

  const handleSelectDragTarget = (target: string) => {
    if (quizSubmitted || !selectedDragOption) return;
    setDragMatches(prev => ({
      ...prev,
      [selectedDragOption]: target
    }));
    setSelectedDragOption(null);
  };

  const handleClearMatches = () => {
    if (quizSubmitted) return;
    setDragMatches({});
    setSelectedDragOption(null);
  };

  const getCorrectMatches = (ans: any): string[] => {
    if (Array.isArray(ans)) return ans;
    if (typeof ans === 'string') return ans.split(',').map(s => s.trim());
    if (typeof ans === 'object' && ans !== null) {
      return Object.entries(ans).map(([k, v]) => `${k} - ${v}`);
    }
    return [];
  };

  const handleGradeQuiz = () => {
    let score = 0;
    const questions = lesson.practice;
    
    questions.forEach(q => {
      if (q.type === 'multiple_choice') {
        if (userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) {
          score += 1;
        }
      } else if (q.type === 'fill_blank') {
        if (userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) {
          score += 1;
        }
      } else if (q.type === 'drag_drop') {
        // Drag-drop matches checking
        const correctMatches = getCorrectMatches(q.correctAnswer);
        let matchesCorrect = true;
        correctMatches.forEach(match => {
          const [src, tgt] = match.split(' - ');
          if (src && tgt && dragMatches[src] !== tgt) {
            matchesCorrect = false;
          }
        });
        if (matchesCorrect && Object.keys(dragMatches).length > 0) {
          score += 1;
        }
      }
    });

    const finalPercent = Math.round((score / questions.length) * 100);
    setQuizScore(finalPercent);
    setQuizSubmitted(true);
  };

  const handleFinishLesson = () => {
    completeStage(roadmapId, stage.id, quizScore);
    setCompletedScreen(true);
  };

  const getSubjectColorTheme = (subject: string) => {
    switch (subject) {
      case 'Toán': return 'from-blue-500 to-cyan-500 text-blue-600 bg-blue-50 border-blue-200';
      case 'Tiếng Việt': return 'from-orange-500 to-rose-500 text-orange-600 bg-orange-50 border-orange-200';
      case 'Ngoại ngữ 1': return 'from-indigo-500 to-purple-500 text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'Khoa học': return 'from-emerald-500 to-teal-500 text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Lịch sử và Địa lí': return 'from-amber-500 to-yellow-500 text-amber-600 bg-amber-50 border-amber-200';
      case 'Tin học và Công nghệ': return 'from-pink-500 to-rose-500 text-pink-600 bg-pink-50 border-pink-200';
      default: return 'from-slate-500 to-slate-600 text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const themeClasses = getSubjectColorTheme(stage.subject);

  if (completedScreen) {
    return (
      <div className="w-full text-center py-12 px-6 glass-card rounded-3xl border border-green-200 animate-pop-in relative overflow-hidden" style={{ background: 'radial-gradient(circle, #f0fdf4 0%, #ffffff 100%)' }}>
        
        {/* Falling Confetti Simulation */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="confetti bg-orange-400" style={{ left: '10%', animationDelay: '0s' }}></div>
          <div className="confetti bg-blue-400" style={{ left: '30%', animationDelay: '1.2s' }}></div>
          <div className="confetti bg-green-400" style={{ left: '50%', animationDelay: '0.5s' }}></div>
          <div className="confetti bg-purple-400" style={{ left: '70%', animationDelay: '2s' }}></div>
          <div className="confetti bg-yellow-400" style={{ left: '90%', animationDelay: '0.8s' }}></div>
        </div>

        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center text-5xl mb-6 shadow-md border border-green-200 animate-bounce">
          🏆
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 font-display">Con làm tốt lắm!</h2>
        <p className="text-slate-600 mt-2 font-medium">Hoàn thành xuất sắc chặng học môn <strong>{stage.subject}</strong></p>
        
        {/* Rewards Summary */}
        <div className="flex justify-center gap-6 my-8 max-w-sm mx-auto">
          <div className="flex-1 bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm flex flex-col items-center">
            <span className="text-3xl mb-1">⭐</span>
            <span className="text-xs font-bold text-amber-800">KINH NGHIỆM</span>
            <span className="text-xl font-extrabold text-amber-700 mt-1">+{quizScore >= 80 ? '50' : '30'} XP</span>
          </div>
          <div className="flex-1 bg-yellow-50 rounded-2xl p-4 border border-yellow-200 shadow-sm flex flex-col items-center">
            <span className="text-3xl mb-1">🪙</span>
            <span className="text-xs font-bold text-yellow-800">XU THƯỞNG</span>
            <span className="text-xl font-extrabold text-yellow-700 mt-1">+{quizScore >= 80 ? '25' : '15'} Xu</span>
          </div>
        </div>

        <div className="bg-white/80 border border-slate-100 rounded-2xl p-4 max-w-md mx-auto mb-8 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Kết quả bài luyện tập:</p>
          <p className="text-4xl font-black text-green-600 mt-1">{quizScore}%</p>
          {quizScore >= 80 ? (
            <p className="text-xs font-bold text-green-600 mt-2">🌟 Nhận được 1 bao thư Sticker bí mật!</p>
          ) : (
            <p className="text-xs font-bold text-slate-500 mt-2">Hãy cố gắng trên 80% lần sau để mở sticker nhé!</p>
          )}
        </div>

        <button
          onClick={onBack}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold shadow-lg hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 active:scale-95 btn-3d"
        >
          Trở về bản đồ
        </button>
      </div>
    );
  }

  return (
    <div className="w-full glass-card rounded-3xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Top Navbar */}
      <div className={`p-4 bg-gradient-to-r ${themeClasses.split(' ').slice(0,2).join(' ')} text-white flex justify-between items-center`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold uppercase opacity-80">{stage.subject} | Khối {stage.grade}</span>
            <h2 className="text-xl font-extrabold font-display leading-tight">{stage.title}</h2>
          </div>
        </div>
        <button
          onClick={() => speakText(
            activeStep === 'warmup' ? `${lesson.warmUp.story} . ${lesson.warmUp.question}` :
            activeStep === 'discover' ? lesson.explanation.mainContent :
            activeStep === 'application' ? `${lesson.application.realWorldConnection} . ${lesson.application.challengeQuestion}` :
            'Cùng làm bài tập nào con!'
          )}
          disabled={!ttsEnabled}
          className={`p-2 rounded-xl border border-white/30 flex items-center gap-1.5 font-bold text-xs cursor-pointer transition-all active:scale-95 ${
            !ttsEnabled ? 'bg-white/5 opacity-40 cursor-not-allowed border-white/10' :
            isSpeaking ? 'bg-red-500/80 animate-pulse' : 'bg-white/20 hover:bg-white/30'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>{!ttsEnabled ? 'Tắt giọng đọc' : isSpeaking ? 'Dừng đọc' : 'Đọc bài'}</span>
        </button>
      </div>

      {/* Active Voice Waveform and Badge */}
      {isSpeaking && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold border-b border-indigo-100 shadow-inner backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="flex gap-0.5 items-end h-3 w-4">
              <span className="w-0.5 bg-white rounded-full animate-wave-1 h-1"></span>
              <span className="w-0.5 bg-white rounded-full animate-wave-2 h-2.5"></span>
              <span className="w-0.5 bg-white rounded-full animate-wave-3 h-1.5"></span>
              <span className="w-0.5 bg-white rounded-full animate-wave-4 h-2"></span>
            </span>
            <span>
              {ttsLanguage === 'vi' ? 'Đang đọc bài bằng giọng AI: ' : 'Reading lesson with AI voice: '}
              <span className="text-amber-300 font-extrabold">
                {ttsEngine === 'google' ? '✨ Google Neural2' :
                 ttsEngine === 'capcut' ? '🎬 CapCut AI ' + (ttsVoiceProfile.includes('mc') ? '(Giọng MC)' : '(Giọng Chị Google)') :
                 ttsEngine === 'f5tts' ? '⚡ F5-TTS Open Source' :
                 '🔊 Trình duyệt (Web Speech)'}
              </span>
            </span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
            {ttsVoiceProfile.includes('southern') ? 'Miền Nam' :
             ttsVoiceProfile.includes('central') ? 'Miền Trung' :
             ttsVoiceProfile.includes('gb') ? 'UK English' :
             ttsVoiceProfile.includes('us') ? 'US English' :
             'Miền Bắc'}
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white/50 text-xs sm:text-sm font-bold text-slate-500">
        <button 
          onClick={() => setActiveStep('warmup')}
          className={`flex-1 py-3 text-center transition-all border-b-4 cursor-pointer ${activeStep === 'warmup' ? 'border-orange-500 text-orange-600 bg-orange-50/50' : 'border-transparent hover:bg-slate-50'}`}
        >
          🚀 Khởi động
        </button>
        <button 
          onClick={() => setActiveStep('discover')}
          className={`flex-1 py-3 text-center transition-all border-b-4 cursor-pointer ${activeStep === 'discover' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent hover:bg-slate-50'}`}
        >
          📖 Khám phá
        </button>
        <button 
          onClick={() => setActiveStep('application')}
          className={`flex-1 py-3 text-center transition-all border-b-4 cursor-pointer ${activeStep === 'application' ? 'border-green-500 text-green-600 bg-green-50/50' : 'border-transparent hover:bg-slate-50'}`}
        >
          🌱 Vận dụng
        </button>
        <button 
          onClick={() => setActiveStep('practice')}
          className={`flex-1 py-3 text-center transition-all border-b-4 cursor-pointer ${activeStep === 'practice' ? 'border-purple-500 text-purple-600 bg-purple-50/50' : 'border-transparent hover:bg-slate-50'}`}
        >
          ✏️ Luyện tập
        </button>
      </div>

      {/* Content Area */}
      <div className="p-6 bg-white/60 flex-1 min-h-[300px]">
        {/* Step 1: WARM UP */}
        {activeStep === 'warmup' && (
          <div className="space-y-6 animate-pop-in">
            <div className="flex gap-4 items-start bg-amber-50 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
              <span className="text-4xl">🦉</span>
              <div>
                <h4 className="font-extrabold text-amber-800 mb-1">Cú Học Thức kể chuyện:</h4>
                <p className="text-slate-700 leading-relaxed font-medium">{lesson.warmUp.story}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-500" />
                <span>Câu đố khởi động:</span>
              </h4>
              <p className="text-slate-700 font-semibold">{lesson.warmUp.question}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {(lesson.warmUp.options || ['Thân cây', 'Lá cây', 'Rễ cây', 'Quả']).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => speakText(`Đáp án con chọn là ${opt}`)}
                    className="p-3 text-left font-bold text-slate-700 rounded-xl border border-slate-200 hover:bg-orange-50 hover:border-orange-300 transition-all hover:scale-[1.01]"
                  >
                    💡 {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveStep('discover')}
                className="px-6 py-2.5 rounded-full bg-slate-800 text-white font-extrabold text-sm flex items-center gap-1.5 shadow hover:bg-slate-700 active:scale-95 transition-all btn-3d"
              >
                Tiếp tục Khám phá
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: EXPLORATION / DISCOVERY */}
        {activeStep === 'discover' && (
          <div className="space-y-6 animate-pop-in">
            {/* Subject Specific Pedagogical Widgets */}

            {/* A. TOÁN: Spaced Repetition Info & Active Recall */}
            {stage.subject === 'Toán' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🧠</span>
                    <div>
                      <h4 className="text-xs font-black text-blue-900 uppercase">Học tập ngắt quãng (Spaced Repetition)</h4>
                      <p className="text-[11px] font-semibold text-blue-700">Đạt điểm cao chặng này để tự động lùi lịch ôn tập dài hơn (1 ➔ 3 ➔ 7 ngày).</p>
                    </div>
                  </div>
                  {stage.nextReviewDate && (
                    <span className="text-[10px] bg-white border border-blue-300 text-blue-700 font-extrabold px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                      📅 Lịch ôn: {new Date(stage.nextReviewDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5">
                      💡 Chủ động gợi nhớ (Active Recall)
                    </h3>
                    <button
                      onClick={() => setActiveRecallRevealed(!activeRecallRevealed)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg text-[10px] transition-all cursor-pointer"
                    >
                      {activeRecallRevealed ? 'Ẩn kiến thức' : 'Xem kiến thức cốt lõi'}
                    </button>
                  </div>

                  {!activeRecallRevealed ? (
                    <div className="py-6 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
                      <span className="text-3xl">🧐</span>
                      <p className="text-xs font-black text-slate-600">Con hãy tự nhẩm lại công thức hoặc cách giải bài này trước nhé!</p>
                      <p className="text-[10px] text-slate-450">Kích hoạt não bộ giúp nhớ lâu gấp 3 lần đọc sách thông thường.</p>
                    </div>
                  ) : (
                    <div className="text-slate-700 space-y-3 leading-relaxed whitespace-pre-line font-semibold bg-blue-50/20 p-4 rounded-xl border border-blue-100/50 animate-fadeIn">
                      {lesson.explanation.mainContent}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* B. HÓA HỌC / KHOA HỌC: Pomodoro & Flowchart */}
            {(stage.subject === 'Khoa học' || stage.subject === 'Tin học và Công nghệ') && (
              <div className="space-y-4">
                {/* Pomodoro Timer */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">⏱️</span>
                    <div>
                      <h4 className="text-xs font-black text-red-900 uppercase">Nhịp học tập tập trung Pomodoro</h4>
                      <p className="text-[11px] font-semibold text-red-700">Tập trung tối đa 25 phút không xao nhãng để đạt hiệu quả cao nhất.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-red-700 font-mono bg-white border border-red-300 px-3 py-1 rounded-xl shadow-inner">
                      {formatTime(pomodoroSeconds)}
                    </span>
                    <button
                      onClick={() => setPomodoroRunning(!pomodoroRunning)}
                      className={`px-3 py-1.5 text-[10px] font-black text-white rounded-xl shadow cursor-pointer transition-all ${
                        pomodoroRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-550 hover:bg-red-600'
                      }`}
                    >
                      {pomodoroRunning ? 'Tạm dừng' : 'Bắt đầu'}
                    </button>
                  </div>
                </div>

                {/* Flowchart Diagram */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    🧬 Sơ đồ tiến trình (Flowchart)
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4 overflow-x-auto">
                    {(() => {
                      const hintText = lesson.explanation.visualHint || '';
                      const steps = hintText.split('->').map(s => s.trim());
                      return steps.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <div className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl text-center shadow-xs min-w-[120px] font-black text-slate-800 text-xs hover:scale-105 transition-all">
                            {step}
                          </div>
                          {idx < steps.length - 1 && (
                            <span className="text-teal-400 font-bold text-xl rotate-90 sm:rotate-0">➔</span>
                          )}
                        </React.Fragment>
                      ));
                    })()}
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-slate-700 text-xs font-semibold leading-relaxed">
                    {lesson.explanation.mainContent}
                  </div>
                </div>
              </div>
            )}

            {/* C. TIẾNG ANH / NGOẠI NGỮ 1: Flashcards & Shadowing */}
            {stage.subject === 'Ngoại ngữ 1' && (
              <div className="space-y-4">
                {/* Shadowing practice widget */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-purple-900 uppercase">🗣️ Luyện đọc nhại (Shadowing)</span>
                    {shadowingScore !== null && (
                      <span className="text-[10px] bg-green-100 text-green-700 font-black px-2 py-0.5 rounded">
                        Độ chuẩn: {shadowingScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-purple-700">Nghe AI đọc mẫu rồi bấm nút thu âm và bắt chước đọc theo cùng tốc độ nhé.</p>
                  
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => speakText("Good morning, class! Today we are learning Unit one Greetings.")}
                      className="px-4 py-2 bg-purple-650 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow"
                    >
                      🔊 AI Đọc Mẫu
                    </button>
                    <button
                      onClick={async () => {
                        setIsRecording(true);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        setIsRecording(false);
                        setShadowingScore(95);
                        alert("🎙️ [Ghi âm thành công] AI phân tích giọng đọc nhại của con đạt: 95% phát âm chuẩn xác!");
                      }}
                      disabled={isRecording}
                      className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all ${
                        isRecording ? 'bg-red-500 animate-pulse' : 'bg-pink-600 hover:bg-pink-700'
                      }`}
                    >
                      🎤 {isRecording ? 'Đang ghi âm...' : 'Bắt đầu Shadowing'}
                    </button>
                  </div>
                </div>

                {/* Vocabulary Flashcards */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    📇 Sưu tầm thẻ từ (Flashcards)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { word: 'Hello', phonetic: '/həˈləʊ/', meaning: 'Xin chào', example: 'Hello, how are you?' },
                      { word: 'Teacher', phonetic: '/ˈtiːtʃə(r)/', meaning: 'Thầy/Cô giáo', example: 'Our teacher is very nice.' },
                      { word: 'Classroom', phonetic: '/ˈklɑːsruːm/', meaning: 'Lớp học', example: 'We clean our classroom everyday.' }
                    ].map((card, idx) => {
                      const isFlipped = !!flippedFlashcards[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => setFlippedFlashcards({ ...flippedFlashcards, [idx]: !isFlipped })}
                          className={`h-32 rounded-2xl border transition-all duration-300 transform preserve-3d cursor-pointer flex flex-col justify-center items-center p-3 text-center shadow-xs hover:-translate-y-1 ${
                            isFlipped 
                              ? 'bg-purple-50 border-purple-300 rotate-y-180' 
                              : 'bg-white border-slate-200 hover:border-purple-250'
                          }`}
                        >
                          {!isFlipped ? (
                            <>
                              <span className="text-base font-black text-purple-700">{card.word}</span>
                              <span className="text-[10px] font-semibold text-slate-400 mt-1">{card.phonetic}</span>
                              <span className="text-[9px] text-slate-400 font-extrabold mt-3 uppercase tracking-wider block">Bấm để lật</span>
                            </>
                          ) : (
                            <div className="rotate-y-180">
                              <span className="text-sm font-black text-slate-700">{card.meaning}</span>
                              <p className="text-[9px] text-slate-500 font-medium italic mt-2">"{card.example}"</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* D. LỊCH SỬ: Storytelling & Timeline */}
            {stage.subject === 'Lịch sử và Địa lí' && (
              <div className="space-y-4 animate-pop-in">
                {/* Horizontal Timeline */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    ⏳ Trục thời gian lịch sử (Timeline)
                  </h3>
                  <div className="flex gap-4 overflow-x-auto py-4 px-2 custom-scrollbar">
                    {[
                      { year: '1070', event: 'Xây dựng Văn Miếu', desc: 'Vua Lý Thánh Tông cho lập Văn Miếu thờ Khổng Tử.' },
                      { year: '1076', event: 'Quốc Tử Giám thành lập', desc: 'Trường đại học hoàng gia đầu tiên mở cửa.' },
                      { year: '1484', event: 'Dựng bia Tiến sĩ', desc: 'Vua Lê Thánh Tông bắt đầu cho khắc tên các tiến sĩ lên bia rùa đá.' }
                    ].map((item, idx) => (
                      <div key={idx} className="min-w-[200px] flex-1 bg-amber-50/40 border border-amber-200 rounded-2xl p-4 shadow-xs relative">
                        <span className="absolute -top-3.5 left-4 bg-amber-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-sm">
                          Năm {item.year}
                        </span>
                        <h4 className="text-xs font-black text-slate-800 mt-1">{item.event}</h4>
                        <p className="text-[10px] text-slate-650 leading-relaxed font-semibold mt-1.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Storytelling card */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <span className="bg-amber-200 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">TRUYỀN THUYẾT LỊCH SỬ</span>
                  <div className="text-slate-700 text-xs font-semibold leading-relaxed whitespace-pre-line pt-1">
                    {lesson.explanation.mainContent}
                  </div>
                </div>
              </div>
            )}

            {/* E. SINH HỌC: Mindmap */}
            {(stage.subject as string) === 'Sinh học' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    🌿 Sơ đồ tư duy học tập (Mindmap)
                  </h3>
                  
                  <div className="p-4 bg-emerald-50/30 border border-emerald-150 rounded-2xl space-y-3">
                    {/* Root node */}
                    <div className="mx-auto max-w-[160px] p-2 bg-emerald-600 text-white text-xs font-black rounded-xl text-center shadow">
                      {stage.title}
                    </div>
                    {/* Level 1 branches */}
                    <div className="grid grid-cols-2 gap-4 pt-4 relative">
                      <div className="p-2.5 bg-white border border-emerald-300 rounded-xl shadow-xs text-center text-[11px] font-bold text-slate-750">
                        🌱 Cấu trúc bên ngoài
                        <div className="text-[9px] text-slate-500 font-semibold mt-1">Rễ, Thân, Lá, Hoa, Quả</div>
                      </div>
                      <div className="p-2.5 bg-white border border-emerald-300 rounded-xl shadow-xs text-center text-[11px] font-bold text-slate-750">
                        🧪 Chức năng sinh lý
                        <div className="text-[9px] text-slate-500 font-semibold mt-1">Hấp thụ nước, Quang hợp</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl text-slate-700 text-xs font-semibold leading-relaxed">
                    {lesson.explanation.mainContent}
                  </div>
                </div>
              </div>
            )}

            {/* F. VẬT LÝ: Practice papers */}
            {(stage.subject as string) === 'Vật lý' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    ⚡ Phân tích bài toán mẫu (Practice papers)
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-xl">
                      <h4 className="text-xs font-black text-blue-900">1. Hiện tượng & Tóm tắt đề bài:</h4>
                      <p className="text-[11px] font-semibold text-slate-700 mt-1 leading-relaxed">{lesson.examples[0].problem}</p>
                    </div>
                    
                    <div className="p-3 bg-indigo-50/40 border border-indigo-200 rounded-xl">
                      <h4 className="text-xs font-black text-indigo-900">2. Công thức áp dụng:</h4>
                      <p className="text-[11px] font-mono font-black text-indigo-700 mt-1">P = F / S | v = s / t</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-black text-slate-800">3. Các bước giải chi tiết:</h4>
                      <div className="space-y-1 mt-1.5">
                        {lesson.examples[0].solutionSteps.map((step, idx) => (
                          <p key={idx} className="text-[11px] font-semibold text-slate-600">{step}</p>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-green-50/50 border border-green-200 rounded-xl flex justify-between items-center">
                      <span className="text-xs font-black text-green-950">4. Đáp số cuối cùng:</span>
                      <strong className="text-sm font-black text-green-700">{lesson.examples[0].answer}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* G. NGỮ VĂN / TIẾNG VIỆT: PEEL Framework */}
            {(stage.subject === 'Tiếng Việt' || (stage.subject as string) === 'Văn') && (
              <div className="space-y-4">
                {/* PEEL explanation card */}
                <div className="bg-pink-50/40 border border-pink-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-pink-150 pb-2">
                    <h3 className="text-sm font-black text-pink-900 uppercase">✍️ Lập luận chuẩn PEEL</h3>
                    <div className="flex gap-2 text-[9px] font-black uppercase">
                      <span className="text-blue-600">P: Point</span>
                      <span className="text-green-600">E: Evidence</span>
                      <span className="text-amber-600">E: Explain</span>
                      <span className="text-pink-600">L: Link</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-pink-100 rounded-xl space-y-3 leading-relaxed font-semibold text-xs text-slate-750">
                    <p className="border-l-4 border-blue-500 pl-2 bg-blue-50/10 py-1">
                      <strong className="text-blue-600">[Point - Luận điểm]:</strong> {lesson.explanation.mainContent.substring(0, 100)}...
                    </p>
                    <p className="border-l-4 border-green-500 pl-2 bg-green-50/10 py-1">
                      <strong className="text-green-600">[Evidence - Dẫn chứng]:</strong> Trích đoạn các ví dụ thực tế được nêu trong bài làm của các nhân vật.
                    </p>
                    <p className="border-l-4 border-amber-500 pl-2 bg-amber-50/10 py-1">
                      <strong className="text-amber-600">[Explanation - Giải thích]:</strong> Giải nghĩa sâu hơn bài học nhân văn, liên hệ thực tế.
                    </p>
                    <p className="border-l-4 border-pink-500 pl-2 bg-pink-50/10 py-1">
                      <strong className="text-pink-600">[Link - Liên kết]:</strong> Hướng dẫn kết bài và tóm gọn ý nghĩa rèn luyện kỹ năng của bản thân học sinh.
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-xs font-semibold leading-relaxed text-slate-700">
                  {lesson.explanation.mainContent}
                </div>
              </div>
            )}

            {/* Default Example Box for non-Physics / standard subjects */}
            {(stage.subject as string) !== 'Vật lý' && stage.subject !== 'Toán' && stage.subject !== 'Ngoại ngữ 1' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">VÍ DỤ THỰC TẾ</span>
                <h4 className="font-extrabold text-slate-800 mt-1">{lesson.examples[0].problem}</h4>
                <div className="space-y-2 mt-3">
                  {lesson.examples[0].solutionSteps.map((step, idx) => (
                    <p key={idx} className="text-sm font-semibold text-slate-600">{step}</p>
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-800 mt-2">👉 Đáp án đúng là: <strong className="text-green-600">{lesson.examples[0].answer}</strong></p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setActiveStep('application')}
                className="px-6 py-2.5 rounded-full bg-slate-800 text-white font-extrabold text-sm flex items-center gap-1.5 shadow hover:bg-slate-700 active:scale-95 transition-all btn-3d"
              >
                Tiếp tục Vận dụng
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: APPLICATION */}
        {activeStep === 'application' && (
          <div className="space-y-6 animate-pop-in">
            <div className="flex gap-4 items-start bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <span className="text-4xl">🌎</span>
              <div>
                <h4 className="font-extrabold text-emerald-800 mb-1">Thế giới quanh ta:</h4>
                <p className="text-slate-700 leading-relaxed font-medium">{lesson.application.realWorldConnection}</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
              <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                <span>Câu hỏi thử thách tư duy:</span>
              </h4>
              <p className="text-slate-700 font-semibold">{lesson.application.challengeQuestion}</p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Gõ câu trả lời của con vào đây..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button 
                  onClick={() => alert('Cảm ơn con đã thử sức câu hỏi vận dụng này! Nhấn Luyện Tập để làm bài thi nhé.')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  Gửi
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveStep('practice')}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold shadow-lg hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-105 active:scale-95 btn-3d"
              >
                Cùng Luyện Tập nào! ✏️
              </button>
            </div>
          </div>
        )}

        {/* Step 4: PRACTICE / QUIZ */}
        {activeStep === 'practice' && (
          <div className="space-y-8 animate-pop-in">
            {lesson.practice.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-0.5 rounded-full">CÂU HỎI {idx + 1}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    q.difficulty === 'easy' ? 'bg-green-50 text-green-700' :
                    q.difficulty === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                  </span>
                </div>
                
                <h4 className="font-extrabold text-slate-800 leading-tight">{q.question_text || q.question}</h4>

                {/* Multiple choice type */}
                {q.type === 'multiple_choice' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {q.options.map((opt) => {
                      const isSelected = userAnswers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          disabled={quizSubmitted}
                          onClick={() => handleSelectMultipleChoice(q.id, opt)}
                          className={`p-3 text-left font-bold rounded-xl border transition-all ${
                            isSelected 
                              ? 'bg-purple-100 border-purple-400 text-purple-800 shadow'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          🎈 {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill blank type */}
                {q.type === 'fill_blank' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      disabled={quizSubmitted}
                      value={userAnswers[q.id] || ''}
                      onChange={(e) => handleFillBlankChange(q.id, e.target.value)}
                      placeholder="Gõ đáp án chính xác vào đây..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                )}

                {/* Click-to-connect drag drop simulation */}
                {q.type === 'drag_drop' && q.options && (
                  <div className="space-y-4 mt-3">
                    <p className="text-xs font-bold text-slate-500 italic">Hướng dẫn: Click vào một bộ phận bên trái, sau đó click vào chức năng tương ứng bên phải để ghép nối.</p>
                    
                    <div className="flex gap-4">
                      {/* Sources */}
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bộ phận</p>
                        {['Quả', 'Hoa'].map(src => {
                          const isSelected = selectedDragOption === src;
                          const isMatched = !!dragMatches[src];
                          return (
                            <button
                              key={src}
                              disabled={quizSubmitted}
                              onClick={() => handleSelectDragSource(src)}
                              className={`w-full p-2.5 text-center font-black rounded-lg border text-sm transition-all ${
                                isSelected ? 'bg-amber-100 border-amber-400 text-amber-800 scale-[1.02]' :
                                isMatched ? 'bg-green-50 border-green-300 text-green-700' :
                                'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {src} {isMatched && '✅'}
                            </button>
                          );
                        })}
                      </div>

                      {/* Targets */}
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chức năng</p>
                        {['Chứa hạt gieo mầm', 'Duy trì nòi giống bằng cách thụ phấn'].map(tgt => {
                          const matchedSource = Object.keys(dragMatches).find(k => dragMatches[k] === tgt);
                          return (
                            <button
                              key={tgt}
                              disabled={quizSubmitted}
                              onClick={() => handleSelectDragTarget(tgt)}
                              className={`w-full p-2.5 text-center font-bold rounded-lg border text-xs transition-all ${
                                matchedSource ? 'bg-green-50 border-green-300 text-green-800' :
                                'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-purple-300'
                              }`}
                            >
                              {tgt} {matchedSource && `(${matchedSource})`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {!quizSubmitted && Object.keys(dragMatches).length > 0 && (
                      <button 
                        onClick={handleClearMatches}
                        className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        Xóa tất cả các cặp đã nối
                      </button>
                    )}
                  </div>
                )}

                {/* Feedback after grading */}
                {quizSubmitted && (
                  <div className={`p-4 rounded-xl border text-sm ${
                    // simple correct checking
                    (q.type === 'multiple_choice' && userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) ||
                    (q.type === 'fill_blank' && userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) ||
                    (q.type === 'drag_drop' && getCorrectMatches(q.correctAnswer).every(match => {
                      const [src, tgt] = match.split(' - ');
                      return src && tgt && dragMatches[src] === tgt;
                    }))
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex gap-2 items-start">
                      <span className="text-xl">
                        {((q.type === 'multiple_choice' && userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) ||
                        (q.type === 'fill_blank' && userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) ||
                        (q.type === 'drag_drop' && getCorrectMatches(q.correctAnswer).every(match => {
                          const [src, tgt] = match.split(' - ');
                          return src && tgt && dragMatches[src] === tgt;
                        }))) ? '✨' : '💪'}
                      </span>
                      <div>
                        <p className="font-extrabold">
                          {((q.type === 'multiple_choice' && userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) ||
                          (q.type === 'fill_blank' && userAnswers[q.id]?.toLowerCase().trim() === (q.correctAnswer as string).toLowerCase().trim()) ||
                          (q.type === 'drag_drop' && getCorrectMatches(q.correctAnswer).every(match => {
                            const [src, tgt] = match.split(' - ');
                            return src && tgt && dragMatches[src] === tgt;
                          }))) ? 'Giải thích đúng:' : 'Lời khuyên sửa lỗi:'}
                        </p>
                        <p className="mt-0.5 font-medium">{q.explanation}</p>
                        <p className="text-xs font-bold text-slate-500 mt-1">Đáp án đúng: {
                          getCorrectMatches(q.correctAnswer).join(' | ') || (typeof q.correctAnswer === 'string' ? q.correctAnswer : '')
                        }</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              {!quizSubmitted ? (
                <button
                  onClick={handleGradeQuiz}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold shadow-md hover:from-purple-600 hover:to-indigo-600 active:scale-95 transition-all btn-3d"
                >
                  Nộp bài chấm điểm
                </button>
              ) : (
                <button
                  onClick={handleFinishLesson}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold shadow-md hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all btn-3d flex items-center gap-1"
                >
                  <CheckCircle className="w-5 h-5" />
                  Hoàn thành chặng
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
