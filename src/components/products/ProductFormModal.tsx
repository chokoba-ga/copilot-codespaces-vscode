import { useEffect, useState } from 'react';
import type { ProductCategoryDoc, ProductDoc } from '@/types';
import { Modal, Button, TextField, NumberField, SelectField, TextAreaField } from '@/components/common';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    categoryId: string | null;
    price: number;
    cost: number;
    initialStock: number;
    currentStock?: number;
    description: string;
    imageUrl: string | null;
  }) => Promise<void>;
  initial?: ProductDoc | null;
  categories: ProductCategoryDoc[];
}

export function ProductFormModal({ open, onClose, onSubmit, initial, categories }: Props) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [initialStock, setInitialStock] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setCategoryId(initial?.categoryId ?? '');
    setPrice(initial?.price ?? 0);
    setCost(initial?.cost ?? 0);
    setInitialStock(initial?.initialStock ?? 0);
    setCurrentStock(initial?.currentStock ?? 0);
    setDescription(initial?.description ?? '');
    setImageUrl(initial?.imageUrl ?? '');
  }, [open, initial]);

  const handleSubmit = async () => {
    if (!name.trim() || price <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        categoryId: categoryId || null,
        price,
        cost,
        initialStock: initial ? initial.initialStock : initialStock,
        currentStock: initial ? currentStock : undefined,
        description: description.trim(),
        imageUrl: imageUrl.trim() || null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const margin = price - cost;

  return (
    <Modal open={open} onClose={onClose} title={initial ? '商品を編集' : '商品を追加'}>
      <div className="space-y-4">
        <TextField label="商品名" required value={name} onChange={(e) => setName(e.target.value)} placeholder="例）からあげ" />
        <SelectField label="カテゴリー（任意）" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">未分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="販売価格" required suffix="円" min={0} value={price} onChange={setPrice} />
          <NumberField label="原価" suffix="円" min={0} value={cost} onChange={setCost} />
        </div>
        <p className="-mt-2 text-xs font-bold text-neutral-400">1個あたり粗利益：{margin.toLocaleString()}円</p>
        {initial ? (
          <NumberField
            label="現在在庫（数量を修正する場合のみ変更）"
            suffix="個"
            min={0}
            value={currentStock}
            onChange={setCurrentStock}
            hint={`初期在庫: ${initial.initialStock}個`}
          />
        ) : (
          <NumberField label="初期在庫" suffix="個" min={0} value={initialStock} onChange={setInitialStock} />
        )}
        <TextField label="商品画像URL（任意）" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        <TextAreaField label="説明（任意）" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button fullWidth size="lg" onClick={handleSubmit} loading={submitting} disabled={!name.trim() || price <= 0}>
          保存する
        </Button>
      </div>
    </Modal>
  );
}
