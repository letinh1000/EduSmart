'use client';

import React, { useState } from 'react';
import { useEduSmart } from '@/store/edusmartStore';
import { Sparkles, Heart, ShoppingBag, Award } from 'lucide-react';

const SHOP_ITEMS = [
  { id: 'apple', name: 'Táo Vàng', type: 'food', value: 20, cost: 20, icon: '🍎', desc: '+20 XP linh vật' },
  { id: 'candy', name: 'Kẹo Ngọt', type: 'food', value: 10, cost: 10, icon: '🍬', desc: '+10 XP linh vật' },
  { id: 'cake', name: 'Bánh Kem', type: 'food', value: 40, cost: 35, icon: '🧁', desc: '+40 XP linh vật' },
  { id: 'hat', name: 'Mũ Trạng Nguyên', type: 'accessory', value: 0, cost: 100, icon: '🎓', desc: 'Trang phục học giả' },
  { id: 'glasses', name: 'Kính Học Thức', type: 'accessory', value: 0, cost: 60, icon: '👓', desc: 'Nhìn thông minh hơn' },
  { id: 'wand', name: 'Đũa Phép Thuật', type: 'accessory', value: 0, cost: 80, icon: '🪄', desc: 'Tỏa sáng lấp lánh' }
];

export const AIPet: React.FC = () => {
  const { pet, stats, feedPet, buyAccessory } = useEduSmart();
  const [activeTab, setActiveTab] = useState<'status' | 'shop'>('status');
  const [petMessage, setPetMessage] = useState('Chào bạn nhỏ! Hôm nay chúng ta cùng học Toán nhé! 🦉');
  const [actionAnim, setActionAnim] = useState<string | null>(null);

  const getPetEmoji = () => {
    // Egg state at Level 1
    if (pet.level === 1) return '🥚';
    
    // Hatching state at Level 2
    if (pet.level === 2) return '🐣';
    
    // Fully grown animal based on type
    if (pet.type === 'owl') {
      const hasHat = pet.equippedAccessories.includes('hat');
      const hasGlasses = pet.equippedAccessories.includes('glasses');
      
      if (hasHat && hasGlasses) return '🦉🎓👓';
      if (hasHat) return '🦉🎓';
      if (hasGlasses) return '🦉👓';
      return '🦉';
    }
    return '🦉';
  };

  const getPetName = () => {
    if (pet.level === 1) return 'Quả Trứng Bí Mật';
    if (pet.level === 2) return 'Chim non Sơ Sinh';
    return pet.name;
  };

  const handleBuy = (item: typeof SHOP_ITEMS[0]) => {
    if (stats.coins < item.cost) {
      setPetMessage('Úi! Bạn nhỏ chưa đủ xu rồi, làm thêm bài tập để kiếm xu nhé! 🪙');
      return;
    }

    if (item.type === 'food') {
      const success = feedPet(item.value, item.cost);
      if (success) {
        setActionAnim('feed');
        setPetMessage(`Nhoàm nhoàm! Cảm ơn con vì quả ${item.name} siêu ngon nhé! ${item.icon}`);
        setTimeout(() => setActionAnim(null), 1000);
      }
    } else {
      if (pet.equippedAccessories.includes(item.id)) {
        setPetMessage('Món đồ này linh vật đã mặc rồi nha con! 🎒');
        return;
      }
      const success = buyAccessory(item.id, item.cost);
      if (success) {
        setActionAnim('dress');
        setPetMessage(`Oa! Trang phục ${item.name} mới trông hợp với ta quá! Cảm ơn bạn nhỏ! ✨`);
        setTimeout(() => setActionAnim(null), 1000);
      }
    }
  };

  const interactWithPet = () => {
    const messages = [
      'Gấu chăm chỉ nói: Học tập chăm chỉ sẽ mở ra nhiều kho báu! 🗺️',
      'Đúng câu khó là mình được cộng nhiều XP lắm đó! 🔥',
      'Này bạn nhỏ, đừng quên tưới nước cho cây thật ngoài đời nhé! 🌱',
      'Mở Sticker Album xem con sưu tập được gì rồi nha! 🚣',
      'Hôm nay streak của chúng mình là ngày thứ ' + stats.streak + ' rồi, siêu ghê! 🏆',
      'Cú Học Thức khuyên: Khi gặp bài khó, hãy hỏi Gia sư Socratic kế bên nha!'
    ];
    const rand = Math.floor(Math.random() * messages.length);
    setActionAnim('wiggle');
    setPetMessage(messages[rand]);
    setTimeout(() => setActionAnim(null), 800);
  };

  return (
    <div className="w-full glass-card rounded-3xl border border-blue-100 overflow-hidden flex flex-col bg-white/60">
      
      {/* Header tab */}
      <div className="flex border-b border-slate-100 bg-blue-50/30">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-3 text-center text-xs font-black transition-all border-b-4 cursor-pointer ${activeTab === 'status' ? 'border-blue-500 text-blue-600 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
          🥰 Linh vật AI
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex-1 py-3 text-center text-xs font-black transition-all border-b-4 cursor-pointer ${activeTab === 'shop' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
        >
          🛒 Cửa hàng Thú cưng
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between min-h-[300px]">
        {activeTab === 'status' ? (
          /* Tab: Status representation */
          <div className="space-y-4 flex flex-col items-center flex-1">
            {/* Visual Mascot rendering */}
            <div className="relative w-36 h-36 flex items-center justify-center bg-blue-50/50 rounded-full border-4 border-blue-200 shadow-inner group">
              <div 
                onClick={interactWithPet}
                className={`text-6xl cursor-pointer select-none transition-all duration-300 ${
                  actionAnim === 'feed' ? 'animate-bounce scale-110' :
                  actionAnim === 'dress' ? 'rotate-12 scale-110' :
                  actionAnim === 'wiggle' ? 'animate-wiggle' : 'hover:scale-105 hover:rotate-3'
                }`}
              >
                {getPetEmoji().slice(0, 2)} {/* base emoji */}
                {/* Accessory overlays */}
                <div className="absolute top-2 right-2 text-2xl">
                  {pet.equippedAccessories.includes('hat') && '🎓'}
                </div>
                <div className="absolute top-12 left-4 text-xl">
                  {pet.equippedAccessories.includes('glasses') && '👓'}
                </div>
                <div className="absolute bottom-2 right-2 text-2xl">
                  {pet.equippedAccessories.includes('wand') && '🪄'}
                </div>
              </div>
              <span className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full p-1 text-[10px] font-bold px-2 border border-white">
                Cấp {pet.level}
              </span>
            </div>

            {/* Pet message speech bubble */}
            <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center relative">
              <p className="text-xs font-extrabold text-blue-800">{petMessage}</p>
              <div className="absolute top-[-8px] left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-50 border-t border-l border-blue-100 rotate-45"></div>
            </div>

            {/* Status meters */}
            <div className="w-full space-y-2.5 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">📊 Tiến trình lớn lên</span>
                <span>{pet.xp}/{pet.xpNeeded} XP</span>
              </div>
              {/* Custom styled progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200 relative shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full transition-all duration-500 shadow-md relative"
                  style={{ width: `${(pet.xp / pet.xpNeeded) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_2s_linear_infinite]"></div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-red-500 fill-red-500" /> Thân thiết</span>
                <span>{pet.happiness}/100</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 border border-slate-200 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-red-400 to-pink-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pet.happiness}%` }}
                ></div>
              </div>
            </div>

            <p className="text-[10px] font-bold text-slate-400 italic">Nhấn vào linh vật để cùng trò chuyện!</p>
          </div>
        ) : (
          /* Tab: Pet Shop */
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center bg-yellow-50 border border-yellow-100 p-2.5 rounded-2xl">
              <span className="text-xs font-bold text-yellow-800">Ví tiền xu của con:</span>
              <span className="text-sm font-black text-yellow-700 flex items-center gap-1">
                🪙 {stats.coins} Xu
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto max-h-[300px] pr-1">
              {SHOP_ITEMS.map((item) => {
                const isOwned = item.type === 'accessory' && pet.equippedAccessories.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between items-center text-center shadow-sm relative group hover:border-orange-300 transition-all"
                  >
                    <span className="text-4xl group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="my-1.5">
                      <p className="text-xs font-extrabold text-slate-700">{item.name}</p>
                      <p className="text-[9px] font-semibold text-slate-400">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={isOwned}
                      className={`w-full py-1.5 rounded-xl text-[10px] font-black tracking-wide shadow flex justify-center items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                        isOwned 
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none'
                          : 'bg-gradient-to-r from-orange-400 to-amber-500 text-white font-extrabold hover:from-orange-500 hover:to-amber-600'
                      }`}
                    >
                      {isOwned ? 'ĐÃ MUA' : `🪙 ${item.cost} XU`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
