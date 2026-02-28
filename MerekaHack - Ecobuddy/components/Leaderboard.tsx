import React from 'react';
import { Crown } from 'lucide-react';
import { DigitalPet } from '../types';

interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  avatar: string;
  change?: 'up' | 'down' | 'same';
  pet: DigitalPet;
}

const leaderboardData: LeaderboardUser[] = [
  { 
    rank: 1, 
    name: 'Sarah Chen', 
    points: 2850, 
    avatar: 'https://picsum.photos/seed/sarah/120/120', 
    change: 'same',
    pet: {
      name: 'Luna',
      happiness: 95,
      level: 5,
      type: 'cat',
      accessories: [
        { id: 'clothes_1', name: 'Red Scarf', type: 'clothes', price: 200, icon: '🧣', purchased: true, equipped: true },
        { id: 'furn_1', name: 'Cozy Bed', type: 'furniture', price: 500, icon: '🛏️', purchased: true, equipped: true }
      ],
      lastActiveDate: new Date().toISOString()
    }
  },
  { 
    rank: 2, 
    name: 'Mike Ross', 
    points: 2720, 
    avatar: 'https://picsum.photos/seed/mike/120/120', 
    change: 'up',
    pet: {
      name: 'Rocky',
      happiness: 88,
      level: 4,
      type: 'dog',
      accessories: [
        { id: 'clothes_2', name: 'Cool Shades', type: 'clothes', price: 350, icon: '🕶️', purchased: true, equipped: true }
      ],
      lastActiveDate: new Date().toISOString()
    }
  },
  { 
    rank: 3, 
    name: 'Jessica P.', 
    points: 2680, 
    avatar: 'https://picsum.photos/seed/jessica/120/120', 
    change: 'down',
    pet: {
      name: 'Sky',
      happiness: 92,
      level: 4,
      type: 'bird',
      accessories: [],
      lastActiveDate: new Date().toISOString()
    }
  },
  { 
    rank: 4, 
    name: 'Alex Green', 
    points: 2450, 
    avatar: 'https://picsum.photos/seed/alex/120/120', 
    change: 'up',
    pet: { // Placeholder, will be replaced by actual user pet in App logic if needed, but good for mock
      name: 'Sprout',
      happiness: 100,
      level: 1,
      type: 'sprout',
      accessories: [],
      lastActiveDate: new Date().toISOString()
    }
  },
  { 
    rank: 5, 
    name: 'David Kim', 
    points: 2300, 
    avatar: 'https://picsum.photos/seed/david/120/120', 
    change: 'same',
    pet: {
      name: 'Coco',
      happiness: 75,
      level: 3,
      type: 'dog',
      accessories: [],
      lastActiveDate: new Date().toISOString()
    }
  },
  { 
    rank: 6, 
    name: 'Emma W.', 
    points: 2150, 
    avatar: 'https://picsum.photos/seed/emma/120/120', 
    change: 'down',
    pet: {
      name: 'Misty',
      happiness: 60,
      level: 2,
      type: 'cat',
      accessories: [],
      lastActiveDate: new Date().toISOString()
    }
  },
  { 
    rank: 7, 
    name: 'Tom H.', 
    points: 1900, 
    avatar: 'https://picsum.photos/seed/tom/120/120', 
    change: 'same',
    pet: {
      name: 'Leafy',
      happiness: 90,
      level: 2,
      type: 'sprout',
      accessories: [],
      lastActiveDate: new Date().toISOString()
    }
  },
];

