import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMyRoles, useAdminSellers, grantSellerRoleByUserId, revokeSellerRole } from '@/hooks/useSeller';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ArrowLeft, Search, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const db = supabase as any;

export default function AdminUsers() {
  const { user } = useAuth();
  const { isAdmin, loading } = useMyRoles();
  const { sellers, refetch } = useAdminSellers();
  const { toast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [lookup, setLookup] = useState<any>(null);
  const [userId, setUserId] = useState('');

  const loadRequests = async () => {
    const { data } = await db.from('seller_requests').select('*').order('created_at', { ascending: false });
    setRequests(data || []);
    const ids = Array.from(new Set((data || []).map((r: any) => r.user_id)));
    if (ids.length) {
      const { data: em } = await db.rpc('admin_get_user_emails', { _user_ids: ids });
      const map: Record<string, string> = {};
      (em || []).forEach((r: any) => { map[r.user_id] = r.email; });
      setEmails(map);
    }
  };

  useEffect(() => { if (isAdmin) loadRequests(); }, [isAdmin]);

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

  const approve = async (id: string) => {
    try { await db.rpc('approve_seller_request', { _request_id: id }); toast({ title: 'Approved' }); loadRequests(); refetch(); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };
  const reject = async (id: string) => {
    try { await db.rpc('reject_seller_request', { _request_id: id }); toast({ title: 'Rejected' }); loadRequests(); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const lookupByEmail = async () => {
    const e = email.trim();
    if (!e) return;
    const { data, error } = await db.rpc('admin_lookup_user_by_email', { _email: e });
    if (error) { toast({ title: 'Lookup failed', description: error.message, variant: 'destructive' }); return; }
    setLookup(data?.[0] ?? null);
    if (!data?.[0]) toast({ title: 'No user with that email' });
  };
  const grantFromLookup = async () => {
    if (!lookup?.user_id) return;
    try { await grantSellerRoleByUserId(lookup.user_id); toast({ title: 'Granted' }); refetch(); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };
  const onGrantById = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = userId.trim(); if (!id) return;
    try { await grantSellerRoleByUserId(id); setUserId(''); refetch(); toast({ title: 'Seller role granted' }); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };
  const onRevoke = async (uid: string) => {
    if (!confirm('Revoke seller role?')) return;
    try { await revokeSellerRole(uid); refetch(); toast({ title: 'Revoked' }); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild><Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
        <h1 className="font-display font-bold text-3xl">Admin</h1>
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests {pending.length ? <Badge variant="secondary" className="ml-2">{pending.length}</Badge> : null}</TabsTrigger>
          <TabsTrigger value="sellers">Sellers ({sellers.length})</TabsTrigger>
          <TabsTrigger value="grant">Grant manually</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3 mt-4">
          {requests.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">No seller requests yet.</Card>
          ) : requests.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-semibold">{r.store_name}</div>
                  <div className="text-xs text-muted-foreground">{emails[r.user_id] || r.user_id}</div>
                  {r.pitch && <p className="text-sm mt-2">{r.pitch}</p>}
                  <div className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={r.status === 'pending' ? 'secondary' : r.status === 'approved' ? 'default' : 'destructive'}>{r.status}</Badge>
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => approve(r.id)}><Check className="h-4 w-4 mr-1" />Approve</Button>
                      <Button size="sm" variant="outline" onClick={() => reject(r.id)}><X className="h-4 w-4 mr-1" />Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sellers" className="mt-4">
          <Card className="p-6">
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
        </TabsContent>

        <TabsContent value="grant" className="space-y-4 mt-4">
          <Card className="p-6">
            <h2 className="font-semibold mb-3">Grant by email</h2>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <Button type="button" variant="outline" onClick={lookupByEmail}><Search className="h-4 w-4 mr-1" />Find</Button>
            </div>
            {lookup && (
              <div className="mt-3 p-3 bg-muted/40 rounded flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm">{lookup.email}</div>
                  <div className="text-xs text-muted-foreground font-mono">{lookup.user_id}</div>
                </div>
                <Button size="sm" onClick={grantFromLookup}>Grant seller</Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold mb-3">Grant by user ID</h2>
            <form onSubmit={onGrantById} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>User ID</Label>
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid…" />
              </div>
              <Button type="submit">Grant</Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
