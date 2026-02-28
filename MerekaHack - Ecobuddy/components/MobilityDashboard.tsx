
import React, { useState, useEffect, useRef } from 'react';
import { UserStats, DigitalPet } from '../types';
import { Icons, COLORS } from '../constants';
import ShortTripReminder from './ShortTripReminder';
import { verifyCommuteLocation } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, CheckCircle2, AlertCircle, Loader2, Zap, RefreshCw } from 'lucide-react';
import L from 'leaflet';

interface Props {
  stats: UserStats;
  pet: DigitalPet;
  onUpdateStats: (update: Partial<UserStats> | ((prev: UserStats) => Partial<UserStats>)) => void;
  onBack: () => void;
}

const MobilityDashboard: React.FC<Props> = ({ stats, pet, onUpdateStats, onBack }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [locationInfo, setLocationInfo] = useState<{ type: string; name: string } | null>(null);
  const [nearestLocation, setNearestLocation] = useState<{ name: string; type: string; distance: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    const initMap = () => {
      if (mapContainerRef.current && !leafletMapRef.current && (verifyStatus === 'idle' || verifyStatus === 'checking')) {
        leafletMapRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView(userCoords ? [userCoords.lat, userCoords.lng] : [0, 0], userCoords ? 15 : 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(leafletMapRef.current);

        if (userCoords) {
          const userIcon = L.divIcon({
            className: 'custom-user-icon',
            html: `<div style="width: 16px; height: 16px; background: #3B82F6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          markerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(leafletMapRef.current);
        }

        // Force a resize check
        setTimeout(() => {
          if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
        }, 100);
      }
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [verifyStatus]);

  // Geolocation Watch
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition((position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 15);
          
          if (!markerRef.current) {
            const userIcon = L.divIcon({
              className: 'custom-user-icon',
              html: `<div style="width: 16px; height: 16px; background: #3B82F6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            });
            markerRef.current = L.marker([latitude, longitude], { icon: userIcon }).addTo(leafletMapRef.current);
          } else {
            markerRef.current.setLatLng([latitude, longitude]);
          }
          
          leafletMapRef.current.invalidateSize();
        }
      }, (err) => {
        console.error("Geolocation error:", err);
      }, { enableHighAccuracy: true });

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      setVerifyStatus('error');
      return;
    }

    setIsVerifying(true);
    setVerifyStatus('checking');
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lng: longitude });

      // Update map view and marker
      if (leafletMapRef.current) {
        leafletMapRef.current.setView([latitude, longitude], 16);
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
      }
      
      try {
        const result = await verifyCommuteLocation(latitude, longitude);
        
        if (result.isGreen) {
          setLocationInfo({ 
            type: result.locationType || 'Green Zone', 
            name: result.locationName || 'Eco-Friendly Spot' 
          });
          
          onUpdateStats(prev => ({
            points: prev.points + 150,
            co2Saved: prev.co2Saved + 0.5,
            tripsAvoided: prev.tripsAvoided + 1
          }));
          
          setVerifyStatus('success');
        } else {
          setNearestLocation(result.nearestLocation || null);
          setErrorMessage("You don't seem to be at a recognized Green Mobility location (Bus stop, Train station, or Park).");
          setVerifyStatus('error');
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        const isQuotaError = err.message?.includes("429") || 
                            err.message?.toLowerCase().includes("quota") ||
                            err.message?.includes("RESOURCE_EXHAUSTED") ||
                            err.message?.includes("Requested entity was not found");
        
        if (isQuotaError) {
          setErrorMessage("Gemini API quota exceeded. Please provide your own API key to continue.");
        } else {
          setErrorMessage("Failed to verify location. Please try again.");
        }
        setVerifyStatus('error');
      } finally {
        setIsVerifying(false);
      }
    }, (err) => {
      console.error("Geolocation error:", err);
      setErrorMessage("Please enable location permissions to check-in.");
      setVerifyStatus('error');
      setIsVerifying(false);
    }, { enableHighAccuracy: true });
  };

  const progress = Math.min(stats.steps / 10000, 1);

  return (
    <div className="p-6 pb-32 space-y-6 animate-in fade-in duration-500 bg-[#F0F9FF] min-h-screen">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-2">
        <button onClick={onBack} className="bg-white p-3 rounded-2xl shadow-sm active:scale-90 border border-gray-100">
          <Icons.ChevronLeft size={24} className="text-blue-500" />
        </button>
        <h2 className="text-2xl font-black text-gray-800">Green Mobility</h2>
      </div>

      {/* Main Check-in Card */}
      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-500">
          <Navigation size={48} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Eco-Destination Check-in</span>
            <h3 className="text-xl font-black text-gray-800">Verify your Green Mobility</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed mt-2">
              Check-in at bus stops, train stations, or parks to earn 150 bonus points for choosing sustainable mobility.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {verifyStatus === 'idle' || verifyStatus === 'checking' ? (
              <div className="space-y-4">
                <motion.button
                  key="checkin-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCheckIn}
                  disabled={isVerifying}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 rounded-[32px] shadow-lg shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-95 group"
                >
                  {isVerifying ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <MapPin size={24} className="group-hover:animate-bounce" />
                  )}
                  <span className="font-black uppercase tracking-[0.2em] text-xs">
                    {isVerifying ? 'Verifying Location...' : 'Check-in Now'}
                  </span>
                </motion.button>

                {/* Map Container */}
                <div 
                  ref={mapContainerRef} 
                  className="w-full h-48 rounded-[32px] bg-gray-100 border border-blue-50 overflow-hidden shadow-inner relative z-0"
                >
                  {!userCoords && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-gray-50 text-gray-400">
                      <RefreshCw size={20} className="animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Locating you...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : verifyStatus === 'success' ? (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] text-center space-y-3"
              >
                <div className="bg-emerald-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h4 className="font-black text-emerald-900">Mobility Verified!</h4>
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-1">
                    {locationInfo?.name} • {locationInfo?.type}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-sm">
                  <Zap size={14} className="fill-emerald-600" />
                  <span>+150 Points Earned</span>
                </div>
                <button 
                  onClick={() => setVerifyStatus('idle')}
                  className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest hover:text-emerald-900 transition-colors"
                >
                  Check-in again later
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="error-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-yellow-50 border border-yellow-100 p-6 rounded-[32px] text-center space-y-3"
              >
                <div className="bg-yellow-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                  <AlertCircle size={24} />
                </div>
                <p className="text-xs text-yellow-700 font-bold leading-relaxed">
                  {errorMessage}
                </p>
                
                {errorMessage?.includes("API key") || errorMessage?.includes("quota") ? (
                  <button 
                    onClick={async () => {
                      // @ts-ignore
                      if (window.aistudio) {
                        // @ts-ignore
                        await window.aistudio.openSelectKey();
                        setVerifyStatus('idle');
                      }
                    }}
                    className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 shadow-lg shadow-blue-200"
                  >
                    Provide My Own API Key
                  </button>
                ) : nearestLocation && (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-left">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Nearest Green Spot</p>
                    <p className="text-sm font-black text-emerald-900">{nearestLocation.name}</p>
                    <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest mt-0.5">
                      {nearestLocation.type} • {nearestLocation.distance} away
                    </p>
                  </div>
                )}
                <button 
                  onClick={() => setVerifyStatus('idle')}
                  className="w-full bg-yellow-100 text-yellow-700 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Step Progress Card */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[40px] p-8 flex flex-col items-center text-center relative overflow-hidden border border-white/60 shadow-sm">
        <div className="absolute top-0 right-0 p-6 opacity-10 text-blue-400"><Icons.Steps size={48} /></div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Daily Step Goal</span>
        
        <div className="relative w-56 h-56 flex items-center justify-center mb-6">
           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
             <circle 
               cx="50" cy="50" r="42" 
               stroke="rgba(0,0,0,0.05)" strokeWidth="6" fill="none" 
             />
             <circle 
               cx="50" cy="50" r="42" 
               stroke={COLORS.blue} strokeWidth="8" fill="none" 
               strokeDasharray={263.8} 
               strokeDashoffset={263.8 - (263.8 * progress)} 
               strokeLinecap="round" 
               className="transition-all duration-1000 ease-out"
             />
           </svg>
           <div className="absolute flex flex-col items-center">
              <span className="text-5xl font-black text-gray-800 tracking-tight leading-tight">{stats.steps.toLocaleString()}</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Steps</span>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-8 w-full">
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-gray-800">{stats.distance.toFixed(1)}km</span>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Distance</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-gray-800">{stats.co2Saved.toFixed(1)}kg</span>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">CO2 Saved</span>
          </div>
        </div>
      </div>

      <ShortTripReminder onAvoidTrip={(co2) => onUpdateStats(prev => ({ 
        tripsAvoided: prev.tripsAvoided + 1, 
        points: prev.points + 100,
        co2Saved: prev.co2Saved + co2 
      }))} />
    </div>
  );
};

export default MobilityDashboard;
