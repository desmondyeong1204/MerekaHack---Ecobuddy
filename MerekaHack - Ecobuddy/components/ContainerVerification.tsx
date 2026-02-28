
import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Sparkles, X, QrCode, Smartphone, Zap, RefreshCw, AlertCircle, Box, Loader2, Hourglass } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ContainerVerificationProps {
  onCancel: () => void;
  onSuccess: (co2Saved: number, points: number) => void;
}

const THINKING_MESSAGES = [
  "Detecting 1.2L - 1.5L volume range...",
  "Scanning for BPA-free materials...",
  "Verifying reusable seal integrity...",
  "Analyzing container dimensions...",
  "Checking eco-durability standards...",
  "Calculating carbon offset potential...",
  "Identifying container material type..."
];

const ContainerVerification: React.FC<ContainerVerificationProps> = ({ onCancel, onSuccess }) => {
  const [step, setStep] = useState<'scanning' | 'analyzing' | 'success' | 'error'>('scanning');
  const [analysisResult, setAnalysisResult] = useState<{ volume: number; co2: number; points: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisStartTime = useRef<number>(0);

  // Rotate thinking messages during analysis
  useEffect(() => {
    let interval: number;
    if (step === 'analyzing') {
      interval = window.setInterval(() => {
        setThinkingIndex((prev) => (prev + 1) % THINKING_MESSAGES.length);
        
        // Check if more than 7 seconds have passed to show "taking long" hint
        if (Date.now() - analysisStartTime.current > 7000) {
          setIsTakingLong(true);
        }
      }, 1500);
    } else {
      setIsTakingLong(false);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Initialize Camera (using selfie/user-facing mode)
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
        setErrorMessage("Please enable camera permissions to verify your container.");
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

    // Capture the current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    // Create a 15 second timeout promise (increased from 10s to be more robust)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("SCAN_TIMEOUT")), 15000)
    );

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
        Analyze this image of a food container. 
        1. Is it a reusable container (Tupperware, glass box, thermos, etc.)? 
        2. Estimate its volume in Liters accurately (e.g. 0.5, 0.8, 1.2).
        3. Provide the results in JSON format: 
        {
          "is_reusable": boolean,
          "volume_liters": number,
          "confidence_percent": number,
          "reasoning": "short string explaining why it is or isn't reusable"
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

      // Race the AI call against a 15s timeout
      const response = await Promise.race([aiPromise, timeoutPromise]) as any;
      const result = JSON.parse(response.text || "{}");

      if (result.is_reusable) {
        const pts = 50 + Math.floor(result.volume_liters * 20);
        const co2 = parseFloat((result.volume_liters * 0.4).toFixed(2));
        
        setAnalysisResult({
          volume: result.volume_liters,
          points: pts,
          co2: co2
        });
        
        // Minimum perceived analysis time for "quality" feel
        const elapsed = Date.now() - analysisStartTime.current;
        const delay = Math.max(0, 2000 - elapsed);
        setTimeout(() => setStep('success'), delay);
      } else {
        setErrorMessage(result.reasoning || "We couldn't verify this as a reusable container.");
        setStep('error');
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      if (err.message === "SCAN_TIMEOUT") {
        setErrorMessage("Verification timed out. Gemini took over 15 seconds to respond. Please ensure you have a stable connection and better lighting.");
      } else {
        setErrorMessage("Detection failed. Ensure your container is clearly visible in the viewfinder and not obstructed.");
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
            {step === 'scanning' ? 'Live AI Scanner' : 'AI Verifying...'}
          </span>
        </div>
        <div className="w-14" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 space-y-8 relative z-10">
        
        {/* Constrained Camera Viewport */}
        {(step === 'scanning' || step === 'analyzing') && (
          <div className="w-full max-w-[340px] aspect-[3/4] rounded-[40px] overflow-hidden relative shadow-2xl ring-1 ring-white/20">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              style={{ transform: `${step === 'analyzing' ? 'scale(1.1)' : 'scale(1)'}` }}
              className={`w-full h-full object-cover transition-all duration-1000 ${step === 'analyzing' ? 'blur-[4px]' : ''}`}
            />
            
            {/* Viewfinder Overlays inside the constrained box */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {/* Corner Brackets */}
              <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-[#A0E8AF] rounded-tl-2xl shadow-[0_0_10px_#A0E8AF]" />
              <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-[#A0E8AF] rounded-tr-2xl shadow-[0_0_10px_#A0E8AF]" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-[#A0E8AF] rounded-bl-2xl shadow-[0_0_10px_#A0E8AF]" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-[#A0E8AF] rounded-br-2xl shadow-[0_0_10px_#A0E8AF]" />
              
              {/* Scan Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-[#A0E8AF] shadow-[0_0_20px_#A0E8AF] animate-[scan_3s_ease-in-out_infinite]" />
            </div>

            {/* AI Status in the camera box */}
            {step === 'analyzing' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-black/40">
                <div className="bg-black/70 backdrop-blur-xl px-5 py-4 rounded-3xl border border-white/20 flex flex-col items-center space-y-3 shadow-2xl text-center">
                  <Loader2 className="text-[#A0E8AF] animate-spin" size={32} />
                  <p className="text-[12px] font-black text-[#A0E8AF] uppercase tracking-wider italic animate-pulse">
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

        {/* Success View */}
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
                <h3 className="text-3xl font-black text-gray-800 tracking-tight">Verified!</h3>
                <div className="flex items-center justify-center space-x-2">
                   <Box size={14} className="text-green-500" />
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">AI Insight: {analysisResult.volume}L Reusable</p>
                </div>
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
                 <span>Confirm & Pay</span>
              </button>
          </div>
        )}

        {/* Error View */}
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

        {/* Instruction Footer (Always scrollable part) */}
        {step === 'scanning' && (
          <div className="w-full max-w-[340px] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/10 backdrop-blur-2xl p-6 rounded-[35px] border border-white/20">
               <div className="flex items-center space-x-4">
                  <div className="bg-[#A0E8AF] p-3 rounded-2xl text-green-900">
                     <Smartphone size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-black text-sm">Bring Your Own</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-tight mt-1">
                      Position the container clearly within the frame for AI volume analysis.
                    </p>
                  </div>
               </div>
            </div>
            
            <button 
              onClick={handleCapture}
              className="w-full bg-[#A0E8AF] text-green-900 py-6 rounded-[28px] font-black text-lg shadow-[0_15px_30px_-5px_#A0E8AF66] active:scale-95 transition-all flex items-center justify-center space-x-3"
            >
              <Camera size={24} />
              <span>Verify My Container</span>
            </button>
          </div>
        )}

        {/* Progress Overlay during Analysis */}
        {step === 'analyzing' && (
          <div className="w-full max-w-[340px] flex flex-col items-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-[#A0E8AF] transition-all duration-300 ease-linear shadow-[0_0_10px_#A0E8AF]"
                  style={{ width: `${Math.min(95, ((Date.now() - analysisStartTime.current) / 15000) * 100)}%` }}
                />
             </div>
             <div className="flex flex-col items-center space-y-2">
                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing with Gemini AI...</span>
                <span className="text-[#A0E8AF] text-[9px] font-black uppercase tracking-widest">Secure Cloud Verification Active</span>
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

export default ContainerVerification;
