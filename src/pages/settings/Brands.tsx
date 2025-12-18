import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Edit, Trash2, Building2, MapPin, Image } from 'lucide-react';

const demoBrands = [
  { id: '1', name: 'Conceptia Fertility', subdomain: 'conceptia', logo_url: null, colors: { topBar: '#263F6A', button: '#FF887C', text: '#263F6A' }, locations: [{ id: 'l1', name: 'Downtown', address: '123 Main St', gmb_link: 'https://g.page/conceptia' }] },
  { id: '2', name: 'Generation Fertility', subdomain: 'generation', logo_url: null, colors: { topBar: '#1a365d', button: '#48bb78', text: '#1a365d' }, locations: [{ id: 'l2', name: 'NewMarket', address: '456 Oak Ave', gmb_link: 'https://g.page/generation' }, { id: 'l3', name: 'Midtown', address: '789 Elm St', gmb_link: '' }] },
  { id: '3', name: 'Grace Fertility', subdomain: 'grace', logo_url: null, colors: { topBar: '#2d3748', button: '#ed8936', text: '#2d3748' }, locations: [{ id: 'l4', name: 'Downtown', address: '321 Pine Rd', gmb_link: 'https://g.page/grace' }] },
  { id: '4', name: 'Olive Fertility', subdomain: 'olive', logo_url: null, colors: { topBar: '#276749', button: '#68d391', text: '#276749' }, locations: [] },
];

export default function Brands() {
  const { toast } = useToast();
  const [brands, setBrands] = useState(demoBrands);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [form, setForm] = useState({ name: '', subdomain: '', colors: { topBar: '#263F6A', button: '#FF887C', text: '#263F6A', buttonText: '#FFFFFF' }, locations: [] as any[] });

  const handleSave = () => {
    if (!form.name) { toast({ title: 'Brand name required', variant: 'destructive' }); return; }
    if (editingBrand) {
      setBrands(brands.map(b => b.id === editingBrand.id ? { ...b, ...form } : b));
      toast({ title: 'Brand updated' });
    } else {
      setBrands([...brands, { id: crypto.randomUUID(), ...form, logo_url: null }]);
      toast({ title: 'Brand created' });
    }
    setModalOpen(false); setEditingBrand(null);
  };

  const handleEdit = (brand: any) => { setEditingBrand(brand); setForm({ name: brand.name, subdomain: brand.subdomain, colors: brand.colors, locations: brand.locations || [] }); setModalOpen(true); };
  const handleDelete = (id: string) => { setBrands(brands.filter(b => b.id !== id)); toast({ title: 'Brand deleted' }); };
  const addLocation = () => setForm({ ...form, locations: [...form.locations, { id: crypto.randomUUID(), name: '', address: '', gmb_link: '' }] });
  const updateLocation = (idx: number, field: string, value: string) => setForm({ ...form, locations: form.locations.map((l, i) => i === idx ? { ...l, [field]: value } : l) });
  const removeLocation = (idx: number) => setForm({ ...form, locations: form.locations.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Brands" description="Manage brands and their locations" actions={<Button className="btn-coral" onClick={() => { setEditingBrand(null); setForm({ name: '', subdomain: '', colors: { topBar: '#263F6A', button: '#FF887C', text: '#263F6A', buttonText: '#FFFFFF' }, locations: [] }); setModalOpen(true); }}><Plus className="h-4 w-4 mr-2" />Create Brand</Button>} />

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Brand</TableHead><TableHead>Subdomain</TableHead><TableHead>Locations</TableHead><TableHead>Colors</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
              {brands.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{b.name}</div></TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{b.subdomain}.userpulse.com</TableCell>
                  <TableCell><Badge variant="secondary"><MapPin className="h-3 w-3 mr-1" />{b.locations?.length || 0}</Badge></TableCell>
                  <TableCell><div className="flex gap-1">{Object.values(b.colors || {}).slice(0, 3).map((c, i) => <div key={i} className="h-5 w-5 rounded border" style={{ backgroundColor: c as string }} />)}</div></TableCell>
                  <TableCell>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(b)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBrand ? 'Edit' : 'Create'} Brand</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Brand Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, subdomain: form.subdomain || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })} /></div>
              <div className="space-y-2"><Label>Subdomain</Label><div className="flex"><Input value={form.subdomain} onChange={e => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })} /><span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">.userpulse.com</span></div></div>
            </div>
            <div className="space-y-2"><Label>Logo</Label><div className="border-2 border-dashed rounded-lg p-4 text-center"><Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Click to upload logo</p></div></div>
            <div className="space-y-2"><Label>Brand Colors</Label>
              <div className="grid grid-cols-4 gap-4">
                {[['topBar', 'Top Bar'], ['button', 'Button'], ['text', 'Text'], ['buttonText', 'Button Text']].map(([key, label]) => (
                  <div key={key} className="space-y-1"><Label className="text-xs">{label}</Label><div className="flex gap-1"><Input type="color" value={(form.colors as any)[key] || '#000000'} onChange={e => setForm({ ...form, colors: { ...form.colors, [key]: e.target.value } })} className="w-10 h-8 p-0.5" /><Input value={(form.colors as any)[key] || ''} onChange={e => setForm({ ...form, colors: { ...form.colors, [key]: e.target.value } })} className="h-8 text-xs" /></div></div>
                ))}
              </div>
            </div>
            <div className="space-y-2"><div className="flex items-center justify-between"><Label>Locations</Label><Button variant="outline" size="sm" onClick={addLocation}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
              {form.locations.map((loc, idx) => (
                <Card key={loc.id} className="p-3"><div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Name" value={loc.name} onChange={e => updateLocation(idx, 'name', e.target.value)} />
                  <Input placeholder="Address" value={loc.address} onChange={e => updateLocation(idx, 'address', e.target.value)} />
                  <div className="flex gap-1"><Input placeholder="GMB Link" value={loc.gmb_link} onChange={e => updateLocation(idx, 'gmb_link', e.target.value)} /><Button variant="ghost" size="icon" onClick={() => removeLocation(idx)}><Trash2 className="h-4 w-4" /></Button></div>
                </div></Card>
              ))}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button><Button className="btn-coral" onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
