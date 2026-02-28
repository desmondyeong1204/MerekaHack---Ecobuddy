
import React, { useState } from 'react';
import { ChevronLeft, Heart, Zap, Coffee, Sparkles, MessageCircle } from 'lucide-react';
import PetAvatar from './PetAvatar';
import { generatePetMessage } from '../services/gemini';

interface PetInteractionProps {
  onBack: () => void;
  pet: any;
}

const PetInteraction: React.FC<PetInteractionProps> = ({ onBack, pet }) => {
  const [happiness, setHappiness] = useState(pet.happiness || 85);
  const [showHeart, setShowHeart] = useState(false);
  const [petMessage, setPetMessage] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const interact = async (type: string, boost: number) => {
    setHappiness(prev => Math.min(100, prev + boost));
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);

    setIsThinking(true);
    const msg = await generatePetMessage({ ...pet, happiness: Math.min(100, happiness + boost) }, type);
    setPetMessage(msg);
    setIsThinking(false);
  };

  return (
    <div className="h-screen bg-gradient-to-b from-[#E8F5E9] to-white p-6 relative flex flex-col items-center animate-in zoom-in duration-500">
      <button onClick={onBack} className="absolute top-8 left-6 bg-white p-3 rounded-2xl shadow-sm active:scale-90 z-50">
        <ChevronLeft size={24} />
      </button>

      <div className="mt-20 flex flex-col items-center flex-1 w-full max-w-sm">
        <div className="mb-4 text-center">
          <h2 className="text-3xl font-black text-green-900">{pet.name || 'Sproutly'}</h2>
          <p className="text-green-600 font-bold">Level {pet.level || 1} • {pet.type || 'Earth Guardian'}</p>
        </div>

        <div className="relative mt-8 py-8 h-48 w-48 flex items-center justify-center">
          {showHeart && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-bounce z-20">
              <Heart className="text-red-400 fill-red-400" size={48} />
            </div>
          )}
          <PetAvatar 
            type={pet.type} 
            accessories={pet.accessories || []} 
            happiness={happiness} 
            className="w-full h-full"
          />
          
          {petMessage && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl shadow-xl border border-green-100 min-w-[150px] animate-in slide-in-from-bottom-2">
              <p className="text-xs font-bold text-green-800 text-center">{petMessage}</p>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-green-100 rotate-45" />
            </div>
          )}

          {isThinking && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/80 px-4 py-2 rounded-2xl shadow-sm border border-green-50 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        <div className="w-full mt-12 space-y-6">
          <div className="bg-white/60 p-6 rounded-[30px] shadow-sm space-y-3">
            <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
              <span>Happiness</span>
              <span>{happiness}%</span>
            </div>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-green-400 h-full transition-all duration-700" 
                style={{ width: `${happiness}%` }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => interact('petting', 5)}
              disabled={isThinking}
              className="bg-white p-6 rounded-[30px] flex flex-col items-center space-y-2 shadow-sm active:bg-pink-50 transition-colors disabled:opacity-50"
            >
              <Heart className="text-pink-400" />
              <span className="text-[10px] font-black uppercase">Pet</span>
            </button>
            <button 
              onClick={() => interact('feeding', 10)}
              disabled={isThinking}
              className="bg-white p-6 rounded-[30px] flex flex-col items-center space-y-2 shadow-sm active:bg-blue-50 transition-colors disabled:opacity-50"
            >
              <Coffee className="text-blue-400" />
              <span className="text-[10px] font-black uppercase">Feed</span>
            </button>
            <button 
              onClick={() => interact('playing', 15)}
              disabled={isThinking}
              className="bg-white p-6 rounded-[30px] flex flex-col items-center space-y-2 shadow-sm active:bg-yellow-50 transition-colors disabled:opacity-50"
            >
              <Zap className="text-yellow-400" />
              <span className="text-[10px] font-black uppercase">Play</span>
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center space-x-2 text-yellow-600 font-bold bg-yellow-50 px-6 py-3 rounded-full border border-yellow-100">
          <Sparkles size={18} />
          <span>+20 points available for playing today</span>
        </div>
      </div>
    </div>
  );
};

export default PetInteraction;
