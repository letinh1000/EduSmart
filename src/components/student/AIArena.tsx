'use client';

import React, { useState, useEffect } from 'react';
import { useEduSmart } from '@/store/edusmartStore';
import { Trophy, ArrowLeft, Zap, CheckCircle2, XCircle } from 'lucide-react';

interface ArenaQuestion {
  question: string;
  options: string[];
  answer: string;
}

const ARENA_QUESTIONS: ArenaQuestion[] = [
  { question: 'Tìm số lớn nhất có hai chữ số khác nhau?', options: ['99', '98', '90', '89'], answer: '98' },
  { question: 'Có bao nhiêu chữ cái trong từ tiếng Anh "WELCOME"?', options: ['5', '6', '7', '8'], answer: '7' },
  { question: 'Thực vật chế tạo thức ăn nhờ ánh nắng mặt trời qua quá trình nào?', options: ['Quang hợp', 'Hô hấp', 'Hút nước', 'Thụ phấn'], answer: 'Quang hợp' },
  { question: 'Quần đảo Hoàng Sa và Trường Sa thuộc nước nào?', options: ['Việt Nam', 'Thái Lan', 'Lào', 'Campuchia'], answer: 'Việt Nam' },
  { question: 'Thừa số thứ nhất là 6, thừa số thứ hai là 7. Tích là bao nhiêu?', options: ['13', '42', '36', '49'], answer: '42' }
];

