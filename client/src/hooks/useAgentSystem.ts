import { useState, useEffect } from 'react';
import type { WeatherData, TodoItem } from '../types';

type AgentStatus = 'IDLE' | 'ANALYZING' | 'FETCHING_NEWS' | 'SYNTHESIZING' | 'COMPLETED';

export function useAgentSystem(weather: WeatherData | null, todos: TodoItem[]) {
  const [briefing, setBriefing] = useState('');
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('IDLE');
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!weather) return; 

    const generateBriefing = async () => {
      setAgentStatus('ANALYZING');
      await new Promise(r => setTimeout(r, 600));

      setAgentStatus('FETCHING_NEWS');
      const newsHeadline = "React 19 RC Released"; 
      await new Promise(r => setTimeout(r, 800));

      setAgentStatus('SYNTHESIZING');
      
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? "좋은 아침입니다" : hour < 18 ? "오후 업무 화이팅하세요" : "오늘 하루 수고하셨습니다";
      const weatherComment = weather.condition.includes('Rain') 
        ? "비 소식이 있으니 우산을 챙기세요." 
        : `현재 기온 ${weather.temp}°C로 쾌적합니다.`;
      const pendingCount = todos.filter(t => !t.done).length;
      const todoComment = pendingCount > 0 
        ? `오늘 처리할 작업이 ${pendingCount}건 남아있습니다.` 
        : "예정된 모든 작업을 완료했습니다.";

      const fullText = `"${timeGreeting}, 현서님. ${weatherComment} ${todoComment} 주요 이슈로는 '${newsHeadline}' 관련 업데이트가 감지되었습니다."`;
      
      setBriefing(fullText);
      setAgentStatus('COMPLETED');
    };

    generateBriefing();
  }, [weather, todos.length]); 

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

  return { displayedText, agentStatus };
}