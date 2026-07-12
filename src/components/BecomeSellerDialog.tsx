import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const db = supabase as any;

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onSubmitted?: () => void }

export default function BecomeSellerDialog({ open, onOpenChange, onSubmitted }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [storeName, setStoreName] = useState('');
  const [pitch, setPitch] = useState('');
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await db
        .from('seller_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      setExisting(data?.[0] ?? null);
    })();
  }, [open, user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!storeName.trim()) { toast({ title: 'Store name required', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const { error } = await db.from('seller_requests').insert({
        user_id: user.id, store_name: storeName.trim(), pitch: pitch.trim() || null,
      });
      if (error) throw error;
      toast({ title: 'Request submitted', description: 'An admin will review it shortly.' });
      onOpenChange(false); onSubmitted?.();
    } catch (e: any) {
      toast({ title: 'Could not submit', description: e.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Become a seller</DialogTitle>
          <DialogDescription>Tell us about the store you'd like to open on ShopNexus.</DialogDescription>
        </DialogHeader>

        {existing?.status === 'pending' ? (
          <div className="py-4 text-sm">Your request for <b>{existing.store_name}</b> is pending review.</div>
        ) : existing?.status === 'approved' ? (
          <div className="py-4 text-sm">Your seller request was approved. Head to the Seller dashboard.</div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-2">
            {existing?.status === 'rejected' && (
              <p className="text-sm text-muted-foreground">Your previous request was declined. You may submit a new one.</p>
            )}
            <div>
              <Label>Store name *</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Lagos Leather Co." maxLength={80} />
            </div>
            <div>
              <Label>What do you plan to sell?</Label>
              <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Short description of your products and brand" maxLength={500} rows={4} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit request
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
