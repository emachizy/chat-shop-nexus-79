import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMyRoles } from '@/hooks/useSeller';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogOut, Store, Shield, Copy, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import BecomeSellerDialog from './BecomeSellerDialog';

interface UserMenuProps {
  onShowAuth: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onShowAuth }) => {
  const { user, signOut } = useAuth();
  const { isSeller, isAdmin } = useMyRoles();
  const { toast } = useToast();
  const [becomeOpen, setBecomeOpen] = useState(false);

  if (!user) {
    return (
      <Button onClick={onShowAuth} variant="outline">Sign In</Button>
    );
  }

  const userInitials = user.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U';

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    toast({ title: 'User ID copied' });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.user_metadata?.full_name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyId}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy my user ID</span>
          </DropdownMenuItem>
          {!isSeller && !isAdmin && (
            <DropdownMenuItem onClick={() => setBecomeOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Become a seller</span>
            </DropdownMenuItem>
          )}
          {isSeller && (
            <DropdownMenuItem asChild>
              <Link to="/seller"><Store className="mr-2 h-4 w-4" />Seller dashboard</Link>
            </DropdownMenuItem>
          )}
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link to="/admin"><Shield className="mr-2 h-4 w-4" />Admin</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <BecomeSellerDialog open={becomeOpen} onOpenChange={setBecomeOpen} />
    </>
  );
};

