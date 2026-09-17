import { supabase } from '@/lib/supabase';
import { subscribeTable } from './subscribe';
import { writeAuditLog } from './auditLog';
import type { ProductCategoryDoc, ProductDoc } from '@/types';
import { generateId } from '@/lib/utils';

function productFromRow(row: Record<string, unknown>): ProductDoc {
  return {
    id: row.id as string,
    name: row.name as string,
    categoryId: (row.category_id as string) ?? null,
    price: Number(row.price),
    cost: Number(row.cost),
    initialStock: Number(row.initial_stock),
    currentStock: Number(row.current_stock),
    description: (row.description as string) ?? '',
    imageUrl: (row.image_url as string) ?? null,
    order: Number(row.order),
    isActive: Boolean(row.is_active),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function categoryFromRow(row: Record<string, unknown>): ProductCategoryDoc {
  return {
    id: row.id as string,
    name: row.name as string,
    order: Number(row.order),
    color: (row.color as string) ?? 'brand',
    createdAt: Number(row.created_at),
  };
}

export function subscribeProducts(eventId: string, onData: (items: ProductDoc[]) => void): () => void {
  return subscribeTable({
    table: 'products',
    eventId,
    cacheKey: `products:${eventId}`,
    fromRow: productFromRow,
    onData: (items) => onData([...items].sort((a, b) => a.order - b.order)),
  });
}

export function subscribeCategories(
  eventId: string,
  onData: (items: ProductCategoryDoc[]) => void,
): () => void {
  return subscribeTable({
    table: 'categories',
    eventId,
    cacheKey: `categories:${eventId}`,
    fromRow: categoryFromRow,
    onData: (items) => onData([...items].sort((a, b) => a.order - b.order)),
  });
}

export async function upsertCategory(
  eventId: string,
  category: Partial<ProductCategoryDoc> & { name: string },
  actor: { uid: string; name: string },
): Promise<string> {
  const id = category.id ?? generateId();
  const { error } = await supabase.from('categories').upsert({
    id,
    event_id: eventId,
    name: category.name,
    order: category.order ?? 999,
    color: category.color ?? 'brand',
    created_at: category.createdAt ?? Date.now(),
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({
    eventId,
    action: category.id ? 'product.update' : 'product.create',
    targetId: id,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `カテゴリー「${category.name}」を保存`,
  });
  return id;
}

export async function deleteCategory(eventId: string, categoryId: string): Promise<void> {
  void eventId;
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) throw new Error(error.message);
}

export async function upsertProduct(
  eventId: string,
  product: Partial<ProductDoc> & { name: string; price: number; cost: number; initialStock: number },
  actor: { uid: string; name: string },
): Promise<string> {
  const isNew = !product.id;
  const id = product.id ?? generateId();
  const now = Date.now();

  const { error } = await supabase.from('products').upsert({
    id,
    event_id: eventId,
    name: product.name,
    category_id: product.categoryId ?? null,
    price: product.price,
    cost: product.cost,
    initial_stock: product.initialStock,
    current_stock: product.currentStock ?? product.initialStock,
    description: product.description ?? '',
    image_url: product.imageUrl ?? null,
    order: product.order ?? 999,
    is_active: product.isActive ?? true,
    created_at: product.createdAt ?? now,
    updated_at: now,
  });
  if (error) throw new Error(error.message);

  await writeAuditLog({
    eventId,
    action: isNew ? 'product.create' : 'product.update',
    targetId: id,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `商品「${product.name}」を${isNew ? '登録' : '更新'}`,
  });
  return id;
}

export async function deleteProduct(
  eventId: string,
  productId: string,
  productName: string,
  actor: { uid: string; name: string },
): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw new Error(error.message);

  await writeAuditLog({
    eventId,
    action: 'product.delete',
    targetId: productId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `商品「${productName}」を削除`,
  });
}
