import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import type { WeatherData, TodoItem } from '../types';

type AiStatus = 'IDLE' | 'ANALYZING' | 'GENERATING' | 'COMPLETED' | 'ERROR';

export function useAiSystem(weather: WeatherData | null, todos: TodoItem[]) {
  const [briefing, setBriefing] = useState('');
  const [aiStatus, setAiStatus] = useState<AiStatus>('IDLE');
  const [displayedText, setDisplayedText] = useState('');
  
  const lastTimeSlot = useRef<number>(-1);

  const todosRef = useRef<TodoItem[]>(todos);

  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  const getTimeSlot = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 1; 
    if (hour >= 12 && hour < 18) return 2; 
    if (hour >= 18 && hour < 24) return 3; 
    return 0; 
  };

  const fetchBriefing = async () => {
    if (!weather) return;

    try {
      setAiStatus('ANALYZING');
      
      const apiPromise = api.ai.generateBriefing(weather, todosRef.current);

      await new Promise(r => setTimeout(r, 1500));
      setAiStatus('GENERATING');

      const data = await apiPromise;
      setBriefing(data.briefing);
      setAiStatus('COMPLETED');
      
      lastTimeSlot.current = getTimeSlot();

    } catch (error) {
      console.error("AI System Error:", error);
      if (!briefing) setBriefing("시스템 연결 대기 중... 네트워크 상태를 확인해주세요.");
      setAiStatus('ERROR');
    }
  };

  useEffect(() => {
    if (!weather) return;

    if (briefing === '') {
      fetchBriefing();
    }

    const interval = setInterval(() => {
      const currentSlot = getTimeSlot();
      
      if (currentSlot !== lastTimeSlot.current) {
        console.log(`[AI System] Time slot changed (${lastTimeSlot.current} -> ${currentSlot}). Refreshing briefing.`);
        fetchBriefing();
      }
    }, 60000); 

    return () => clearInterval(interval);
    
  }, [weather, briefing]); 

  useEffect(() => {
    if (!briefing) return;
    
    let i = 0;
    setDisplayedText('');
    
    const timer = setInterval(() => {
      if (i <= briefing.length) {
        setDisplayedText(briefing.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 30); 

    return () => clearInterval(timer);
  }, [briefing]);

  return { displayedText, aiStatus };
}