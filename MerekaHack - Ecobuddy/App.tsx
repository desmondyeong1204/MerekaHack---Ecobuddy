
import React, { useState } from 'react';
import FloatingNav from './components/FloatingNav';
import HomeDashboard from './components/HomeDashboard';
import MapView from './components/MapView';
import RecyclingScanner from './components/RecyclingScanner';
import MobilityDashboard from './components/MobilityDashboard';
import UserDashboard from './components/UserDashboard';
import FoodRescue from './components/FoodRescue';
import MerchantPortal from './components/MerchantPortal';
import CartCheckout from './components/CartCheckout';
import ContainerVerification from './components/ContainerVerification';
import RecycleBagVerification from './components/RecycleBagVerification';
import PetRoom from './components/PetRoom';
import Leaderboard from './components/Leaderboard';
import PetSelection from './components/PetSelection';
import { TabType, UserStats, DigitalPet, FoodItem, PetType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [cart, setCart] = useState<FoodItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    steps: 6420,
    distance: 4.8,
    points: 360,
    co2Saved: 12.5,
    tripsAvoided: 5,
    mealsRescued: 3,
    userName: 'Alex Green',
    profileImage: 'https://picsum.photos/seed/alex/120/120',
    level: 12,
    badges: [
      { 
        id: '1', 
        name: 'Plastic Warrior', 
        icon: '🛡️', 
        unlocked: true,
        description: 'Recycle 50 plastic items',
        points: 500,
        specialPoint: 'Unlocks "Ocean Blue" theme'
      },
      { 
        id: '2', 
        name: 'Walking Hero', 
        icon: '👟', 
        unlocked: true,
        description: 'Walk 10,000 steps in a single day',
        points: 300,
        specialPoint: '2x points on next walk'
      },
      { 
        id: '3', 
        name: 'Leaf Guardian', 
        icon: '🌿', 
        unlocked: true,
        description: 'Maintain a 7-day streak',
        points: 1000,
        specialPoint: 'Rare "Golden Leaf" pet accessory'
      },
      { 
        id: '4', 
        name: 'Ocean Savior', 
        icon: '🌊', 
        unlocked: false,
        description: 'Clean up a beach or waterway',
        points: 800,
        specialPoint: 'Water element pet evolution'
      },
      { 
        id: '5', 
        name: 'Tree Hugger', 
        icon: '🌳', 
        unlocked: false,
        description: 'Plant a tree or donate to planting',
        points: 600,
        specialPoint: 'Forest background unlock'
      },
    ],
    hasUsedPlastic: false
  });

  const [pet, setPet] = useState<DigitalPet>({
    name: '',
    happiness: 100,
    level: 1,
    accessories: [],
    lastActiveDate: new Date().toISOString()
  });

  const [visitingPet, setVisitingPet] = useState<{ pet: DigitalPet; ownerName: string } | null>(null);

  const handlePetSelection = (type: PetType, name: string) => {
    setPet({
      ...pet,
      type,
      name,
      happiness: 100,
      level: 1,
      accessories: [],
      lastActiveDate: new Date().toISOString()
    });
    setActiveTab('pet');
  };

  const handleVisit = (visitedPet: DigitalPet, ownerName: string) => {
    setVisitingPet({ pet: visitedPet, ownerName });
    setActiveTab('pet');
  };

  const getPageBg = () => {
    switch (activeTab) {
      case 'cart': return 'bg-[#F8F9FA]';
      case 'merchant': return 'bg-gray-50';
      case 'verify':
      case 'bag-verify': return 'bg-black';
      case 'pet': return userStats.hasUsedPlastic && !visitingPet ? 'bg-gray-100' : 'bg-gradient-to-b from-[#E8F5E9] to-white';
      case 'scan': return 'bg-gray-900';
      case 'map': return 'bg-gray-100';
      case 'home': return 'bg-[#F0FDF4]';
      default: return 'bg-white';
    }
  };

  const updateStats = (update: Partial<UserStats> | ((prev: UserStats) => Partial<UserStats>)) => {
    setUserStats(prev => {
      const result = typeof update === 'function' ? update(prev) : update;
      return { ...prev, ...result };
    });
  };

  const addPoints = (amount: number) => {
    updateStats(prev => ({ points: prev.points + amount }));
  };

  const handleAddToCart = (item: FoodItem) => {
    setCart(prev => [...prev, item]);
    setActiveTab('cart');
  };

  const handleVerificationSuccess = (co2: number, pts: number) => {
    updateStats(prev => ({
      co2Saved: prev.co2Saved + co2,
      points: prev.points + pts,
      mealsRescued: prev.mealsRescued + cart.length
    }));
    setCart([]);
    setActiveTab('home');
  };

  const renderContent = () => {
    if (!pet.type) {
      return <PetSelection onSelect={handlePetSelection} />;
    }

    switch (activeTab) {
      case 'home': return <HomeDashboard onNavigate={setActiveTab} totalPoints={userStats.points} pet={pet} />;
      case 'map': return <MapView onBack={() => setActiveTab('home')} />;
      case 'pet': 
        if (visitingPet) {
          return (
            <PetRoom 
              pet={visitingPet.pet} 
              userStats={userStats} 
              onUpdatePet={() => {}} // Read-only
              onUpdateStats={() => {}} // Read-only
              onBack={() => {
                setVisitingPet(null);
                setActiveTab('leaderboard');
              }} 
              isVisitor={true}
              ownerName={visitingPet.ownerName}
            />
          );
        }
        return <PetRoom pet={pet} userStats={userStats} onUpdatePet={setPet} onUpdateStats={updateStats} onBack={() => setActiveTab('home')} />;
      case 'steps': return <MobilityDashboard stats={userStats} pet={pet} onUpdateStats={updateStats} onBack={() => setActiveTab('home')} />;
      case 'scan': return <RecyclingScanner onBack={() => setActiveTab('home')} onAddPoints={addPoints} />;
      case 'food': return <FoodRescue onBack={() => setActiveTab('home')} onNavigate={setActiveTab} onAddToCart={handleAddToCart} />;
      case 'merchant': return <MerchantPortal onBack={() => setActiveTab('food')} />;
      case 'cart': return <CartCheckout cart={cart} onBack={() => setActiveTab('food')} onNavigate={setActiveTab} />;
      case 'verify': return <ContainerVerification onCancel={() => setActiveTab('cart')} onSuccess={handleVerificationSuccess} />;
      case 'bag-verify': return <RecycleBagVerification onCancel={() => setActiveTab('home')} onSuccess={handleVerificationSuccess} />;
      case 'leaderboard':
        return <Leaderboard onVisit={handleVisit} />;
      case 'profile': return <UserDashboard stats={userStats} pet={pet} onUpdateStats={updateStats} />;
      default: return <HomeDashboard onNavigate={setActiveTab} totalPoints={userStats.points} pet={pet} />;
    }
  };

  const showNav = !['map', 'pet', 'scan', 'steps', 'merchant', 'cart', 'verify', 'bag-verify'].includes(activeTab);

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#F3F1E8]">
      {/* 
        Simple Vertical Rectangle 
        - Max width for desktop centering
        - w-full for mobile devices
        - Natural scroll behavior (no fixed aspect ratio or borders)
      */}
      <div className={`w-full max-w-[430px] min-h-screen ${getPageBg()} shadow-2xl relative flex flex-col transition-colors duration-500`}>
        <main className="flex-1 w-full">
          {renderContent()}
        </main>
        
        {showNav && (
          <div className="sticky bottom-0 w-full z-50">
            <FloatingNav 
              activeTab={activeTab === 'food' ? 'home' : activeTab} 
              setActiveTab={setActiveTab} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
