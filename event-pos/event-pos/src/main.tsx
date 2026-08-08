import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import { ToastContainer } from '@/components/common';
import { initAuthListener, useAuthStore } from '@/stores/authStore';
import { initEventListener } from '@/stores/eventStore';
import { applyTheme, initOnlineListener, useUiStore } from '@/stores/uiStore';
import { flushOutbox } from '@/lib/offline/outbox';
// registerOutboxHandler の副作用（オンライン復帰時の再送処理登録）を確実に読み込む
import '@/lib/db/sales';
import '@/lib/db/expenses';

function Root() {
  const theme = useUiStore((s) => s.theme);
  const status = useAuthStore((s) => s.status);
  const showToast = useUiStore((s) => s.showToast);

  useEffect(() => {
    const unsubAuth = initAuthListener();
    const unsubOnline = initOnlineListener();
    return () => {
      unsubAuth();
      unsubOnline();
    };
  }, []);

  // オンライン復帰時に、オフライン中にたまった会計・支出登録を自動的にサーバーへ再送する
  useEffect(() => {
    let flushedCount = 0;
    const flush = () => {
      flushedCount = 0;
      void flushOutbox(() => {
        flushedCount += 1;
      }).then(() => {
        if (flushedCount > 0) {
          showToast(`オフライン中の${flushedCount}件を同期しました`, 'success');
        }
      });
    };
    flush(); // 起動時にも未送信分があれば試す
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [showToast]);

  // イベント一覧はログイン後にのみ購読を開始する（RLSがログイン必須のため）
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
