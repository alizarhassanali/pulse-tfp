import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, Eye, Mail, ChevronRight, ChevronLeft, Check, Building2, MapPin } from 'lucide-react';
import { 
  AppRole, 
  AppSection, 
  PermissionLevel, 
  DEFAULT_PERMISSIONS, 
  SECTION_CONFIG, 
  ROLE_CONFIG 
} from '@/types/permissions';
import { cn } from '@/lib/utils';

interface Brand {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
  brand_id: string;
}

interface InviteUserWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingUser?: {
    id: string;
    user_id: string;
    email: string;
    name: string;
    role: AppRole;
    brands: string[];
    locations: string[];
    permissions: Record<AppSection, PermissionLevel>;
  } | null;
}

const STEPS = ['Basic Info', 'Brand & Location', 'Permissions', 'Review'];

export function InviteUserWizard({ open, onOpenChange, onSuccess, editingUser }: InviteUserWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole>('staff');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string[]>>({});
  const [permissions, setPermissions] = useState<Record<AppSection, PermissionLevel>>(
    DEFAULT_PERMISSIONS.staff
  );

  // Data
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch brands and locations
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [brandsRes, locationsRes] = await Promise.all([
        supabase.from('brands').select('id, name').order('name'),
        supabase.from('locations').select('id, name, brand_id').order('name'),
      ]);
      
      if (brandsRes.data) setBrands(brandsRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
      setLoading(false);
    }
    
    if (open) fetchData();
  }, [open]);

  // Initialize form when editing
  useEffect(() => {
    if (editingUser) {
      setEmail(editingUser.email);
      setName(editingUser.name || '');
      setRole(editingUser.role);
      setSelectedBrands(editingUser.brands);
      // Convert locations array to Record<brandId, locationIds[]>
      const locsByBrand: Record<string, string[]> = {};
      editingUser.brands.forEach(brandId => {
        locsByBrand[brandId] = editingUser.locations.filter(locId => {
          const loc = locations.find(l => l.id === locId);
          return loc?.brand_id === brandId;
        });
      });
      setSelectedLocations(locsByBrand);
      setPermissions(editingUser.permissions);
    } else {
      resetForm();
    }
  }, [editingUser, locations, open]);

  // Update permissions when role changes
  useEffect(() => {
    if (!editingUser) {
      setPermissions(DEFAULT_PERMISSIONS[role]);
    }
  }, [role, editingUser]);

  const resetForm = () => {
    setCurrentStep(0);
    setEmail('');
    setName('');
    setRole('staff');
    setSelectedBrands([]);
    setSelectedLocations({});
    setPermissions(DEFAULT_PERMISSIONS.staff);
  };

  const handleBrandToggle = (brandId: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands([...selectedBrands, brandId]);
      setSelectedLocations({ ...selectedLocations, [brandId]: [] });
    } else {
      setSelectedBrands(selectedBrands.filter(id => id !== brandId));
      const newLocs = { ...selectedLocations };
      delete newLocs[brandId];
      setSelectedLocations(newLocs);
    }
  };

  const handleLocationToggle = (brandId: string, locationId: string, checked: boolean) => {
    const current = selectedLocations[brandId] || [];
    if (checked) {
      setSelectedLocations({ ...selectedLocations, [brandId]: [...current, locationId] });
    } else {
      setSelectedLocations({ ...selectedLocations, [brandId]: current.filter(id => id !== locationId) });
    }
  };

  const handleAllLocationsToggle = (brandId: string, checked: boolean) => {
    if (checked) {
      const brandLocs = locations.filter(l => l.brand_id === brandId).map(l => l.id);
      setSelectedLocations({ ...selectedLocations, [brandId]: brandLocs });
    } else {
      setSelectedLocations({ ...selectedLocations, [brandId]: [] });
    }
  };

  const handlePermissionChange = (section: AppSection, permission: PermissionLevel) => {
    setPermissions({ ...permissions, [section]: permission });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return email.trim() !== '' && role !== undefined;
      case 1:
        return role === 'super_admin' || selectedBrands.length > 0;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        // Update existing user
        // Update role
        await supabase
          .from('user_roles')
          .upsert({ user_id: editingUser.user_id, role }, { onConflict: 'user_id' });

        // Update brand access
        await supabase
          .from('user_brand_access')
          .delete()
          .eq('user_id', editingUser.user_id);

        if (selectedBrands.length > 0) {
          await supabase
            .from('user_brand_access')
            .insert(selectedBrands.map(brand_id => ({ user_id: editingUser.user_id, brand_id })));
        }

        // Update location access
        await supabase
          .from('user_location_access')
          .delete()
          .eq('user_id', editingUser.user_id);

        const allLocations = Object.values(selectedLocations).flat();
        if (allLocations.length > 0) {
          await supabase
            .from('user_location_access')
            .insert(allLocations.map(location_id => ({ user_id: editingUser.user_id, location_id })));
        }

        // Update permissions
        await (supabase
          .from('user_section_permissions' as any)
          .delete()
          .eq('user_id', editingUser.user_id) as any);

        const permEntries = Object.entries(permissions)
          .filter(([, perm]) => perm !== 'no_access')
          .map(([section, permission]) => ({
            user_id: editingUser.user_id,
            section: section as AppSection,
            permission,
          }));

        if (permEntries.length > 0) {
          await (supabase.from('user_section_permissions' as any).insert(permEntries) as any);
        }

        toast({ title: 'User updated', description: 'User permissions have been updated successfully.' });
      } else {
        // Invite new user via Supabase Auth
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: { name, invited_role: role },
        });

        if (inviteError) {
          // If admin invite fails, show manual invitation message
          toast({
            title: 'Invitation prepared',
            description: `Please ask ${email} to sign up. They will be assigned the ${ROLE_CONFIG[role].label} role.`,
          });
        } else if (inviteData.user) {
          const userId = inviteData.user.id;

          // Set role
          await supabase.from('user_roles').insert({ user_id: userId, role });

          // Set brand access
          if (selectedBrands.length > 0) {
            await supabase
              .from('user_brand_access')
              .insert(selectedBrands.map(brand_id => ({ user_id: userId, brand_id })));
          }

          // Set location access
          const allLocations = Object.values(selectedLocations).flat();
          if (allLocations.length > 0) {
            await supabase
              .from('user_location_access')
              .insert(allLocations.map(location_id => ({ user_id: userId, location_id })));
          }

          // Set permissions
          const permEntries = Object.entries(permissions)
            .filter(([, perm]) => perm !== 'no_access')
            .map(([section, permission]) => ({
              user_id: userId,
              section: section as AppSection,
              permission,
            }));

          if (permEntries.length > 0) {
            await (supabase.from('user_section_permissions' as any).insert(permEntries) as any);
          }

          toast({ title: 'Invitation sent', description: `An invitation has been sent to ${email}` });
        }
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', description: 'Failed to save user. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocationsByBrand = (brandId: string) => locations.filter(l => l.brand_id === brandId);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <div className="grid gap-2">
                {(Object.keys(ROLE_CONFIG) as AppRole[]).map(r => (
                  <Card
                    key={r}
                    className={cn(
                      'cursor-pointer transition-all',
                      role === r ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    )}
                    onClick={() => setRole(r)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={cn('w-2 h-2 rounded-full', ROLE_CONFIG[r].color)} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ROLE_CONFIG[r].label}</p>
                        <p className="text-xs text-muted-foreground">{ROLE_CONFIG[r].description}</p>
                      </div>
                      {role === r && <Check className="h-4 w-4 text-primary" />}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        if (role === 'super_admin') {
          return (
            <div className="py-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Full Access</h3>
              <p className="text-muted-foreground">
                Super Admins have access to all brands and locations automatically.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Select Brands
              </Label>
              <div className="space-y-2">
                {brands.map(brand => {
                  const isSelected = selectedBrands.includes(brand.id);
                  const brandLocations = getLocationsByBrand(brand.id);
                  const selectedLocs = selectedLocations[brand.id] || [];
                  const allSelected = brandLocations.length > 0 && selectedLocs.length === brandLocations.length;

                  return (
                    <Card key={brand.id} className={cn(isSelected && 'ring-1 ring-primary')}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={checked => handleBrandToggle(brand.id, !!checked)}
                          />
                          <span className="font-medium">{brand.name}</span>
                        </div>
                        
                        {isSelected && brandLocations.length > 0 && (
                          <div className="mt-3 pl-6 space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={checked => handleAllLocationsToggle(brand.id, !!checked)}
                              />
                              <span className="text-sm text-muted-foreground">All locations</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {brandLocations.map(loc => (
                                <div key={loc.id} className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedLocs.includes(loc.id)}
                                    onCheckedChange={checked => handleLocationToggle(brand.id, loc.id, !!checked)}
                                  />
                                  <span className="text-sm">{loc.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        if (role === 'super_admin') {
          return (
            <div className="py-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Full Permissions</h3>
              <p className="text-muted-foreground">
                Super Admins have full access to all sections.
              </p>
            </div>
          );
        }

        const groupedSections = Object.entries(SECTION_CONFIG).reduce((acc, [section, config]) => {
          if (!acc[config.group]) acc[config.group] = [];
          acc[config.group].push({ section: section as AppSection, ...config });
          return acc;
        }, {} as Record<string, { section: AppSection; label: string; group: string; supportsRespond?: boolean }[]>);

        return (
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {Object.entries(groupedSections).map(([group, sections]) => (
              <div key={group}>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">{group}</h4>
                <div className="space-y-2">
                  {sections.map(({ section, label, supportsRespond }) => (
                    <div key={section} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-sm">{label}</span>
                      <Select
                        value={permissions[section]}
                        onValueChange={v => handlePermissionChange(section, v as PermissionLevel)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_access">No Access</SelectItem>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                          {supportsRespond && <SelectItem value="respond">Respond</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 3:
        const allLocs = Object.values(selectedLocations).flat();
        
        return (
          <div className="space-y-4 py-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{email}</span>
                </div>
                {name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge className={ROLE_CONFIG[role].color}>{ROLE_CONFIG[role].label}</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Brands</span>
                  <div className="text-right">
                    {role === 'super_admin' ? (
                      <span className="text-sm">All brands</span>
                    ) : selectedBrands.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {selectedBrands.map(bid => {
                          const brand = brands.find(b => b.id === bid);
                          return brand ? (
                            <Badge key={bid} variant="outline" className="text-xs">
                              {brand.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Locations</span>
                  <div className="text-right">
                    {role === 'super_admin' ? (
                      <span className="text-sm">All locations</span>
                    ) : allLocs.length > 0 ? (
                      <span className="text-sm">{allLocs.length} location(s)</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">All in selected brands</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-muted-foreground">
              <h4 className="font-medium text-foreground mb-2">Permissions Summary</h4>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(permissions) as [AppSection, PermissionLevel][])
                  .filter(([, perm]) => perm !== 'no_access')
                  .map(([section, perm]) => (
                    <div key={section} className="flex items-center justify-between text-xs p-1 bg-muted/30 rounded">
                      <span>{SECTION_CONFIG[section]?.label || section}</span>
                      <Badge variant="outline" className="text-xs">{perm}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Invite User'}</DialogTitle>
          <DialogDescription>
            {editingUser ? 'Update user role, scope, and permissions.' : 'Send an invitation with role and permissions.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : i === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('w-12 h-0.5 mx-1', i < currentStep ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">{STEPS[currentStep]}</p>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          renderStepContent()
        )}

        <DialogFooter className="gap-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="btn-coral">
              {isSubmitting ? 'Saving...' : editingUser ? 'Save Changes' : 'Send Invitation'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
