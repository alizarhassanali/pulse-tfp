import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContactTagsSelect } from '@/components/contacts/ContactTagsSelect';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock } from 'lucide-react';

interface EditContactModalProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditContactModal({ contactId, open, onOpenChange, onSuccess }: EditContactModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    availableBrands,
    availableLocations,
    isBrandLocked,
    isLocationLocked,
    effectiveBrandId,
    effectiveLocationId,
    getLocationsForBrand,
  } = useBrandLocationContext();
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    prefer_sms: false,
    prefer_email: true,
    brand_id: '',
    location_id: '',
    status: 'active',
    tag_ids: [] as string[],
  });

  // Fetch contact data
  const { data: contact, isLoading: loadingContact } = useQuery({
    queryKey: ['contact-edit', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!contactId && open,
  });

  // Fetch contact's current tags
  const { data: contactTags = [] } = useQuery({
    queryKey: ['contact-tags-edit', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('contact_tag_assignments')
        .select('tag_id')
        .eq('contact_id', contactId);
      if (error) throw error;
      return data?.map(d => d.tag_id) || [];
    },
    enabled: !!contactId && open,
  });

  // Get locations for the selected brand
  const locationsForBrand = formData.brand_id 
    ? getLocationsForBrand(formData.brand_id) 
    : availableLocations;

  // Initialize form data when contact loads
  useEffect(() => {
    if (contact) {
      const preferSms = contact.preferred_channel === 'sms' || contact.preferred_channel === 'both';
      const preferEmail = contact.preferred_channel === 'email' || contact.preferred_channel === 'both';
      
      // Use effective brand/location if locked, otherwise use contact's values
      const brandId = isBrandLocked && effectiveBrandId 
        ? effectiveBrandId 
        : (contact.brand_id || effectiveBrandId || '');
      const locationId = isLocationLocked && effectiveLocationId 
        ? effectiveLocationId 
        : (contact.location_id || effectiveLocationId || '');
      
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        prefer_sms: preferSms,
        prefer_email: preferEmail,
        brand_id: brandId,
        location_id: locationId,
        status: contact.status || 'active',
        tag_ids: contactTags,
      });
    }
  }, [contact, contactTags, isBrandLocked, isLocationLocked, effectiveBrandId, effectiveLocationId]);

  // Update contact mutation
  const updateContactMutation = useMutation({
    mutationFn: async () => {
      if (!contactId) throw new Error('No contact ID');
      
      let preferred_channel = 'email';
      if (formData.prefer_sms && formData.prefer_email) {
        preferred_channel = 'both';
      } else if (formData.prefer_sms) {
        preferred_channel = 'sms';
      } else if (formData.prefer_email) {
        preferred_channel = 'email';
      }

      // Update contact
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email || null,
          phone: formData.phone || null,
          preferred_channel,
          brand_id: formData.brand_id || null,
          location_id: formData.location_id || null,
          status: formData.status,
        })
        .eq('id', contactId);

      if (updateError) throw updateError;

      // Update tags - delete all and re-insert
      await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('contact_id', contactId);

      if (formData.tag_ids.length > 0) {
        const { error: tagError } = await supabase
          .from('contact_tag_assignments')
          .insert(formData.tag_ids.map(tagId => ({
            contact_id: contactId,
            tag_id: tagId,
          })));
        if (tagError) throw tagError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-detail', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-tags', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact-tag-assignments'] });
      toast({ title: 'Contact updated successfully' });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({ title: 'Error updating contact', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    if (!formData.first_name) {
      toast({ title: 'Please enter first name', variant: 'destructive' });
      return;
    }
    if (formData.prefer_sms && !formData.phone) {
      toast({ title: 'Phone is required when SMS is selected', variant: 'destructive' });
      return;
    }
    if (formData.prefer_email && !formData.email) {
      toast({ title: 'Email is required when Email is selected', variant: 'destructive' });
      return;
    }
    if (!formData.prefer_sms && !formData.prefer_email) {
      toast({ title: 'Please select at least one preferred method', variant: 'destructive' });
      return;
    }
    updateContactMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>

        {loadingContact ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1-555-0123"
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Contact Method</Label>
              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prefer_email"
                    checked={formData.prefer_email}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, prefer_email: !!checked }))}
                  />
                  <Label htmlFor="prefer_email" className="font-normal">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prefer_sms"
                    checked={formData.prefer_sms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, prefer_sms: !!checked }))}
                  />
                  <Label htmlFor="prefer_sms" className="font-normal">SMS</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                {isBrandLocked ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                    <span className="text-sm">{availableBrands.find(b => b.id === formData.brand_id)?.name || 'No brand'}</span>
                    <Lock className="h-3 w-3 opacity-50 ml-auto" />
                  </div>
                ) : (
                  <Select 
                    value={formData.brand_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, brand_id: v, location_id: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBrands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                {isLocationLocked ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                    <span className="text-sm">{locationsForBrand.find(l => l.id === formData.location_id)?.name || 'No location'}</span>
                    <Lock className="h-3 w-3 opacity-50 ml-auto" />
                  </div>
                ) : (
                  <Select 
                    value={formData.location_id} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, location_id: v }))}
                    disabled={!formData.brand_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.brand_id ? "Select location" : "Select brand first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {locationsForBrand.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <ContactTagsSelect
                selectedTags={formData.tag_ids}
                onTagsChange={(tags) => setFormData(prev => ({ ...prev, tag_ids: tags }))}
                placeholder="Select tags..."
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            className="btn-coral" 
            onClick={handleSave}
            disabled={updateContactMutation.isPending || loadingContact}
          >
            {updateContactMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
