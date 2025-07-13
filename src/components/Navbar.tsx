
import React, { useState } from 'react';
import { ShoppingCart, Store, MessageCircle, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface NavbarProps {
  cartItemsCount: number;
  onOpenChat: () => void;
  onOpenCart: () => void;
}

const Navbar = ({ cartItemsCount, onOpenChat, onOpenCart }: NavbarProps) => {
  const isMobile = useIsMobile();

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {isMobile ? 'ShopNexus' : 'ShopNexus'}
            </span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-4">
            <Button
              variant="outline"
              size={isMobile ? "sm" : "sm"}
              onClick={onOpenChat}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden xs:inline">AI Assistant</span>
              <span className="xs:hidden">AI</span>
            </Button>
            
            <Button
              variant="outline"
              size={isMobile ? "sm" : "sm"}
              onClick={onOpenCart}
              className="flex items-center space-x-1 sm:space-x-2 relative px-2 sm:px-3"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-1 sm:-right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-xs">
                  {cartItemsCount}
                </span>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size={isMobile ? "sm" : "sm"} 
              className="hidden md:flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Vendor Portal</span>
            </Button>
            
            {/* Mobile Menu Button */}
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-4 mt-6">
                    <Button
                      variant="ghost"
                      onClick={onOpenChat}
                      className="flex items-center space-x-2 justify-start"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>AI Assistant</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={onOpenCart}
                      className="flex items-center space-x-2 justify-start"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>Cart {cartItemsCount > 0 && `(${cartItemsCount})`}</span>
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      className="flex items-center space-x-2 justify-start"
                    >
                      <User className="h-4 w-4" />
                      <span>Vendor Portal</span>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
