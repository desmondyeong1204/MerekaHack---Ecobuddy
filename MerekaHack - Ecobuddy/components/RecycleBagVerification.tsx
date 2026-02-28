
import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Sparkles, X, QrCode, Smartphone, Zap, RefreshCw, AlertCircle, ShoppingBag, Loader2, Hourglass, MapPin } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { verifyRetailLocation } from '../services/gemini';

interface RecycleBagVerificationProps {
  onCancel: () => void;
  onSuccess: (co2Saved: number, points: number) => void;
}

const THINKING_MESSAGES = [
  "Analyzing bag material...",
  "Checking for recycled content...",
  "Verifying bag durability...",
  "Scanning for eco-labels...",
  "Calculating carbon footprint reduction...",
  "Identifying bag type...",
  "Validating reuse potential..."
];

const RecycleBagVerification: React.FC<RecycleBagVerificationProps> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState<'scanning' | 'analyzing' | 'success' | 'error'>('scanning');
  const [analysisResult, setAnalysisResult] = useState<{ bagType: string; co2: number; points: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'verified' | 'unverified'>('checking');
  const [nearbyStore, setNearbyStore] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisStartTime = useRef<number>(0);

  // Location Detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use Gemini grounding instead of Google Maps Places JS API
          const result = await verifyRetailLocation(latitude, longitude);
          
          if (result.isRetail) {
            setLocationStatus('verified');
            setNearbyStore(result.storeName || "Retail Zone");
          } else {
            setLocationStatus('unverified');
          }
        } catch (e) {
          console.error("Location verification error:", e);
          setLocationStatus('unverified');
        }
      }, () => {
        setLocationStatus('unverified');
      });
    } else {
      setLocationStatus('unverified');
    }
  }, []);

  // Rotate thinking messages during analysis
  useEffect(() => {
    let interval: number;
    if (step === 'analyzing') {
      interval = window.setInterval(() => {
        setThinkingIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
        
        if (Date.now() - analysisStartTime.current > 7000) {
          setIsTakingLong(true);
        }
      }, 1500);
    } else {
      setIsTakingLong(false);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Initialize Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setErrorMessage("Please enable camera permissions to verify your recycle bag.");
        setStep('error');
      }
    };

    if (step === 'scanning' || step === 'analyzing') startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStep('analyzing');
    analysisStartTime.current = Date.now();
    setIsTakingLong(false);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("SCAN_TIMEOUT")), 15000)
    );

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Analyze this image of a shopping bag. 
        1. Is it a reusable recycle bag (cloth, heavy-duty plastic, canvas, etc.)? 
        2. If it is a single-use plastic bag, does it have a clear corporate or brand logo?
        3. Identify the material type.
        4. Provide the results in JSON format: 
        {
          "is_recycle_bag": boolean,
          "has_corporate_logo": boolean,
          "bag_type": string,
          "confidence_percent": number,
          "reasoning": "short string explaining why it is or isn't a recycle bag or if it has a logo"
        }
      `;

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const response = await Promise.race([aiPromise, timeoutPromise]) as any;
      const result = JSON.parse(response.text || "{}");

      if (result.is_recycle_bag || result.has_corporate_logo) {
        // Points logic: 20 for reusable, 10 for plastic with logo
        const basePoints = result.is_recycle_bag ? 20 : 10;
        const locationBonus = locationStatus === 'verified' ? 10 : 0;
        const pts = basePoints + locationBonus;
        const co2 = result.is_recycle_bag ? 0.2 : 0.05; // Less CO2 saved for plastic but still better than nothing
        
        setAnalysisResult({
          bagType: result.bag_type + (result.has_corporate_logo ? " (with Logo)" : ""),
          points: pts,
          co2: co2
        });
        
        const elapsed = Date.now() - analysisStartTime.current;
        const delay = Math.max(0, 2000 - elapsed);
        setTimeout(() => setStep('success'), delay);
      } else {
        setErrorMessage(result.reasoning || "We couldn't verify this as a reusable recycle bag.");
        setStep('error');
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      if (err.message === "SCAN_TIMEOUT") {
        setErrorMessage("Verification timed out. Please try again.");
      } else {
        setErrorMessage("Detection failed. Ensure your bag is clearly visible.");
      }
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-y-auto pb-12">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="p-8 flex justify-between items-center relative z-20 shrink-0">
        <button 
          onClick={onCancel} 
          className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 active:scale-90 transition-transform"
        >
          <X size={24} className="text-white" />
        </button>
        
        <div className="bg-green-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-green-500/30 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${step === 'scanning' ? 'bg-green-500 animate-pulse' : 'bg-blue-400 animate-bounce'}`} />
          <span className="text-white text-[10px] font-black uppercase tracking-widest">
            {step === 'scanning' ? 'Bag Scanner' : 'AI Verifying...'}
          </span>
        </div>
        <div className="w-14" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-8 relative z-10">
        
        {(step === 'scanning' || step === 'analyzing') && (
          <div className="w-full max-w-[340px] aspect-[3/4] rounded-[40px] overflow-hidden relative shadow-2xl ring-1 ring-white/20">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-all duration-1000 ${step === 'analyzing' ? 'blur-[4px]' : ''}`}
            />
            
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-[#FDFD96] rounded-tl-2xl shadow-[0_0_10px_#FDFD96]" />
              <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-[#FDFD96] rounded-tr-2xl shadow-[0_0_10px_#FDFD96]" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-[#FDFD96] rounded-bl-2xl shadow-[0_0_10px_#FDFD96]" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-[#FDFD96] rounded-br-2xl shadow-[0_0_10px_#FDFD96]" />
              
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FDFD96] shadow-[0_0_20px_#FDFD96] animate-[scan_3s_ease-in-out_infinite]" />
            </div>

            {step === 'analyzing' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/40">
                <div className="bg-black/70 backdrop-blur-xl px-5 py-4 rounded-3xl border border-white/20 flex flex-col items-center space-y-3 shadow-2xl text-center">
                  <Loader2 className="text-[#FDFD96] animate-spin" size={32} />
                  <p className="text-[12px] font-black text-[#FDFD96] uppercase tracking-wider italic animate-pulse">
                    {THINKING_MESSAGES[thinkingIndex]}
                  </p>
                </div>
                
                {isTakingLong && (
                  <div className="mt-4 bg-yellow-500/90 text-yellow-950 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tight animate-bounce flex items-center space-x-2">
                    <Hourglass size={14} />
                    <span>Analyzing deeper...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'success' && analysisResult && (
          <div className="w-full max-w-[340px] bg-white p-10 rounded-[50px] shadow-2xl animate-in zoom-in-95 duration-500 space-y-8 text-center relative z-50">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white shadow-[0_20px_50px_-10px_rgba(34,197,94,0.5)] border-4 border-white">
                   <CheckCircle2 size={48} />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-2xl shadow-lg border-2 border-white animate-pulse">
                  <Zap className="text-yellow-800 fill-yellow-800" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight">Bag Verified!</h3>
                <div className="flex items-center justify-center space-x-2">
                   <ShoppingBag size={14} className="text-green-500" />
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">Type: {analysisResult.bagType}</p>
                </div>
                {locationStatus === 'verified' && (
                  <div className="flex items-center justify-center space-x-1 text-blue-500">
                    <MapPin size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Location Bonus Applied</span>
                  </div>
                )}
              </div>

              <div className="bg-green-50 p-6 rounded-[35px] border border-green-100 flex items-center justify-between">
                 <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-green-900/40 uppercase tracking-widest">Rewards</span>
                    <span className="text-lg font-black text-green-700">+{analysisResult.points} pts</span>
                 </div>
                 <div className="w-[1px] h-8 bg-green-200" />
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-green-900/40 uppercase tracking-widest">CO2 Saved</span>
                    <span className="text-lg font-black text-green-700">{analysisResult.co2} kg</span>
                 </div>
              </div>

              <button 
                onClick={() => onSuccess(analysisResult.co2, analysisResult.points)}
                className="w-full bg-gray-900 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"
              >
                 <QrCode size={24} />
                 <span>Claim Points</span>
              </button>
          </div>
        )}

        {step === 'error' && (
          <div className="w-full max-w-[340px] bg-white p-10 rounded-[40px] shadow-2xl space-y-6 text-center relative z-50">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
               <AlertCircle size={32} />
             </div>
             <h3 className="text-xl font-black text-gray-800">Verification Failed</h3>
             <p className="text-sm text-gray-400 font-bold leading-relaxed">{errorMessage}</p>
             <button 
               onClick={() => setStep('scanning')}
               className="w-full bg-gray-100 text-gray-800 py-5 rounded-2xl font-black text-sm active:scale-95 border border-gray-200"
             >
               Try Again
             </button>
          </div>
        )}

        {step === 'scanning' && (
          <div className="w-full max-w-[340px] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Location Status Badge */}
            <div className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-full border transition-colors ${
              locationStatus === 'verified' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 
              locationStatus === 'checking' ? 'bg-white/5 border-white/10 text-white/40' : 
              'bg-white/5 border-white/10 text-white/40'
            }`}>
              {locationStatus === 'checking' ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Checking Location...</span>
                </>
              ) : locationStatus === 'verified' ? (
                <>
                  <MapPin size={12} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Verified: {nearbyStore}</span>
                </>
              ) : (
                <>
                  <MapPin size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Scan anywhere for base points</span>
                </>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[35px] border border-white/20">
               <div className="flex items-center space-x-4">
                  <div className="bg-[#FDFD96] p-3 rounded-2xl text-yellow-900">
                     <ShoppingBag size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-black text-sm">Recycle Bag Scan</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">
                      {locationStatus === 'verified' 
                        ? "You're at a retail zone! Earn +10 bonus points for using your bag here." 
                        : "Show your reusable bag to earn points. Plastic bags with corporate logos earn 10 base points!"}
                    </p>
                  </div>
               </div>
            </div>
            
            <button 
              onClick={handleCapture}
              className="w-full bg-[#FDFD96] text-yellow-900 py-6 rounded-[28px] font-black text-lg shadow-[0_15px_30px_-5px_#FDFD9666] active:scale-95 transition-all flex items-center justify-center space-x-3"
            >
              <Camera size={24} />
              <span>Verify My Bag</span>
            </button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="w-full max-w-[340px] flex flex-col items-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-[#FDFD96] transition-all duration-300 ease-linear shadow-[0_0_10px_#FDFD96]"
                  style={{ width: `${Math.min(95, ((Date.now() - analysisStartTime.current) / 15000) * 100)}%` }}
                />
             </div>
             <div className="flex flex-col items-center space-y-2">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing with Gemini AI...</span>
                <span className="text-[#FDFD96] text-[9px] font-black uppercase tracking-widest">Secure Cloud Verification Active</span>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RecycleBagVerification;
