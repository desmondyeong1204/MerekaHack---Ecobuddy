
import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Sparkles, X, QrCode, Smartphone, Zap, RefreshCw, AlertCircle, Trash2, Loader2, Hourglass, Search, MapPin } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { findNearbyRecycling } from '../services/gemini';

interface RecyclingScannerProps {
  onBack: () => void;
  onAddPoints: (amount: number) => void;
}

const THINKING_MESSAGES = [
  "Identifying material composition...",
  "Analyzing recyclability index...",
  "Checking for contamination...",
  "Calculating weight estimation...",
  "Verifying local bin standards...",
  "Optimizing carbon credit value...",
  "Scanning for brand identifiers..."
];

const RecyclingScanner: React.FC<RecyclingScannerProps> = ({ onBack, onAddPoints }) => {
  const [step, setStep] = useState<'scanning' | 'analyzing' | 'item_success' | 'finding_bin' | 'bin_scanning' | 'final_success' | 'error'>('scanning');
  const [analysisResult, setAnalysisResult] = useState<{ items: string[]; points: number; co2: number } | null>(null);
  const [nearestBin, setNearestBin] = useState<{ name: string; address: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);
  const [binLinked, setBinLinked] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisStartTime = useRef<number>(0);

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
        setErrorMessage("Please enable camera permissions to scan your recycling.");
        setStep('error');
      }
    };

    if (step === 'scanning' || step === 'analyzing' || step === 'bin_scanning') startCamera();

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
      // Use process.env.API_KEY (from selection dialog) or process.env.GEMINI_API_KEY
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey as string });
      const prompt = `
        Analyze this image of items being recycled. 
        1. Identify all recyclable items (plastic bottles, aluminum cans, paper, glass, etc.).
        2. Determine if they are valid for a standard recycling bin.
        3. Provide the results in JSON format: 
        {
          "is_valid": boolean,
          "items": string[],
          "estimated_points": number,
          "co2_saved_kg": number,
          "reasoning": "short string explaining the detection"
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

      if (result.is_valid && result.items && result.items.length > 0) {
        setAnalysisResult({
          items: result.items,
          points: result.estimated_points || (result.items.length * 10),
          co2: result.co2_saved_kg || (result.items.length * 0.1)
        });

        // Find nearest bin
        try {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
              const bins = await findNearbyRecycling(result.items[0], pos.coords.latitude, pos.coords.longitude);
              if (bins && bins.length > 0) {
                setNearestBin({ name: bins[0].name, address: bins[0].address });
              }
            });
          }
        } catch (e) {
          console.error("Failed to find nearby bins", e);
        }
        
        const elapsed = Date.now() - analysisStartTime.current;
        const delay = Math.max(0, 2000 - elapsed);
        setTimeout(() => setStep('item_success'), delay);
      } else {
        setErrorMessage(result.reasoning || "No recyclable items detected. Please ensure items are clearly visible.");
        setStep('error');
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      const isQuotaError = err.message?.includes("429") || 
                          err.message?.toLowerCase().includes("quota") ||
                          err.message?.includes("Requested entity was not found");
      
      if (isQuotaError) {
        setErrorMessage("Gemini API quota exceeded or key invalid. Please provide your own API key to continue.");
      } else {
        setErrorMessage("Detection failed. Please try again with better lighting.");
      }
      setStep('error');
    }
  };

  const handleRecycleClick = () => {
    setStep('finding_bin');
    setTimeout(() => {
      setBinLinked(true);
      setStep('bin_scanning');
    }, 2500);
  };

  const handleBinQRScan = () => {
    setStep('analyzing');
    analysisStartTime.current = Date.now();
    setTimeout(() => {
      if (analysisResult) {
        onAddPoints(analysisResult.points);
      }
      setStep('final_success');
    }, 2000);
  };

  const handleConfirm = () => {
    onBack();
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-y-auto pb-12">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="p-8 flex justify-between items-center relative z-20 shrink-0">
        <button 
          onClick={onBack} 
          className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/20 active:scale-90 transition-transform"
        >
          <X size={24} className="text-white" />
        </button>
        
        <div className="bg-emerald-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/30 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${step === 'scanning' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400 animate-bounce'}`} />
          <span className="text-white text-[10px] font-black uppercase tracking-widest">
            {step === 'scanning' ? 'Smart Bin Scanner' : 'AI Analyzing...'}
          </span>
        </div>
        <div className="w-14" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-8 relative z-10">
        
        {/* Constrained Camera Viewport */}
        {(step === 'scanning' || step === 'analyzing' || step === 'bin_scanning') && (
          <div className="w-full max-w-[340px] aspect-[3/4] rounded-[40px] overflow-hidden relative shadow-2xl ring-1 ring-white/20">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`w-full h-full object-cover transition-all duration-1000 ${step === 'analyzing' ? 'blur-[4px] scale(1.1)' : 'scale(1)'}`}
            />
            
            {/* Viewfinder Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className={`absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 ${step === 'bin_scanning' ? 'border-blue-400' : 'border-[#A0E8AF]'} rounded-tl-2xl shadow-[0_0_10px_currentColor]`} />
              <div className={`absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 ${step === 'bin_scanning' ? 'border-blue-400' : 'border-[#A0E8AF]'} rounded-tr-2xl shadow-[0_0_10px_currentColor]`} />
              <div className={`absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 ${step === 'bin_scanning' ? 'border-blue-400' : 'border-[#A0E8AF]'} rounded-bl-2xl shadow-[0_0_10px_currentColor]`} />
              <div className={`absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 ${step === 'bin_scanning' ? 'border-blue-400' : 'border-[#A0E8AF]'} rounded-br-2xl shadow-[0_0_10px_currentColor]`} />
              
              <div className={`absolute top-0 left-0 w-full h-1 ${step === 'bin_scanning' ? 'bg-blue-400 shadow-[0_0_20px_#60A5FA]' : 'bg-[#A0E8AF] shadow-[0_0_20px_#A0E8AF]'} animate-[scan_3s_ease-in-out_infinite]`} />
            </div>

            {/* AI Status */}
            {step === 'analyzing' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/40">
                <div className="bg-black/70 backdrop-blur-xl px-5 py-4 rounded-3xl border border-white/20 flex flex-col items-center space-y-3 shadow-2xl text-center">
                  <Loader2 className={`${binLinked ? 'text-blue-400' : 'text-[#A0E8AF]'} animate-spin`} size={32} />
                  <p className={`text-[12px] font-black ${binLinked ? 'text-blue-400' : 'text-[#A0E8AF]'} uppercase tracking-wider italic animate-pulse`}>
                    {binLinked ? "Verifying Smart Bin QR..." : THINKING_MESSAGES[thinkingIndex]}
                  </p>
                </div>
              </div>
            )}
            
            {step === 'bin_scanning' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/20">
                <div className="bg-blue-500/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-blue-400 flex items-center space-x-3 shadow-xl">
                  <QrCode className="text-white animate-pulse" size={24} />
                  <span className="text-white text-xs font-black uppercase tracking-widest">Scan Bin QR Code</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finding Bin View */}
        {step === 'finding_bin' && (
          <div className="w-full max-w-[340px] aspect-[3/4] rounded-[40px] bg-gray-900 flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in duration-500">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white relative z-10 shadow-xl shadow-blue-500/40">
                <Search size={40} className="animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-white text-xl font-black tracking-tight">Linking to Smart Bin</h3>
              {nearestBin && (
                <p className="text-blue-400 text-xs font-bold animate-in slide-in-from-bottom-2 duration-500">{nearestBin.name}</p>
              )}
              <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Searching for nearby signals...</p>
            </div>
          </div>
        )}

        {/* Item Success View */}
        {step === 'item_success' && analysisResult && (
          <div className="w-full max-w-[340px] bg-white p-10 rounded-[50px] shadow-2xl animate-in zoom-in-95 duration-500 space-y-8 text-center relative z-50">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] border-4 border-white">
                   <CheckCircle2 size={48} />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-2xl shadow-lg border-2 border-white animate-pulse">
                  <Zap className="text-yellow-800 fill-yellow-800" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">Verified!</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                  {analysisResult.items.join(', ')}
                </p>
              </div>

              <div className="bg-emerald-50 p-6 rounded-[35px] border border-emerald-100 flex flex-col space-y-4">
                 <div className="flex items-center justify-between w-full">
                   <div className="flex flex-col items-start">
                      <span className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">Potential Points</span>
                      <span className="text-lg font-black text-emerald-700">+{analysisResult.points}</span>
                   </div>
                   <div className="w-[1px] h-8 bg-emerald-200" />
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest">CO2 Saved</span>
                      <span className="text-lg font-black text-emerald-700">{analysisResult.co2}kg</span>
                   </div>
                 </div>

                 <div className="pt-4 border-t border-emerald-200/50 text-left">
                    <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-widest mb-2">Next Step</p>
                    <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                      Please proceed to the nearest recycling bin to complete your deposit.
                    </p>
                    {nearestBin && (
                      <div className="mt-3 flex items-start space-x-2 bg-white/50 p-3 rounded-2xl border border-emerald-100">
                        <MapPin size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-emerald-900">{nearestBin.name}</p>
                          <p className="text-[9px] font-bold text-emerald-700/60 truncate max-w-[180px]">{nearestBin.address}</p>
                        </div>
                      </div>
                    )}
                 </div>
              </div>

              <button 
                onClick={handleRecycleClick}
                className="w-full bg-gray-900 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"
              >
                 <Trash2 size={24} />
                 <span>Recycle Now</span>
              </button>
          </div>
        )}

        {/* Final Success View */}
        {step === 'final_success' && analysisResult && (
          <div className="w-full max-w-[340px] bg-white p-10 rounded-[50px] shadow-2xl animate-in zoom-in-95 duration-500 space-y-8 text-center relative z-50">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)] border-4 border-white">
                   <Sparkles size={48} />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 p-2 rounded-2xl shadow-lg border-2 border-white animate-pulse">
                  <Zap className="text-yellow-800 fill-yellow-800" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">Success!</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                  Deposit Complete
                </p>
              </div>

              <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100">
                 <div className="flex flex-col items-center">
                    <span className="text-[12px] font-black text-emerald-900/40 uppercase tracking-[0.2em] mb-2">Points Awarded</span>
                    <span className="text-5xl font-black text-emerald-700">+{analysisResult.points}</span>
                 </div>
              </div>

              <button 
                onClick={handleConfirm}
                className="w-full bg-gray-900 text-white py-6 rounded-[28px] font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                 Done
              </button>
          </div>
        )}

        {/* Error View */}
        {step === 'error' && (
          <div className="w-full max-w-[340px] bg-white p-10 rounded-[40px] shadow-2xl space-y-6 text-center relative z-50">
             <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
               <AlertCircle size={32} />
             </div>
             <h3 className="text-xl font-black text-gray-800">Scan Failed</h3>
             <p className="text-sm text-gray-400 font-bold leading-relaxed">{errorMessage}</p>
             
             {errorMessage?.includes("API key") && (
               <button 
                 onClick={async () => {
                   // @ts-ignore
                   if (window.aistudio) {
                     // @ts-ignore
                     await window.aistudio.openSelectKey();
                     setStep('scanning');
                   }
                 }}
                 className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-blue-200"
               >
                 Provide My Own API Key
               </button>
             )}

             <button 
               onClick={() => setStep('scanning')}
               className="w-full bg-gray-100 text-gray-800 py-5 rounded-2xl font-black text-sm active:scale-95 border border-gray-200"
             >
               Try Again
             </button>
          </div>
        )}

        {/* Instruction Footer */}
        {(step === 'scanning' || step === 'bin_scanning') && (
          <div className="w-full max-w-[340px] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[35px] border border-white/20">
               <div className="flex items-center space-x-4">
                  <div className={`${step === 'bin_scanning' ? 'bg-blue-400' : 'bg-[#A0E8AF]'} p-3 rounded-2xl text-gray-900`}>
                     {step === 'bin_scanning' ? <QrCode size={24} /> : <Trash2 size={24} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-black text-sm">
                      {step === 'bin_scanning' ? 'Verify Smart Bin' : 'Smart Bin Deposit'}
                    </h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">
                      {step === 'bin_scanning' 
                        ? 'Scan the QR code on the smart bin to unlock and complete your deposit.' 
                        : 'Show your recyclables to the camera. AI will verify items and unlock the bin.'}
                    </p>
                  </div>
               </div>
            </div>
            
            <button 
              onClick={step === 'bin_scanning' ? handleBinQRScan : handleCapture}
              className={`w-full ${step === 'bin_scanning' ? 'bg-blue-400 text-blue-900 shadow-[0_15px_30px_-5px_#60A5FA66]' : 'bg-[#A0E8AF] text-green-900 shadow-[0_15px_30px_-5px_#A0E8AF66]'} py-6 rounded-[28px] font-black text-lg active:scale-95 transition-all flex items-center justify-center space-x-3`}
            >
              {step === 'bin_scanning' ? <QrCode size={24} /> : <Camera size={24} />}
              <span>{step === 'bin_scanning' ? 'Scan Bin QR' : 'Scan & Deposit'}</span>
            </button>
          </div>
        )}

        {/* Progress Overlay */}
        {step === 'analyzing' && (
          <div className="w-full max-w-[340px] flex flex-col items-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-[#A0E8AF] transition-all duration-300 ease-linear shadow-[0_0_10px_#A0E8AF]"
                  style={{ width: `${Math.min(95, ((Date.now() - analysisStartTime.current) / 15000) * 100)}%` }}
                />
             </div>
             <div className="flex flex-col items-center space-y-2">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">AI Vision Active</span>
                <span className="text-[#A0E8AF] text-[9px] font-black uppercase tracking-widest">Verifying items...</span>
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

export default RecyclingScanner;
