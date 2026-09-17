import { WifiOff } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export function OfflineBanner() {
  const isOnline = useUiStore((s) => s.isOnline);
  const pendingCount = useUiStore((s) => s.pendingCount);
  if (isOnline) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-400 px-3 py-1.5 text-center text-xs font-bold text-amber-950 safe-top">
      <WifiOff size={14} />
      オフラインです。操作は端末に保存され、接続が戻ると自動的に同期されます。
      {pendingCount > 0 && `（未送信 ${pendingCount}件）`}
    </div>
  );
}
