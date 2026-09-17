import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';
import { Button } from '@/components/common';

export function NotFoundPage() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <CompassIcon size={40} className="text-neutral-300" />
      <div>
        <p className="text-lg font-black text-neutral-800 dark:text-neutral-100">ページが見つかりません</p>
        <p className="mt-1 text-sm font-medium text-neutral-400">URLをご確認いただくか、一覧に戻ってください。</p>
      </div>
      <Link to="/events">
        <Button>イベント一覧へ戻る</Button>
      </Link>
    </div>
  );
}
