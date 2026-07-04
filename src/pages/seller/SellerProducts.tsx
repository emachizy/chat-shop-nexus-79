import { Link } from 'react-router-dom';
import { useMyVendor, useMyProducts, deleteProduct, updateProduct } from '@/hooks/useSeller';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SellerProducts() {
  const { vendor, loading: vLoading } = useMyVendor();
  const { products, loading, refetch } = useMyProducts(vendor?.id);
  const { toast } = useToast();

  const onToggle = async (id: string, is_active: boolean) => {
    try { await updateProduct(id, { is_active }); refetch(); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };
  const onDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); refetch(); toast({ title: 'Deleted' }); }
    catch (e: any) { toast({ title: 'Failed', description: e.message, variant: 'destructive' }); }
  };

  if (vLoading || loading) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">Products</h1>
          <p className="text-muted-foreground">{products.length} total</p>
        </div>
        <Button asChild><Link to="/seller/products/new"><Plus className="h-4 w-4 mr-1" />New product</Link></Button>
      </div>

      {products.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          You haven't added any products yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => (
            <Card key={p.id} className="p-4 flex items-center gap-4">
              <img
                src={p.images?.[0] || 'https://placehold.co/80x80?text=%20'}
                alt={p.name}
                className="w-16 h-16 rounded-lg object-cover bg-muted"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.name}</div>
                <div className="text-sm text-muted-foreground">
                  ₦{Number(p.price).toLocaleString()} · Stock: {p.stock} · {p.category || 'Uncategorized'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={p.is_active} onCheckedChange={(v) => onToggle(p.id, v)} />
                  {p.is_active ? 'Active' : 'Hidden'}
                </label>
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/seller/products/${p.id}`}><Pencil className="h-4 w-4" /></Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
