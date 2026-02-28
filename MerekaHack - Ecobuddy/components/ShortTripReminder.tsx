
import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../constants';
import { getDistanceInfo, searchPlaces, DistanceResult } from '../services/gemini';

interface Props {
  onAvoidTrip: (co2Saved: number) => void;
}

const ShortTripReminder: React.FC<Props> = ({ onAvoidTrip }) => {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState<DistanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCommitted, setIsCommitted] = useState(false);
  
  const [startSuggestions, setStartSuggestions] = useState<string[]>([]);
  const [destSuggestions, setDestSuggestions] = useState<string[]>([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingDest, setIsSearchingDest] = useState(false);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const startRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | undefined>(undefined);

  const CO2_DRIVING_PER_KM = 0.21;
  const CO2_TRANSIT_PER_KM = 0.08;
  const TRANSIT_OFFSET_SAVED = CO2_DRIVING_PER_KM - CO2_TRANSIT_PER_KM;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => console.warn("Geolocation denied.")
      );
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) setShowStartSuggestions(false);
      if (destRef.current && !destRef.current.contains(e.target as Node)) setShowDestSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Effect for Start Suggestions
  useEffect(() => {
    if (startPoint.length < 3 || startPoint === "Your Location" || !showStartSuggestions) {
      setStartSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingStart(true);
      const places = await searchPlaces(startPoint, userLoc);
      setStartSuggestions(places);
      setIsSearchingStart(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [startPoint, showStartSuggestions, userLoc]);

  // Effect for Destination Suggestions
  useEffect(() => {
    if (destination.length < 3 || !showDestSuggestions) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingDest(true);
      const places = await searchPlaces(destination, userLoc);
      setDestSuggestions(places);
      setIsSearchingDest(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [destination, showDestSuggestions, userLoc]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setUserLoc({ lat: latitude, lng: longitude });
      setStartPoint("Your Location");
      setLocating(false);
      setShowStartSuggestions(false);
    }, () => {
      setLocating(false);
      setError("Unable to access your location. Please check browser permissions.");
    }, { enableHighAccuracy: true });
  };

  const handleAnalyze = async () => {
    if (!startPoint || !destination) return;
    setLoading(true);
    setError(null);
    setResult(null);
    
    // Use coordinates if user selected "Your Location"
    const resolvedStart = startPoint === "Your Location" && userLoc 
      ? `${userLoc.lat}, ${userLoc.lng}` 
      : startPoint;

    try {
      const info = await getDistanceInfo(resolvedStart, destination, userLoc);
      if (info && info.distanceKm > 0) {
        setResult(info);
      } else {
        setError("We couldn't find a walking route for this trip. Please try choosing a more specific address from the suggestions.");
      }
    } catch (err: any) {
      setError("There was a connection issue while calculating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = () => {
    if (!result || !result.isWalkingViable) return;
    onAvoidTrip(result.distanceKm * CO2_DRIVING_PER_KM);
    setIsCommitted(true);
    setTimeout(() => {
      setResult(null);
      setDestination('');
      setStartPoint('');
      setIsCommitted(false);
    }, 2500);
  };

  return (
    <div className="bg-white rounded-[40px] p-8 space-y-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-300 border border-gray-50 relative">
      <div className="flex items-center gap-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Smart Trip Planner</h3>
      </div>
      
      <div className="relative space-y-3">
        {/* Vertical Connecting Line */}
        <div className="absolute left-[29px] top-10 bottom-10 w-[2px] border-l-2 border-dotted border-gray-200 pointer-events-none z-0" />

        {/* Origin Input */}
        <div className={`relative ${showStartSuggestions ? 'z-[60]' : 'z-10'}`} ref={startRef}>
          <div className={`flex items-center gap-5 bg-white border rounded-2xl px-5 transition-all shadow-sm ${showStartSuggestions ? 'border-blue-300 ring-4 ring-blue-50' : 'border-gray-100/60'}`}>
            <div className={`w-5 h-5 rounded-full border-[3px] shrink-0 transition-colors ${startPoint === 'Your Location' ? 'border-green-400 bg-green-50' : 'border-blue-400 bg-white'}`}></div>
            <input 
              placeholder={locating ? "Locating you..." : "From where?"}
              value={startPoint} 
              onFocus={() => {
                setShowStartSuggestions(true);
                setShowDestSuggestions(false);
              }} 
              onChange={(e) => setStartPoint(e.target.value)} 
              className="w-full py-5 text-sm font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300" 
              disabled={locating}
            />
            <button 
              onClick={handleUseMyLocation} 
              title="Use my current location"
              className={`p-2 transition-all hover:scale-110 active:scale-90 ${startPoint === 'Your Location' ? 'text-green-500' : 'text-gray-400 hover:text-blue-500'}`}
            >
              {locating ? <Icons.RefreshCw className="animate-spin" size={18} /> : <Icons.LocateFixed size={18} />}
            </button>
          </div>
          {showStartSuggestions && startPoint !== "Your Location" && startPoint.length >= 3 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-blue-50 max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
               {isSearchingStart ? (
                 <div className="p-5 text-[10px] font-black text-blue-400 uppercase animate-pulse">Searching Map Results...</div>
               ) : startSuggestions.length === 0 ? (
                 <div className="p-5 text-[10px] font-black text-gray-400 uppercase">Searching for matches...</div>
               ) : (
                 startSuggestions.map((s, i) => (
                   <button key={i} onClick={() => { setStartPoint(s); setShowStartSuggestions(false); }} className="w-full text-left p-4 px-5 hover:bg-blue-50 text-xs font-bold text-gray-700 truncate border-b border-gray-50 last:border-0 transition-colors">{s}</button>
                 ))
               )}
            </div>
          )}
        </div>

        {/* Destination Input */}
        <div className={`relative ${showDestSuggestions ? 'z-[60]' : 'z-10'}`} ref={destRef}>
          <div className={`flex items-center gap-5 bg-white border rounded-2xl px-5 transition-all shadow-sm ${showDestSuggestions ? 'border-blue-300 ring-4 ring-blue-50' : 'border-gray-100/60'}`}>
            <Icons.Pin className="w-5 h-5 text-blue-500 shrink-0" />
            <input 
              placeholder="Where to?" 
              value={destination} 
              onFocus={() => {
                setShowDestSuggestions(true);
                setShowStartSuggestions(false);
              }} 
              onChange={(e) => setDestination(e.target.value)} 
              className="w-full py-5 text-sm font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300" 
            />
          </div>
          {showDestSuggestions && destination.length >= 3 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[100] bg-white rounded-3xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.15)] border border-blue-50 max-h-[250px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
               {isSearchingDest ? (
                 <div className="p-5 text-[10px] font-black text-blue-400 uppercase animate-pulse">Searching Map Results...</div>
               ) : destSuggestions.length === 0 ? (
                 <div className="p-5 text-[10px] font-black text-gray-400 uppercase">Searching for matches...</div>
               ) : (
                 destSuggestions.map((s, i) => (
                   <button key={i} onClick={() => { setDestination(s); setShowDestSuggestions(false); }} className="w-full text-left p-4 px-5 hover:bg-blue-50 text-xs font-bold text-gray-700 truncate border-b border-gray-50 last:border-0 transition-colors">{s}</button>
                 ))
               )}
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={handleAnalyze} 
        disabled={loading || !startPoint || !destination} 
        className="w-full py-5 bg-[#B3E5FC] text-[#1A237E] rounded-3xl text-[12px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-40 shadow-sm relative z-10"
      >
        {loading ? 'CALCULATING ROUTE...' : 'ANALYSE TRIP'}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-in slide-in-from-top-1 duration-300">
           <p className="text-[10px] font-black text-red-500 uppercase text-center leading-relaxed">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-[#E1F5FE] p-8 rounded-[40px] animate-in slide-in-from-bottom-4 duration-500 border border-white/40 shadow-inner space-y-6 relative z-10">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-[#1A237E]/40 uppercase tracking-widest">Calculated Route</span>
              <div className="bg-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase text-[#1A237E] shadow-sm">
                {result.isWalkingViable ? 'Walking Recommended' : 'Transit Recommended'}
              </div>
           </div>
           
           <div className="flex items-baseline">
              <span className="text-6xl font-black text-[#1A237E] tracking-tighter leading-none">{result.distanceKm.toFixed(2)}</span>
              <span className="text-3xl font-black text-[#1A237E] ml-2">km</span>
           </div>

           <div className="space-y-3">
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[11px] font-black text-[#1A237E]/60 uppercase tracking-tighter mb-1">Pedestrian Path Found</p>
                <p className="text-xs font-bold text-[#1A237E] truncate">{result.startAddress} → {result.endAddress}</p>
              </div>
              <p className="text-[13px] font-semibold text-[#1A237E]/70 leading-snug italic tracking-tight">
                {result.isWalkingViable 
                  ? `This ${result.distanceKm.toFixed(2)}km trip is ideal for a walk. You'll avoid ${(result.distanceKm * CO2_DRIVING_PER_KM).toFixed(2)}kg of CO2 emissions!`
                  : `Distance is ${result.distanceKm.toFixed(2)}km. Public transit is advised to save ${(result.distanceKm * TRANSIT_OFFSET_SAVED).toFixed(2)}kg CO2 compared to driving.`
                }
              </p>
           </div>

           {result.isWalkingViable ? (
             <button 
               onClick={handleCommit}
               disabled={isCommitted}
               className={`w-full py-5 text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl transition-all shadow-xl flex items-center justify-center gap-2
                 ${isCommitted ? 'bg-green-600 text-white' : 'bg-[#1A1C1E] text-white hover:scale-[1.02] active:scale-95'}`}
             >
               {isCommitted ? 'COMMIT CONFIRMED!' : 'COMMIT TO WALK (+100 PTS)'}
             </button>
           ) : (
             <div className="w-full py-4 flex items-center justify-center gap-3 bg-white/40 rounded-3xl border border-blue-200/50">
                <Icons.Zap size={16} className="text-blue-600 fill-blue-600" />
                <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Public Transit</span>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default ShortTripReminder;
