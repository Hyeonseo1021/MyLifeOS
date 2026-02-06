// src/hooks/useNotification.ts
import { useState, useCallback, useEffect } from 'react';

export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // 권한 요청 함수
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  // 알림 발송 함수
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    // 권한이 없으면 요청부터 시도
    if (permission !== 'granted') {
        requestPermission();
        return;
    }
    
    // 알림 생성
    try {
        new Notification(title, options);
    } catch (e) {
        console.error("알림 발송 실패:", e);
    }
  }, [permission, requestPermission]);

  return { permission, requestPermission, sendNotification };
};