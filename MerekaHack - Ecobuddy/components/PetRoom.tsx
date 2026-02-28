import React, { useState } from 'react';
import { ChevronLeft, AlertTriangle, Trash2, ShoppingBag, Sparkles } from 'lucide-react';
import PetAvatar from './PetAvatar';
import PetInteraction from './PetInteraction';
import { DigitalPet, PetAccessory, UserStats } from '../types';

interface PetRoomProps {
  pet: DigitalPet;
  userStats: UserStats;
  onBack: () => void;
  onUpdatePet: (pet: DigitalPet) => void;
  onUpdateStats: (update: Partial<UserStats>) => void;
  isVisitor?: boolean;
  ownerName?: string;
}

const SHOP_ITEMS: PetAccessory[] = [
  { id: 'food_1', name: 'Organic Kibble', type: 'food', price: 50, icon: '🍖', purchased: false, equipped: false },
  { id: 'food_2', name: 'Premium Fish', type: 'food', price: 80, icon: '🐟', purchased: false, equipped: false },
  { id: 'daily_1', name: 'Soap', type: 'daily', price: 30, icon: '🧼', purchased: false, equipped: false },
  { id: 'clothes_1', name: 'Red Scarf', type: 'clothes', price: 200, icon: '🧣', purchased: false, equipped: false },
  { id: 'clothes_2', name: 'Cool Shades', type: 'clothes', price: 350, icon: '🕶️', purchased: false, equipped: false },
  { id: 'furn_1', name: 'Cozy Bed', type: 'furniture', price: 500, icon: '🛏️', purchased: false, equipped: false },
  { id: 'furn_2', name: 'Scratch Post', type: 'furniture', price: 400, icon: '🧶', purchased: false, equipped: false },
];

