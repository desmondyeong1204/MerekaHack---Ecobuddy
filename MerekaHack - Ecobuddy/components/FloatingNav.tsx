
import React from 'react';
import { Home, Map as MapIcon, QrCode, Trophy, User as UserIcon } from 'lucide-react';
import { TabType } from '../types';

interface FloatingNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const FloatingNav: React.FC<FloatingNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: MapIcon, label: 'Map' },
    { id: 'scan', icon: QrCode, label: 'Log' },
    { id: 'leaderboard', icon: Trophy, label: 'Stats' },
    { id: 'profile', icon: UserIcon, label: 'Me' },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] z-50">
      <div className="bg-white/95 backdrop-blur-xl border border-white/60 rounded-[32px] px-1 py-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCenter = index === 2;

          if (isCenter) {
            return (
              <div key={tab.id} className="relative -top-7 flex flex-col items-center px-1">
                <button
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                    isActive 
                    ? 'bg-[#A0E8AF] text-green-900 scale-110' 
                    : 'bg-green-500 text-white hover:scale-105'
                  } border-[4px] border-white`}
                >
                  <Icon size={28} strokeWidth={2.5} />
                </button>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 flex flex-col items-center py-1 transition-all duration-300 ${
                isActive ? 'text-green-600 scale-110' : 'text-gray-400 hover:text-green-500'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[8px] mt-0.5 font-bold ${isActive ? 'block' : 'hidden'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloatingNav;
