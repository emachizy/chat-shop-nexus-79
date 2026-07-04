import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMyVendor, createProduct, updateProduct, fetchProductById, uploadProductImage } from '@/hooks/useSeller';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { X, Upload } from 'lucide-react';

export default function SellerProductForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const { vendor } = useMyVendor();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('0');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing || !id) return;
    fetchProductById(id).then((p) => {
      setName(p.name); setDescription(p.description || ''); setPrice(String(p.price));
      setCategory(p.category || ''); setStock(String(p.stock)); setImages(p.images || []);
    }).catch((e) => toast({ title: 'Not found', description: e.message, variant: 'destructive' }));
  }, [id, editing, toast]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!vendor) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        const url = await uploadProductImage(vendor.id, f);
        setImages((prev) => [...prev, url]);
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    try {
      const payload = {
        vendor_id: vendor.id,
        name, description,
        price: parseFloat(price) || 0,
        category: category || null,
        stock: parseInt(stock) || 0,
        images,
      };
      if (editing && id) await updateProduct(id, payload);
      else await createProduct(payload);
      toast({ title: editing ? 'Updated' : 'Created' });
      navigate('/seller/products');
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display font-bold text-3xl mb-6">{editing ? 'Edit product' : 'New product'}</h1>
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Price (₦)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Fashion" />
            </div>
          </div>
          <div>
            <Label>Images</Label>
            <div className="flex flex-wrap gap-3 mt-2">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover bg-muted" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary text-muted-foreground">
                {uploading ? '…' : <Upload className="h-5 w-5" />}
                <input type="file" accept="image/*" multiple onChange={onFile} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</Button>
            <Button type="button" variant="outline" onClick={() => navigate('/seller/products')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
