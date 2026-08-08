import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { FullScreenSpinner } from '@/components/common';
import { LoginPage } from '@/pages/LoginPage';
import { EventListPage } from '@/pages/EventListPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { EventShell } from '@/components/layout';

// Chart.js / jsPDF を含む重いページは遅延読み込みにし、初期バンドルを軽量に保つ
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PdfExportPage = lazy(() => import('@/pages/PdfExportPage').then((m) => ({ default: m.PdfExportPage })));

/** 未ログインなら /login へ、ログイン済みなら子ルートを表示する */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <FullScreenSpinner label="読み込み中…" />;
  if (status !== 'signed-in') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/events"
        element={
          <RequireAuth>
            <EventListPage />
          </RequireAuth>
        }
      />

      <Route
        path="/events/:eventId"
        element={
          <RequireAuth>
            <EventShell />
          </RequireAuth>
        }
      >
        <Route index element={<RegisterPage />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<FullScreenSpinner label="読み込み中…" />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route path="history" element={<HistoryPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="pdf"
          element={
            <Suspense fallback={<FullScreenSpinner label="読み込み中…" />}>
              <PdfExportPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
