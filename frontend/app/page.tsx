'use client'

import React, { useState, useEffect } from 'react';
import { HardHat, Footprints, Eye, Smartphone, Activity, HandFist, ShirtIcon } from 'lucide-react';
import FPSCounter from '@/components/fpscounter';

interface DetectionClass {
  id: string;
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
}

const SafetyDashboard: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [safetyScore, setSafetyScore] = useState(100); // Percentage 0-100

  const [classes, setClasses] = useState<DetectionClass[]>([
    { id: 'helmet', label: 'Helmet', enabled: true, icon: <HardHat size={18} /> },
    { id: 'boots', label: 'Boots', enabled: true, icon: <Footprints size={18} /> },
    { id: 'glasses', label: 'Safety Glasses', enabled: true, icon: <Eye size={18} /> },
    { id: 'gloves', label: 'Gloves', enabled: true, icon: <HandFist size={18} /> },
    { id: 'vest', label: 'Safety Vest', enabled: true, icon: <ShirtIcon size={18} /> },
  ]);

  // --- SCORE POLLING LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStreaming) {
      // Poll the Python backend for the latest Net Safety Score
      interval = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:8000/safety-score');
          if (response.ok) {
            const data = await response.json();
            // Convert Python decimal (0.85) to React percentage (85)
            setSafetyScore(Math.round(data.score * 100));
          }
        } catch (err) {
          console.error("Critical: Could not reach Python API for safety metrics.");
        }
      }, 1000); // Updates every 1 second
    }

    return () => clearInterval(interval); // Cleanup on stop
  }, [isStreaming]);

  const startStream = () => setIsStreaming(true);
  const stopStream = () => setIsStreaming(false);

  const toggleClass = async (id: string) => {
    const updatedClasses = classes.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    );
    setClasses(updatedClasses);

    const activeNames = updatedClasses.filter(c => c.enabled).map(c => c.id);

    try {
      await fetch('http://localhost:8000/update-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes: activeNames }),
      });
    } catch (err) {
      console.error("Backend offline. Ensure main.py is running.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-7xl bg-[#141414] border border-[#333] rounded-xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[700px]">
        
        {/* LEFT SIDEBAR: Detection Filters */}
        <aside className="w-full md:w-56 border-r border-[#333] p-5 bg-[#0f0f0f]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6">
            YOLO Filters
          </h2>
          <div className="space-y-2">
            {classes.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-lg border border-[#222] hover:border-[#444] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={item.enabled ? "text-green-500" : "text-gray-600"}>{item.icon}</span>
                  <span className="text-xs font-semibold">{item.label}</span>
                </div>
                <button
                  onClick={() => toggleClass(item.id)}
                  className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                    item.enabled ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                >
                  <span className={`h-2 w-2 transform rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER: Main Feed */}
        <main className="flex-1 p-6 flex flex-col bg-[#111]">
          <header className="flex justify-between items-center mb-4 border-b border-[#333] pb-4">
            <div className="flex items-center gap-3">
              <FPSCounter />
              <div className={`h-2 w-2 rounded-full transition-colors duration-500 ${isStreaming ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
              <span className="text-xs font-bold tracking-widest uppercase text-gray-300">
                Cam_01 // Site_Floor
              </span>
            </div>
          </header>

          <div id="feed-container" className="relative aspect-video bg-black rounded-lg border border-[#333] overflow-hidden shadow-inner">
            {isStreaming ? (
              <img 
                src="http://localhost:8000/video_feed" 
                alt="YOLO Stream"
                className="w-full h-full object-cover"
                onError={() => setIsStreaming(false)}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 uppercase text-[10px] tracking-widest gap-2">
                <Activity size={32} className="opacity-20" />
                Stream Offline
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={startStream} className="bg-green-600/10 border border-green-500/50 text-green-500 py-3 rounded text-[10px] font-bold uppercase hover:bg-green-500 hover:text-black transition-all">
              Initiate Feed
            </button>
            <button onClick={stopStream} className="bg-red-900/10 border border-red-500/50 text-red-500 py-3 rounded text-[10px] font-bold uppercase hover:bg-red-600 hover:text-white transition-all">
              Abort Stream
            </button>
          </div>
        </main>

        {/* RIGHT SIDEBAR: Safety Metrics */}
        <aside className="w-full md:w-64 border-l border-[#333] p-5 bg-[#0f0f0f]">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-6 text-right">
            Safety Metrics
          </h2>

          <div className="flex flex-col items-center py-6 border-b border-[#222]">
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-[#222]" strokeWidth="8" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                <circle 
                  className={safetyScore > 80 ? "text-green-500" : safetyScore > 50 ? "text-yellow-500" : "text-red-500"} 
                  strokeWidth="8" 
                  strokeDasharray={314} 
                  strokeDashoffset={314 - (314 * safetyScore) / 100} 
                  strokeLinecap="round" 
                  stroke="currentColor" 
                  fill="transparent" 
                  r="50" cx="64" cy="64" 
                  style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black">{safetyScore}%</span>
                <span className="text-[8px] text-gray-500 uppercase"> Safety Score</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <div className="bg-[#1a1a1a] p-3 rounded border border-[#333] text-center">
                <p className="text-[9px] text-gray-500 uppercase mb-1">Risk Level</p>
                <p className={`text-xs font-bold ${
                  safetyScore > 80 ? 'text-green-400' : safetyScore > 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {safetyScore > 80 ? 'NOMINAL' : safetyScore > 50 ? 'CAUTION' : 'CRITICAL'}
                </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default SafetyDashboard;