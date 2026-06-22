'use client';

import React from 'react';
import { useEduSmart, LearningStage } from '@/store/edusmartStore';
import { BookOpen, Calculator, Globe, Languages, Laptop, Leaf, Lock, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface TreasureMapProps {
  onSelectStage: (stage: LearningStage, roadmapId: string) => void;
}

// Coordinate layout for stages in SVG/absolute space
const STAGE_COORDS = [
  { x: 12, y: 30 }, // Stage 1
  { x: 28, y: 18 }, // Stage 2
  { x: 46, y: 28 }, // Stage 3
  { x: 62, y: 18 }, // Stage 4
  { x: 78, y: 28 }, // Stage 5
  { x: 90, y: 20 }, // Stage 6
  { x: 82, y: 45 }, // Stage 7
  { x: 64, y: 55 }, // Stage 8
  { x: 46, y: 45 }, // Stage 9
  { x: 28, y: 55 }, // Stage 10
  { x: 12, y: 48 }, // Stage 11
  { x: 22, y: 75 }, // Stage 12
  { x: 40, y: 82 }, // Stage 13
  { x: 60, y: 75 }, // Stage 14
  { x: 80, y: 82 }, // Stage 15
  { x: 92, y: 70 }  // Stage 16
];

export const TreasureMap: React.FC<TreasureMapProps> = ({ onSelectStage }) => {
  const { roadmaps, currentUser } = useEduSmart();
  
  // Find roadmaps assigned to the current student's class
  const studentClassId = currentUser?.classId;
  const studentRoadmaps = studentClassId 
    ? roadmaps.filter(r => (r.classIds || (r.classId ? [r.classId] : [])).includes(studentClassId))
    : roadmaps;

  // Track expanded state for each roadmap
  const [expandedRoadmaps, setExpandedRoadmaps] = React.useState<Record<string, boolean>>({});

  // Sync to expand the first roadmap by default when studentRoadmaps change
  React.useEffect(() => {
    if (studentRoadmaps.length > 0) {
      setExpandedRoadmaps(prev => {
        const firstId = studentRoadmaps[0].id;
        if (prev[firstId] === undefined) {
          return {
            ...prev,
            [firstId]: true
          };
        }
        return prev;
      });
    }
  }, [studentRoadmaps]);

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'Toán': return <Calculator className="w-6 h-6" />;
      case 'Tiếng Việt': return <BookOpen className="w-6 h-6" />;
      case 'Ngoại ngữ 1': return <Languages className="w-6 h-6" />;
      case 'Khoa học': return <Leaf className="w-6 h-6" />;
      case 'Lịch sử và Địa lí': return <Globe className="w-6 h-6" />;
      case 'Tin học và Công nghệ': return <Laptop className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  };

  const getSubjectColorClass = (subject: string, status: string) => {
    if (status === 'locked') return 'bg-slate-300 text-slate-500 border-slate-400';
    
    switch (subject) {
      case 'Toán': return 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-blue-200';
      case 'Tiếng Việt': return 'bg-gradient-to-br from-orange-400 to-rose-500 text-white border-orange-200';
      case 'Ngoại ngữ 1': return 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white border-indigo-200';
      case 'Khoa học': return 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-emerald-200';
      case 'Lịch sử và Địa lí': return 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white border-amber-200';
      case 'Tin học và Công nghệ': return 'bg-gradient-to-br from-pink-400 to-rose-500 text-white border-pink-200';
      default: return 'bg-gradient-to-br from-slate-400 to-slate-500 text-white border-slate-200';
    }
  };

  // Build the SVG path string linking all stages
  const generateSvgPath = (stages: LearningStage[]) => {
    if (stages.length === 0) return '';
    return stages.map((_, index) => {
      const coord = STAGE_COORDS[index] || { x: 50, y: 50 };
      return `${index === 0 ? 'M' : 'L'} ${coord.x}% ${coord.y}%`;
    }).join(' ');
  };

  if (studentRoadmaps.length === 0) {
    return (
      <div className="w-full relative rounded-3xl p-8 glass-card border border-blue-100 text-center py-16 bg-white/60">
        <span className="text-5xl block mb-4 animate-float">🗺️</span>
        <h3 className="text-lg font-black text-slate-700">Chưa có lộ trình học tập</h3>
        <p className="text-xs font-semibold text-slate-400 mt-2 max-w-sm mx-auto">
          Hiện tại lớp học của bạn chưa được gán lộ trình học tập nào. Vui lòng liên hệ với giáo viên để nhận lộ trình nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {studentRoadmaps.map((roadmap, rIdx) => {
        const isExpanded = !!expandedRoadmaps[roadmap.id];
        const stages = roadmap.stages;
        const completedStagesCount = stages.filter(s => s.status === 'completed').length;
        
        return (
          <div 
            key={roadmap.id} 
            className="w-full relative rounded-3xl p-6 glass-card border border-blue-100 overflow-hidden select-none transition-all duration-300"
            style={{ 
              background: 'radial-gradient(circle, #f0fdf4 0%, #eff6ff 100%)',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
            }}
          >
            {/* Header / Toggle Bar */}
            <div 
              onClick={() => {
                setExpandedRoadmaps(prev => ({
                  ...prev,
                  [roadmap.id]: !prev[roadmap.id]
                }));
              }}
              className="flex justify-between items-center relative z-10 cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    LỘ TRÌNH {rIdx + 1}
                  </span>
                  {!isExpanded && (
                    <span className="bg-slate-200 text-slate-655 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Thu gọn
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-800 font-display mt-1 group-hover:text-blue-600 transition-colors">
                  {roadmap.title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-500 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200">
                  Chặng hoàn thành: {completedStagesCount}/{stages.length}
                </div>
                <button
                  type="button"
                  className="p-1.5 bg-white/80 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all text-slate-655"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded Content (Winding map journey) */}
            {isExpanded && (
              <div className="relative mt-6 pt-6 border-t border-slate-200/50" style={{ minHeight: '420px' }}>
                {/* Background Cartoony Decorative Elements */}
                <div className="absolute top-10 right-12 text-6xl opacity-20 animate-float pointer-events-none">🏝️</div>
                <div className="absolute bottom-8 left-16 text-6xl opacity-20 animate-float pointer-events-none" style={{ animationDelay: '1.5s' }}>⛵</div>
                <div className="absolute top-48 left-1/4 text-5xl opacity-15 pointer-events-none">🐙</div>
                <div className="absolute bottom-32 right-1/4 text-5xl opacity-15 pointer-events-none">🪙</div>
                <div className="absolute top-8 left-8 text-4xl opacity-25 pointer-events-none">☁️</div>
                <div className="absolute top-4 right-1/3 text-4xl opacity-25 animate-pulse pointer-events-none">☁️</div>

                {/* The Winding Journey Path (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minHeight: '420px' }}>
                  {/* Draw a shadow connection line */}
                  <path
                    d={generateSvgPath(stages)}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Draw main colorful dash connection line */}
                  <path
                    d={generateSvgPath(stages)}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="12 8"
                    className="animate-[shimmer_30s_linear_infinite]"
                  />
                </svg>

                {/* Winding Stages Circles */}
                <div className="absolute inset-0 w-full h-full" style={{ minHeight: '420px' }}>
                  {stages.map((stage, index) => {
                    const coord = STAGE_COORDS[index] || { x: 50, y: 50 };
                    const isLocked = stage.status === 'locked';
                    const isCompleted = stage.status === 'completed';
                    const isAvailable = stage.status === 'available';

                    return (
                      <div
                        key={stage.id}
                        draggable={!isLocked}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('stage-data', JSON.stringify({ stage, roadmapId: roadmap.id }));
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all ${
                          isLocked ? '' : 'cursor-grab active:cursor-grabbing hover:scale-[1.02]'
                        }`}
                        style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                      >
                        {/* Glow for available */}
                        {isAvailable && (
                          <div className="absolute inset-0 rounded-full bg-blue-400 opacity-40 blur-md animate-ping scale-150 pointer-events-none" />
                        )}

                        {/* Node Button */}
                        <button
                          disabled={isLocked}
                          onClick={() => onSelectStage(stage, roadmap.id)}
                          className={`w-14 h-14 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 relative shadow-lg group hover:scale-110 ${getSubjectColorClass(stage.subject, stage.status)}`}
                        >
                          {isLocked ? (
                            <Lock className="w-5 h-5" />
                          ) : isCompleted ? (
                            <div className="relative">
                              {getSubjectIcon(stage.subject)}
                              <span className="absolute -top-3 -right-3 bg-green-500 border-2 border-white rounded-full p-0.5 text-white shadow">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </span>
                            </div>
                          ) : (
                            getSubjectIcon(stage.subject)
                          )}

                          {/* Pin Mascot indicator for Current Stage */}
                          {isAvailable && (
                            <div className="absolute -top-11 bg-indigo-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md animate-bounce-slow flex items-center gap-1 border border-indigo-400 whitespace-nowrap">
                              <span>📍 Bạn đang ở đây</span>
                            </div>
                          )}
                        </button>

                        {/* Tooltip & Text details */}
                        <div className="mt-2 bg-white/95 px-3 py-1 rounded-xl shadow-md border border-slate-100 max-w-[120px] text-center pointer-events-none relative z-10 transition-all duration-200 group-hover:scale-105">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{stage.subject}</p>
                          <p className="text-[11px] font-extrabold text-slate-700 truncate">{stage.title}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
