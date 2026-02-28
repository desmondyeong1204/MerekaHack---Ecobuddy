
import React, { useState, useEffect } from 'react';
import { Apple, MapPin, ChevronLeft, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { FoodItem, TabType } from '../types';
import { generateFoodRescueInsight } from '../services/gemini';

interface FoodRescueProps {
  onBack: () => void;
  onNavigate: (tab: TabType) => void;
  onAddToCart: (item: FoodItem) => void;
}

const MOCK_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'f1',
    restaurant: 'Sushi Zen',
    name: 'Seafood Surprise',
    distance: '0.5 km',
    originalPrice: 30,
    discountedPrice: 9,
    category: 'Sushi & Seafood',
    urgency: 'CRITICAL',
    co2Saved: 2.5
  },
  {
    id: 'f2',
    restaurant: 'Green Bakery',
    name: 'Pastry Box (x4)',
    distance: '1.2 km',
    originalPrice: 20,
    discountedPrice: 8,
    category: 'Bakery',
    urgency: 'MEDIUM',
    co2Saved: 1.0
  },
  {
    id: 'f3',
    restaurant: 'Noodle House',
    name: 'Late Night Box',
    distance: '2.0 km',
    originalPrice: 15,
    discountedPrice: 5,
    category: 'Noodles',
    urgency: 'LOW',
    co2Saved: 0.8
  }
];

const FoodRescue: React.FC<FoodRescueProps> = ({ onBack, onNavigate, onAddToCart }) => {
  const [insight, setInsight] = useState<string>("Loading eco-insights...");
  const [isInsightLoading, setIsInsightLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      setIsInsightLoading(true);
      const msg = await generateFoodRescueInsight(MOCK_FOOD_ITEMS);
      setInsight(msg);
      setIsInsightLoading(false);
    };
    fetchInsight();
  }, []);

  const getFoodImage = (item: FoodItem) => {
    if (item.category === 'Sushi & Seafood') return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80';
    if (item.category === 'Bakery') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80';
    if (item.category === 'Noodles') return 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=300&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
  };

  return (
    <div className="p-6 pb-32 space-y-6 animate-in fade-in slide-in-from-right duration-500 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack} 
            className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 active:scale-90 transition-all hover:bg-gray-50 flex items-center justify-center"
          >
            <ChevronLeft size={24} className="text-gray-900" strokeWidth={2.5} />
          </button>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Food Rescue</h2>
        </div>
        <button 
          onClick={() => onNavigate('merchant')}
          className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100/50"
        >
          Merchant
        </button>
      </div>

      {/* AI Insight Box */}
      <div className="bg-[#B3E5FC]/20 p-6 rounded-[35px] border border-white/40 flex items-start space-x-4 shadow-sm relative overflow-hidden">
        <div className="bg-white p-3 rounded-2xl text-blue-500 shadow-sm shrink-0">
          {isInsightLoading ? <RefreshCw size={24} className="animate-spin" /> : <Sparkles size={24} />}
        </div>
        <div>
          <h3 className="text-[11px] font-black text-[#1A237E]/60 uppercase tracking-widest">Gemini Insight</h3>
          <p className={`text-sm font-bold text-gray-800 mt-1 leading-snug ${isInsightLoading ? 'opacity-50' : ''}`}>
            {insight}
          </p>
        </div>
      </div>

      {/* Food Items List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Nearby Surprise Boxes</h3>
        {MOCK_FOOD_ITEMS.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 p-5 rounded-[35px] shadow-sm flex flex-col space-y-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden border border-gray-50 shadow-inner">
                   <img src={getFoodImage(item)} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-black text-gray-800 leading-tight">{item.restaurant}</h4>
                  <p className="text-xs text-gray-500 font-bold">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-black flex items-center mt-1">
                    <MapPin size={10} className="mr-1 text-red-400" /> {item.distance}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                item.urgency === 'CRITICAL' ? 'bg-red-100 text-red-500' : 
                item.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-500'
              }`}>
                {item.urgency}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <div className="bg-green-50 px-3 py-1 rounded-lg flex items-center space-x-1 border border-green-100">
                  <span className="text-[10px] text-green-600 font-black">🌱 {item.co2Saved}kg CO2 Saved</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 line-through font-bold">RM {item.originalPrice.toFixed(2)}</p>
                  <p className="font-black text-gray-800">RM {item.discountedPrice.toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => onAddToCart(item)}
                  className="bg-[#A0E8AF] text-green-900 p-3.5 rounded-2xl shadow-sm active:scale-95 transition-all hover:bg-green-300"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodRescue;
