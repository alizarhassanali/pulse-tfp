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
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useSortableTable } from '@/hooks/useSortableTable';
import { Plus, MoreVertical, Edit, Trash2, Building2, MapPin, Image, Loader2, ChevronDown } from 'lucide-react';
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
  address_line1: string;
  address_line2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone: string;
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
  colors: BrandColors;
  locations: Location[];
}

const defaultColors: BrandColors = { topBar: '#263F6A', button: '#FF887C', text: '#263F6A', buttonText: '#FFFFFF' };

export default function Brands() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', colors: defaultColors, locations: [] });
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

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
            address_line1: loc.address_line1 || '',
            address_line2: loc.address_line2 || '',
            city: loc.city || '',
            state_province: loc.state_province || '',
            postal_code: loc.postal_code || '',
            country: loc.country || 'Canada',
            phone: loc.phone || '',
            brand_id: loc.brand_id || undefined,
          })),
      })) as Brand[];
    },
  });

  const { sortKey, sortDirection, sortedData, handleSort } = useSortableTable({
    data: brands,
    defaultSortKey: 'name',
    defaultSortDirection: 'asc',
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { brand: FormState; editingId?: string }) => {
      const { brand, editingId } = data;
      const brandPayload = {
        name: brand.name,
        colors: brand.colors as unknown as Json,
      };

      let brandId: string;

      if (editingId) {
        const { error } = await supabase
          .from('brands')
          .update(brandPayload)
          .eq('id', editingId);
        if (error) throw error;
        brandId = editingId;

        const { data: existingLocations } = await supabase
          .from('locations')
          .select('id')
          .eq('brand_id', editingId);

        const existingIds = existingLocations?.map(l => l.id) || [];
        const newLocationIds = brand.locations.filter(l => !l.id.startsWith('temp-')).map(l => l.id);
        const toDelete = existingIds.filter(id => !newLocationIds.includes(id));

        if (toDelete.length > 0) {
          await supabase.from('locations').delete().in('id', toDelete);
        }

        for (const loc of brand.locations) {
          const locationPayload = {
            name: loc.name,
            address_line1: loc.address_line1 || null,
            address_line2: loc.address_line2 || null,
            city: loc.city || null,
            state_province: loc.state_province || null,
            postal_code: loc.postal_code || null,
            country: loc.country || 'Canada',
            phone: loc.phone || null,
          };

          if (loc.id.startsWith('temp-')) {
            await supabase.from('locations').insert({
              ...locationPayload,
              brand_id: brandId,
            });
          } else {
            await supabase.from('locations').update(locationPayload).eq('id', loc.id);
          }
        }
      } else {
        const { data: newBrand, error } = await supabase
          .from('brands')
          .insert(brandPayload)
          .select()
          .single();
        if (error) throw error;
        brandId = newBrand.id;

        if (brand.locations.length > 0) {
          const locationsPayload = brand.locations.map(loc => ({
            name: loc.name,
            address_line1: loc.address_line1 || null,
            address_line2: loc.address_line2 || null,
            city: loc.city || null,
            state_province: loc.state_province || null,
            postal_code: loc.postal_code || null,
            country: loc.country || 'Canada',
            phone: loc.phone || null,
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

  const deleteMutation = useMutation({
    mutationFn: async (brandId: string) => {
      await supabase.from('locations').delete().eq('brand_id', brandId);
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
      colors: brand.colors || defaultColors,
      locations: brand.locations || [],
    });
    setExpandedLocations(new Set());
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const addLocation = () => {
    const newId = `temp-${crypto.randomUUID()}`;
    setForm({
      ...form,
      locations: [...form.locations, { 
        id: newId, 
        name: '', 
        address_line1: '',
        address_line2: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: 'Canada',
        phone: '',
      }],
    });
    setExpandedLocations(prev => new Set([...prev, newId]));
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

  const toggleLocationExpanded = (id: string) => {
    setExpandedLocations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingBrand(null);
    setForm({ name: '', colors: defaultColors, locations: [] });
    setExpandedLocations(new Set());
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
                <SortableTableHead sortKey="name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Brand</SortableTableHead>
                
                <SortableTableHead sortKey="locations.length" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Locations</SortableTableHead>
                <TableHead>Colors</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No brands found. Create your first brand to get started.
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {b.name}
                      </div>
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
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="locations">Locations</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Brand Name *</Label>
                <Input
                  value={form.name}
                  onChange={e =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload logo</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="locations" className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Locations ({form.locations.length})</Label>
                <Button variant="outline" size="sm" onClick={addLocation}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Location
                </Button>
              </div>
              
              {form.locations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No locations added yet. Click "Add Location" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.locations.map((loc, idx) => (
                    <Card key={loc.id} className="overflow-hidden">
                      <Collapsible open={expandedLocations.has(loc.id)} onOpenChange={() => toggleLocationExpanded(loc.id)}>
                        <div className="p-3 flex items-center gap-3">
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedLocations.has(loc.id) ? 'rotate-180' : ''}`} />
                            </Button>
                          </CollapsibleTrigger>
                          <div className="flex-1 min-w-0">
                            <Input
                              placeholder="Location name"
                              value={loc.name}
                              onChange={e => updateLocation(idx, 'name', e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeLocation(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <CollapsibleContent>
                          <div className="px-3 pb-3 pt-0 space-y-3 border-t">
                            <div className="space-y-3 pt-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Address Line 1</Label>
                                <Input
                                  placeholder="123 Main St"
                                  value={loc.address_line1}
                                  onChange={e => updateLocation(idx, 'address_line1', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Address Line 2 (Optional)</Label>
                                <Input
                                  placeholder="Suite 100"
                                  value={loc.address_line2}
                                  onChange={e => updateLocation(idx, 'address_line2', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">City</Label>
                                  <Input
                                    placeholder="Toronto"
                                    value={loc.city}
                                    onChange={e => updateLocation(idx, 'city', e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">State/Province</Label>
                                  <Input
                                    placeholder="Ontario"
                                    value={loc.state_province}
                                    onChange={e => updateLocation(idx, 'state_province', e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Postal Code</Label>
                                  <Input
                                    placeholder="M5V 1A1"
                                    value={loc.postal_code}
                                    onChange={e => updateLocation(idx, 'postal_code', e.target.value)}
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Country</Label>
                                  <Select
                                    value={loc.country}
                                    onValueChange={value => updateLocation(idx, 'country', value)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Canada">Canada</SelectItem>
                                      <SelectItem value="United States">United States</SelectItem>
                                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                                      <SelectItem value="Australia">Australia</SelectItem>
                                      <SelectItem value="Germany">Germany</SelectItem>
                                      <SelectItem value="France">France</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Contact Phone</Label>
                                <Input
                                  placeholder="+1-555-123-4567"
                                  value={loc.phone}
                                  onChange={e => updateLocation(idx, 'phone', e.target.value)}
                                  className="h-8"
                                />
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="branding" className="space-y-4 py-4">
              <Label className="text-base">Brand Colors</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['topBar', 'Top Bar'],
                  ['button', 'Button'],
                  ['text', 'Text'],
                  ['buttonText', 'Button Text'],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={(form.colors as any)[key] || '#000000'}
                        onChange={e => setForm({ ...form, colors: { ...form.colors, [key]: e.target.value } })}
                        className="w-12 h-9 p-1"
                      />
                      <Input
                        value={(form.colors as any)[key] || ''}
                        onChange={e => setForm({ ...form, colors: { ...form.colors, [key]: e.target.value } })}
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
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
