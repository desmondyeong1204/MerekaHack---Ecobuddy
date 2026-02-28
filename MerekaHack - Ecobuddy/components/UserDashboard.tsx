
import React, { useState, useEffect, useRef } from 'react';
import { UserStats, DigitalPet } from '../types';
import { Icons, COLORS } from '../constants';
import { generateWeeklySummary } from '../services/gemini';

interface Props {
  stats: UserStats;
  pet: DigitalPet;
  onUpdateStats: (update: Partial<UserStats> | ((prev: UserStats) => Partial<UserStats>)) => void;
}

const UserDashboard: React.FC<Props> = ({ stats, pet, onUpdateStats }) => {
  const [summary, setSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stats.userName);
  const [editImage, setEditImage] = useState(stats.profileImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      const text = await generateWeeklySummary(stats);
      setSummary(text);
      setLoadingSummary(false);
    };
    fetchSummary();
  }, [stats.steps, stats.co2Saved, stats.tripsAvoided, stats.mealsRescued]);

  const handleSave = () => {
    onUpdateStats({
      userName: editName,
      profileImage: editImage,
    });
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (showAllBadges) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 min-h-screen bg-white relative z-50 pb-32">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-6 border-b border-gray-100 flex items-center gap-4">
          <button 
            onClick={() => setShowAllBadges(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Icons.ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">All Achievements</h2>
        </div>

        <div className="p-6 space-y-4">
          {stats.badges.map((badge) => (
            <div key={badge.id} className={`p-5 rounded-[32px] border ${badge.unlocked ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-80'} relative overflow-hidden`}>
              <div className="flex gap-5">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${badge.unlocked ? 'bg-[#A0E8AF]/20' : 'bg-gray-200'}`}>
                  <span className={`text-4xl ${!badge.unlocked && 'grayscale opacity-50'}`}>{badge.icon}</span>
                  {!badge.unlocked && (
                    <div className="absolute">
                      <Icons.Lock className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 py-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-black text-lg ${badge.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{badge.name}</h3>
                    {badge.unlocked ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Unlocked</span>
                    ) : (
                      <span className="bg-gray-200 text-gray-500 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider">Locked</span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3">{badge.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-100">
                      <Icons.Trophy className="w-3 h-3 text-yellow-600" />
                      <span className="text-[10px] font-bold text-yellow-700">+{badge.points} pts</span>
                    </div>
                    {badge.specialPoint && (
                      <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                        <Icons.Sparkles className="w-3 h-3 text-purple-600" />
                        <span className="text-[10px] font-bold text-purple-700">{badge.specialPoint}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 p-6">
      {/* Profile Header Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-6">
          <div 
            className={`w-32 h-32 rounded-[40px] overflow-hidden border-4 border-[#A0E8AF] shadow-2xl relative group transition-all duration-300 ${isEditing ? 'cursor-pointer ring-4 ring-blue-300 ring-offset-4' : ''}`}
            onClick={() => isEditing && fileInputRef.current?.click()}
          >
            <img 
              src={isEditing ? editImage : stats.profileImage} 
              alt={stats.userName} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#FDFD96] px-3 py-1.5 rounded-2xl shadow-lg border-2 border-white animate-in zoom-in duration-500 delay-300">
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter">LVL {stats.level}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 w-full">
          {isEditing ? (
            <div className="flex flex-col items-center gap-5 w-full max-w-[280px]">
              <div className="w-full relative">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-2xl font-black text-center text-gray-800 tracking-tight bg-white/60 border-2 border-[#A0E8AF] outline-none px-4 py-3 rounded-2xl shadow-inner focus:bg-white transition-all"
                  autoFocus
                  placeholder="Enter your name..."
                />
                <div className="absolute -top-2 left-4 bg-white px-2 rounded-lg text-[8px] font-black text-[#A0E8AF] uppercase tracking-widest border border-[#A0E8AF]/20">Name</div>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={handleSave} className="flex-1 py-4 bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black active:scale-95 transition-all">Apply</button>
                <button onClick={() => { setIsEditing(false); setEditName(stats.userName); setEditImage(stats.profileImage); }} className="flex-1 py-4 bg-white/80 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-gray-100 hover:bg-white active:scale-95 transition-all shadow-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="group flex items-center gap-3">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">{stats.userName}</h2>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2.5 bg-white/50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all active:scale-90"
                title="Edit Profile"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button 
                onClick={async () => {
                  // @ts-ignore
                  if (window.aistudio) {
                    // @ts-ignore
                    await window.aistudio.openSelectKey();
                  }
                }}
                className="p-2.5 bg-white/50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all active:scale-90"
                title="Update API Key"
              >
                <Icons.Key className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rewards Spotlight Card */}
      <div className="bg-white/80 border border-white p-6 rounded-[32px] mb-8 shadow-sm flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Eco-Points</span>
          <span className="text-3xl font-black text-gray-800 tracking-tight leading-tight">{stats.points.toLocaleString()}</span>
        </div>
        <div className="w-12 h-12 bg-[#A0E8AF]/30 rounded-2xl flex items-center justify-center text-green-700">
           <Icons.Leaf className="w-7 h-7" />
        </div>
      </div>

      {/* Environmental Impact Grid */}
      <div className="mb-10">
        <div className="px-2 mb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Environmental Impact</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* CO2 Saved */}
          <div className="bg-[#A0E8AF]/20 p-6 rounded-[36px] border border-white/40 shadow-sm animate-in zoom-in duration-500 delay-100">
            <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center text-green-600 mb-4">
              <Icons.Leaf className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-gray-800 leading-tight">{stats.co2Saved.toFixed(1)} <span className="text-[10px] font-bold text-gray-400">kg</span></span>
            <span className="block text-[9px] font-black text-green-900/40 uppercase tracking-widest mt-2">CO2 Offset</span>
          </div>

          {/* Total Steps */}
          <div className="bg-[#B3E5FC]/20 p-6 rounded-[36px] border border-white/40 shadow-sm animate-in zoom-in duration-500 delay-200">
            <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center text-blue-500 mb-4">
              <Icons.Steps className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-gray-800 leading-tight">{stats.steps.toLocaleString()}</span>
            <span className="block text-[9px] font-black text-blue-900/40 uppercase tracking-widest mt-2">Active Steps</span>
          </div>

          {/* Trips Avoided */}
          <div className="bg-[#FDFD96]/20 p-6 rounded-[36px] border border-white/40 shadow-sm animate-in zoom-in duration-500 delay-300">
            <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center text-yellow-600 mb-4">
              <Icons.Map className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-gray-800 leading-tight">{stats.tripsAvoided}</span>
            <span className="block text-[9px] font-black text-yellow-900/40 uppercase tracking-widest mt-2">Trips Skipped</span>
          </div>

          {/* Meals Rescued */}
          <div className="bg-[#FEE2C7]/30 p-6 rounded-[36px] border border-white/40 shadow-sm animate-in zoom-in duration-500 delay-400">
            <div className="w-10 h-10 bg-white/60 rounded-xl flex items-center justify-center text-orange-400 mb-4">
              <Icons.Apple className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-gray-800 leading-tight">{stats.mealsRescued}</span>
            <span className="block text-[9px] font-black text-orange-900/40 uppercase tracking-widest mt-2">Meals Rescued</span>
          </div>
        </div>
      </div>

      {/* Badges Carousel */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Achievements</h3>
          <button 
            onClick={() => setShowAllBadges(true)}
            className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline decoration-2"
          >
            View All
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
          {stats.badges.map((badge) => (
            <div key={badge.id} className={`eco-glass min-w-[130px] aspect-square rounded-[36px] flex flex-col items-center justify-center p-5 border border-white shadow-sm shrink-0 group transition-all cursor-default ${badge.unlocked ? 'hover:bg-white' : 'opacity-60 bg-gray-100/50'}`}>
              <div className={`w-14 h-14 mb-3 flex items-center justify-center text-gray-800 transition-transform ${badge.unlocked ? 'group-hover:scale-110' : 'grayscale'}`}>
                <span className="text-3xl">{badge.icon}</span>
                {!badge.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200/40 rounded-full backdrop-blur-[1px]">
                    <Icons.Lock className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest text-center leading-tight ${badge.unlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                {badge.name}
              </span>
              {!badge.unlocked && <span className="text-[7px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Locked</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly AI Insight Card */}
      <div className="eco-glass rounded-[48px] p-10 relative overflow-hidden border border-white/60 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
          <Icons.Leaf className="w-48 h-48" />
        </div>
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg ring-4 ring-blue-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.25em]">Personal Growth Insight</h3>
        </div>

        {loadingSummary ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200/50 rounded-full w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200/50 rounded-full w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200/50 rounded-full w-2/3 animate-pulse"></div>
          </div>
        ) : (
          <p className="text-gray-700 text-sm font-semibold leading-relaxed italic tracking-tight relative">
            "{summary || "Analyzing your recent green choices..."}"
          </p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
