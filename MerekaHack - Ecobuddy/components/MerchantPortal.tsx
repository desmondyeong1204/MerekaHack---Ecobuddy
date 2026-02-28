
import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Package, Send } from 'lucide-react';

interface MerchantPortalProps {
  onBack: () => void;
}

const MerchantPortal: React.FC<MerchantPortalProps> = ({ onBack }) => {
  const [category, setCategory] = useState('General');
  const [quantity, setQuantity] = useState(3);
  const [price, setPrice] = useState(90);
  const [discountPrice, setDiscountPrice] = useState(27);

  const isCritical = category === 'Sushi & Seafood';

  return (
    <div className="p-6 h-screen bg-gray-50 flex flex-col space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-3">
        <button onClick={onBack} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-800">Merchant Portal</h2>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex-1 space-y-8 overflow-y-auto">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center">
            <Package size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-800">Post Surprise Box</h3>
          <p className="text-xs text-gray-400 font-bold">List leftovers to rescue them from waste</p>
        </div>

        {isCritical && (
          <div className="bg-[#B3E5FC]/40 p-6 rounded-[30px] border border-blue-200 animate-in zoom-in duration-300">
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Gemini Insight</span>
            </div>
            <p className="text-xs font-bold text-blue-900 leading-relaxed">
              Category 'Sushi & Seafood' will be flagged as <span className="text-red-500 font-black">CRITICAL</span> urgency for immediate pickup. Notification sent to 500 nearby users.
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Food Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-800 outline-none focus:border-[#A0E8AF] transition-all"
            >
              <option>General</option>
              <option>Sushi & Seafood</option>
              <option>Bakery</option>
              <option>Noodles</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
            <div className="flex items-center justify-between bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-gray-400 font-black text-2xl">-</button>
              <span className="font-black text-lg">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 text-gray-400 font-black text-2xl">+</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Original Price</label>
              <input 
                type="text" 
                value={`RM ${price.toFixed(2)}`}
                readOnly
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Price</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={`RM ${discountPrice.toFixed(2)}`}
                  readOnly
                  className="w-full bg-green-50 border-2 border-[#A0E8AF] rounded-2xl px-5 py-4 font-black text-green-700"
                />
                <span className="absolute -top-2 right-2 bg-[#A0E8AF] px-2 py-0.5 rounded-lg text-[8px] font-black text-green-900 uppercase">70% OFF</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-full bg-[#A0E8AF] text-green-900 py-5 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"
        >
          <Send size={20} />
          <span>Post & Notify Nearby Users</span>
        </button>
      </div>
    </div>
  );
};

export default MerchantPortal;
