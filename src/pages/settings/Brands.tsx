import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Edit, Trash2, Building2, MapPin, Image, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface BrandColors {
  topBar: string;
  button: string;
  text: string;
  primary?: string;
  buttonText?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
  gmb_link: string;
  brand_id?: string;
}

interface Brand {
  id: string;
  name: string;
  subdomain: string | null;
  logo_url: string | null;
  colors: BrandColors | null;
  locations: Location[];
}

interface FormState {
  name: string;
  subdomain: string;
  colors: BrandColors;
  locations: Location[];
}

const defaultColors: BrandColors = { topBar: '#263F6A', button: '#FF887C', text: '#263F6A', buttonText: '#FFFFFF' };

export default function Brands() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', subdomain: '', colors: defaultColors, locations: [] });

  // Fetch brands with their locations
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands-with-locations'],
    queryFn: async () => {
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (brandsError) throw brandsError;

      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*');
      
      if (locationsError) throw locationsError;

      return brandsData.map(brand => ({
        ...brand,
        colors: brand.colors as unknown as BrandColors | null,
        locations: locationsData
          .filter(loc => loc.brand_id === brand.id)
          .map(loc => ({
            id: loc.id,
            name: loc.name,
            address: loc.address || '',
            gmb_link: loc.gmb_link || '',
            brand_id: loc.brand_id || undefined,
          })),
      })) as Brand[];
    },
  });

  // Create/Update brand mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { brand: FormState; editingId?: string }) => {
      const { brand, editingId } = data;
      const brandPayload = {
        name: brand.name,
        subdomain: brand.subdomain || null,
        colors: brand.colors as unknown as Json,
      };

      let brandId: string;

      if (editingId) {
        // Update existing brand
        const { error } = await supabase
          .from('brands')
          .update(brandPayload)
          .eq('id', editingId);
        if (error) throw error;
        brandId = editingId;

        // Get existing locations for this brand
        const { data: existingLocations } = await supabase
          .from('locations')
          .select('id')
          .eq('brand_id', editingId);

        const existingIds = existingLocations?.map(l => l.id) || [];
        const newLocationIds = brand.locations.filter(l => !l.id.startsWith('temp-')).map(l => l.id);
        const toDelete = existingIds.filter(id => !newLocationIds.includes(id));

        // Delete removed locations
        if (toDelete.length > 0) {
          await supabase.from('locations').delete().in('id', toDelete);
        }

        // Upsert locations
        for (const loc of brand.locations) {
          if (loc.id.startsWith('temp-')) {
            // Insert new location
            await supabase.from('locations').insert({
              name: loc.name,
              address: loc.address || null,
              gmb_link: loc.gmb_link || null,
              brand_id: brandId,
            });
          } else {
            // Update existing location
            await supabase.from('locations').update({
              name: loc.name,
              address: loc.address || null,
              gmb_link: loc.gmb_link || null,
            }).eq('id', loc.id);
          }
        }
      } else {
        // Create new brand
        const { data: newBrand, error } = await supabase
          .from('brands')
          .insert(brandPayload)
          .select()
          .single();
        if (error) throw error;
        brandId = newBrand.id;

        // Insert locations
        if (brand.locations.length > 0) {
          const locationsPayload = brand.locations.map(loc => ({
            name: loc.name,
            address: loc.address || null,
            gmb_link: loc.gmb_link || null,
            brand_id: brandId,
          }));
          const { error: locError } = await supabase.from('locations').insert(locationsPayload);
          if (locError) throw locError;
        }
      }

      return brandId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brands-with-locations'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: variables.editingId ? 'Brand updated' : 'Brand created' });
      setModalOpen(false);
      setEditingBrand(null);
    },
    onError: (error) => {
      toast({ title: 'Error saving brand', description: error.message, variant: 'destructive' });
    },
  });

  // Delete brand mutation
  const deleteMutation = useMutation({
    mutationFn: async (brandId: string) => {
      // Delete locations first (foreign key constraint)
      await supabase.from('locations').delete().eq('brand_id', brandId);
      // Then delete brand
      const { error } = await supabase.from('brands').delete().eq('id', brandId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-with-locations'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({ title: 'Brand deleted' });
    },
    onError: (error) => {
      toast({ title: 'Error deleting brand', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    if (!form.name) {
      toast({ title: 'Brand name required', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({ brand: form, editingId: editingBrand?.id });
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      subdomain: brand.subdomain || '',
      colors: brand.colors || defaultColors,
      locations: brand.locations || [],
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const addLocation = () => {
    setForm({
      ...form,
      locations: [...form.locations, { id: `temp-${crypto.randomUUID()}`, name: '', address: '', gmb_link: '' }],
    });
  };

  const updateLocation = (idx: number, field: string, value: string) => {
    setForm({
      ...form,
      locations: form.locations.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    });
  };

  const removeLocation = (idx: number) => {
    setForm({ ...form, locations: form.locations.filter((_, i) => i !== idx) });
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setForm({ name: '', subdomain: '', colors: defaultColors, locations: [] });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Brands"
        description="Manage brands and their locations"
        actions={
          <Button className="btn-coral" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Create Brand
          </Button>
        }
      />

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : brands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No brands found. Create your first brand to get started.
                  </TableCell>
                </TableRow>
              ) : (
                brands.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {b.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {b.subdomain ? `${b.subdomain}.userpulse.com` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        <MapPin className="h-3 w-3 mr-1" />
                        {b.locations?.length || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.colors && Object.values(b.colors).slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="h-5 w-5 rounded border"
                            style={{ backgroundColor: c as string }}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(b)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(b.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBrand ? 'Edit' : 'Create'} Brand</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand Name *</Label>
                <Input
                  value={form.name}
                  onChange={e =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      subdomain: form.subdomain || e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Subdomain</Label>
                <div className="flex">
                  <Input
                    value={form.subdomain}
                    onChange={e =>
                      setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })
                    }
                  />
                  <span className="flex items-center px-3 bg-muted border border-l-0 rounded-r-md text-sm text-muted-foreground">
                    .userpulse.com
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload logo</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Brand Colors</Label>
              <div className="grid grid-cols-4 gap-4">
                {[
                  ['topBar', 'Top Bar'],
                  ['button', 'Button'],
                  ['text', 'Text'],
                  ['buttonText', 'Button Text'],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <div className="flex gap-1">
                      <Input
                        type="color"
                        value={(form.colors as any)[key] || '#000000'}
                        onChange={e => setForm({ ...form, colors: { ...form.colors, [key]: e.target.value } })}
                        className="w-10 h-8 p-0.5"
                      />
                      <Input
                        value={(form.colors as any)[key] || ''}
                        onChange={e => setForm({ ...form, colors: { ...form.colors, [key]: e.target.value } })}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Locations</Label>
                <Button variant="outline" size="sm" onClick={addLocation}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
              {form.locations.map((loc, idx) => (
                <Card key={loc.id} className="p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Name"
                      value={loc.name}
                      onChange={e => updateLocation(idx, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Address"
                      value={loc.address}
                      onChange={e => updateLocation(idx, 'address', e.target.value)}
                    />
                    <div className="flex gap-1">
                      <Input
                        placeholder="GMB Link"
                        value={loc.gmb_link}
                        onChange={e => updateLocation(idx, 'gmb_link', e.target.value)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeLocation(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-coral" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
