import React, { useState } from 'react';
import { PetType } from '../types';
import { Check } from 'lucide-react';

interface PetSelectionProps {
  onSelect: (type: PetType, name: string) => void;
}

const PetSelection: React.FC<PetSelectionProps> = ({ onSelect }) => {
  const [selectedType, setSelectedType] = useState<PetType | null>(null);
  const [name, setName] = useState('');

  const CartoonCat = () => (
    <div className="relative w-16 h-16 animate-bounce delay-100">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Body */}
        <path d="M30 60 Q50 80 70 60 L70 40 Q50 20 30 40 Z" fill="#FFB74D" />
        {/* Ears */}
        <path d="M30 40 L20 20 L40 35 Z" fill="#FFB74D" />
        <path d="M70 40 L80 20 L60 35 Z" fill="#FFB74D" />
        {/* Eyes */}
        <circle cx="40" cy="50" r="4" fill="#333" />
        <circle cx="60" cy="50" r="4" fill="#333" />
        {/* Nose & Mouth */}
        <path d="M48 58 L52 58 L50 62 Z" fill="#E57373" />
        <path d="M50 62 Q45 68 40 65" stroke="#333" strokeWidth="2" fill="none" />
        <path d="M50 62 Q55 68 60 65" stroke="#333" strokeWidth="2" fill="none" />
        {/* Whiskers */}
        <path d="M30 55 L15 52" stroke="#333" strokeWidth="1" />
        <path d="M30 60 L15 60" stroke="#333" strokeWidth="1" />
        <path d="M70 55 L85 52" stroke="#333" strokeWidth="1" />
        <path d="M70 60 L85 60" stroke="#333" strokeWidth="1" />
        {/* Tail */}
        <path d="M70 70 Q90 80 90 60" stroke="#FFB74D" strokeWidth="6" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );

  const CartoonDog = () => (
    <div className="relative w-16 h-16 animate-bounce delay-200">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Body */}
        <rect x="30" y="40" width="40" height="35" rx="10" fill="#A1887F" />
        {/* Head */}
        <circle cx="50" cy="40" r="25" fill="#D7CCC8" />
        {/* Ears */}
        <path d="M25 30 L15 50 L30 45 Z" fill="#8D6E63" />
        <path d="M75 30 L85 50 L70 45 Z" fill="#8D6E63" />
        {/* Eyes */}
        <circle cx="40" cy="35" r="4" fill="#333" />
        <circle cx="60" cy="35" r="4" fill="#333" />
        {/* Nose */}
        <ellipse cx="50" cy="45" rx="6" ry="4" fill="#333" />
        {/* Tongue */}
        <path d="M50 55 Q50 65 55 60" stroke="#E57373" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* Tail */}
        <path d="M70 60 Q85 50 90 55" stroke="#A1887F" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );

  const CartoonBird = () => (
    <div className="relative w-16 h-16 animate-bounce delay-300">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Body */}
        <circle cx="50" cy="50" r="25" fill="#4FC3F7" />
        {/* Wings */}
        <path d="M25 50 Q10 40 25 30" fill="#039BE5" />
        <path d="M75 50 Q90 40 75 30" fill="#039BE5" />
        {/* Eyes */}
        <circle cx="42" cy="45" r="3" fill="#333" />
        <circle cx="58" cy="45" r="3" fill="#333" />
        {/* Beak */}
        <path d="M45 52 L55 52 L50 60 Z" fill="#FFB74D" />
        {/* Crest */}
        <path d="M50 25 L45 15 L55 15 Z" fill="#039BE5" />
      </svg>
    </div>
  );

  const CartoonSprout = () => (
    <div className="relative w-16 h-16 animate-bounce">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Stem */}
        <path d="M50 90 C50 90 50 70 50 60" stroke="#4CAF50" strokeWidth="4" strokeLinecap="round" />
        {/* Body */}
        <path d="M50 70 C20 70 10 40 50 10 C90 40 80 70 50 70 Z" fill="#A0E8AF" />
        {/* Leaf Arm */}
        <path d="M45 65 C35 65 30 55 45 45 C60 55 55 65 45 65 Z" fill="#81C784" />
        {/* Eyes */}
        <circle cx="40" cy="40" r="3" fill="#333" />
        <circle cx="60" cy="40" r="3" fill="#333" />
        {/* Smile */}
        <path d="M40 52 Q50 60 60 52" stroke="#333" strokeWidth="2" fill="none" />
      </svg>
    </div>
  );

  const CartoonCapybara = () => (
    <div className="relative w-16 h-16 animate-bounce delay-75">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
        {/* Body */}
        <rect x="25" y="45" width="50" height="35" rx="12" fill="#8D6E63" />
        {/* Head */}
        <rect x="55" y="30" width="30" height="25" rx="8" fill="#A1887F" />
        {/* Ears */}
        <circle cx="60" cy="30" r="4" fill="#8D6E63" />
        {/* Eyes */}
        <circle cx="75" cy="38" r="3" fill="#333" />
        {/* Snout/Nose */}
        <rect x="78" y="42" width="10" height="8" rx="2" fill="#5D4037" />
        {/* Legs */}
        <rect x="30" y="75" width="8" height="10" rx="2" fill="#5D4037" />
        <rect x="62" y="75" width="8" height="10" rx="2" fill="#5D4037" />
        {/* Small orange (yuzu) on head - classic capybara meme */}
        <circle cx="70" cy="25" r="5" fill="#FFA726" />
        <path d="M70 20 L70 18" stroke="#4CAF50" strokeWidth="1" />
      </svg>
    </div>
  );

  const pets: { type: PetType; icon: React.ReactNode; label: string; desc: string }[] = [
    { type: 'sprout', icon: <CartoonSprout />, label: 'Eco Sprout', desc: 'The classic green companion.' },
    { type: 'cat', icon: <CartoonCat />, label: 'Eco Cat', desc: 'Independent and clean.' },
    { type: 'dog', icon: <CartoonDog />, label: 'Green Dog', desc: 'Loyal and active.' },
    { type: 'bird', icon: <CartoonBird />, label: 'Sky Bird', desc: 'Free and observant.' },
    { type: 'capybara', icon: <CartoonCapybara />, label: 'Chill Capy', desc: 'The ultimate zen master.' },
  ];

  const handleConfirm = () => {
    if (selectedType && name.trim()) {
      onSelect(selectedType, name);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] p-6 pb-40 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="text-center mb-8 relative z-10">
        <h1 className="text-3xl font-black text-gray-800 mb-2">Choose Your Companion</h1>
        <p className="text-gray-500 max-w-xs mx-auto">Select your eco-partner. This choice is permanent!</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm mb-8 relative z-10">
        {pets.map((pet) => (
          <button
            key={pet.type}
            onClick={() => setSelectedType(pet.type)}
            className={`relative p-4 rounded-[32px] border-4 transition-all flex items-center gap-4 text-left group ${
              selectedType === pet.type
                ? 'bg-white border-green-400 shadow-xl scale-105 ring-4 ring-green-100'
                : 'bg-white/60 border-transparent hover:bg-white hover:border-green-200 hover:shadow-md'
            }`}
          >
            <div className={`p-2 rounded-2xl transition-colors ${selectedType === pet.type ? 'bg-green-50' : 'bg-gray-50 group-hover:bg-green-50/50'}`}>
              {pet.icon}
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-800">{pet.label}</h3>
              <p className="text-xs font-bold text-gray-400">{pet.desc}</p>
            </div>
            {selectedType === pet.type && (
              <div className="absolute top-1/2 -translate-y-1/2 right-4 bg-green-500 text-white p-1.5 rounded-full shadow-lg animate-in zoom-in">
                <Check size={20} strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-500 relative z-20 bg-white/80 backdrop-blur-md p-6 rounded-[32px] shadow-2xl border border-white">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Name your pet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name..."
              className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 focus:outline-none font-black text-gray-800 bg-white text-lg placeholder:font-medium placeholder:text-gray-300"
              autoFocus
            />
          </div>
          <button
            onClick={handleConfirm}
            disabled={!name.trim()}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Adopt Companion</span>
            <Check size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PetSelection;
