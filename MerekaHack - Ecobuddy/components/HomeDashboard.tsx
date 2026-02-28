
import React from 'react';
import { Leaf, Footprints, Recycle, Apple, Zap } from 'lucide-react';
import PetAvatar from './PetAvatar';
import { TabType, DigitalPet } from '../types';

interface HomeDashboardProps {
  onNavigate: (tab: TabType) => void;
  totalPoints: number;
  pet: DigitalPet;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate, totalPoints, pet }) => {
  const actions = [
    { id: 'scan', label: 'Recycle Bins', icon: Recycle, color: 'bg-[#A0E8AF]' },
    { id: 'steps', label: 'Green Mobility', icon: Footprints, color: 'bg-[#B3E5FC]' },
    { id: 'bag-verify', label: 'Recycle Bag', icon: Leaf, color: 'bg-[#FDFD96]' },
    { id: 'food', label: 'Save Food', icon: Apple, color: 'bg-orange-100' },
  ];

  // Simple check for foggy state in dashboard (can be more complex if needed)
  const daysSinceActive = (new Date().getTime() - new Date(pet.lastActiveDate).getTime()) / (1000 * 3600 * 24);
  const isFoggy = daysSinceActive > 3;

  return (
    <div className="p-6 pb-32 space-y-6 animate-in fade-in duration-700">
      {/* App Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="bg-[#A0E8AF] p-2 rounded-xl">
            <Leaf size={20} className="text-green-800" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-800">EcoBuddy</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden">
          <img src="https://picsum.photos/seed/alex/40/40" alt="profile" />
        </div>
      </div>

      {/* Pet Header Section */}
      <div 
        className="bg-gradient-to-br from-[#A0E8AF]/20 to-[#B3E5FC]/20 rounded-[40px] p-8 flex flex-col items-center justify-center space-y-4 cursor-pointer hover:scale-[1.02] transition-transform shadow-sm relative overflow-hidden"
        onClick={() => onNavigate('pet')}
      >
        <div className="w-32 h-32">
          <PetAvatar 
            type={pet.type} 
            accessories={pet.accessories} 
            happiness={pet.happiness} 
            isFoggy={isFoggy}
          />
        </div>
        <div className="text-center relative z-10 px-4">
          <p className="text-gray-500 font-bold text-sm leading-relaxed">Your {pet.name || 'Companion'} is {pet.happiness > 80 ? 'thriving' : 'doing okay'}</p>
          <h2 className="text-xl font-extrabold text-gray-800 leading-tight">Keep up the green work!</h2>
        </div>
      </div>

      {/* Points Summary - Displaying the dynamic totalPoints */}
      <div className="glass-card rounded-[35px] p-6 flex justify-between items-center custom-shadow border-2 border-white/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/10 blur-2xl rounded-full -mr-12 -mt-12" />
        
        <div className="relative z-10">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Today's Eco-Points</p>
          <div className="flex items-end space-x-2">
            <p className="text-5xl font-black text-gray-800">{totalPoints}</p>
            <div className="mb-1.5 bg-green-500/10 px-2 py-1 rounded-lg flex items-center space-x-1 border border-green-200">
              <Zap size={10} className="text-green-600 fill-green-600" />
              <span className="text-[10px] font-black text-green-700">+20 Bin Bonus</span>
            </div>
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-1">Includes recent recycling scan</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded-[25px] relative z-10">
          <Leaf className="text-green-600" size={32} />
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onNavigate(action.id as TabType)}
            className={`${action.color} p-6 rounded-[30px] flex flex-col items-start justify-between h-36 transition-all active:scale-95 shadow-sm hover:shadow-md border-b-4 border-black/5`}
          >
            <div className="bg-white/60 p-2 rounded-xl">
              <action.icon size={24} className="text-gray-800" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-800 font-black text-lg leading-tight text-left">{action.label}</span>
              {action.id === 'scan' && (
                <span className="text-[9px] font-black text-green-800/60 uppercase tracking-tighter mt-1">Scan for +10 pts/item</span>
              )}
              {action.id === 'map' && (
                <span className="text-[9px] font-black text-green-800/60 uppercase tracking-tighter mt-1">Scan for +10 pts</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Recent Activity Mini Section */}
      <div className="pt-2">
        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3 px-1">Weekly Impact</h3>
        <div className="bg-gray-50 rounded-[30px] p-5 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-2 rounded-xl">
              <Footprints size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold">12kg CO2 Saved</p>
              <p className="text-xs text-gray-400 font-semibold">Keep walking to reach 15kg!</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-400 h-full w-[80%]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
