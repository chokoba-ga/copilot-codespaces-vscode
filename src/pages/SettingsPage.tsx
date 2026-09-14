import { useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Plus, FileDown, CalendarCog } from 'lucide-react';
import type { EventDoc, ProductDoc } from '@/types';
import { useCatalogStore } from '@/stores/catalogStore';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { upsertProduct, deleteProduct } from '@/lib/db/products';
import { updateEvent } from '@/lib/db/events';
import { Button, SearchInput, ConfirmDialog, Card } from '@/components/common';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { ProductList } from '@/components/products/ProductList';
import { CategoryManager } from '@/components/products/CategoryManager';
import { EventSettingsForm } from '@/components/settings/EventSettingsForm';
import { StaffManager } from '@/components/settings/StaffManager';
import { StaffRosterManager } from '@/components/settings/StaffRosterManager';
import { AuditLogPanel } from '@/components/settings/AuditLogPanel';
import { EventFormModal } from '@/components/events/EventFormModal';

export function SettingsPage() {
  const { event } = useOutletContext<{ event: EventDoc | null }>();
  const navigate = useNavigate();
  const products = useCatalogStore((s) => s.products);
  const categories = useCatalogStore((s) => s.categories);
  const appUser = useAuthStore((s) => s.appUser);
  const showToast = useUiStore((s) => s.showToast);

  const [search, setSearch] = useState('');
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDoc | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductDoc | null>(null);
  const [eventFormOpen, setEventFormOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...products].sort((a, b) => a.order - b.order).filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (!event || !appUser) return null;
  const actor = { uid: appUser.uid, name: appUser.displayName };

  const handleProductSubmit = async (data: Parameters<typeof upsertProduct>[1]) => {
    try {
      await upsertProduct(event.id, { ...data, id: editProduct?.id, order: editProduct?.order }, actor);
      showToast(editProduct ? '商品を更新しました' : '商品を追加しました', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : '保存に失敗しました', 'error');
      throw e;
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(event.id, deleteTarget.id, deleteTarget.name, actor);
      showToast('商品を削除しました', 'success');
      setDeleteTarget(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : '削除に失敗しました', 'error');
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const sorted = [...products].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    await Promise.all(sorted.map((p, i) => upsertProduct(event.id, { ...p, order: i }, actor)));
  };

  const handleEventFormSubmit = async (data: { name: string; description: string; days: EventDoc['days'] }) => {
    await updateEvent(event.id, data, actor);
    showToast('イベント情報を更新しました', 'success');
  };

  return (
    <div className="space-y-4 px-4 pb-10 pt-3">
      <button
        onClick={() => setEventFormOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-left text-sm font-bold text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        <CalendarCog size={17} />
        イベント名・開催日程を編集
      </button>

      <EventSettingsForm event={event} />

      <Card className="p-4">
        <p className="mb-3 text-sm font-black text-neutral-700 dark:text-neutral-200">カテゴリー</p>
        <CategoryManager eventId={event.id} categories={categories} />
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-black text-neutral-700 dark:text-neutral-200">商品管理（{products.length}）</p>
          <Button
            size="sm"
            onClick={() => {
              setEditProduct(null);
              setProductFormOpen(true);
            }}
          >
            <Plus size={15} /> 追加
          </Button>
        </div>
        <div className="mb-3">
          <SearchInput value={search} onChange={setSearch} placeholder="商品を検索" />
        </div>
        {filteredProducts.length === 0 ? (
          <p className="py-6 text-center text-xs font-semibold text-neutral-400">商品がありません</p>
        ) : (
          <ProductList
            products={filteredProducts}
            onEdit={(p) => {
              setEditProduct(p);
              setProductFormOpen(true);
            }}
            onDelete={setDeleteTarget}
            onReorder={handleReorder}
          />
        )}
      </Card>

      <button
        onClick={() => navigate(`/events/${event.id}/pdf`)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-4 py-3.5 text-sm font-black text-white shadow-soft dark:bg-brand-600"
      >
        <FileDown size={17} />
        学校提出用PDFを作成する
      </button>

      <StaffRosterManager />
      <StaffManager />
      <AuditLogPanel eventId={event.id} />

      <ProductFormModal open={productFormOpen} onClose={() => setProductFormOpen(false)} onSubmit={handleProductSubmit} initial={editProduct} categories={categories} />
      <EventFormModal open={eventFormOpen} onClose={() => setEventFormOpen(false)} onSubmit={handleEventFormSubmit} initial={event} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="商品を削除しますか？"
        description={`「${deleteTarget?.name}」を削除します。過去の売上履歴には商品名が残ります。`}
        danger
        confirmLabel="削除する"
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