const PetRoom: React.FC<PetRoomProps> = ({ pet, userStats, onBack, onUpdatePet, onUpdateStats, isVisitor = false, ownerName }) => {
  const [showShop, setShowShop] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [activeShopTab, setActiveShopTab] = useState<'food' | 'daily' | 'clothes' | 'furniture'>('food');
  const [isHappy, setIsHappy] = useState(false);

  if (showInteraction) {
    return <PetInteraction pet={pet} onBack={() => setShowInteraction(false)} />;
  }

  // Eco-Mirror Logic
  const daysSinceActive = (new Date().getTime() - new Date(pet.lastActiveDate).getTime()) / (1000 * 3600 * 24);
  const isFoggy = daysSinceActive > 3 || (userStats.hasUsedPlastic && !isVisitor);
  
  const handleBuy = (item: PetAccessory) => {
    if (isVisitor) return;
    if (userStats.points >= item.price) {
      onUpdateStats({ points: userStats.points - item.price });
      const newItem = { ...item, purchased: true };
      onUpdatePet({
        ...pet,
        accessories: [...pet.accessories, newItem]
      });
    }
  };

  const handleEquip = (item: PetAccessory) => {
    if (isVisitor) return;
    const updatedAccessories = pet.accessories.map(acc => {
      if (acc.type === item.type && acc.type !== 'food' && acc.type !== 'daily') {
         // Unequip others of same type if not consumable
         return { ...acc, equipped: acc.id === item.id ? !acc.equipped : false };
      }
      if (acc.id === item.id) {
        return { ...acc, equipped: !acc.equipped };
      }
      return acc;
    });
    
    // If consumable, remove it and boost happiness
    if (item.type === 'food' || item.type === 'daily') {
       setIsHappy(true);
       setTimeout(() => setIsHappy(false), 1000);
       onUpdatePet({
         ...pet,
         happiness: Math.min(100, pet.happiness + 10),
         accessories: pet.accessories.filter(a => a.id !== item.id)
       });
    } else {
       onUpdatePet({ ...pet, accessories: updatedAccessories });
    }
  };

  return (
    <div className={`min-h-screen relative p-6 flex flex-col items-center overflow-hidden`}>
      {/* Eco-Mirror Fog/Dirt Overlay */}
      {isFoggy && (
        <>
          <div className="absolute inset-0 bg-gray-500/20 backdrop-blur-[4px] z-20 pointer-events-none" />
          <div className="absolute inset-0 flex flex-wrap opacity-30 pointer-events-none p-12 overflow-hidden z-20">
            {[...Array(8)].map((_, i) => (
              <Trash2 key={i} className="text-gray-600 m-12 rotate-12" size={64} />
            ))}
          </div>
          <div className="absolute top-24 z-30 bg-white/90 px-4 py-2 rounded-full shadow-lg">
             <p className="text-xs font-bold text-gray-600 flex items-center gap-2">
               <AlertTriangle size={14} className="text-orange-500" />
               Room is foggy due to inactivity or waste
             </p>
          </div>
        </>
      )}

      {/* Header */}
      <div className="w-full flex justify-between items-center relative z-30">
        <button onClick={onBack} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 active:scale-90">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
           {isVisitor ? (
             <span className="text-sm font-black text-gray-600">Visiting {ownerName}</span>
           ) : (
             <span className="text-sm font-black text-green-600">{userStats.points} pts</span>
           )}
        </div>
        {!isVisitor && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowInteraction(true)}
              className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 active:scale-90 text-yellow-500"
            >
              <Sparkles size={24} />
            </button>
            <button onClick={() => setShowShop(!showShop)} className={`p-3 rounded-2xl shadow-sm border border-gray-100 active:scale-90 transition-colors ${showShop ? 'bg-green-500 text-white' : 'bg-white text-gray-800'}`}>
              <ShoppingBag size={24} />
            </button>
          </div>
        )}
        {isVisitor && <div className="w-12" />}
      </div>

      {/* Main Pet Area */}
      <div className="mt-12 flex flex-col items-center flex-1 w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">{pet.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${pet.happiness > 50 ? 'bg-green-500' : 'bg-orange-500'}`} 
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-400">{pet.happiness}% Happy</span>
          </div>
        </div>

        <div className={`relative py-8 w-64 h-64 flex items-center justify-center transition-transform duration-300 ${isHappy ? 'scale-110 -translate-y-4' : ''}`}>
          <div className="w-48 h-48">
            <PetAvatar 
              type={pet.type} 
              accessories={pet.accessories} 
              happiness={pet.happiness} 
              isFoggy={isFoggy}
            />
          </div>
          
          {/* Furniture */}
          {pet.accessories.filter(a => a.type === 'furniture' && a.equipped).map((furn, i) => (
             <div key={furn.id} className="absolute -bottom-4 -right-8 text-6xl opacity-90" style={{ transform: `translateX(${i * 20}px)` }}>
               {furn.icon}
             </div>
          ))}
        </div>

        {/* Shop / Inventory Interface */}
        {!isVisitor && showShop ? (
          <div className="w-full mt-8 bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/50 p-6 animate-in slide-in-from-bottom-10 absolute bottom-0 h-[50vh] flex flex-col z-40">
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
              {['food', 'daily', 'clothes', 'furniture'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveShopTab(tab as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                    activeShopTab === tab ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {/* Inventory Items of current tab */}
              {pet.accessories.filter(a => a.type === activeShopTab).length > 0 && (
                <div className="mb-4">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Items</h4>
                   <div className="grid grid-cols-2 gap-3">
                     {pet.accessories.filter(a => a.type === activeShopTab).map(item => (
                       <button 
                         key={item.id}
                         onClick={() => handleEquip(item)}
                         className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${item.equipped ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}
                       >
                         <span className="text-2xl">{item.icon}</span>
                         <div className="text-left">
                           <p className="font-bold text-xs text-gray-800">{item.name}</p>
                           <p className="text-[10px] text-green-600 font-bold">{item.type === 'food' || item.type === 'daily' ? 'Use' : (item.equipped ? 'Equipped' : 'Equip')}</p>
                         </div>
                       </button>
                     ))}
                   </div>
                </div>
              )}

              {/* Shop Items */}
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Shop</h4>
              <div className="grid grid-cols-2 gap-3">
                {SHOP_ITEMS.filter(item => item.type === activeShopTab && !pet.accessories.find(a => a.id === item.id)).map(item => (
                  <button 
                    key={item.id}
                    onClick={() => handleBuy(item)}
                    disabled={userStats.points < item.price}
                    className="p-3 rounded-xl border border-gray-100 bg-white flex items-center gap-3 hover:shadow-md transition-all disabled:opacity-50"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="text-left">
                      <p className="font-bold text-xs text-gray-800">{item.name}</p>
                      <p className={`text-[10px] font-bold ${userStats.points >= item.price ? 'text-gray-500' : 'text-red-400'}`}>{item.price} pts</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full mt-12 p-6 bg-white/40 rounded-[35px] text-center border border-white backdrop-blur-sm">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</span>
             <p className="text-sm font-bold text-gray-800 mt-2 italic">
               {isFoggy ? "It's a bit foggy in here..." : "The room is sparkling clean!"}
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PetRoom;
