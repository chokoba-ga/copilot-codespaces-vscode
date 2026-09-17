import { supabase } from '@/lib/supabase';
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

/** audit_logs への直接INSERTはRLSで禁止しており、必ずRPC経由で記録する（改ざん防止）。 */
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
  let cancelled = false;

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(max);
    if (error) {
      console.error('[subscribeAuditLogs] fetch error', error);
      return;
    }
    if (cancelled || !data) return;
    onData(data.map(fromRow));
  };

  void fetchAll();

  const channel = supabase
    .channel(`audit_logs:${eventId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: `event_id=eq.${eventId}` },
      () => void fetchAll(),
    )
    .subscribe();

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}
