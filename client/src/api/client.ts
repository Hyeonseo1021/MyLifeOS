// src/api/client.ts

// 환경 변수에서 주소를 가져오고, 없으면 기본값 사용
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface RequestConfig extends RequestInit {
  data?: unknown; // POST나 PATCH때 보낼 데이터
}

// 제네릭 T를 사용하여 반환 타입을 지정할 수 있게 함
async function client<T>(endpoint: string, { data, ...customConfig }: RequestConfig = {}): Promise<T> {
  const headers = { 'Content-Type': 'application/json' };
  
  const config: RequestInit = {
    method: data ? 'POST' : 'GET', // 데이터가 있으면 자동으로 POST로 설정 (덮어쓰기 가능)
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    // 응답이 없는 경우(DELETE 등)를 대비해 텍스트 확인
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
    
  } catch (error) {
    console.error('API Request Failed:', error);
    throw error;
  }
}

export default client;