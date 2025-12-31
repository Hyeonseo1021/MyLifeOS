import { useEffect, useState } from 'react';

interface AICoreProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
}

export default function AICore({ state }: AICoreProps) {
  // 상태에 따른 색상 및 애니메이션 속도 제어
  const getCoreStyle = () => {
    switch (state) {
      case 'processing':
        return 'animate-spin border-t-white border-r-white';
      case 'speaking':
        return 'animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.8)]';
      default: // idle
        return 'shadow-[0_0_10px_rgba(255,255,255,0.2)] scale-100';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* 1. 바깥쪽 궤도 (천천히 회전) */}
      <div className="absolute w-full h-full border border-neutral-800 rounded-full animate-[spin_10s_linear_infinite] opacity-50"></div>
      
      {/* 2. 중간 궤도 (반대로 회전) */}
      <div className="absolute w-[70%] h-[70%] border border-neutral-700 border-t-transparent border-l-transparent rounded-full animate-[spin_5s_linear_infinite_reverse]"></div>

      {/* 3. 핵심 코어 (상태에 따라 변화) */}
      <div className={`w-8 h-8 bg-white rounded-full transition-all duration-500 ${getCoreStyle()}`}>
         {/* 내부 은은한 광원 */}
         <div className="absolute inset-0 bg-white blur-md opacity-50"></div>
      </div>
      
      {/* 4. 장식용 파티클 (옵션) */}
      <div className="absolute w-[120%] h-0.5 bg-gradient-to-r from-transparent via-neutral-800 to-transparent rotate-45"></div>
      <div className="absolute w-[120%] h-0.5 bg-gradient-to-r from-transparent via-neutral-800 to-transparent -rotate-45"></div>
    </div>
  );
}