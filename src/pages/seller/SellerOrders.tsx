import { useMyVendor, useMyOrders, updateOrderStatus } from '@/hooks/useSeller';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function SellerOrders() {
  const { vendor, loading: vLoading } = useMyVendor();
  const { orders, loading, refetch } = useMyOrders(vendor?.id);
  const { toast } = useToast();

  const onStatus = async (id: string, status: string) => {
    try { await updateOrderStatus(id, status); refetch(); toast({ title: `Marked ${status}` }); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  if (vLoading || loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl">Orders</h1>
        <p className="text-muted-foreground">{orders.length} orders contain your products.</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No orders yet.</Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const myTotal = o.items.reduce((s: number, i: any) => s + Number(i.unit_price) * i.quantity, 0);
            return (
              <Card key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-mono text-sm">{o.order_number}</div>
                    <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                    <div className="text-sm mt-1">
                      <Badge variant="outline">{o.payment_status}</Badge>{' '}
                      <span className="text-muted-foreground">via {o.payment_method}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">₦{myTotal.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{o.items.length} of your items</div>
                    <Select value={o.status} onValueChange={(v) => onStatus(o.id, v)}>
                      <SelectTrigger className="w-40 mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/40 space-y-1">
                  {o.items.map((i: any) => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span>{i.product_name} × {i.quantity}</span>
                      <span className="text-muted-foreground">₦{(Number(i.unit_price) * i.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
