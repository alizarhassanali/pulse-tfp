import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, MapPin, Loader2, Globe, Check, Clock, Plus, ChevronRight, Trash2 } from "lucide-react";
import { useBrandLocationContext } from "@/hooks/useBrandLocationContext";

// Channel metadata
interface ChannelConfigBase {
  name: string;
  description: string;
  color: string;
  available: boolean;
  idLabel?: string;
  idPlaceholder?: string;
  helpText?: string;
  helpLink?: string;
}

const CHANNEL_CONFIG: Record<string, ChannelConfigBase> = {
  google: {
    name: "Google Business",
    description: "Google Business Profile reviews",
    color: "bg-red-500",
    idLabel: "Place ID",
    idPlaceholder: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    helpText: "Find your Place ID at Google's Place ID Finder",
    helpLink: "https://developers.google.com/maps/documentation/places/web-service/place-id",
    available: true,
  },
  facebook: {
    name: "Facebook",
    description: "Facebook Page reviews",
    color: "bg-blue-600",
    available: false,
  },
  yelp: {
    name: "Yelp",
    description: "Yelp business reviews",
    color: "bg-rose-500",
    available: false,
  },
  tripadvisor: {
    name: "TripAdvisor",
    description: "TripAdvisor reviews",
    color: "bg-emerald-500",
    available: false,
  },
};

type ChannelKey = 'google' | 'facebook' | 'yelp' | 'tripadvisor';

interface ReviewChannelConfig {
  enabled?: boolean;
  sync_frequency?: string;
  notification_email?: string;
  connected_at?: string;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  google_place_id: string | null;
  review_channels_config: Record<string, ReviewChannelConfig> | null;
  brand: {
    id: string;
    name: string;
  } | null;
}

interface ConfigForm {
  enabled: boolean;
  placeId: string;
  syncFrequency: string;
  notificationEmail: string;
}

