import { useNavigate } from 'react-router-dom';
import { Calendar, Copy, Pencil, Trash2, ChevronRight } from 'lucide-react';
import type { EventDoc } from '@/types';
import { Card, Badge } from '@/components/common';
import { RoleGuard } from '@/components/layout';
import { formatDateJp } from '@/lib/utils';

const STATUS_LABEL: Record<EventDoc['status'], string> = {
  planning: '準備中',
  active: '開催中',
  archived: '終了',
};
const STATUS_TONE: Record<EventDoc['status'], 'neutral' | 'brand' | 'info'> = {
  planning: 'info',
  active: 'brand',
  archived: 'neutral',
};

export function EventCard({
  event,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  event: EventDoc;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Card className="group relative overflow-hidden p-4 transition-transform active:scale-[0.98]">
      <button
        className="absolute inset-0"
        aria-label={`${event.name}を開く`}
        onClick={() => navigate(`/events/${event.id}`)}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <Badge tone={STATUS_TONE[event.status]}>{STATUS_LABEL[event.status]}</Badge>
          </div>
          <h3 className="truncate text-[17px] font-black text-neutral-900 dark:text-neutral-50">
            {event.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-neutral-400">
            <Calendar size={14} />
            {event.days.length > 0
              ? `${formatDateJp(event.days[0].date)}${event.days.length > 1 ? ` 〜 全${event.days.length}日` : ''}`
              : '日程未設定'}
          </div>
        </div>
        <ChevronRight size={20} className="mt-1 flex-shrink-0 text-neutral-300" />
      </div>

      <RoleGuard roles={['admin']}>
        <div className="relative z-10 mt-3 flex gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <IconTextButton icon={Pencil} label="編集" onClick={onEdit} />
          <IconTextButton icon={Copy} label="複製" onClick={onDuplicate} />
          <IconTextButton icon={Trash2} label="削除" onClick={onDelete} tone="danger" />
        </div>
      </RoleGuard>
    </Card>
  );
}

function IconTextButton({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  tone?: 'danger';
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors ${
        tone === 'danger'
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}
