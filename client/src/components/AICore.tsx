interface AICoreProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
}

export default function AICore({ state }: AICoreProps) {
  const getCoreStyle = () => {
    switch (state) {
      case 'processing':
        return 'animate-spin border-t-[var(--text-main)] border-r-[var(--text-main)] rounded-full border-2 border-transparent';
      case 'speaking':
        return 'animate-pulse shadow-[0_0_20px_currentColor] scale-110';
      default: 
        return 'shadow-[0_0_10px_currentColor] scale-100 opacity-80';
    }
  };

  return (
    <div className="relative flex items-center justify-center w-24 h-24 text-[var(--text-main)] transition-colors duration-300">
      {/* 1. 바깥쪽 궤도 (천천히 회전) */}
      <div className="absolute w-full h-full border border-[var(--border-main)] rounded-full animate-[spin_10s_linear_infinite] opacity-40"></div>
      
      {/* 2. 중간 궤도 (반대로 회전) */}
      <div className="absolute w-[70%] h-[70%] border border-[var(--text-muted)] border-t-transparent border-l-transparent rounded-full animate-[spin_5s_linear_infinite_reverse] opacity-60"></div>

      {/* 3. 핵심 코어 (상태에 따라 변화) */}
      <div className={`relative w-8 h-8 bg-[var(--text-main)] rounded-full transition-all duration-500 z-10 ${getCoreStyle()}`}>
         {/* 내부 은은한 광원 (다크모드에서만 더 강하게 보임) */}
         <div className="absolute inset-0 bg-[var(--text-main)] blur-md opacity-40 animate-pulse"></div>
      </div>
      
      {/* 4. 장식용 파티클 (배경선) */}
      <div className="absolute w-[120%] h-px bg-gradient-to-r from-transparent via-[var(--border-main)] to-transparent rotate-45 opacity-50"></div>
      <div className="absolute w-[120%] h-px bg-gradient-to-r from-transparent via-[var(--border-main)] to-transparent -rotate-45 opacity-50"></div>
    </div>
  );
}