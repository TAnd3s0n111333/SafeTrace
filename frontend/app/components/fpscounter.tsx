'use client';
import React, { useEffect, useState } from 'react';

const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let requestId: number;

    const updateCounter = () => {
      const now = performance.now();
      frameCount++;

      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      requestId = requestAnimationFrame(updateCounter);
    };

    requestId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(requestId);
  }, []);

  return (
    <div className="flex items-center gap-1 font-mono text-[10px] bg-black/40 px-2 py-1 rounded border border-[#333]">
      <span className="text-gray-500 uppercase tracking-tighter">FPS:</span>
      <span className={fps < 24 ? "text-red-500" : "text-green-400"}>
        {fps.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

export default FPSCounter;