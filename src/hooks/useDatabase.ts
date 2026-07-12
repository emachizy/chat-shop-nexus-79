import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Product } from '../types';

// NOTE: DB tables are not yet provisioned on this Cloud project.
// These hooks are typed loosely so the app builds; when tables exist,
// the queries will start returning real data.
const db = supabase as any;

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await db
        .from('products')
        .select(`*, vendor:vendors(*)`)
        .eq('is_active', true);
      if (error) throw error;

      const formatted: Product[] = (data || []).map((item: any) => ({
        id: item.id,
        vendorId: item.vendor_id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price?.toString() ?? '0'),
        category: item.category,
        images: item.images || [],
        stock: item.stock,
        vendor: item.vendor
          ? {
              id: item.vendor.id,
              name: item.vendor.name,
              email: item.vendor.email,
              storeName: item.vendor.store_name,
              description: item.vendor.description,
              avatar: item.vendor.avatar_url,
              createdAt: new Date(item.vendor.created_at),
            }
          : undefined,
        createdAt: new Date(item.created_at),
      }));
      setProducts(formatted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
};

export const useCreateOrder = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createOrder = async (orderData: {
    cartItems: Array<{ product: Product; quantity: number }>;
    shippingAddress: any;
    paymentMethod: 'card' | 'cash_on_delivery';
    paymentReference?: string;
  }) => {
    if (!user) throw new Error('You must be signed in to place an order');
    if (!orderData.cartItems.length) throw new Error('Your cart is empty');

    setLoading(true);
    try {
      const totalAmount = orderData.cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      const { data: order, error: orderError } = await db
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          shipping_address: orderData.shippingAddress,
          payment_method: orderData.paymentMethod,
          // Never trust the client to mark an order paid. Card orders are
          // verified server-side via verify-paystack-payment before being
          // flipped to 'paid'. Pay-on-delivery stays 'pending' until fulfilled.
          payment_status: 'pending',
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = orderData.cartItems.map((item) => ({
        order_id: order.id,
        product_ref: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images?.[0] || null,
        product_category: item.product.category || null,
        unit_price: item.product.price,
        quantity: item.quantity,
        vendor_id: (item.product as any).vendorId || null,
      }));
      const { error: itemsError } = await db.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Card payments: verify with Paystack server-side.
      if (orderData.paymentMethod === 'card' && orderData.paymentReference) {
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          'verify-paystack-payment',
          { body: { reference: orderData.paymentReference, order_id: order.id } },
        );
        if (verifyError || !verifyData?.verified) {
          const msg = verifyError?.message || verifyData?.error || 'Payment could not be verified';
          throw new Error(msg);
        }
        // Refresh order to reflect paid status
        const { data: fresh } = await db.from('orders').select('*').eq('id', order.id).single();
        return fresh || order;
      }

      return order;
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, loading };
};

export const useUserOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await db
        .from('orders')
        .select(`*, order_items(*, product:products(*))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  return { orders, loading, error, refetch: fetchOrders };
};
