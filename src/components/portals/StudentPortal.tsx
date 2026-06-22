'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEduSmart, LearningStage } from '@/store/edusmartStore';
import { TreasureMap } from '../student/TreasureMap';
import { LessonPlayer } from '../student/LessonPlayer';
import { SocraticTutor } from '../student/SocraticTutor';
import { AIPet } from '../student/AIPet';
import { StickerAlbum } from '../student/StickerAlbum';
import { AIArena } from '../student/AIArena';
import { Volume2, Star, Sparkles, ChevronRight, Award, Play, Square } from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { 
    stats, quests, rewards, requestReward, pet, selectedStudent, 
    ttsEnabled, setTtsEnabled, virtualClasses, currentUser,
    activeLesson, setActiveLesson, moderationList,
    ttsMode, setTtsMode,
    ttsLanguage, setTtsLanguage, ttsEngine, setTtsEngine, 
    ttsVoiceProfile, setTtsVoiceProfile, ttsPitch, setTtsPitch, 
    ttsRate, setTtsRate,
    users,
    ttsLimits,
    ttsUsage,
    recordTtsUsage
  } = useEduSmart();

  // Views: 'map' | 'lesson' | 'stickers' | 'arena'
  const [activeView, setActiveView] = useState<'map' | 'lesson' | 'stickers' | 'arena'>('map');
  const [activeStage, setActiveStage] = useState<{ stage: LearningStage; roadmapId: string } | null>(null);

  // Find class dynamically based on student's actual assigned classId
  const assignedClass = virtualClasses.find(c => c.id === currentUser?.classId);
  const className = assignedClass ? assignedClass.name : 'Chưa gán lớp';

  
  // Accessibility Font Size: 'normal' (text-base) | 'medium' (text-lg) | 'large' (text-xl)
  const [fontSize, setFontSize] = useState<'normal' | 'medium' | 'large'>('normal');

  // Widget Order State for Drag and Drop Sidebar
  const [widgetOrder, setWidgetOrder] = useState<string[]>(['quests', 'aipet', 'settings']);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const playNativeTestSpeech = (testText: string) => {
    const utterance = new SpeechSynthesisUtterance(testText);
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
    utterance.onend = () => setIsTestingAudio(false);
    utterance.onerror = () => setIsTestingAudio(false);
    
    setIsTestingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleTestSpeak = async () => {
    if (typeof window === 'undefined') return;
    
    // Stop any active audio/speech
    if (isTestingAudio) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
      }
      setIsTestingAudio(false);
      return;
    }

    const testText = ttsLanguage === 'vi' 
      ? 'Chào con! Đây là giọng đọc trí tuệ nhân tạo của hệ thống EduSmart.'
      : 'Hello there! This is a test of the artificial intelligence voice on EduSmart.';

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
          if (currentUsage + testText.length > limit) {
            alert(`Hạn mức giọng đọc AI tháng này của tài khoản đã hết (${currentUsage.toLocaleString()} / ${limit.toLocaleString()} ký tự).\n\nHệ thống tự động chuyển sang giọng đọc thiết bị. Phụ huynh có thể tự cấu hình API Key riêng trong Cài đặt Phụ huynh để không bị giới hạn.`);
            playNativeTestSpeech(testText);
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
          if (currentUsage + testText.length > limit) {
            alert(`Hạn mức giọng đọc AI tháng này của giáo viên đã hết (${currentUsage.toLocaleString()} / ${limit.toLocaleString()} ký tự).\n\nHệ thống tự động chuyển sang giọng đọc thiết bị. Vui lòng liên hệ Quản trị viên để nâng hạn mức.`);
            playNativeTestSpeech(testText);
            return;
          }
        }
      }

      try {
        setIsTestingAudio(true);
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: testText,
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
          playNativeTestSpeech(testText);
          return;
        }

        if (data.audioContent) {
          // Record usage if we used system key (.env)
          if (!parentApiKey) {
            const isStudent = currentUser?.role === 'student';
            const parentUser = users.find(u => u.id === currentUser?.parentId);
            const usageId = isStudent ? (parentUser?.id || currentUser?.id || 'unknown') : (currentUser?.id || 'unknown');
            recordTtsUsage(usageId, testText.length);
          }

          const mimeType = ttsEngine === 'google' ? 'audio/wav' : 'audio/mp3';
          const audio = new Audio(`data:${mimeType};base64,${data.audioContent}`);
          activeAudioRef.current = audio;
          
          audio.onended = () => {
            setIsTestingAudio(false);
            activeAudioRef.current = null;
          };
          audio.onerror = () => {
            console.error("Audio playback error, falling back to native SpeechSynthesis");
            playNativeTestSpeech(testText);
          };
          
          await audio.play();
        } else {
          playNativeTestSpeech(testText);
        }
      } catch (err) {
        console.error("TTS fetch error, falling back to native:", err);
        playNativeTestSpeech(testText);
      }
      return;
    }

    // Default Web Speech API
    playNativeTestSpeech(testText);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggedWidget(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to make the dragged element visually distinct if needed
    setTimeout(() => {
      const target = e.target as HTMLElement;
      target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedWidget(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;

    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidget);
    const targetIndex = newOrder.indexOf(targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedWidget);
      setWidgetOrder(newOrder);
    }
  };

  const handleSelectStage = (stage: LearningStage, roadmapId: string) => {
    // Look up the designed and approved lesson in the moderation list
    const matchedMod = moderationList.find(
      m => m.title.trim().toLowerCase() === stage.title.trim().toLowerCase() || m.content.id === stage.lessonId
    );

    if (matchedMod) {
      setActiveLesson(matchedMod.content);
    } else {
      // Fallback: use activeLesson structure but update the title
      setActiveLesson({
        ...activeLesson,
        id: stage.lessonId || activeLesson.id,
        title: stage.title,
      });
    }

    setActiveStage({ stage, roadmapId });
    setActiveView('lesson');
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'medium': return 'text-lg';
      case 'large': return 'text-xl';
      default: return 'text-base';
    }
  };

  return (
    <div className={`space-y-6 ${fontSize === 'medium' ? 'prose-lg' : fontSize === 'large' ? 'prose-xl' : ''}`}>
      
      {/* Student Portal Dashboard Header */}
      <div className="p-5 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 rounded-3xl text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

        {/* User profile info */}
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 rounded-full border-4 border-white/60 bg-white flex items-center justify-center text-3xl shadow">
            👦
          </div>
          <div>
            <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">Học sinh</span>
            <h1 className="text-2xl font-black font-display tracking-tight mt-0.5">{selectedStudent}</h1>
            <p className="text-xs font-semibold opacity-90">{className} | Trường Tiểu học EduSmart</p>
          </div>
        </div>

        {/* Level & XP Meter */}
        <div className="flex flex-col items-center md:items-start gap-1 w-full md:w-48">
          <div className="flex justify-between w-full text-xs font-bold">
            <span>Cấp độ {stats.level}</span>
            <span>{stats.xp}/{stats.level * 200} XP</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden border border-white/10">
            <div 
              className="bg-yellow-300 h-full rounded-full transition-all duration-500" 
              style={{ width: `${(stats.xp / (stats.level * 200)) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Coins, Streak, Stickers Summary */}
        <div className="flex gap-3">
          <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-center flex flex-col items-center">
            <span className="text-xl">🪙</span>
            <span className="text-[10px] font-bold opacity-80 uppercase mt-0.5">Tiền Xu</span>
            <span className="text-sm font-black text-yellow-300 mt-0.5">{stats.coins} xu</span>
          </div>
          <div className="bg-white/15 backdrop-blur px-4 py-2 rounded-2xl border border-white/10 text-center flex flex-col items-center">
            <span className="text-xl">🔥</span>
            <span className="text-[10px] font-bold opacity-80 uppercase mt-0.5">Chuỗi Ngày</span>
            <span className="text-sm font-black text-orange-300 mt-0.5">{stats.streak} ngày</span>
          </div>
          <button 
            onClick={() => setActiveView('stickers')}
            className="bg-white/15 backdrop-blur hover:bg-white/25 transition-all px-4 py-2 rounded-2xl border border-white/10 text-center flex flex-col items-center cursor-pointer"
          >
            <span className="text-xl">🚣</span>
            <span className="text-[10px] font-bold opacity-80 uppercase mt-0.5">Sticker</span>
            <span className="text-sm font-black text-indigo-200 mt-0.5">Sưu tập</span>
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left column: Study Workspace / Map / Game */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Dashboard Quick Navigation (Visible only when in map mode) */}
          {activeView === 'map' && (
            <div className="flex gap-3 bg-white/40 p-2.5 rounded-2xl border border-slate-200/50">
              <button 
                onClick={() => setActiveView('map')}
                className="flex-1 py-2 px-3 text-center bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                🗺️ Bản đồ chặng học
              </button>
              <button 
                onClick={() => setActiveView('arena')}
                className="flex-1 py-2 px-3 text-center bg-red-500 hover:bg-red-600 text-white rounded-xl font-extrabold text-xs shadow transition-all cursor-pointer"
              >
                ⚡ Đấu trường AI
              </button>
              <button 
                onClick={() => setActiveView('stickers')}
                className="flex-1 py-2 px-3 text-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-extrabold text-xs shadow transition-all cursor-pointer"
              >
                🚣 Sổ Sticker
              </button>
            </div>
          )}

          {/* Active View Router */}
          <div className={getFontSizeClass()}>
            {activeView === 'map' && (
              <TreasureMap onSelectStage={handleSelectStage} />
            )}
            
            {activeView === 'lesson' && activeStage && (
              <div className="w-full">
                <LessonPlayer 
                  stage={activeStage.stage} 
                  roadmapId={activeStage.roadmapId} 
                  onBack={() => setActiveView('map')} 
                />
              </div>
            )}

            {activeView === 'stickers' && (
              <StickerAlbum onBack={() => setActiveView('map')} />
            )}

            {activeView === 'arena' && (
              <AIArena onBack={() => setActiveView('map')} />
            )}
          </div>

          {/* Real-world Parents Rewards list (Visible in map view) */}
          {activeView === 'map' && (
            <div className="p-6 glass-card rounded-3xl border border-slate-200 space-y-4">
              <h3 className="text-lg font-black text-slate-800 font-display flex items-center gap-1.5">
                🎁 Cơ chế quy đổi xu lấy "Quà đời thực"
              </h3>
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                Tích lũy đủ xu trên hệ thống, con có thể bấm "Yêu cầu quy đổi" gửi thông báo đến điện thoại của bố mẹ để nhận phần quà mong ước ngoài đời thực nhé!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                {rewards.map((reward) => (
                  <div 
                    key={reward.id} 
                    className="p-4 bg-white/80 border border-slate-200 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm"
                  >
                    <span className="text-3xl">🎁</span>
                    <h4 className="text-xs font-black text-slate-700 mt-2 mb-1">{reward.description}</h4>
                    <div className="flex flex-col gap-0.5 mb-3">
                      <span className="text-[11px] font-bold text-yellow-600">Yêu cầu: 🪙 {reward.cost} xu</span>
                      {reward.expiresAt && <span className="text-[9px] font-semibold text-slate-500">⏳ Hạn đổi: {new Date(reward.expiresAt).toLocaleDateString('vi-VN')}</span>}
                    </div>
                    
                    <button
                      onClick={() => requestReward(reward.id)}
                      disabled={reward.status !== 'available' || stats.coins < reward.cost}
                      className={`w-full py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 cursor-pointer ${
                        reward.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : reward.status === 'approved'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : reward.status === 'rejected'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : stats.coins < reward.cost
                          ? 'bg-slate-100 text-slate-400 shadow-none border border-slate-200 cursor-not-allowed'
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-800 font-extrabold shadow'
                      }`}
                    >
                      {reward.status === 'pending' ? 'ĐANG CHỜ BỐ MẸ...' :
                       reward.status === 'approved' ? 'BỐ MẸ ĐÃ DUYỆT! 🎉' :
                       reward.status === 'rejected' ? 'BỐ MẸ TỪ CHỐI 😢' : 'YÊU CẦU ĐỔI QUÀ'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Draggable Widgets Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          {widgetOrder.map((widgetId) => {
            let WidgetContent = null;
            
            if (widgetId === 'settings') {
              WidgetContent = (
                <div className="p-4 glass-card rounded-2xl border border-slate-200/80 space-y-4 bg-white/70 shadow-lg backdrop-blur-md">
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide mb-2">Cài đặt cỡ chữ</h4>
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setFontSize('normal')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${fontSize === 'normal' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Nhỏ
                      </button>
                      <button 
                        onClick={() => setFontSize('medium')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${fontSize === 'medium' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        Vừa
                      </button>
                      <button 
                        onClick={() => setFontSize('large')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${fontSize === 'large' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        To
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                      <Volume2 className={`w-4 h-4 ${ttsEnabled ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
                      Giọng đọc trợ lý (TTS)
                    </span>
                    <button
                      onClick={() => setTtsEnabled(!ttsEnabled)}
                      className={`w-12 h-6.5 rounded-full p-0.5 transition-all duration-350 cursor-pointer flex items-center ${
                        ttsEnabled ? 'bg-indigo-500 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5.5 h-5.5 bg-white rounded-full shadow-md transition-all duration-350"></span>
                    </button>
                  </div>

                  {ttsEnabled && (
                    <div className="space-y-3.5 border-t border-slate-100 pt-3.5 animate-fadeIn">
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Công nghệ giọng đọc</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-0.5 rounded-xl">
                          <button
                            onClick={() => {
                              setTtsMode('tts');
                              setTtsEngine('native');
                              setTtsVoiceProfile('vi-native');
                            }}
                            className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              ttsMode === 'tts' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            🔊 Giọng máy (TTS)
                          </button>
                          <button
                            onClick={() => {
                              setTtsMode('ai');
                              setTtsEngine('google');
                              setTtsVoiceProfile('vi-northern');
                            }}
                            className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              ttsMode === 'ai' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            ✨ Giọng AI (Tự nhiên)
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ngôn ngữ đọc</span>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-0.5 rounded-xl">
                          <button
                            onClick={() => {
                              setTtsLanguage('vi');
                              if (ttsMode === 'tts') {
                                setTtsVoiceProfile('vi-native');
                              } else {
                                setTtsVoiceProfile('vi-northern');
                              }
                            }}
                            className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              ttsLanguage === 'vi' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Tiếng Việt 🇻🇳
                          </button>
                          <button
                            onClick={() => {
                              setTtsLanguage('en');
                              setTtsVoiceProfile('en-us');
                            }}
                            className={`py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                              ttsLanguage === 'en' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            English 🇬🇧
                          </button>
                        </div>
                      </div>

                      {ttsMode === 'ai' && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mô hình AI (Engine)</span>
                          <select
                            value={ttsEngine}
                            onChange={(e) => {
                              const newEngine = e.target.value as any;
                              setTtsEngine(newEngine);
                              if (ttsLanguage === 'vi') {
                                if (newEngine === 'google') setTtsVoiceProfile('vi-northern');
                                else if (newEngine === 'capcut') setTtsVoiceProfile('vi-capcut-sis');
                                else if (newEngine === 'f5tts') setTtsVoiceProfile('vi-f5tts-northern');
                                else setTtsVoiceProfile('vi-native');
                              }
                            }}
                            className="w-full text-xs font-bold bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200/50 focus:outline-none"
                          >
                            <option value="google">✨ Google Cloud TTS (Neural2)</option>
                            <option value="capcut">🎬 CapCut AI Voice (MC / Google)</option>
                            <option value="f5tts">⚡ F5-TTS (AI Open Source)</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Giọng đọc / Vùng miền</span>
                        <select
                          value={ttsVoiceProfile}
                          onChange={(e) => setTtsVoiceProfile(e.target.value)}
                          className="w-full text-xs font-bold bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200/50 focus:outline-none"
                        >
                          {ttsLanguage === 'vi' ? (
                            <>
                              {ttsMode === 'tts' && (
                                <option value="vi-native">Mặc định thiết bị (TTS)</option>
                              )}
                              {ttsMode === 'ai' && (
                                <>
                                  {ttsEngine === 'google' && (
                                    <>
                                      <option value="vi-northern">Google Neural2 - Giọng miền Bắc</option>
                                      <option value="vi-central">Google Neural2 - Giọng miền Trung</option>
                                      <option value="vi-southern">Google Neural2 - Giọng miền Nam</option>
                                    </>
                                  )}
                                  {ttsEngine === 'capcut' && (
                                    <>
                                      <option value="vi-capcut-sis">CapCut AI - Giọng chị Google</option>
                                      <option value="vi-capcut-mc">CapCut AI - Giọng MC Truyền cảm</option>
                                    </>
                                  )}
                                  {ttsEngine === 'f5tts' && (
                                    <>
                                      <option value="vi-f5tts-northern">F5-TTS - Miền Bắc (Tự nhiên)</option>
                                      <option value="vi-f5tts-southern">F5-TTS - Miền Nam (Ấm áp)</option>
                                    </>
                                  )}
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <option value="en-us">Tiếng Anh - Mỹ (US Accent)</option>
                              <option value="en-gb">Tiếng Anh - Anh (UK Accent)</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="space-y-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="flex justify-between text-[11px] font-extrabold text-slate-600">
                          <span>Tông giọng (Pitch): {ttsPitch}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.1"
                          value={ttsPitch}
                          onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />

                        <div className="flex justify-between text-[11px] font-extrabold text-slate-600 mt-1">
                          <span>Tốc độ đọc (Speed): {ttsRate}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.6"
                          step="0.1"
                          value={ttsRate}
                          onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                          className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      <button
                        onClick={handleTestSpeak}
                        className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isTestingAudio
                            ? 'bg-red-500 text-white shadow-md shadow-red-200'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-100 hover:opacity-95'
                        }`}
                      >
                        {isTestingAudio ? (
                          <>
                            <Square className="w-3 h-3 fill-white" />
                            Dừng nghe thử
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-white" />
                            Nghe thử giọng {ttsMode === 'ai' ? 'AI 🦉' : 'máy 🔊'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            } else if (widgetId === 'aipet') {
              WidgetContent = <AIPet />;
            } else if (widgetId === 'quests') {
              WidgetContent = (
                <div className="p-5 glass-card rounded-3xl border border-slate-200 space-y-4 bg-gradient-to-br from-amber-50/50 to-orange-50/20">
                  <div className="cursor-grab">
                    <h3 className="font-extrabold text-sm font-display text-slate-800 flex items-center gap-1.5">
                      <span>🎯 Nhiệm vụ hàng ngày</span>
                      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">3 N.VỤ</span>
                    </h3>
                    <p className="text-[10px] text-orange-700 font-bold mt-1 leading-normal italic opacity-90">
                      (AI tự sinh dựa vào lộ trình học, bài học hoặc giáo viên thêm vào)
                    </p>
                  </div>
                  <div className="space-y-3">
                    {quests.map((quest) => (
                      <div 
                        key={quest.id} 
                        className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                          quest.completed 
                            ? 'bg-slate-100/60 border-slate-200/50 text-slate-400' 
                            : 'bg-white border-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-xl shrink-0">{quest.completed ? '✅' : '🌟'}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-tight ${quest.completed ? 'line-through' : ''}`}>
                            {quest.description}
                          </p>
                          {!quest.completed && (
                            <p className="text-[10px] font-semibold text-orange-600 mt-1">
                              Thưởng: ⭐ {quest.xpReward} XP | 🪙 {quest.coinsReward} Xu
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            } else if (widgetId === 'tutor') {
              WidgetContent = <SocraticTutor />;
            }

            if (!WidgetContent) return null;

            return (
              <div 
                key={widgetId}
                draggable
                onDragStart={(e) => handleDragStart(e, widgetId)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, widgetId)}
                className="cursor-grab active:cursor-grabbing transition-transform"
              >
                {WidgetContent}
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Socratic Tutor Chatbox */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="w-[380px] h-[520px] shadow-2xl rounded-3xl overflow-hidden border border-indigo-100 bg-white/95 backdrop-blur-md transition-all duration-300 transform scale-100 origin-bottom-right mb-4 flex flex-col">
            <SocraticTutor onClose={() => setIsChatOpen(false)} />
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            e.preventDefault();
            try {
              const dataStr = e.dataTransfer.getData('stage-data');
              if (dataStr) {
                const { stage } = JSON.parse(dataStr);
                
                // Set active lesson context to align the AI subject & RAG context
                const matchedMod = moderationList.find(
                  m => m.title.trim().toLowerCase() === stage.title.trim().toLowerCase() || m.content.id === stage.lessonId
                );
                if (matchedMod) {
                  setActiveLesson(matchedMod.content);
                } else {
                  setActiveLesson({
                    id: stage.lessonId || 'math_g3_lesson1',
                    title: stage.title,
                    warmUp: { story: `Chào mừng con đến với bài học ${stage.title}!`, question: 'Sẵn sàng chưa con?' },
                    explanation: { mainContent: `Bài học về ${stage.title}`, visualHint: '' },
                    examples: [],
                    application: { realWorldConnection: '', challengeQuestion: '' },
                    practice: []
                  });
                }

                setIsChatOpen(true);
                // Dispatch custom event to trigger SocraticTutor to ask about this stage
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('ask-socratic-stage', { detail: stage }));
                }, 150);
              }
            } catch (err) {
              console.error("Drop error on Socratic float button:", err);
            }
          }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl border-2 border-white flex items-center justify-center text-3xl cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200 relative group"
          title="Gia sư Socratic AI (Kéo thả chặng học vào đây để hỏi)"
        >
          <span className="animate-bounce">🦉</span>
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-white animate-pulse">
            AI
          </span>
        </button>
      </div>
    </div>
  );
};
