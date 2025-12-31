import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Star, MapPin, Building2, Settings, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewChannelsConfig {
  google?: {
    enabled: boolean;
    sync_frequency?: 'hourly' | 'every_4_hours' | 'every_8_hours' | 'daily' | 'weekly';
    notification_email?: string;
    connected_at?: string;
  };
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  google_place_id: string | null;
  review_channels_config: ReviewChannelsConfig | null;
  brand: {
    id: string;
    name: string;
  } | null;
}

interface ConfigForm {
  enabled: boolean;
  google_place_id: string;
  sync_frequency: 'hourly' | 'every_4_hours' | 'every_8_hours' | 'daily' | 'weekly';
  notification_email: string;
}

const defaultConfig: ConfigForm = {
  enabled: false,
  google_place_id: '',
  sync_frequency: 'daily',
  notification_email: '',
};

export default function ReviewSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [configForm, setConfigForm] = useState<ConfigForm>(defaultConfig);
  const [brandFilter, setBrandFilter] = useState<string>('all');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations-with-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, google_place_id, review_channels_config, brand:brands(id, name)')
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands-simple'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ locationId, config, placeId }: { locationId: string; config: ReviewChannelsConfig; placeId: string }) => {
      const { error } = await supabase
        .from('locations')
        .update({
          google_place_id: placeId || null,
          review_channels_config: config as unknown as Json,
        })
        .eq('id', locationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations-with-brands'] });
      toast({ title: 'Review settings updated' });
      setSelectedLocation(null);
    },
    onError: (error) => {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    },
  });

  const handleOpenConfig = (location: Location) => {
    const googleConfig = location.review_channels_config?.google;
    setConfigForm({
      enabled: googleConfig?.enabled || false,
      google_place_id: location.google_place_id || '',
      sync_frequency: googleConfig?.sync_frequency || 'daily',
      notification_email: googleConfig?.notification_email || '',
    });
    setSelectedLocation(location);
  };

  const handleSave = () => {
    if (!selectedLocation) return;
    
    const config: ReviewChannelsConfig = {
      google: {
        enabled: configForm.enabled,
        sync_frequency: configForm.sync_frequency,
        notification_email: configForm.notification_email || undefined,
        connected_at: configForm.enabled ? new Date().toISOString() : undefined,
      },
    };

    saveMutation.mutate({
      locationId: selectedLocation.id,
      config,
      placeId: configForm.google_place_id,
    });
  };

  const getLocationStatus = (location: Location) => {
    const googleConfig = location.review_channels_config?.google;
    
    if (!location.google_place_id && !googleConfig?.enabled) {
      return { status: 'not_configured', label: 'Not Set Up', variant: 'secondary' as const };
    }
    if (googleConfig?.enabled) {
      return { status: 'active', label: 'Active', variant: 'default' as const };
    }
    return { status: 'paused', label: 'Paused', variant: 'outline' as const };
  };

  const filteredLocations = brandFilter === 'all' 
    ? locations 
    : locations.filter(l => l.brand?.id === brandFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reviews Settings"
        description="Configure review channels for each location"
      />

      <div className="flex items-center gap-4">
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-24 w-64" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No locations found</h3>
            <p className="text-muted-foreground">
              {brandFilter === 'all' 
                ? 'Add locations in Brands settings to configure reviews.'
                : 'No locations for this brand.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredLocations.map(location => {
            const status = getLocationStatus(location);
            const googleConfig = location.review_channels_config?.google;
            
            return (
              <Card key={location.id} className="shadow-soft border-border/50 hover:border-border transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    {/* Location Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium">{location.name}</h3>
                      </div>
                      {location.brand && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {location.brand.name}
                        </div>
                      )}
                      {location.address && (
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                      )}
                    </div>

                    {/* Google Reviews Status */}
                    <div className="bg-muted/50 rounded-lg p-4 min-w-[280px]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-sm">Google Reviews</span>
                        </div>
                        <Badge variant={status.variant}>
                          {status.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {status.status === 'paused' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {status.label}
                        </Badge>
                      </div>

                      {status.status === 'active' ? (
                        <div className="space-y-1 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Syncs {googleConfig?.sync_frequency?.replace('_', ' ')}
                          </div>
                          {location.google_place_id && (
                            <div className="font-mono truncate">
                              ID: {location.google_place_id.substring(0, 20)}...
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mb-3">
                          {status.status === 'paused' 
                            ? 'Google reviews sync is paused'
                            : 'Configure to start syncing reviews'}
                        </p>
                      )}

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleOpenConfig(location)}
                      >
                        <Settings className="h-3.5 w-3.5 mr-2" />
                        {status.status === 'not_configured' ? 'Set Up' : 'Configure'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Configuration Modal */}
      <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Configure Google Reviews
            </DialogTitle>
            <DialogDescription>
              {selectedLocation?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Enable Google Reviews</Label>
                <p className="text-sm text-muted-foreground">Sync reviews from Google</p>
              </div>
              <Switch
                checked={configForm.enabled}
                onCheckedChange={enabled => setConfigForm({ ...configForm, enabled })}
              />
            </div>

            <div className="space-y-2">
              <Label>Google Place ID *</Label>
              <Input
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={configForm.google_place_id}
                onChange={e => setConfigForm({ ...configForm, google_place_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Find your Place ID at{' '}
                <a 
                  href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google's Place ID Finder
                </a>
              </p>
            </div>

            {configForm.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Sync Frequency</Label>
                  <Select
                    value={configForm.sync_frequency}
                    onValueChange={value => setConfigForm({ ...configForm, sync_frequency: value as ConfigForm['sync_frequency'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every hour</SelectItem>
                      <SelectItem value="every_4_hours">Every 4 hours</SelectItem>
                      <SelectItem value="every_8_hours">Every 8 hours</SelectItem>
                      <SelectItem value="daily">Daily (recommended)</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notification Email (optional)</Label>
                  <Input
                    type="email"
                    placeholder="alerts@company.com"
                    value={configForm.notification_email}
                    onChange={e => setConfigForm({ ...configForm, notification_email: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get notified when new reviews are received
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLocation(null)}>
              Cancel
            </Button>
            <Button className="btn-coral" onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
