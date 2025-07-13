
import React from 'react';
import { ShoppingCart, Store, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  cartItemsCount: number;
  onOpenChat: () => void;
  onOpenCart: () => void;
}

const Navbar = ({ cartItemsCount, onOpenChat, onOpenCart }: NavbarProps) => {
  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ShopNexus
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenChat}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>AI Assistant</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenCart}
              className="flex items-center space-x-2 relative"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>
            
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Vendor Portal
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
