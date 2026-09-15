import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import SellerLayout from "./pages/seller/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProducts from "./pages/seller/SellerProducts";
import SellerProductForm from "./pages/seller/SellerProductForm";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerProfile from "./pages/seller/SellerProfile";
import AdminUsers from "./pages/admin/AdminUsers";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Refund from "./pages/legal/Refund";
import Shipping from "./pages/legal/Shipping";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminUsers />} />
            <Route path="/seller" element={<SellerLayout />}>
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="products/new" element={<SellerProductForm />} />
              <Route path="products/:id" element={<SellerProductForm />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="profile" element={<SellerProfile />} />
            </Route>
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/refund" element={<Refund />} />
            <Route path="/legal/shipping" element={<Shipping />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Footer />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
