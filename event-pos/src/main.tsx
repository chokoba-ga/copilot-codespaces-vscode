import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import { ToastContainer } from '@/components/common';
import { initAuthListener } from '@/stores/authStore';
import { initEventListener } from '@/stores/eventStore';
import { applyTheme, initOnlineListener, useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

function Root() {
  const theme = useUiStore((s) => s.theme);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    const unsubAuth = initAuthListener();
    const unsubOnline = initOnlineListener();
    return () => {
      unsubAuth();
      unsubOnline();
    };
  }, []);

  useEffect(() => {
    if (status !== 'signed-in') return;
    return initEventListener();
  }, [status]);

  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => theme === 'system' && applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <App />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
