/**
 * 앱인토스 미니앱 엔트리 포인트
 * 
 * 이 파일은 앱의 시작점입니다.
 * 앱인토스 환경 초기화 및 React 앱 마운트가 이루어집니다.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 앱인토스 환경 정보 로깅 (개발 시 유용)
if (import.meta.env.DEV) {
  console.log('🚀 앱인토스 미니앱 시작');
  console.log('📱 환경:', import.meta.env.MODE);
  console.log('🔗 User Agent:', navigator.userAgent);
}

// React 앱 마운트
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. index.html에 <div id="root"></div>가 있는지 확인하세요.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
