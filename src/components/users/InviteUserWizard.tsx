import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronRight, Shield, Building2, MapPin } from 'lucide-react';
import {
  AppRole,
  AppSection,
  PermissionLevel,
  ROLE_CONFIG,
  CustomRole,
} from '@/types/permissions';

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
    name: string | null;
    role: AppRole;
    custom_role_id?: string | null;
    brands: string[];
    locations: string[];
  } | null;
}

type RoleSelection = { type: 'builtin'; role: AppRole } | { type: 'custom'; roleId: string };

export function InviteUserWizard({
  open,
  onOpenChange,
  onSuccess,
  editingUser,
}: InviteUserWizardProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [roleSelection, setRoleSelection] = useState<RoleSelection>({ type: 'builtin', role: 'staff' });
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Record<string, string[]>>({});

  // Data state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if this is a single-brand account
  const isSingleBrand = brands.length === 1;
  const isSuperAdmin = roleSelection.type === 'builtin' && roleSelection.role === 'super_admin';
  const needsBrandStep = !isSuperAdmin && brands.length > 1;
  const totalSteps = needsBrandStep ? 2 : 1;

  // Fetch data on open
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  // Initialize form when editing
  useEffect(() => {
    if (editingUser) {
      setEmail(editingUser.email);
      setName(editingUser.name || '');
      
      if (editingUser.custom_role_id) {
        setRoleSelection({ type: 'custom', roleId: editingUser.custom_role_id });
      } else {
        setRoleSelection({ type: 'builtin', role: editingUser.role });
      }
      
      setSelectedBrands(editingUser.brands);
      
      // Group locations by brand
      const locsByBrand: Record<string, string[]> = {};
      editingUser.locations.forEach(locId => {
        const loc = locations.find(l => l.id === locId);
        if (loc) {
          if (!locsByBrand[loc.brand_id]) locsByBrand[loc.brand_id] = [];
          locsByBrand[loc.brand_id].push(locId);
        }
      });
      setSelectedLocations(locsByBrand);
    } else {
      resetForm();
    }
  }, [editingUser, locations]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [brandsRes, locsRes, rolesRes] = await Promise.all([
        supabase.from('brands').select('id, name').order('name'),
        supabase.from('locations').select('id, name, brand_id').order('name'),
        supabase.from('custom_roles').select('*').order('name'),
      ]);

      if (brandsRes.error) throw brandsRes.error;
      if (locsRes.error) throw locsRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setBrands(brandsRes.data || []);
      setLocations(locsRes.data || []);
      setCustomRoles(
        (rolesRes.data || []).map(r => ({
          ...r,
          permissions: r.permissions as Record<AppSection, PermissionLevel>,
        }))
      );

      // Auto-select single brand for non-super-admin
      if (brandsRes.data?.length === 1 && !editingUser) {
        const brandId = brandsRes.data[0].id;
        setSelectedBrands([brandId]);
        // Auto-select all locations for single brand
        const brandLocs = locsRes.data?.filter(l => l.brand_id === brandId).map(l => l.id) || [];
        setSelectedLocations({ [brandId]: brandLocs });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setEmail('');
    setName('');
    setRoleSelection({ type: 'builtin', role: 'staff' });
    setSelectedBrands([]);
    setSelectedLocations({});
  };

  const handleBrandToggle = (brandId: string, checked: boolean) => {
    if (checked) {
      setSelectedBrands(prev => [...prev, brandId]);
      // Auto-select all locations for this brand
      const brandLocs = locations.filter(l => l.brand_id === brandId).map(l => l.id);
      setSelectedLocations(prev => ({ ...prev, [brandId]: brandLocs }));
    } else {
      setSelectedBrands(prev => prev.filter(id => id !== brandId));
      setSelectedLocations(prev => {
        const updated = { ...prev };
        delete updated[brandId];
        return updated;
      });
    }
  };

  const handleLocationToggle = (brandId: string, locationId: string, checked: boolean) => {
    setSelectedLocations(prev => {
      const brandLocs = prev[brandId] || [];
      if (checked) {
        return { ...prev, [brandId]: [...brandLocs, locationId] };
      } else {
        return { ...prev, [brandId]: brandLocs.filter(id => id !== locationId) };
      }
    });
  };

  const canProceed = (): boolean => {
    if (currentStep === 0) {
      if (!editingUser && !email.trim()) return false;
      return true;
    }
    if (currentStep === 1) {
      return selectedBrands.length > 0;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const builtinRole = roleSelection.type === 'builtin' ? roleSelection.role : 'staff';
      const customRoleId = roleSelection.type === 'custom' ? roleSelection.roleId : null;

      if (editingUser) {
        // Update existing user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: builtinRole, custom_role_id: customRoleId })
          .eq('user_id', editingUser.user_id);

        if (roleError) throw roleError;

        // Update brand access
        await supabase.from('user_brand_access').delete().eq('user_id', editingUser.user_id);
        if (selectedBrands.length > 0 && !isSuperAdmin) {
          const brandAccess = selectedBrands.map(brandId => ({
            user_id: editingUser.user_id,
            brand_id: brandId,
          }));
          const { error: brandError } = await supabase.from('user_brand_access').insert(brandAccess);
          if (brandError) throw brandError;
        }

        // Update location access
        await supabase.from('user_location_access').delete().eq('user_id', editingUser.user_id);
        const allLocationIds = Object.values(selectedLocations).flat();
        if (allLocationIds.length > 0 && !isSuperAdmin) {
          const locationAccess = allLocationIds.map(locationId => ({
            user_id: editingUser.user_id,
            location_id: locationId,
          }));
          const { error: locError } = await supabase.from('user_location_access').insert(locationAccess);
          if (locError) throw locError;
        }

        toast.success('User updated successfully');
      } else {
        // Invite new user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password: crypto.randomUUID(),
          options: {
            data: { name: name.trim() },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        const userId = authData.user.id;

        // Set role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: builtinRole, custom_role_id: customRoleId })
          .eq('user_id', userId);

        if (roleError) throw roleError;

        // Set brand access
        if (selectedBrands.length > 0 && !isSuperAdmin) {
          const brandAccess = selectedBrands.map(brandId => ({
            user_id: userId,
            brand_id: brandId,
          }));
          const { error: brandError } = await supabase.from('user_brand_access').insert(brandAccess);
          if (brandError) throw brandError;
        }

        // Set location access
        const allLocationIds = Object.values(selectedLocations).flat();
        if (allLocationIds.length > 0 && !isSuperAdmin) {
          const locationAccess = allLocationIds.map(locationId => ({
            user_id: userId,
            location_id: locationId,
          }));
          const { error: locError } = await supabase.from('user_location_access').insert(locationAccess);
          if (locError) throw locError;
        }

        toast.success('Invitation sent successfully');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLocationsByBrand = (brandId: string) => {
    return locations.filter(l => l.brand_id === brandId);
  };

  const getRoleDisplayName = (): string => {
    if (roleSelection.type === 'builtin') {
      return ROLE_CONFIG[roleSelection.role].label;
    }
    const customRole = customRoles.find(r => r.id === roleSelection.roleId);
    return customRole?.name || 'Custom Role';
  };

  // Render Step 1: User Info + Role
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* User Info */}
      {!editingUser && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
        </div>
      )}

      {editingUser && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
          <div>
            <p className="font-medium">{editingUser.name || editingUser.email}</p>
            <p className="text-sm text-muted-foreground">{editingUser.email}</p>
          </div>
        </div>
      )}

      <Separator />

      {/* Role Selection */}
      <div className="space-y-4">
        <Label>Role</Label>
        <RadioGroup
          value={
            roleSelection.type === 'builtin'
              ? roleSelection.role
              : `custom:${roleSelection.roleId}`
          }
          onValueChange={value => {
            if (value.startsWith('custom:')) {
              setRoleSelection({ type: 'custom', roleId: value.replace('custom:', '') });
            } else {
              setRoleSelection({ type: 'builtin', role: value as AppRole });
            }
          }}
        >
          {/* Built-in roles */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Built-in Roles</p>
            {(Object.entries(ROLE_CONFIG) as [AppRole, typeof ROLE_CONFIG[AppRole]][]).map(
              ([roleKey, config]) => (
                <div
                  key={roleKey}
                  className="flex items-center space-x-3 p-3 rounded-md border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setRoleSelection({ type: 'builtin', role: roleKey })}
                >
                  <RadioGroupItem value={roleKey} id={roleKey} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={roleKey} className="cursor-pointer font-medium">
                        {config.label}
                      </Label>
                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Custom roles */}
          {customRoles.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm text-muted-foreground">Custom Roles</p>
              {customRoles.map(role => (
                <div
                  key={role.id}
                  className="flex items-center space-x-3 p-3 rounded-md border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setRoleSelection({ type: 'custom', roleId: role.id })}
                >
                  <RadioGroupItem value={`custom:${role.id}`} id={role.id} />
                  <div className="flex-1">
                    <Label htmlFor={role.id} className="cursor-pointer font-medium">
                      {role.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {role.description || 'Custom role with specific permissions'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RadioGroup>
      </div>

      {/* Summary for single-brand */}
      {isSingleBrand && !isSuperAdmin && brands[0] && (
        <div className="p-3 bg-muted/50 rounded-md space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>Access to: <strong>{brands[0].name}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>All locations ({locations.length})</span>
          </div>
        </div>
      )}
    </div>
  );

  // Render Step 2: Brand & Location Access
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          Role: <strong>{getRoleDisplayName()}</strong>
        </span>
      </div>

      <div className="space-y-4">
        <Label>Select Brand & Location Access</Label>
        {brands.map(brand => {
          const brandLocs = getLocationsByBrand(brand.id);
          const isSelected = selectedBrands.includes(brand.id);
          const selectedLocs = selectedLocations[brand.id] || [];

          return (
            <div key={brand.id} className="border rounded-md p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`brand-${brand.id}`}
                  checked={isSelected}
                  onCheckedChange={checked => handleBrandToggle(brand.id, !!checked)}
                />
                <Label htmlFor={`brand-${brand.id}`} className="cursor-pointer font-medium">
                  {brand.name}
                </Label>
                {isSelected && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedLocs.length} / {brandLocs.length} locations
                  </Badge>
                )}
              </div>

              {isSelected && brandLocs.length > 0 && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`all-locs-${brand.id}`}
                      checked={selectedLocs.length === brandLocs.length}
                      onCheckedChange={checked => {
                        if (checked) {
                          setSelectedLocations(prev => ({
                            ...prev,
                            [brand.id]: brandLocs.map(l => l.id),
                          }));
                        } else {
                          setSelectedLocations(prev => ({ ...prev, [brand.id]: [] }));
                        }
                      }}
                    />
                    <Label htmlFor={`all-locs-${brand.id}`} className="text-sm cursor-pointer">
                      All locations
                    </Label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {brandLocs.map(loc => (
                      <div key={loc.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`loc-${loc.id}`}
                          checked={selectedLocs.includes(loc.id)}
                          onCheckedChange={checked =>
                            handleLocationToggle(brand.id, loc.id, !!checked)
                          }
                        />
                        <Label htmlFor={`loc-${loc.id}`} className="text-sm cursor-pointer">
                          {loc.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        onOpenChange(open);
        if (!open) resetForm();
      }}
    >
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit User' : 'Invite User'}</DialogTitle>
          <DialogDescription>
            {currentStep === 0
              ? 'Enter user details and select a role'
              : 'Select which brands and locations they can access'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            {totalSteps > 1 && (
              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= currentStep ? 'bg-secondary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}

            {currentStep === 0 && renderStep1()}
            {currentStep === 1 && renderStep2()}
          </>
        )}

        <DialogFooter className="mt-6">
          {currentStep > 0 && (
            <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {currentStep < totalSteps - 1 ? (
            <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
              {isSubmitting
                ? 'Saving...'
                : editingUser
                ? 'Save Changes'
                : 'Send Invitation'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
