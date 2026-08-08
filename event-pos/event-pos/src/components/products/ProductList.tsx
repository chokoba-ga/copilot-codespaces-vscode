import type { ProductDoc } from '@/types';
import { Card, Badge } from '@/components/common';
import { formatYen } from '@/lib/utils';
import { Pencil, Trash2, GripVertical, ImageOff } from 'lucide-react';

export function ProductList({
  products,
  onEdit,
  onDelete,
  onReorder,
}: {
  products: ProductDoc[];
  onEdit: (p: ProductDoc) => void;
  onDelete: (p: ProductDoc) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  return (
    <div className="space-y-2">
      {products.map((p, index) => (
        <Card key={p.id} className="flex items-center gap-2.5 p-3">
          <div className="flex flex-col text-neutral-300">
            <button
              disabled={index === 0}
              onClick={() => onReorder(index, index - 1)}
              className="disabled:opacity-20"
              aria-label="上へ"
            >
              <GripVertical size={16} />
            </button>
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageOff size={16} className="text-neutral-300" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-[14px] font-bold text-neutral-800 dark:text-neutral-100">{p.name}</p>
              {!p.isActive && <Badge tone="neutral">非表示</Badge>}
              {p.currentStock <= 0 && <Badge tone="danger">売切</Badge>}
            </div>
            <p className="text-xs font-semibold text-neutral-400">
              {formatYen(p.price)} ・ 在庫{p.currentStock}/{p.initialStock}
            </p>
          </div>
          <button
            onClick={() => onEdit(p)}
            aria-label="編集"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onDelete(p)}
            aria-label="削除"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={15} />
          </button>
        </Card>
      ))}
    </div>
  );
}
