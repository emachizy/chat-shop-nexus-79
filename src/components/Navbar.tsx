import React, { useState } from 'react';
import { ShoppingCart, Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserMenu } from './UserMenu';
import { Auth } from './Auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface NavbarProps {
  cartItemsCount: number;
  onOpenChat: () => void;
  onOpenCart: () => void;
}

const Navbar = ({ cartItemsCount, onOpenChat, onOpenCart }: NavbarProps) => {
  const isMobile = useIsMobile();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary blur-md opacity-60 rounded-lg" />
              <div className="relative bg-gradient-primary rounded-lg p-1.5">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-lg sm:text-xl font-display font-bold tracking-tight">
              Shop<span className="text-gradient">Nexus</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenChat}
              className="gap-1.5 hover:bg-primary/10 hover:text-primary"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden xs:inline">AI</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenCart}
              className="relative gap-1.5 hover:bg-primary/10 hover:text-primary"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-primary text-primary-foreground text-[10px] font-semibold rounded-full h-5 min-w-5 px-1 flex items-center justify-center shadow-glow">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            <div className="hidden md:block">
              <UserMenu onShowAuth={() => setShowAuth(true)} />
            </div>

            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-card">
                  <SheetHeader>
                    <SheetTitle className="text-gradient font-display">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2 mt-6">
                    <Button variant="ghost" onClick={onOpenChat} className="justify-start gap-2">
                      <Sparkles className="h-4 w-4" /> AI Assistant
                    </Button>
                    <Button variant="ghost" onClick={onOpenCart} className="justify-start gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Cart {cartItemsCount > 0 && `(${cartItemsCount})`}
                    </Button>
                    <div className="pt-2">
                      <UserMenu onShowAuth={() => setShowAuth(true)} />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-[440px] p-0 border-border/70 bg-card">
          <DialogHeader className="sr-only">
            <DialogTitle>Authentication</DialogTitle>
          </DialogHeader>
          <Auth onClose={() => setShowAuth(false)} />
        </DialogContent>
      </Dialog>
    </nav>
  );
};

export default Navbar;
