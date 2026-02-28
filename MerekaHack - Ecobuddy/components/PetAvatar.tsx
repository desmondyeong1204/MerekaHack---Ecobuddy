import React from 'react';
import { PetType, PetAccessory } from '../types';
import SproutPet from './SproutPet';

interface PetAvatarProps {
  type: PetType;
  accessories: PetAccessory[];
  happiness: number;
  isFoggy?: boolean;
  className?: string;
}

const PetAvatar: React.FC<PetAvatarProps> = ({ type, accessories, happiness, isFoggy = false, className = '' }) => {
  const equippedClothes = accessories.find(a => a.type === 'clothes' && a.equipped);

  const CartoonCat = () => (
    <div className="relative w-full h-full animate-bounce delay-100">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <path d="M30 60 Q50 80 70 60 L70 40 Q50 20 30 40 Z" fill="#FFB74D" />
        <path d="M30 40 L20 20 L40 35 Z" fill="#FFB74D" />
        <path d="M70 40 L80 20 L60 35 Z" fill="#FFB74D" />
        <circle cx="40" cy="50" r="4" fill="#333" />
        <circle cx="60" cy="50" r="4" fill="#333" />
        <path d="M48 58 L52 58 L50 62 Z" fill="#E57373" />
        <path d="M50 62 Q45 68 40 65" stroke="#333" strokeWidth="2" fill="none" />
        <path d="M50 62 Q55 68 60 65" stroke="#333" strokeWidth="2" fill="none" />
        <path d="M30 55 L15 52" stroke="#333" strokeWidth="1" />
        <path d="M30 60 L15 60" stroke="#333" strokeWidth="1" />
        <path d="M70 55 L85 52" stroke="#333" strokeWidth="1" />
        <path d="M70 60 L85 60" stroke="#333" strokeWidth="1" />
        <path d="M70 70 Q90 80 90 60" stroke="#FFB74D" strokeWidth="6" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );

  const CartoonDog = () => (
    <div className="relative w-full h-full animate-bounce delay-200">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <rect x="30" y="40" width="40" height="35" rx="10" fill="#A1887F" />
        <circle cx="50" cy="40" r="25" fill="#D7CCC8" />
        <path d="M25 30 L15 50 L30 45 Z" fill="#8D6E63" />
        <path d="M75 30 L85 50 L70 45 Z" fill="#8D6E63" />
        <circle cx="40" cy="35" r="4" fill="#333" />
        <circle cx="60" cy="35" r="4" fill="#333" />
        <ellipse cx="50" cy="45" rx="6" ry="4" fill="#333" />
        <path d="M50 55 Q50 65 55 60" stroke="#E57373" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M70 60 Q85 50 90 55" stroke="#A1887F" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );

  const CartoonBird = () => (
    <div className="relative w-full h-full animate-bounce delay-300">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
        <circle cx="50" cy="50" r="25" fill="#4FC3F7" />
        <path d="M25 50 Q10 40 25 30" fill="#039BE5" />
        <path d="M75 50 Q90 40 75 30" fill="#039BE5" />
        <circle cx="42" cy="45" r="3" fill="#333" />
        <circle cx="58" cy="45" r="3" fill="#333" />
        <path d="M45 52 L55 52 L50 60 Z" fill="#FFB74D" />
        <path d="M50 25 L45 15 L55 15 Z" fill="#039BE5" />
      </svg>
    </div>
  );

  const CartoonSprout = () => (
    <div className="w-full h-full">
       <SproutPet happiness={happiness} size="lg" />
    </div>
  );

  const CartoonCapybara = () => (
    <div className="relative w-full h-full animate-bounce delay-75">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
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
        {/* Small orange (yuzu) on head */}
        <circle cx="70" cy="25" r="5" fill="#FFA726" />
        <path d="M70 20 L70 18" stroke="#4CAF50" strokeWidth="1" />
      </svg>
    </div>
  );

  const renderIcon = () => {
    switch (type) {
      case 'cat': return <CartoonCat />;
      case 'dog': return <CartoonDog />;
      case 'bird': return <CartoonBird />;
      case 'sprout': return <CartoonSprout />;
      case 'capybara': return <CartoonCapybara />;
      default: return <CartoonSprout />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className={isFoggy ? 'opacity-50 blur-[1px]' : ''}>
        {renderIcon()}
      </div>
      {equippedClothes && (
        <div className="absolute top-0 right-0 text-4xl animate-bounce z-10">
          {equippedClothes.icon}
        </div>
      )}
    </div>
  );
};

export default PetAvatar;
