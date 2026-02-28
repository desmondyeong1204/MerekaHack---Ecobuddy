
import React, { useState } from 'react';
import { ChevronLeft, ShoppingBag, Leaf, Camera, Sparkles, Minus, Plus } from 'lucide-react';
import { FoodItem, TabType } from '../types';

interface CartCheckoutProps {
  cart: FoodItem[];
  onBack: () => void;
  onNavigate: (tab: TabType) => void;
}

const CartCheckout: React.FC<CartCheckoutProps> = ({ cart, onBack, onNavigate }) => {
  const [byo, setByo] = useState(false);
  
  const [quantities, setQuantities] = useState<Record<string, number>>(
    cart.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
  );

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const total = cart.reduce((sum, item) => {
    const qty = quantities[item.id] || 1;
    return sum + (item.discountedPrice * qty);
  }, 0);

  const getFoodImage = (item: FoodItem) => {
    if (item.category === 'Sushi & Seafood') return 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=300&q=80';
    if (item.category === 'Bakery') return 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80';
    if (item.category === 'Noodles') return 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=300&q=80';
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
          <ShoppingBag size={48} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Your cart is empty</h2>
          <p className="text-gray-400 font-bold mt-2">Go rescue some delicious food!</p>
        </div>
        <button 
          onClick={onBack} 
          className="bg-[#A0E8AF] text-green-900 px-8 py-4 rounded-[25px] font-black shadow-lg active:scale-95 transition-transform"
        >
          Browse Food
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-6 space-y-4 animate-in fade-in duration-500 pb-32">
      <div className="flex items-center w-full mb-2">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 flex-1 text-center pr-8">My Cart</h2>
      </div>

      <div className="w-full space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-[25px] p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                <img src={getFoodImage(item)} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-sm leading-tight">{item.restaurant} - {item.name}</h4>
                <p className="font-black text-gray-800 mt-1">RM {item.discountedPrice.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => updateQty(item.id, -1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E0F7E9] text-[#4CAF50] transition-transform active:scale-90"
              >
                <Minus size={16} strokeWidth={3} />
              </button>
              <span className="font-black text-gray-800">{quantities[item.id] || 1}</span>
              <button 
                onClick={() => updateQty(item.id, 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#E0F7E9] text-[#4CAF50] transition-transform active:scale-90"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full bg-[#FEF3C7] rounded-[20px] p-5 flex items-center justify-center space-x-3 border border-[#FDE68A]">
        <Leaf className="text-[#059669] fill-[#10B981]" size={20} />
        <p className="text-sm font-bold text-gray-800">
          Eco-Bonus Active: Bring your own container for <span className="font-black">2x Points!</span>
        </p>
      </div>

      <div className="w-full flex items-center justify-between px-2">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setByo(!byo)}
            className={`w-12 h-6 rounded-full transition-colors relative ${byo ? 'bg-[#4CAF50]' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${byo ? 'left-7' : 'left-1'}`} />
          </button>
          <span className="text-sm font-bold text-gray-800">
            Bring Own Container <span className="text-green-600 font-black">(+50 pts)</span>
          </span>
        </div>
        <button 
          onClick={() => onNavigate('verify')}
          className="flex items-center space-x-1 bg-[#A7F3D0] text-[#065F46] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all active:scale-95"
        >
          <Camera size={14} strokeWidth={3} />
          <span>Scan</span>
        </button>
      </div>

      <div className="w-full relative flex flex-col items-center">
        <div className="bg-[#CFFAFE] rounded-[30px] p-6 text-center shadow-sm border border-[#BAE6FD] w-full max-w-sm mt-4 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <div className="bg-[#BAE6FD] text-[#0E7490] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
              Gemini Insight
            </div>
          </div>
          <p className="text-sm font-bold text-gray-800 mt-2 leading-tight">
            Based on your order,<br />
            a medium-sized (1L) container is recommended.
          </p>
        </div>
      </div>

      <div className="w-full pt-4">
        <button 
          onClick={() => byo ? onNavigate('verify') : onNavigate('home')}
          className="w-full bg-[#A0E8AF] text-green-900 py-5 rounded-[25px] font-black text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 group"
        >
          <span>Checkout - RM {total.toFixed(2)}</span>
          <Sparkles size={20} className="text-white opacity-80 group-hover:animate-pulse" />
        </button>
      </div>
    </div>
  );
};

export default CartCheckout;
