import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const db = supabase as any;
const IMG_SIGN_SECONDS = 60 * 60 * 24 * 365 * 10; // ~10 years

// --------------- Roles ---------------
export type AppRole = 'admin' | 'seller';

export const useMyRoles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setRoles([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await db.from('user_roles').select('role').eq('user_id', user.id);
    setRoles((data || []).map((r: any) => r.role as AppRole));
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  return {
    roles,
    loading,
    isAdmin: roles.includes('admin'),
    isSeller: roles.includes('seller'),
    refetch,
  };
};

// --------------- Vendor (store profile) ---------------
export const useMyVendor = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setVendor(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await db.from('vendors').select('*').eq('user_id', user.id).maybeSingle();
    if (data) {
      setVendor(data);
    } else {
      // Auto-create vendor row (only succeeds if user has seller role due to RLS)
      const { data: created } = await db
        .from('vendors')
        .insert({ user_id: user.id, store_name: user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Store` : 'My Store' })
        .select()
        .single();
      setVendor(created ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const updateVendor = async (updates: { store_name?: string; description?: string; avatar_url?: string; is_active?: boolean }) => {
    if (!vendor) return;
    const { data, error } = await db.from('vendors').update(updates).eq('id', vendor.id).select().single();
    if (error) throw error;
    setVendor(data);
    return data;
  };

  return { vendor, loading, refetch, updateVendor };
};

// --------------- Image upload ---------------
export const uploadProductImage = async (vendorId: string, file: File): Promise<string> => {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${vendorId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from('product-images')
    .createSignedUrl(path, IMG_SIGN_SECONDS);
  if (signErr || !data) throw signErr || new Error('Sign failed');
  return data.signedUrl;
};

// --------------- Products (seller-owned) ---------------
export const useMyProducts = (vendorId: string | undefined) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    const { data } = await db
      .from('products')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { products, loading, refetch };
};

export const createProduct = async (payload: any) => {
  const { data, error } = await db.from('products').insert(payload).select().single();
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, payload: any) => {
  const { data, error } = await db.from('products').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await db.from('products').delete().eq('id', id);
  if (error) throw error;
};

export const fetchProductById = async (id: string) => {
  const { data, error } = await db.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

// --------------- Seller orders + analytics ---------------
export const useMyOrders = (vendorId: string | undefined) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    // Get order_items with parent order
    const { data } = await db
      .from('order_items')
      .select('*, order:orders(*)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    // Group by order
    const map = new Map<string, any>();
    (data || []).forEach((row: any) => {
      const o = row.order;
      if (!o) return;
      if (!map.has(o.id)) map.set(o.id, { ...o, items: [] });
      map.get(o.id).items.push(row);
    });
    setOrders(Array.from(map.values()));
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { refetch(); }, [refetch]);

  return { orders, loading, refetch };
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const { error } = await db.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
};

export const useSellerStats = (vendorId: string | undefined) => {
  const [stats, setStats] = useState({
    revenue: 0,
    paidRevenue: 0,
    orderCount: 0,
    unitsSold: 0,
    topProducts: [] as { name: string; units: number; revenue: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) return;
    (async () => {
      setLoading(true);
      const { data } = await db
        .from('order_items')
        .select('quantity, unit_price, product_name, order:orders(payment_status)')
        .eq('vendor_id', vendorId);
      let revenue = 0, paidRevenue = 0, units = 0;
      const productMap: Record<string, { name: string; units: number; revenue: number }> = {};
      const orderIds = new Set<string>();
      (data || []).forEach((row: any) => {
        const sub = Number(row.unit_price) * row.quantity;
        revenue += sub;
        units += row.quantity;
        if (row.order?.payment_status === 'paid') paidRevenue += sub;
        const key = row.product_name;
        if (!productMap[key]) productMap[key] = { name: key, units: 0, revenue: 0 };
        productMap[key].units += row.quantity;
        productMap[key].revenue += sub;
      });
      const { count } = await db.from('orders').select('id', { count: 'exact', head: true });
      const topProducts = Object.values(productMap).sort((a, b) => b.units - a.units).slice(0, 5);
      setStats({ revenue, paidRevenue, orderCount: count ?? orderIds.size, unitsSold: units, topProducts });
      setLoading(false);
    })();
  }, [vendorId]);

  return { stats, loading };
};

// --------------- Admin: manage seller role ---------------
export const useAdminSellers = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    // user_roles + join vendor for display name
    const { data } = await db
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('role', 'seller');
    const userIds = (data || []).map((r: any) => r.user_id);
    let vendors: any[] = [];
    if (userIds.length) {
      const { data: v } = await db.from('vendors').select('user_id, store_name').in('user_id', userIds);
      vendors = v || [];
    }
    setSellers(
      (data || []).map((r: any) => ({
        user_id: r.user_id,
        created_at: r.created_at,
        store_name: vendors.find((v) => v.user_id === r.user_id)?.store_name ?? '(no store yet)',
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { sellers, loading, refetch };
};

export const grantSellerRoleByUserId = async (userId: string) => {
  const { error } = await db.from('user_roles').insert({ user_id: userId, role: 'seller' });
  if (error && !String(error.message || '').includes('duplicate')) throw error;
};

export const revokeSellerRole = async (userId: string) => {
  const { error } = await db.from('user_roles').delete().eq('user_id', userId).eq('role', 'seller');
  if (error) throw error;
};
