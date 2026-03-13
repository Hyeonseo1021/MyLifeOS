import { useState, useEffect } from 'react';

interface AICoreProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
}

type Mode = 'normal' | 'heart' | 'glitch' | 'sleep';

export default function AICore({ state }: AICoreProps) {
  const [mode, setMode] = useState<Mode>('normal');
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (state !== 'idle' && state !== 'listening') return;
    const loop = () => {
      const nextTime = Math.random() * 3000 + 1000;
      setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          loop();
        }, 150);
      }, nextTime);
    };
    loop();
    return () => {};
  }, [state]);

  const handleModeChange = () => {
    const modes: Mode[] = ['normal', 'heart', 'glitch', 'sleep'];
    const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
    setMode(modes[nextIndex]);
  };

  const getEyeContent = (isLeft: boolean) => {
    const baseClass = "transition-all duration-300 flex items-center justify-center font-black select-none";
    
    if (mode === 'heart') {
      return <div className={`${baseClass} text-rose-500 text-2xl animate-pulse scale-125`}>♥</div>;
    }
    if (mode === 'glitch') {
      return <div className={`${baseClass} text-red-500 text-2xl`}>×</div>;
    }
    if (mode === 'sleep') {
      return <div className={`${baseClass} w-4 h-1 bg-white opacity-60 rounded-full`} />;
    }

    const defaultEyeClass = "bg-white rounded-full transition-all duration-300 shadow-[0_0_10px_white]";
    
    if (blink) return <div className={`${defaultEyeClass} w-4 h-0.5 opacity-70`} />;

    switch (state) {
      case 'processing': 
        return <div className={isLeft 
            ? `${defaultEyeClass} w-3 h-3 animate-[pulse_0.5s_infinite]` 
            : `${defaultEyeClass} w-3 h-3 animate-[pulse_0.5s_infinite] delay-75`} />;
      case 'speaking': 
        return <div className={`${defaultEyeClass} w-4 h-6 animate-[bounce_0.2s_infinite]`} />;
      case 'listening': 
        return <div className={`${defaultEyeClass} w-5 h-5 scale-110`} />;
      default: 
        return <div className={`${defaultEyeClass} w-3.5 h-4.5`} />;
    }
  };

  const getBodyStyle = () => {
    const base = "relative flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]";
    
    if (mode === 'heart') {
      return `${base} w-30 h-26 rounded-[2.5rem] bg-rose-100 shadow-[0_10px_40px_-10px_rgba(251,113,133,0.5)] -translate-y-4`;
    }
    if (mode === 'glitch') {
      return `${base} w-28 h-24 rounded-[1rem] bg-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-[shake_0.2s_infinite]`;
    }
    if (mode === 'sleep') {
      return `${base} w-32 h-20 rounded-[3rem] bg-indigo-200 translate-y-2 opacity-90`;
    }

    switch (state) {
      case 'speaking': 
        return `${base} w-28 h-24 rounded-[2rem] -translate-y-4 bg-[var(--text-main)] shadow-[0_10px_40px_-10px_var(--text-main)]`;
      case 'listening': 
        return `${base} w-32 h-22 rounded-[2.5rem] scale-105 rotate-3 bg-[var(--text-main)] shadow-[0_10px_30px_-5px_var(--accent)]`;
      case 'processing': 
        return `${base} w-24 h-24 rounded-full rotate-180 bg-[var(--text-muted)]`;
      default: 
        return `${base} w-28 h-24 rounded-[2.2rem] bg-[var(--text-main)]`;
    }
  };

  const getAntennaStyle = () => {
    const stemBase = "w-1.5 transition-all duration-300 mx-auto";
    const ballBase = "w-4 h-4 rounded-full absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm transition-all duration-300";

    if (mode === 'heart') return { stem: `${stemBase} h-6 bg-rose-400`, ball: `${ballBase} bg-rose-500 scale-125 animate-bounce` };
    if (mode === 'glitch') return { stem: `${stemBase} h-4 bg-red-400 rotate-12`, ball: `${ballBase} bg-red-600 animate-spin` };
    if (mode === 'sleep') return { stem: `${stemBase} h-2 bg-indigo-400 opacity-50`, ball: `${ballBase} bg-indigo-500 top-[-5px] scale-75` };

    const colorStem = "bg-[var(--text-main)]";
    const colorBall = "bg-[var(--accent)]";

    if (state === 'speaking') return { stem: `${stemBase} h-6 animate-[pulse_0.2s_infinite] ${colorStem}`, ball: `${ballBase} bg-[var(--bg-main)] animate-bounce` };
    if (state === 'processing') return { stem: `${stemBase} h-2 ${colorStem}`, ball: `${ballBase} ${colorBall} animate-spin left-0` };
    
    return { stem: `${stemBase} h-4 ${colorStem}`, ball: `${ballBase} ${colorBall}` };
  };

  const antenna = getAntennaStyle();

  return (
    <div 
      onClick={handleModeChange}
      className="relative w-48 h-48 flex flex-col items-center justify-center select-none cursor-pointer group hover:scale-105 transition-transform duration-300"
    >
      <div className={`relative flex flex-col items-center transition-transform duration-1000 ${
         mode === 'heart' ? 'animate-[float_2s_ease-in-out_infinite]' :
         mode === 'glitch' ? '' :
         mode === 'sleep' ? 'animate-[float_6s_ease-in-out_infinite]' :
         state === 'speaking' ? 'animate-[bounce_0.6s_infinite]' : 'animate-[float_3s_ease-in-out_infinite]'
      }`}>
        
        {mode === 'sleep' && (
           <div className="absolute -right-8 -top-8 text-2xl font-black text-indigo-300 animate-[pulse_3s_infinite]">Zzz...</div>
        )}

        <div className="relative z-0 translate-y-2">
            <div className={antenna.ball} />
            <div className={antenna.stem} />
        </div>

        <div className={getBodyStyle()}>
            <div className={`w-[70%] h-[55%] bg-[#222] rounded-[1.2rem] flex items-center justify-center gap-3 relative overflow-hidden shadow-inner transition-all duration-300 ${mode === 'glitch' ? 'border-2 border-red-500 opacity-90' : ''}`}>
                
                {getEyeContent(true)}
                {getEyeContent(false)}

                {mode === 'heart' && (
                  <div className="absolute top-1/2 left-0 w-full flex justify-between px-2 opacity-80">
                      <div className="w-4 h-2 bg-rose-400 rounded-full blur-md" />
                      <div className="w-4 h-2 bg-rose-400 rounded-full blur-md" />
                  </div>
                )}

                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white opacity-10 rounded-full blur-[2px]" />
            </div>

            <div className="absolute top-2 left-4 w-3 h-1.5 bg-white opacity-20 rounded-full rotate-[-15deg]" />
        </div>
      </div>

      <div className={`absolute bottom-10 w-16 h-2 bg-black/10 rounded-[100%] blur-[2px] transition-all duration-300 ${
          mode === 'heart' ? 'scale-50 opacity-10' :
          mode === 'sleep' ? 'scale-110 opacity-30' :
          state === 'speaking' ? 'scale-75 opacity-20' : 'animate-[shadow-float_3s_ease-in-out_infinite]'
      }`} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes shadow-float {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(0.85); opacity: 0.1; }
        }
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}