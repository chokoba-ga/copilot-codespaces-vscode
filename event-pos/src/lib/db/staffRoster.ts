import { supabase } from '@/lib/supabase';
import type { StaffRosterMember } from '@/types';
import { generateId } from '@/lib/utils';

function fromRow(row: Record<string, unknown>): StaffRosterMember {
  return {
    id: row.id as string,
    name: row.name as string,
    order: Number(row.order),
    createdAt: Number(row.created_at),
  };
}

/**
 * 「よく使う名前」の一覧はイベントに紐づかない全体共有のリストとして扱う
 * （同じメンバーが複数のイベントをまたいで手伝うことが多いため）。
 */
export function subscribeStaffRoster(onData: (members: StaffRosterMember[]) => void): () => void {
  let cancelled = false;

  const fetchAll = async () => {
    const { data, error } = await supabase.from('staff_roster').select('*').order('order', { ascending: true });
    if (error) {
      console.error('[subscribeStaffRoster] fetch error', error);
      return;
    }
    if (cancelled || !data) return;
    onData(data.map(fromRow));
  };

  void fetchAll();

  const channel = supabase
    .channel('staff_roster:all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_roster' }, () => void fetchAll())
    .subscribe();

  return () => {
    cancelled = true;
    void supabase.removeChannel(channel);
  };
}

export async function addStaffRosterMember(name: string, order: number): Promise<string> {
  const id = generateId();
  const { error } = await supabase.from('staff_roster').insert({
    id,
    name,
    order,
    created_at: Date.now(),
  });
  if (error) throw new Error(error.message);
  return id;
}

export async function deleteStaffRosterMember(id: string): Promise<void> {
  const { error } = await supabase.from('staff_roster').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
