import { useEffect, useState } from 'react';
import type { AuditLogDoc } from '@/types';
import { subscribeAuditLogs } from '@/lib/db/auditLog';
import { Card } from '@/components/common';
import { formatDateTime } from '@/lib/utils';
import { ScrollText } from 'lucide-react';

export function AuditLogPanel({ eventId }: { eventId: string }) {
  const [logs, setLogs] = useState<AuditLogDoc[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => subscribeAuditLogs(eventId, setLogs, 100), [eventId]);

  const visible = expanded ? logs : logs.slice(0, 6);

  return (
    <Card className="p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-black text-neutral-700 dark:text-neutral-200">
        <ScrollText size={15} /> 操作ログ
      </p>
      {logs.length === 0 ? (
        <p className="text-xs font-semibold text-neutral-400">まだ操作ログがありません</p>
      ) : (
        <>
          <ul className="space-y-2">
            {visible.map((log) => (
              <li key={log.id} className="text-xs">
                <span className="font-bold text-neutral-400">{formatDateTime(log.createdAt)}</span>{' '}
                <span className="font-bold text-neutral-600 dark:text-neutral-300">{log.actorName}</span>
                <span className="text-neutral-500 dark:text-neutral-400"> — {log.detail}</span>
              </li>
            ))}
          </ul>
          {logs.length > 6 && (
            <button onClick={() => setExpanded((v) => !v)} className="mt-3 text-xs font-bold text-brand-600">
              {expanded ? '閉じる' : `すべて表示（${logs.length}件）`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
