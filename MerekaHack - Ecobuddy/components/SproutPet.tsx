
import React from 'react';

interface SproutPetProps {
  happiness: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
}

const SproutPet: React.FC<SproutPetProps> = ({ happiness, size = 'md' }) => {
  const getScale = () => {
    if (size === 'sm') return 'scale-50';
    if (size === 'lg') return 'scale-125';
    return 'scale-100';
  };

  const getExpression = () => {
    if (happiness > 80) return 'text-5xl';
    if (happiness > 40) return 'text-4xl';
    return 'text-3xl';
  };

  return (
    <div className={`relative flex flex-col items-center justify-center transition-all duration-500 ${getScale()}`}>
      {/* Glow Effect */}
      <div className={`absolute w-32 h-32 rounded-full blur-3xl opacity-30 ${happiness > 70 ? 'bg-yellow-300' : 'bg-green-300'}`} />
      
      {/* Simple SVG Leaf Creature */}
      <div className="relative z-10 animate-bounce">
        <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
          {/* Stem */}
          <path d="M50 90C50 90 50 70 50 60" stroke="#4CAF50" strokeWidth="6" strokeLinecap="round" />
          {/* Main Leaf Body */}
          <path d="M50 70C20 70 10 40 50 10C90 40 80 70 50 70Z" fill="#A0E8AF" />
          {/* Side Small Leaf */}
          <path d="M45 65C35 65 30 55 45 45C60 55 55 65 45 65Z" fill="#81C784" />
          
          {/* Eyes */}
          <circle cx="40" cy="40" r="3" fill="#333" />
          <circle cx="60" cy="40" r="3" fill="#333" />
          
          {/* Mouth based on happiness */}
          {happiness > 60 ? (
            <path d="M40 50Q50 58 60 50" stroke="#333" strokeWidth="2" fill="none" />
          ) : (
            <path d="M40 52L60 52" stroke="#333" strokeWidth="2" fill="none" />
          )}
        </svg>
      </div>

      <div className="mt-4 text-center">
        <span className="bg-white/60 px-4 py-1 rounded-full text-xs font-bold text-green-700 uppercase tracking-widest shadow-sm">
          {happiness > 80 ? 'Super Happy' : happiness > 40 ? 'Glowin\'' : 'Needs Care'}
        </span>
      </div>
    </div>
  );
};

export default SproutPet;
