import { Link } from 'react-router-dom';
import { useMyVendor, useSellerStats } from '@/hooks/useSeller';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, ShoppingBag, TrendingUp, Plus } from 'lucide-react';

const fmt = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function SellerDashboard() {
  const { vendor, loading: vLoading } = useMyVendor();
  const { stats, loading } = useSellerStats(vendor?.id);

  if (vLoading) return <p className="text-muted-foreground">Loading store…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">{vendor?.store_name ?? 'Your store'}</h1>
          <p className="text-muted-foreground">Overview of your sales activity.</p>
        </div>
        <Button asChild><Link to="/seller/products/new"><Plus className="h-4 w-4 mr-1" /> New product</Link></Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total revenue" value={fmt(stats.revenue)} sub={`Paid: ${fmt(stats.paidRevenue)}`} />
        <StatCard icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={String(stats.orderCount)} />
        <StatCard icon={<Package className="h-4 w-4" />} label="Units sold" value={String(stats.unitsSold)} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Top product" value={stats.topProducts[0]?.name ?? '—'} sub={stats.topProducts[0] ? `${stats.topProducts[0].units} sold` : ''} />
      </div>

      <Card className="p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Top 5 products</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : stats.topProducts.length === 0 ? (
          <p className="text-muted-foreground">No sales yet.</p>
        ) : (
          <div className="space-y-2">
            {stats.topProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between border-b border-border/40 py-2 last:border-0">
                <span className="font-medium">{p.name}</span>
                <span className="text-sm text-muted-foreground">{p.units} units · {fmt(p.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">{icon} {label}</div>
      <div className="font-display font-bold text-2xl mt-2 truncate">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </Card>
  );
}
