import React, { useState } from "react";
import { CartItem, Product } from "@/types";
import { mockProducts } from "@/data/mockData";
import Navbar from "@/components/Navbar";
import ProductGrid from "@/components/ProductGrid";
import ProductDetails from "@/components/ProductDetails";
import ChatBot from "@/components/ChatBot";
import Cart from "@/components/Cart";
import CheckoutForm from "@/components/CheckoutForm";
import OrderSuccess from "@/components/OrderSuccess";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useCreateOrder } from "@/hooks/useDatabase";

const Index = () => {
  const { products, loading: productsLoading } = useProducts();
  const { createOrder } = useCreateOrder();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const { toast } = useToast();

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prevItems,
          {
            id: Date.now().toString(),
            product,
            quantity: 1,
          },
        ];
      }
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailsOpen(true);
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart.",
    });
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = (addressData: any) => {
    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const orderId = `ORD-${Date.now().toString().slice(-8)}`;

    const order = {
      orderId,
      total,
      items: cartItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      address: addressData,
    };

    setOrderData(order);
    setCartItems([]);
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);

    toast({
      title: "Order placed successfully!",
      description: `Order ${orderId} has been confirmed. Total: ₦${total.toLocaleString()}`,
    });
  };

  const handleSuccessClose = () => {
    setIsSuccessOpen(false);
    setOrderData(null);
  };

  const cartItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar
        cartItemsCount={cartItemsCount}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 px-2">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Shop Smart with AI
            </span>
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Discover amazing products from trusted vendors. Chat with our AI
            assistant to find exactly what you need, add items to cart, and
            checkout - all through natural conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <button
              onClick={() => setIsChatOpen(true)}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-base sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              🤖 Start AI Shopping
            </button>
            <button className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-base sm:text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300">
              Browse Categories
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Featured Products
            </h2>
            <span className="text-sm sm:text-base text-gray-600">
              {products.length} products available
            </span>
          </div>

          <ProductGrid
            products={products}
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
          />
        </div>
      </main>

      <ProductDetails
        product={selectedProduct}
        isOpen={isProductDetailsOpen}
        onClose={() => setIsProductDetailsOpen(false)}
        onAddToCart={addToCart}
      />

      <ChatBot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        products={products}
        onAddToCart={addToCart}
      />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />

      <CheckoutForm
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        }))}
        onSubmit={handleCheckoutSubmit}
      />

      {orderData && (
        <OrderSuccess
          isOpen={isSuccessOpen}
          onClose={handleSuccessClose}
          orderData={orderData}
        />
      )}
    </div>
  );
};

export default Index;
