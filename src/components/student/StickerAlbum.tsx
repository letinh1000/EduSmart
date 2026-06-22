'use client';

import React, { useState } from 'react';
import { useEduSmart } from '@/store/edusmartStore';
import { Sparkles, ArrowLeft, Gift } from 'lucide-react';

export const StickerAlbum: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { album, stickers, openStickerPack } = useEduSmart();
  const [opening, setOpening] = useState(false);
  const [revealedSticker, setRevealedSticker] = useState<typeof stickers[0] | null>(null);

  const handleOpenPack = () => {
    if (album.packsCount <= 0 || opening) return;
    
    setOpening(true);
    setRevealedSticker(null);

    // Opening animation sequence
    setTimeout(() => {
      // Find what stickers will be unlocked
      const oldUnlockedIds = [...album.unlockedIds];
      openStickerPack();
      
      // Determine what was unlocked (simulate matching)
      setTimeout(() => {
        // Fetch current album state again or simulate the unlocked sticker
        // To be safe, we find the new sticker unlocked:
        // We will just read the localStorage or active state
        const storedAlbum = localStorage.getItem('es_album');
        let newUnlockedIds = oldUnlockedIds;
        if (storedAlbum) {
          newUnlockedIds = JSON.parse(storedAlbum).unlockedIds;
        }
        const newlyUnlocked = newUnlockedIds.find(id => !oldUnlockedIds.includes(id));
        const matched = stickers.find(s => s.id === (newlyUnlocked || oldUnlockedIds[oldUnlockedIds.length - 1]));
        
        setRevealedSticker(matched || stickers[0]);
        setOpening(false);
      }, 100);
    }, 1500); // 1.5s tearing package shake
  };

  const handleCloseReveal = () => {
    setRevealedSticker(null);
  };

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
            <span className="text-[10px] font-bold uppercase text-indigo-600">Thành Tích</span>
            <h2 className="text-2xl font-black font-display text-slate-800">Sổ Sưu Tập Sticker nhí</h2>
          </div>
        </div>

        {/* Sticker Pack Inventory */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 p-2 px-3 rounded-2xl border border-indigo-100">
          <span className="text-xl">✉️</span>
          <div>
            <p className="text-[10px] font-black text-indigo-700">BAO THƯ CHƯA MỞ</p>
            <p className="text-xs font-extrabold text-slate-700">{album.packsCount} Bao thư</p>
          </div>
        </div>
      </div>

      {/* Main split: left is pack opening, right is collection grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pack opening area */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white flex flex-col justify-between items-center text-center shadow-lg relative min-h-[340px]">
          
          <div className="absolute top-2 right-2 text-3xl opacity-15">✨</div>
          <div className="absolute bottom-4 left-4 text-3xl opacity-15">🌟</div>

          <div>
            <h3 className="font-extrabold text-base font-display">Bao Thư Bí Mật</h3>
            <p className="text-[11px] opacity-80 mt-1">Hoàn thành bài tập xuất sắc trên 80 điểm để nhận thêm bao thư sticker!</p>
          </div>

          {/* Envelope Graphic */}
          <div className="my-6 relative flex items-center justify-center">
            {opening ? (
              <div className="text-6xl animate-wiggle select-none">✉️✨🔥</div>
            ) : album.packsCount > 0 ? (
              <div className="text-7xl animate-float cursor-pointer hover:scale-105 transition-transform select-none" onClick={handleOpenPack}>
                ✉️
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center border border-white animate-bounce">
                  !
                </span>
              </div>
            ) : (
              <div className="text-6xl grayscale opacity-50 select-none">📭</div>
            )}
          </div>

          <button
            onClick={handleOpenPack}
            disabled={album.packsCount <= 0 || opening}
            className={`w-full py-3 rounded-full font-black text-xs tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex justify-center items-center gap-1.5 btn-3d ${
              album.packsCount > 0 && !opening
                ? 'bg-yellow-400 text-slate-800 hover:bg-yellow-300'
                : 'bg-white/20 text-white/50 border border-white/10 shadow-none cursor-not-allowed'
            }`}
          >
            <Gift className="w-4 h-4" />
            {opening ? 'ĐANG MỞ...' : 'MỞ BAO THƯ STICKER'}
          </button>
        </div>

        {/* Stickers Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Kho báu di sản Việt Nam</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
            {stickers.map((sticker) => {
              const isUnlocked = album.unlockedIds.includes(sticker.id);

              return (
                <div
                  key={sticker.id}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center shadow-sm relative transition-all ${
                    isUnlocked
                      ? 'bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-md'
                      : 'bg-slate-100/50 border-slate-200 grayscale opacity-60'
                  }`}
                >
                  <span className="text-4xl mb-2">{isUnlocked ? sticker.image : '❓'}</span>
                  <h4 className="text-xs font-black text-slate-800 truncate max-w-full">
                    {isUnlocked ? sticker.name : 'Chưa mở khóa'}
                  </h4>
                  <p className="text-[9px] font-bold text-indigo-600 uppercase mt-0.5 tracking-wider">
                    {isUnlocked ? sticker.category === 'landmark' ? 'Kỳ quan' : sticker.category === 'history' ? 'Lịch sử' : 'Khoa học' : 'Ẩn'}
                  </p>

                  {isUnlocked && (
                    <div className="absolute top-1 right-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400 animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unlocked sticker modal popup */}
      {revealedSticker && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-pop-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-4 border-indigo-300 relative">
            
            <div className="w-20 h-20 mx-auto bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-5xl mb-4 shadow">
              {revealedSticker.image}
            </div>

            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              STICKER MỚI!
            </span>
            
            <h3 className="text-xl font-black text-slate-800 font-display mt-2">{revealedSticker.name}</h3>
            
            <div className="bg-indigo-50/50 border border-indigo-100/40 p-3 rounded-2xl my-4 text-xs text-slate-600 leading-relaxed font-semibold">
              {revealedSticker.description}
            </div>

            <button
              onClick={handleCloseReveal}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Dán vào Sổ sưu tập
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
