import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import type { WeatherData, TodoItem } from '../types';

type AiStatus = 'IDLE' | 'ANALYZING' | 'GENERATING' | 'COMPLETED' | 'ERROR';

export function useAiSystem(weather: WeatherData | null, todos: TodoItem[]) {
  const [briefing, setBriefing] = useState<string>(() => sessionStorage.getItem('jarvis_briefing') || '');
  const [displayedText, setDisplayedText] = useState<string>(() => sessionStorage.getItem('jarvis_briefing') || '');
  const [aiStatus, setAiStatus] = useState<AiStatus>(
    sessionStorage.getItem('jarvis_briefing') ? 'COMPLETED' : 'IDLE'
  );
  
  const lastTimeSlot = useRef<number>(
    parseInt(sessionStorage.getItem('jarvis_time_slot') || '-1')
  );

  const todosRef = useRef<TodoItem[]>(todos);
  const isFetchingRef = useRef(false);

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
    if (!weather || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setAiStatus('ANALYZING');
      
      const apiPromise = api.ai.generateBriefing(weather, todosRef.current);
      await new Promise(r => setTimeout(r, 1500));
      setAiStatus('GENERATING');

      const data = await apiPromise;
      
      setBriefing(data.briefing);
      sessionStorage.setItem('jarvis_briefing', data.briefing);
      
      const currentSlot = getTimeSlot();
      lastTimeSlot.current = currentSlot;
      sessionStorage.setItem('jarvis_time_slot', currentSlot.toString());

      setDisplayedText(''); 
      setAiStatus('COMPLETED');

    } catch (error) {
      console.error("AI System Error:", error);
      setAiStatus('ERROR');
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!weather) return;

    const currentSlot = getTimeSlot();
    const savedBriefing = sessionStorage.getItem('jarvis_briefing');

    if (!savedBriefing || currentSlot !== lastTimeSlot.current) {
      fetchBriefing();
    }

    const interval = setInterval(() => {
      if (getTimeSlot() !== lastTimeSlot.current) {
        fetchBriefing();
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, [weather]); 

  useEffect(() => {
    if (!briefing || displayedText === briefing) return;
    
    let i = displayedText.length;
    const timer = setInterval(() => {
      if (i <= briefing.length) {
        setDisplayedText(briefing.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 30); 

    return () => clearInterval(timer);
  }, [briefing, displayedText]);

  return { displayedText, aiStatus };
}