export const AIArena: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { updateStats, stats } = useEduSmart();
  
  // Game states
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'result'>('lobby');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  
  // Simulated AI progress
  const [aiProgress, setAiProgress] = useState(0); // 0 to 5 questions
  const [userProgress, setUserProgress] = useState(0); // 0 to 5 questions
  
  const botNames = ['Cá Heo Máy 🐬', 'Robot Đất Sét 🤖', 'Thỏ Công Nghệ 🐰', 'Sóc Điện Tử 🐿️'];
  const [activeBot, setActiveBot] = useState(botNames[0]);

  // Start the arena match
  const handleStartMatch = () => {
    const randomBot = botNames[Math.floor(Math.random() * botNames.length)];
    setActiveBot(randomBot);
    setGameState('playing');
    setCurrentQIndex(0);
    setUserScore(0);
    setAiScore(0);
    setAiProgress(0);
    setUserProgress(0);
    setSelectedOpt(null);
  };

  // Simulate AI bot making progress
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setAiProgress(prev => {
        if (prev >= ARENA_QUESTIONS.length) {
          clearInterval(interval);
          return prev;
        }

        // Randomly check if bot gets it right (75% correct rate)
        const isCorrect = Math.random() < 0.75;
        if (isCorrect) {
          setAiScore(s => s + 1);
        }

        return prev + 1;
      });
    }, 4500); // AI answers every 4.5s

    return () => clearInterval(interval);
  }, [gameState]);

  // Trigger result stage when both finish
  useEffect(() => {
    if (gameState === 'playing' && userProgress >= ARENA_QUESTIONS.length && aiProgress >= ARENA_QUESTIONS.length) {
      setGameState('result');
      
      // Award bonuses for winning
      if (userScore > aiScore) {
        updateStats(60, 40); // 60 XP, 40 Coins for winning!
      } else if (userScore === aiScore) {
        updateStats(30, 20); // 30 XP, 20 Coins for draw
      } else {
        updateStats(10, 5);  // 10 XP, 5 Coins for trying
      }
    }
  }, [userProgress, aiProgress, gameState]);

  const handleAnswer = (option: string) => {
    if (selectedOpt) return;
    
    setSelectedOpt(option);
    const isCorrect = option === ARENA_QUESTIONS[currentQIndex].answer;
    
    if (isCorrect) {
      setUserScore(prev => prev + 1);
    }

    setTimeout(() => {
      setUserProgress(p => p + 1);
      if (currentQIndex + 1 < ARENA_QUESTIONS.length) {
        setCurrentQIndex(currentQIndex + 1);
        setSelectedOpt(null);
      } else {
        // user finished all questions
        setUserProgress(ARENA_QUESTIONS.length);
        // if AI already finished, go to result, else wait for AI
        if (aiProgress >= ARENA_QUESTIONS.length) {
          setGameState('result');
        }
      }
    }, 1000);
  };

  const currentQ = ARENA_QUESTIONS[currentQIndex];

  return (
    <div className="w-full p-6 glass-card rounded-3xl border border-slate-200 bg-white/60 animate-pop-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase text-red-600">ĐẤU TRƯỜNG</span>
            <h2 className="text-2xl font-black font-display text-slate-800 flex items-center gap-1.5">
              Đấu trường Học thuật AI
              <Zap className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
            </h2>
          </div>
        </div>
      </div>

      {/* LOBBY STATE */}
      {gameState === 'lobby' && (
        <div className="text-center py-8 space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center text-4xl shadow animate-pulse">
            ⚡
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-700">Sẵn sàng so tài kiến thức cùng AI?</h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Con sẽ trả lời 5 câu hỏi nhanh thuộc nhiều chủ đề khác nhau. Hãy trả lời thật nhanh và chính xác để giành chiến thắng trước Robot đối thủ!
            </p>
          </div>

          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-700 space-y-1.5 text-left">
            <p className="flex items-center gap-1.5">🥇 Chiến thắng: +60 XP & +40 Xu thưởng</p>
            <p className="flex items-center gap-1.5">🥈 Hòa đối thủ: +30 XP & +20 Xu thưởng</p>
          </div>

          <button
            onClick={handleStartMatch}
            className="w-full py-3.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-sm tracking-wider shadow-lg hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all btn-3d"
          >
            TÌM ĐỐI THỦ NGAY!
          </button>
        </div>
      )}

      {/* PLAYING STATE */}
      {gameState === 'playing' && (
        <div className="space-y-6">
          {/* Race progress dashboard */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            {/* User progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-extrabold text-slate-600">
                <span>👦 Bạn (Của con)</span>
                <span>{userScore} điểm ({userProgress}/{ARENA_QUESTIONS.length} câu)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(userProgress / ARENA_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* AI progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-extrabold text-slate-600">
                <span>🤖 Đối thủ: {activeBot}</span>
                <span>{aiScore} điểm ({aiProgress}/{ARENA_QUESTIONS.length} câu)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="bg-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(aiProgress / ARENA_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Question area */}
          {userProgress < ARENA_QUESTIONS.length ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 animate-pop-in">
              <span className="bg-red-100 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                CÂU HỎI {currentQIndex + 1}
              </span>
              <h3 className="text-lg font-black text-slate-800 mt-1">{currentQ.question}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {currentQ.options.map(opt => {
                  const isSelected = selectedOpt === opt;
                  const isCorrect = opt === currentQ.answer;
                  
                  let btnStyle = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                  if (selectedOpt) {
                    if (isSelected) {
                      btnStyle = isCorrect 
                        ? 'bg-green-500 text-white border-green-500 shadow-md' 
                        : 'bg-red-500 text-white border-red-500 shadow-md';
                    } else if (isCorrect) {
                      btnStyle = 'bg-green-200 border-green-300 text-green-800';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      disabled={!!selectedOpt}
                      onClick={() => handleAnswer(opt)}
                      className={`p-3 text-left font-bold rounded-2xl border text-sm transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>⚡ {opt}</span>
                      {selectedOpt && isSelected && (
                        isCorrect ? <CheckCircle2 className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-sm font-extrabold text-slate-600">Con đã hoàn thành! Đang đợi đối thủ {activeBot} hoàn thành bài...</p>
            </div>
          )}
        </div>
      )}

      {/* RESULT STATE */}
      {gameState === 'result' && (
        <div className="text-center py-8 space-y-6 max-w-md mx-auto animate-pop-in">
          <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center text-4xl shadow animate-bounce">
            {userScore > aiScore ? '🥇' : userScore === aiScore ? '🤝' : '🥈'}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black font-display text-slate-800">
              {userScore > aiScore ? 'Thắng cuộc! Bạn siêu ghê!' : userScore === aiScore ? 'Hòa nhau rồi! Thử lại nha!' : 'Robot thắng rồi! Cố lên con!'}
            </h3>
            <p className="text-xs font-bold text-slate-500">
              Điểm của con: <strong className="text-blue-600">{userScore}</strong> | Điểm của {activeBot}: <strong className="text-red-500">{aiScore}</strong>
            </p>
          </div>

          {/* Reward cards */}
          <div className="flex justify-center gap-4 my-6">
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 shadow-sm flex flex-col items-center flex-1">
              <span className="text-2xl">⭐</span>
              <span className="text-[10px] font-bold text-amber-800">KINH NGHIỆM</span>
              <span className="text-sm font-extrabold text-amber-700 mt-1">
                +{userScore > aiScore ? '60' : userScore === aiScore ? '30' : '10'} XP
              </span>
            </div>
            <div className="bg-yellow-50 rounded-2xl p-3 border border-yellow-200 shadow-sm flex flex-col items-center flex-1">
              <span className="text-2xl">🪙</span>
              <span className="text-[10px] font-bold text-yellow-800">XU THƯỞNG</span>
              <span className="text-sm font-extrabold text-yellow-700 mt-1">
                +{userScore > aiScore ? '40' : userScore === aiScore ? '20' : '5'} Xu
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleStartMatch}
              className="w-full py-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-xs tracking-wider shadow-lg hover:from-red-600 hover:to-orange-600 active:scale-95 transition-all cursor-pointer"
            >
              ĐẤU TIẾP TRẬN MỚI!
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs shadow transition-all active:scale-95 cursor-pointer"
            >
              Trở về bản đồ học tập
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
