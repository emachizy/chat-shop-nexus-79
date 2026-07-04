import { useEffect, useState } from 'react';
import { useMyVendor } from '@/hooks/useSeller';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function SellerProfile() {
  const { vendor, loading, updateVendor } = useMyVendor();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [avatar, setAvatar] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!vendor) return;
    setName(vendor.store_name || '');
    setDesc(vendor.description || '');
    setAvatar(vendor.avatar_url || '');
    setActive(vendor.is_active);
  }, [vendor]);

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateVendor({ store_name: name, description: desc, avatar_url: avatar, is_active: active });
      toast({ title: 'Saved' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-3xl mb-6">Store profile</h1>
      <Card className="p-6">
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <Label>Store name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} />
          </div>
          <div>
            <Label>Avatar URL</Label>
            <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </div>
          <label className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm">Store is visible to shoppers</span>
          </label>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</Button>
        </form>
      </Card>
    </div>
  );
}