export default function ReviewSettings() {
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey | null>(null);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [configuringLocation, setConfiguringLocation] = useState<Location | null>(null);
const [configForm, setConfigForm] = useState<ConfigForm>({
    enabled: true,
    placeId: "",
    syncFrequency: "daily",
    notificationEmail: "",
  });
  const [selectedLocationForSetup, setSelectedLocationForSetup] = useState<string>("");

  const { effectiveBrandIds, effectiveLocationIds } = useBrandLocationContext();

  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations-with-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, address, google_place_id, review_channels_config, brand:brands(id, name)")
        .order("name");

      if (error) throw error;
      return (data || []) as unknown as Location[];
    },
  });

  // Filter locations based on global filters
  const filteredLocations = useMemo(() => {
    return locations?.filter((loc) => {
      if (effectiveLocationIds.length > 0) {
        return effectiveLocationIds.includes(loc.id);
      }
      if (effectiveBrandIds.length > 0 && loc.brand) {
        return effectiveBrandIds.includes(loc.brand.id);
      }
      return true;
    }) || [];
  }, [locations, effectiveLocationIds, effectiveBrandIds]);

  // Get connected integrations (channels with at least one location)
  const connectedIntegrations = useMemo(() => {
    const integrations: { channel: ChannelKey; locations: Location[] }[] = [];
    
    // Check Google
    const googleLocations = filteredLocations.filter(loc => {
      const config = loc.review_channels_config?.google;
      return config?.enabled && loc.google_place_id;
    });
    if (googleLocations.length > 0) {
      integrations.push({ channel: 'google', locations: googleLocations });
    }
    
    return integrations;
  }, [filteredLocations]);

  // Get locations for a specific channel (for manage view)
  const getChannelLocations = (channel: ChannelKey) => {
    return filteredLocations.filter(loc => {
      if (channel === 'google') {
        const config = loc.review_channels_config?.google;
        return (config?.enabled || config?.connected_at) && loc.google_place_id;
      }
      return false;
    });
  };

  // Get unconnected locations for a channel
  const getUnconnectedLocations = (channel: ChannelKey) => {
    return filteredLocations.filter(loc => {
      if (channel === 'google') {
        const config = loc.review_channels_config?.google;
        return !config?.enabled || !loc.google_place_id;
      }
      return true;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ locationId, config, placeId }: { locationId: string; config: Record<string, ReviewChannelConfig>; placeId: string }) => {
      const { error } = await supabase
        .from("locations")
        .update({
          google_place_id: placeId || null,
          review_channels_config: config as unknown as Json,
        })
        .eq("id", locationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations-with-brands"] });
      toast.success("Configuration saved");
      setConfiguringLocation(null);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleOpenLocationConfig = (location: Location) => {
    setConfiguringLocation(location);
    const googleConfig = location.review_channels_config?.google;
    setConfigForm({
      enabled: googleConfig?.enabled || true,
      placeId: location.google_place_id || "",
      syncFrequency: googleConfig?.sync_frequency || "daily",
      notificationEmail: googleConfig?.notification_email || "",
    });
  };

  const handleSaveConfig = () => {
    if (!configuringLocation || !selectedChannel) return;

    const existingConfig = configuringLocation.review_channels_config || {};
    const config = {
      ...existingConfig,
      [selectedChannel]: {
        enabled: configForm.enabled,
        sync_frequency: configForm.syncFrequency,
        notification_email: configForm.notificationEmail || undefined,
        connected_at: configForm.enabled ? new Date().toISOString() : undefined,
      },
    };

    saveMutation.mutate({
      locationId: configuringLocation.id,
      config,
      placeId: configForm.placeId,
    });
  };

  const handleDisconnectLocation = (location: Location) => {
    if (!selectedChannel) return;
    
    const existingConfig = location.review_channels_config || {};
    const config = {
      ...existingConfig,
      [selectedChannel]: {
        enabled: false,
        connected_at: undefined,
      },
    };

    saveMutation.mutate({
      locationId: location.id,
      config,
      placeId: "",
    });
  };

  const handleSelectIntegration = (channel: ChannelKey) => {
    if (!CHANNEL_CONFIG[channel].available) return;
    setSelectedChannel(channel);
    setSelectedLocationForSetup("");
  };

  const handleContinueFromDialog = () => {
    const unconnected = getUnconnectedLocations(selectedChannel!);
    const loc = unconnected.find(l => l.id === selectedLocationForSetup);
    if (loc) {
      setShowAddIntegration(false);
      handleOpenLocationConfig(loc);
      setSelectedLocationForSetup("");
    }
  };

  // Main view: show integrations or manage specific channel
  if (selectedChannel) {
    const channelConfig = CHANNEL_CONFIG[selectedChannel];
    const channelLocations = getChannelLocations(selectedChannel);
    const unconnectedLocations = getUnconnectedLocations(selectedChannel);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedChannel(null)}>
            ← Back
          </Button>
          <PageHeader
            title={`${channelConfig.name} Integration`}
            description={`Manage ${channelConfig.name} review connections`}
          />
        </div>

        {/* Connected Locations */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Connected Locations</h3>
          
          {channelLocations.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No locations connected yet</p>
                {unconnectedLocations.length > 0 && (
                  <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                    <Select 
                      value={selectedLocationForSetup}
                      onValueChange={setSelectedLocationForSetup}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {unconnectedLocations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} {loc.brand?.name && `(${loc.brand.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => {
                        const loc = unconnectedLocations.find(l => l.id === selectedLocationForSetup);
                        if (loc) {
                          handleOpenLocationConfig(loc);
                          setSelectedLocationForSetup("");
                        }
                      }}
                      disabled={!selectedLocationForSetup}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {channelLocations.map((location) => {
                const config = location.review_channels_config?.[selectedChannel];
                return (
                  <Card key={location.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${config?.enabled ? 'bg-success' : 'bg-warning'}`} />
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {location.google_place_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config?.enabled ? "default" : "outline"} className={config?.enabled ? "bg-success" : ""}>
                          {config?.enabled ? 'Active' : 'Paused'}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenLocationConfig(location)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDisconnectLocation(location)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add Another Location */}
          {unconnectedLocations.length > 0 && channelLocations.length > 0 && (
            <div className="pt-2">
              <Select onValueChange={(id) => {
                const loc = unconnectedLocations.find(l => l.id === id);
                if (loc) handleOpenLocationConfig(loc);
              }}>
                <SelectTrigger className="w-full border-dashed">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="h-4 w-4" />
                    <span>Connect Another Location</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {unconnectedLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} {loc.brand?.name && `(${loc.brand.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Location Configuration Modal */}
        <Dialog open={!!configuringLocation} onOpenChange={(open) => !open && setConfiguringLocation(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Configure {channelConfig.name}</DialogTitle>
              <DialogDescription>
                {configuringLocation?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Sync</Label>
                  <p className="text-sm text-muted-foreground">Automatically fetch new reviews</p>
                </div>
                <Switch
                  checked={configForm.enabled}
                  onCheckedChange={(checked) =>
                    setConfigForm((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="place-id">{channelConfig.idLabel} *</Label>
                <Input
                  id="place-id"
                  value={configForm.placeId}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, placeId: e.target.value }))
                  }
                  placeholder={channelConfig.idPlaceholder}
                />
                <p className="text-xs text-muted-foreground">
                  {channelConfig.helpText}{" "}
                  <a
                    href={channelConfig.helpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Learn more
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sync-frequency">Sync Frequency</Label>
                <Select
                  value={configForm.syncFrequency}
                  onValueChange={(value) =>
                    setConfigForm((prev) => ({ ...prev, syncFrequency: value }))
                  }
                >
                  <SelectTrigger id="sync-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every hour</SelectItem>
                    <SelectItem value="every_4_hours">Every 4 hours</SelectItem>
                    <SelectItem value="daily">Daily (recommended)</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-email">Notification Email (optional)</Label>
                <Input
                  id="notification-email"
                  type="email"
                  value={configForm.notificationEmail}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, notificationEmail: e.target.value }))
                  }
                  placeholder="alerts@company.com"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfiguringLocation(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} disabled={saveMutation.isPending || !configForm.placeId}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default view: show all integrations
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Review Sites"
        description="Connect review platforms to monitor customer feedback"
      />

      {/* Connected Integrations */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Your Integrations</h3>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connectedIntegrations.map(({ channel, locations }) => {
            const config = CHANNEL_CONFIG[channel];
            const activeCount = locations.filter(l => l.review_channels_config?.[channel]?.enabled).length;
            
            return (
              <Card 
                key={channel}
                className="relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedChannel(channel)}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${config.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base">{config.name}</CardTitle>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-success">
                      <Check className="h-3 w-3 mr-1" />
                      {activeCount} Active
                    </Badge>
                    {locations.length - activeCount > 0 && (
                      <Badge variant="outline" className="text-warning border-warning">
                        <Clock className="h-3 w-3 mr-1" />
                        {locations.length - activeCount} Paused
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add Integration Card */}
          <Card 
            className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setShowAddIntegration(true)}
          >
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="font-medium">Add Integration</p>
              <p className="text-sm text-muted-foreground">Connect a review platform</p>
            </CardContent>
          </Card>
        </div>

        {connectedIntegrations.length === 0 && !isLoading && (
          <EmptyState
            icon={<Globe className="h-8 w-8" />}
            title="No integrations connected"
            description="Connect a review platform to start monitoring customer feedback"
          />
        )}
      </div>

      {/* Add Integration Dialog */}
      <Dialog open={showAddIntegration} onOpenChange={(open) => {
        setShowAddIntegration(open);
        if (!open) {
          setSelectedChannel(null);
          setSelectedLocationForSetup("");
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Review Platform</DialogTitle>
            <DialogDescription>
              {selectedChannel 
                ? `Select a location to connect to ${CHANNEL_CONFIG[selectedChannel].name}`
                : "Select a platform to connect"
              }
            </DialogDescription>
          </DialogHeader>

          {!selectedChannel ? (
            <div className="grid gap-3 py-4">
              {(Object.keys(CHANNEL_CONFIG) as ChannelKey[]).map((channel) => {
                const config = CHANNEL_CONFIG[channel];
                const isConnected = connectedIntegrations.some(i => i.channel === channel);
                
                return (
                  <Card 
                    key={channel}
                    className={`relative overflow-hidden ${
                      config.available && !isConnected 
                        ? 'cursor-pointer hover:bg-muted/50' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (config.available && !isConnected) {
                        handleSelectIntegration(channel);
                      }
                    }}
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full ${config.color}`} />
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{config.name}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      {isConnected ? (
                        <Badge variant="secondary">Connected</Badge>
                      ) : config.available ? (
                        <Badge variant="outline" className="text-success border-success">Available</Badge>
                      ) : (
                        <Badge variant="secondary">Coming Soon</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Select 
                  value={selectedLocationForSetup}
                  onValueChange={setSelectedLocationForSetup}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUnconnectedLocations(selectedChannel).map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} {loc.brand?.name && `(${loc.brand.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedChannel && (
              <Button variant="outline" onClick={() => {
                setSelectedChannel(null);
                setSelectedLocationForSetup("");
              }}>
                Back
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAddIntegration(false)}>
              Cancel
            </Button>
            {selectedChannel && (
              <Button 
                onClick={handleContinueFromDialog}
                disabled={!selectedLocationForSetup}
              >
                Continue
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
