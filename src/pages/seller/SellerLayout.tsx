import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Store, LogOut, Sparkles, ArrowLeft } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { useMyRoles } from '@/hooks/useSeller';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const items = [
  { title: 'Dashboard', url: '/seller', icon: LayoutDashboard, end: true },
  { title: 'Products', url: '/seller/products', icon: Package },
  { title: 'Orders', url: '/seller/orders', icon: ShoppingBag },
  { title: 'Store profile', url: '/seller/profile', icon: Store },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <div className="bg-gradient-primary rounded-lg p-1.5">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-display font-bold">Seller</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.end ? pathname === item.url : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink to={item.url} end={item.end} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/')}>
                  <ArrowLeft className="h-4 w-4" />
                  {!collapsed && <span>Back to shop</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sign out</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function SellerLayout() {
  const { user } = useAuth();
  const { isSeller, isAdmin, loading } = useMyRoles();

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="font-display font-bold text-2xl mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to access the seller dashboard.</p>
          <Button asChild><a href="/">Go home</a></Button>
        </div>
      </div>
    );
  }
  if (!isSeller && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="font-display font-bold text-2xl mb-2">Not a seller yet</h1>
          <p className="text-muted-foreground mb-6">
            Only accounts granted the seller role by an admin can access this dashboard.
          </p>
          <Button asChild><a href="/">Back to shop</a></Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/60 px-4 gap-2 glass">
            <SidebarTrigger />
            <span className="font-display font-semibold">Seller Dashboard</span>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
