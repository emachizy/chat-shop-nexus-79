import React, { useState, useEffect } from "react";
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

  // Load cart items from localStorage on component mount
  useEffect(() => {
    try {
      const savedCartItems = localStorage.getItem('cartItems');
      if (savedCartItems) {
        const parsedItems = JSON.parse(savedCartItems);
        if (Array.isArray(parsedItems)) {
          setCartItems(parsedItems);
        }
      }
    } catch (error) {
      console.error('Failed to load cart items from localStorage:', error);
    }
  }, []);

  // Save cart items to localStorage whenever cartItems changes
  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Failed to save cart items to localStorage:', error);
    }
  }, [cartItems]);

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

  const handleCheckoutSubmit = async (addressData: any) => {
    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    try {
      const order = await createOrder({
        cartItems: cartItems.map((i) => ({ product: i.product, quantity: i.quantity })),
        shippingAddress: {
          fullName: addressData.fullName,
          email: addressData.email,
          phone: addressData.phone,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode,
          country: addressData.country,
        },
        paymentMethod: addressData.paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'card',
        paymentReference: addressData.paymentReference,
      });

      setOrderData({
        orderId: order.order_number,
        total: Number(order.total_amount),
        items: cartItems.map((item) => ({ product: item.product, quantity: item.quantity })),
        address: addressData,
      });
      setCartItems([]);
      setIsCheckoutOpen(false);
      setIsSuccessOpen(true);

      toast({
        title: "Order placed successfully!",
        description: `Order ${order.order_number} confirmed. Total: ₦${Number(order.total_amount).toLocaleString()}`,
      });
    } catch (err: any) {
      toast({
        title: "Could not place order",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        cartItemsCount={cartItemsCount}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 transition-all duration-500 ease-out
        ${isChatOpen ? "md:ml-96" : "md:ml-0"}`}
      >
        {/* Hero — Bento grid */}
        <section className="mb-16 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:auto-rows-[minmax(140px,auto)]">
            {/* Big headline card */}
            <div className="md:col-span-4 md:row-span-2 relative overflow-hidden rounded-3xl bg-gradient-surface border border-border/60 p-8 sm:p-12 shadow-card">
              <div className="absolute inset-0 grid-lines opacity-30" />
              <div className="absolute -top-24 -right-24 h-72 w-72 bg-primary/20 blur-3xl rounded-full" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  AI-powered commerce
                </span>
                <h1 className="mt-6 font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
                  Shop smarter.
                  <br />
                  <span className="text-gradient">Chat, click, checkout.</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl">
                  Discover curated products from trusted vendors and let our AI assistant guide you from browse to buy — all in one conversation.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:opacity-95 hover:scale-[1.02] transition-all"
                  >
                    ✨ Start AI Shopping
                  </button>
                  <a
                    href="#featured"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-border bg-card/50 backdrop-blur text-foreground font-semibold hover:border-primary/60 hover:text-primary transition-all"
                  >
                    Browse products
                  </a>
                </div>
              </div>
            </div>

            {/* Stat card 1 */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-card">
              <div className="absolute -bottom-8 -right-8 h-32 w-32 bg-primary/15 blur-2xl rounded-full" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Live catalog</p>
              <p className="mt-3 font-display font-bold text-4xl text-gradient">
                {mockProducts.length}+
              </p>
              <p className="mt-1 text-sm text-muted-foreground">products across categories</p>
            </div>

            {/* Stat card 2 */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-card">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Assistant</p>
              <p className="mt-3 font-display font-bold text-2xl leading-tight">
                Ask, add, checkout —<br />
                <span className="text-primary">in plain English.</span>
              </p>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="featured" className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-medium">Featured</p>
              <h2 className="font-display font-bold text-2xl sm:text-3xl mt-1">
                What people are shopping now
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {mockProducts.length} products available
            </span>
          </div>

          <ProductGrid
            products={mockProducts}
            onAddToCart={addToCart}
            onProductClick={handleProductClick}
          />
        </section>
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
        products={mockProducts}
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
