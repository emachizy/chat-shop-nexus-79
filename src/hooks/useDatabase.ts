import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Product, Vendor } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('is_active', true);

      if (error) throw error;

      const formattedProducts: Product[] = data.map(item => ({
        id: item.id,
        vendorId: item.vendor_id,
        name: item.name,
        description: item.description,
        price: parseFloat(item.price),
        category: item.category,
        images: item.images || [],
        stock: item.stock,
        vendor: item.vendor ? {
          id: item.vendor.id,
          name: item.vendor.name,
          email: item.vendor.email,
          storeName: item.vendor.store_name,
          description: item.vendor.description,
          avatar: item.vendor.avatar_url,
          createdAt: new Date(item.vendor.created_at)
        } : undefined,
        createdAt: new Date(item.created_at)
      }));

      setProducts(formattedProducts);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: fetchProducts };
};

export const useCreateOrder = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createOrder = async (orderData: {
    cartItems: Array<{ product: Product; quantity: number }>;
    shippingAddress: any;
    paymentReference?: string;
  }) => {
    if (!user) throw new Error('User must be authenticated');

    setLoading(true);
    try {
      const totalAmount = orderData.cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // Generate order number
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) throw orderNumberError;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumberData,
          total_amount: totalAmount,
          shipping_address: orderData.shippingAddress,
          payment_status: orderData.paymentReference ? 'paid' : 'pending',
          paystack_reference: orderData.paymentReference,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            product:products(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, refetch: fetchOrders };
};