interface LeaderboardProps {
  onVisit: (pet: DigitalPet, ownerName: string) => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onVisit }) => {
  const topThree = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-green-50 to-white pb-32">
      {/* Header */}
      <div className="p-6 pt-8">
        <h2 className="text-3xl font-black text-gray-800 mb-2">Leaderboard</h2>
        <p className="text-gray-500">Weekly Top Eco-Warriors</p>
      </div>

      {/* Podium */}
      <div className="flex justify-center items-end gap-3 px-4 mb-8">
        {/* 2nd Place */}
        <div 
          className="flex flex-col items-center w-1/3 cursor-pointer active:scale-95 transition-transform"
          onClick={() => onVisit(topThree[1].pet, topThree[1].name)}
        >
          <div className="relative mb-2">
             <img src={topThree[1].avatar} className="w-16 h-16 rounded-full border-4 border-gray-200 shadow-lg object-cover" alt={topThree[1].name} />
             <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full border border-white shadow-sm">
               2
             </div>
          </div>
          <div className="h-28 w-full bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-xl mt-1 shadow-sm opacity-80 flex flex-col justify-end pb-4 items-center px-1">
            <p className="font-bold text-gray-800 text-sm truncate w-full text-center mb-1">{topThree[1].name}</p>
            <p className="text-green-600 font-black text-lg leading-none">{topThree[1].points}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">pts</p>
          </div>
        </div>

        {/* 1st Place */}
        <div 
          className="flex flex-col items-center w-1/3 z-10 cursor-pointer active:scale-95 transition-transform"
          onClick={() => onVisit(topThree[0].pet, topThree[0].name)}
        >
          <div className="relative mb-2">
             <Crown className="w-8 h-8 text-yellow-500 absolute -top-9 left-1/2 transform -translate-x-1/2 animate-bounce" fill="currentColor" />
             <img src={topThree[0].avatar} className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-xl object-cover" alt={topThree[0].name} />
             <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white shadow-sm">
               1
             </div>
          </div>
          <div className="h-36 w-full bg-gradient-to-t from-yellow-100 to-yellow-50 rounded-t-xl mt-1 shadow-md border-t border-yellow-200 flex flex-col justify-end pb-6 items-center px-1">
            <p className="font-black text-gray-900 text-base truncate w-full text-center mb-1">{topThree[0].name}</p>
            <p className="text-green-700 font-black text-2xl leading-none">{topThree[0].points}</p>
            <p className="text-[10px] text-yellow-700/60 font-bold uppercase tracking-wider">pts</p>
          </div>
        </div>

        {/* 3rd Place */}
        <div 
          className="flex flex-col items-center w-1/3 cursor-pointer active:scale-95 transition-transform"
          onClick={() => onVisit(topThree[2].pet, topThree[2].name)}
        >
          <div className="relative mb-2">
             <img src={topThree[2].avatar} className="w-16 h-16 rounded-full border-4 border-orange-200 shadow-lg object-cover" alt={topThree[2].name} />
             <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-orange-200 text-orange-800 text-xs font-bold px-2 py-0.5 rounded-full border border-white shadow-sm">
               3
             </div>
          </div>
          <div className="h-20 w-full bg-gradient-to-t from-orange-100 to-orange-50 rounded-t-xl mt-1 shadow-sm opacity-80 flex flex-col justify-end pb-3 items-center px-1">
            <p className="font-bold text-gray-800 text-sm truncate w-full text-center mb-1">{topThree[2].name}</p>
            <p className="text-green-600 font-black text-lg leading-none">{topThree[2].points}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">pts</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 space-y-3">
        {rest.map((user) => (
          <div 
            key={user.rank} 
            onClick={() => onVisit(user.pet, user.name)}
            className={`flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-all hover:scale-[1.02] active:scale-95 cursor-pointer ${user.name === 'Alex Green' ? 'bg-green-50 border-green-200 ring-1 ring-green-200' : 'bg-white border-gray-100'}`}
          >
            <div className="flex items-center space-x-4">
              <span className="font-bold text-gray-400 w-6 text-center text-lg">{user.rank}</span>
              <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.name} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800">{user.name}</p>
                  {user.name === 'Alex Green' && <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                </div>
              </div>
            </div>
            <span className="font-bold text-green-600">{user.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
