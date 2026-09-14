import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { WifiOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button, FullScreenSpinner } from '@/components/common';
import { NamePromptPage } from '@/pages/NamePromptPage';
import { EventListPage } from '@/pages/EventListPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { EventShell } from '@/components/layout';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PdfExportPage = lazy(() => import('@/pages/PdfExportPage').then((m) => ({ default: m.PdfExportPage })));

function RequireProfile({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const error = useAuthStore((s) => s.error);
  const appUser = useAuthStore((s) => s.appUser);

  if (status === 'signed-out') {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <WifiOff size={36} className="text-neutral-300" />
        <p className="text-sm font-bold text-neutral-500">{error ?? 'サーバーに接続できませんでした。'}</p>
        <Button onClick={() => window.location.reload()}>再読み込みする</Button>
      </div>
    );
  }
  if (status === 'loading' || !appUser) return <FullScreenSpinner label="読み込み中…" />;
  if (!appUser.displayName) return <NamePromptPage />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/events"
        element={
          <RequireProfile>
            <EventListPage />
          </RequireProfile>
        }
      />

      <Route
        path="/events/:eventId"
        element={
          <RequireProfile>
            <EventShell />
          </RequireProfile>
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
