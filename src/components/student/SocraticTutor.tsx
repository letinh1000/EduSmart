'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEduSmart } from '@/store/edusmartStore';
import { Send, Volume2, Sparkles, User, RefreshCw } from 'lucide-react';

interface SocraticTutorProps {
  onClose?: () => void;
}

export const SocraticTutor: React.FC<SocraticTutorProps> = ({ onClose }) => {
  const { 
    socraticChat, 
    addSocraticMessage, 
    activeLesson, 
    setActiveLesson,
    moderationList,
    teacherSettings, 
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
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [socraticChat]);

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

  const sendText = async (userText: string) => {
    if (loading) return;
    addSocraticMessage('user', userText);
    setLoading(true);

    try {
      // 1. Slice chat history to the most recent 6 messages to save tokens
      const maxHistoryMessages = 6;
      const nextChat = [...socraticChat, { sender: 'user' as const, text: userText, timestamp: new Date().toLocaleTimeString() }];
      const recentHistory = nextChat.slice(-maxHistoryMessages);
      const chatContext = recentHistory.map(msg => 
        `${msg.sender === 'user' ? 'Học sinh' : 'Gia sư'}: ${msg.text}`
      ).join('\n');

      // 2. Client-Side RAG Retrieval based on student query
      let lessonRAGContext = "";
      if (activeLesson) {
        const title = activeLesson.title || "";
        const warmUp = activeLesson.warmUp ? `Phần Khởi động: ${activeLesson.warmUp.story} - Câu hỏi: ${activeLesson.warmUp.question}` : "";
        const explanation = activeLesson.explanation ? `Phần Khám phá: ${activeLesson.explanation.mainContent}` : "";
        
        let examplesText = "";
        if (activeLesson.examples && Array.isArray(activeLesson.examples)) {
          examplesText = `Ví dụ mẫu: ${activeLesson.examples.map((ex: any) => `${ex.problem} (Lời giải: ${ex.solutionSteps?.join(' -> ') || ex.answer})`).join('; ')}`;
        }
        
        const application = activeLesson.application ? `Phần Vận dụng: ${activeLesson.application.realWorldConnection}` : "";

        const query = userText.toLowerCase();
        const retrievedParts: string[] = [];

        if (query.includes("khởi động") || query.includes("bắt đầu") || query.includes("warmup")) {
          if (warmUp) retrievedParts.push(warmUp);
        }
        if (query.includes("lý thuyết") || query.includes("bài giảng") || query.includes("giải thích") || query.includes("khám phá") || query.includes("học")) {
          if (explanation) retrievedParts.push(explanation);
        }
        if (query.includes("ví dụ") || query.includes("mẫu") || query.includes("luyện tập")) {
          if (examplesText) retrievedParts.push(examplesText);
        }
        if (query.includes("vận dụng") || query.includes("thực tế") || query.includes("thực tiễn")) {
          if (application) retrievedParts.push(application);
        }

        // Fallback RAG: Provide core explanation if query doesn't match specific sections
        if (retrievedParts.length === 0) {
          if (explanation) retrievedParts.push(explanation);
          if (examplesText) retrievedParts.push(examplesText.slice(0, 200));
        }

        lessonRAGContext = `\n[Tài liệu bài học thực tế (RAG)]: Sách: ${title}\n${retrievedParts.join('\n')}\n`;
      }

      let activeSubject = '';
      const lessonId = activeLesson.id || '';
      if (lessonId.startsWith('math_')) {
        activeSubject = 'Toán';
      } else if (lessonId.startsWith('viet_')) {
        activeSubject = 'Văn';
      } else if (lessonId.startsWith('eng_')) {
        activeSubject = 'Anh';
      } else if (lessonId.startsWith('sci_')) {
        activeSubject = 'Sinh học';
      } else if (lessonId.startsWith('hist_')) {
        activeSubject = 'Lịch sử';
      }

      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent: 'socratic',
          prompt: `Ngữ cảnh Bài học:${lessonRAGContext}\n\nLịch sử hội thoại gần đây:\n${chatContext}\n\nHọc sinh hỏi: "${userText}"\n\nHãy phản hồi ngắn gọn theo hướng gợi mở Socratic.`,
          subject: activeSubject,
          aiProvider: teacherSettings.aiProvider || 'gemini',
          customApiKey: teacherSettings.geminiKey || '',
          openaiKey: teacherSettings.openaiKey || '',
          openaiBaseUrl: teacherSettings.openaiBaseUrl || '',
          openaiModel: teacherSettings.openaiModel || ''
        })
      });

      const data = await response.json();
      
      if (data.error) {
        addSocraticMessage('ai', `Ta gặp chút lỗi nhỏ: ${data.error}. Con thử lại nhé! 🦉`);
      } else {
        addSocraticMessage('ai', data.result);
      }
    } catch (error) {
      console.error('Error talking to Socratic tutor:', error);
      addSocraticMessage('ai', 'Ta đang bận tưới nước cho vườn rồi, con hỏi lại sau 1 chút nhé! 🦉');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    await sendText(userText);
  };

  // Listen for dropped stage custom event
  useEffect(() => {
    const handleAskStageEvent = (e: Event) => {
      const stage = (e as CustomEvent).detail;
      if (stage && stage.title) {
        sendText(`Hãy hướng dẫn gợi mở giúp con học chặng này nhé: "${stage.title}" (Môn ${stage.subject})`);
      }
    };
    window.addEventListener('ask-socratic-stage', handleAskStageEvent);
    return () => {
      window.removeEventListener('ask-socratic-stage', handleAskStageEvent);
    };
  }, [socraticChat, activeLesson, teacherSettings, loading]);

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

  const playNativeMessageSpeech = (cleanText: string, index: number) => {
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
    utterance.onend = () => setSpeakingMessageIndex(null);
    utterance.onerror = () => setSpeakingMessageIndex(null);
    
    setSpeakingMessageIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const speakMessage = async (text: string, index: number) => {
    if (typeof window === 'undefined') return;
    if (!ttsEnabled) return;
    
    // Stop any active audio/speech
    if (speakingMessageIndex === index) {
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
      setSpeakingMessageIndex(null);
      return;
    }

    const cleanText = text.replace(/[*#`\-]/g, '');

    // Call server-side API if custom AI engine is selected
    if (ttsEngine !== 'native') {
      // Check limits and extract parent API key if custom AI engine is selected
      let parentApiKey = '';
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
            alert(`Hạn mức giọng đọc AI tháng này của tài khoản đã hết (${currentUsage.toLocaleString()} / ${limit.toLocaleString()} ký tự).\n\nHệ thống tự động chuyển sang giọng đọc thiết bị. Phụ huynh có thể tự cấu hình API Key riêng trong Cài đặt Phụ huynh để không bị giới hạn.`);
            playNativeMessageSpeech(cleanText, index);
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
            playNativeMessageSpeech(cleanText, index);
            return;
          }
        }
      }

      try {
        setSpeakingMessageIndex(index);
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
          playNativeMessageSpeech(cleanText, index);
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
            setSpeakingMessageIndex(null);
            activeAudioRef.current = null;
          };
          
          let fallbackCalled = false;
          const triggerFallback = () => {
            if (!fallbackCalled) {
              fallbackCalled = true;
              playNativeMessageSpeech(cleanText, index);
            }
          };

          audio.onerror = () => {
            console.warn("Audio playback error, falling back to native SpeechSynthesis");
            triggerFallback();
          };
          
          try {
            await audio.play();
          } catch (playError) {
            console.warn("Audio play failed, falling back to native SpeechSynthesis:", playError);
            triggerFallback();
          }
        } else {
          playNativeMessageSpeech(cleanText, index);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log("TTS fetch aborted by user.");
          return;
        }
        console.warn("TTS fetch error, falling back to native:", err);
        playNativeMessageSpeech(cleanText, index);
      }
      return;
    }

    // Default Web Speech API
    playNativeMessageSpeech(cleanText, index);
  };

  return (
    <div 
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

            // Dispatch event to trigger ask-socratic-stage
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('ask-socratic-stage', { detail: stage }));
            }, 50);
          }
        } catch (err) {
          console.error("Drop error on Socratic chat window:", err);
        }
      }}
      className="w-full h-full flex flex-col glass-card rounded-3xl border border-indigo-100 overflow-hidden bg-white/60"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-float">🦉</span>
          <div>
            <h3 className="font-extrabold text-sm font-display flex items-center gap-1">
              Gia Sư Socratic AI
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            </h3>
            <p className="text-[10px] opacity-95">Không giải bài hộ, giúp con tự nghĩ!</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20">GIỌNG ĐỌC VIỆT</span>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-full transition-all text-white font-bold text-xs"
              title="Thu nhỏ"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px] max-h-[420px] bg-indigo-50/20">
        {socraticChat.map((msg, idx) => {
          const isAi = msg.sender === 'ai';
          const isSpeaking = speakingMessageIndex === idx;

          return (
            <div
              key={idx}
              className={`flex gap-2.5 items-start ${isAi ? '' : 'flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm shrink-0 ${
                isAi ? 'bg-indigo-100 border border-indigo-200' : 'bg-orange-100 border border-orange-200'
              }`}>
                {isAi ? '🦉' : '👦'}
              </div>

              {/* Bubble */}
              <div className="group relative max-w-[80%]">
                <div className={`p-3 rounded-2xl text-xs font-bold leading-relaxed shadow-sm ${
                  isAi 
                    ? 'bg-white border border-indigo-50 text-slate-700 rounded-tl-none' 
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                  {isSpeaking && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-indigo-500 font-extrabold animate-fadeIn">
                      <div className="flex items-center gap-1.5">
                        <span className="flex gap-0.5 items-end h-2 w-3.5 shrink-0">
                          <span className="w-0.5 bg-indigo-500 rounded-full animate-wave-1 h-1"></span>
                          <span className="w-0.5 bg-indigo-500 rounded-full animate-wave-2 h-2.5"></span>
                          <span className="w-0.5 bg-indigo-500 rounded-full animate-wave-3 h-1.5"></span>
                          <span className="w-0.5 bg-indigo-550 rounded-full animate-wave-4 h-2"></span>
                        </span>
                        <span>
                          {ttsEngine === 'google' ? 'Google Neural2' :
                           ttsEngine === 'capcut' ? 'CapCut AI (' + (ttsVoiceProfile.includes('mc') ? 'MC' : 'Chị Google') + ')' :
                           ttsEngine === 'f5tts' ? 'F5-TTS AI' :
                           'Giọng hệ thống'}
                        </span>
                      </div>
                      <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase text-[9px] scale-95 origin-right">
                        {ttsVoiceProfile.includes('southern') ? 'Miền Nam' :
                         ttsVoiceProfile.includes('central') ? 'Miền Trung' :
                         ttsVoiceProfile.includes('gb') ? 'UK Accent' :
                         ttsVoiceProfile.includes('us') ? 'US Accent' :
                         'Miền Bắc'}
                      </span>
                    </div>
                  )}
                </div>

                {/* TTS button inside speech bubbles */}
                {isAi && (
                  <button
                    onClick={() => speakMessage(msg.text, idx)}
                    disabled={!ttsEnabled}
                    className={`absolute -bottom-2 -right-2 p-1 rounded-full border shadow-md transition-all active:scale-90 bg-white ${
                      !ttsEnabled ? 'opacity-30 cursor-not-allowed text-slate-300' :
                      isSpeaking ? 'text-red-500 border-red-200 animate-pulse' : 'text-slate-400 border-slate-100 hover:text-indigo-600'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* AI Loading Bubble */}
        {loading && (
          <div className="flex gap-2.5 items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-sm shrink-0">
              🦉
            </div>
            <div className="bg-white border border-indigo-50 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 py-4">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi gia sư cú cách làm..."
          disabled={loading}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white shadow transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
