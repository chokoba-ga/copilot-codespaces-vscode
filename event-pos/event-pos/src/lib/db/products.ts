import { supabase } from '@/lib/supabase';
import { subscribeTable } from './subscribe';
import { writeAuditLog } from './auditLog';
import type { ProductCategoryDoc, ProductDoc } from '@/types';

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
    color: row.color as string,
    createdAt: Number(row.created_at),
  };
}

export function subscribeProducts(eventId: string, onData: (items: ProductDoc[]) => void): () => void {
  return subscribeTable({
    table: 'products',
    filter: `event_id=eq.${eventId}`,
    cacheKey: `products:${eventId}`,
    onData,
    fetch: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('event_id', eventId)
        .order('order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(productFromRow);
    },
  });
}

export function subscribeCategories(
  eventId: string,
  onData: (items: ProductCategoryDoc[]) => void,
): () => void {
  return subscribeTable({
    table: 'categories',
    filter: `event_id=eq.${eventId}`,
    cacheKey: `categories:${eventId}`,
    onData,
    fetch: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('event_id', eventId)
        .order('order', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(categoryFromRow);
    },
  });
}

export async function upsertCategory(
  eventId: string,
  category: Partial<ProductCategoryDoc> & { name: string },
  actor: { uid: string; name: string },
): Promise<string> {
  if (category.id) {
    const { error } = await supabase
      .from('categories')
      .update({ name: category.name, order: category.order ?? 999, color: category.color ?? 'brand' })
      .eq('id', category.id);
    if (error) throw error;
    await writeAuditLog({
      eventId,
      action: 'product.update',
      targetId: category.id,
      actorUid: actor.uid,
      actorName: actor.name,
      detail: `カテゴリー「${category.name}」を更新`,
    });
    return category.id;
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ event_id: eventId, name: category.name, order: category.order ?? 999, color: category.color ?? 'brand' })
    .select('id')
    .single();
  if (error) throw error;
  await writeAuditLog({
    eventId,
    action: 'product.create',
    targetId: data.id,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `カテゴリー「${category.name}」を追加`,
  });
  return data.id;
}

export async function deleteCategory(_eventId: string, categoryId: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) throw error;
}

export async function upsertProduct(
  eventId: string,
  product: Partial<ProductDoc> & { name: string; price: number; cost: number; initialStock: number },
  actor: { uid: string; name: string },
): Promise<string> {
  const isNew = !product.id;

  if (product.id) {
    const row: Record<string, unknown> = {
      name: product.name,
      category_id: product.categoryId ?? null,
      price: product.price,
      cost: product.cost,
      description: product.description ?? '',
      image_url: product.imageUrl ?? null,
      order: product.order ?? 999,
      is_active: product.isActive ?? true,
      updated_at: Date.now(),
    };
    if (product.currentStock !== undefined) row.current_stock = product.currentStock;
    const { error } = await supabase.from('products').update(row).eq('id', product.id);
    if (error) throw error;
    await writeAuditLog({
      eventId,
      action: 'product.update',
      targetId: product.id,
      actorUid: actor.uid,
      actorName: actor.name,
      detail: `商品「${product.name}」を更新`,
    });
    return product.id;
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      event_id: eventId,
      name: product.name,
      category_id: product.categoryId ?? null,
      price: product.price,
      cost: product.cost,
      initial_stock: product.initialStock,
      current_stock: product.initialStock,
      description: product.description ?? '',
      image_url: product.imageUrl ?? null,
      order: product.order ?? 999,
      is_active: product.isActive ?? true,
    })
    .select('id')
    .single();
  if (error) throw error;
  await writeAuditLog({
    eventId,
    action: 'product.create',
    targetId: data.id,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `商品「${product.name}」を登録`,
  });
  void isNew;
  return data.id;
}

export async function deleteProduct(
  eventId: string,
  productId: string,
  productName: string,
  actor: { uid: string; name: string },
): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  await writeAuditLog({
    eventId,
    action: 'product.delete',
    targetId: productId,
    actorUid: actor.uid,
    actorName: actor.name,
    detail: `商品「${productName}」を削除`,
  });
}
