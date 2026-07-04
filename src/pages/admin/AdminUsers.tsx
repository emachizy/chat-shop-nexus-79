import { useState } from 'react';
import { useMyRoles, useAdminSellers, grantSellerRoleByUserId, revokeSellerRole } from '@/hooks/useSeller';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const { user } = useAuth();
  const { isAdmin, loading } = useMyRoles();
  const { sellers, refetch } = useAdminSellers();
  const { toast } = useToast();
  const [userId, setUserId] = useState('');

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="font-display font-bold text-2xl mb-2">Admin only</h1>
          <p className="text-muted-foreground mb-6">You don't have admin access.</p>
          <Button asChild><Link to="/">Go home</Link></Button>
        </div>
      </div>
    );
  }

  const onGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim();
    if (!id) return;
    try {
      await grantSellerRoleByUserId(id);
      setUserId('');
      refetch();
      toast({ title: 'Seller role granted' });
    } catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };
  const onRevoke = async (uid: string) => {
    if (!confirm('Revoke seller role?')) return;
    try { await revokeSellerRole(uid); refetch(); toast({ title: 'Revoked' }); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
        <h1 className="font-display font-bold text-3xl">Admin · Sellers</h1>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-3">Grant seller role</h2>
        <form onSubmit={onGrant} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>User ID (auth uid)</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid…" />
          </div>
          <Button type="submit">Grant</Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Ask the user to copy their user ID from their profile menu, or find it in the Users section of your backend.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-3">Current sellers ({sellers.length})</h2>
        {sellers.length === 0 ? (
          <p className="text-muted-foreground text-sm">No sellers yet.</p>
        ) : (
          <div className="space-y-2">
            {sellers.map((s) => (
              <div key={s.user_id} className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
                <div>
                  <div className="font-medium">{s.store_name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{s.user_id}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onRevoke(s.user_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
