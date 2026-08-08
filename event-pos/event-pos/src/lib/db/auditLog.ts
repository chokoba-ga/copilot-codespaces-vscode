import { supabase } from '@/lib/supabase';
import { subscribeTable } from './subscribe';
import type { AuditAction, AuditLogDoc } from '@/types';

function fromRow(row: Record<string, unknown>): AuditLogDoc {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    action: row.action as AuditAction,
    targetId: (row.target_id as string) ?? null,
    actorUid: row.actor_uid as string,
    actorName: row.actor_name as string,
    detail: row.detail as string,
    createdAt: Number(row.created_at),
  };
}

/**
 * 操作ログを記録する。
 * audit_logs テーブルへの直接INSERTはRLSで禁止しており（改ざん防止のため）、
 * 必ず write_audit_log 関数（RPC）経由で記録する。実行者（actorUid/actorName）は
 * サーバー側で auth.uid() から自動的に決定されるため、なりすましはできない。
 */
export async function writeAuditLog(params: {
  eventId: string;
  action: AuditAction;
  targetId?: string | null;
  actorUid: string;
  actorName: string;
  detail: string;
}): Promise<void> {
  const { error } = await supabase.rpc('write_audit_log', {
    p_event_id: params.eventId,
    p_action: params.action,
    p_target_id: params.targetId ?? null,
    p_detail: params.detail,
  });
  if (error) console.error('[audit log] failed to write', error);
}

export function subscribeAuditLogs(
  eventId: string,
  onData: (logs: AuditLogDoc[]) => void,
  max = 200,
): () => void {
  return subscribeTable({
    table: 'audit_logs',
    filter: `event_id=eq.${eventId}`,
    cacheKey: `audit_logs:${eventId}`,
    onData,
    fetch: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(max);
      if (error) throw error;
      return (data ?? []).map(fromRow);
    },
  });
}
