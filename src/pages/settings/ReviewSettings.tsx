import { useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Settings, MapPin, Loader2, Globe, Check, Clock } from "lucide-react";
import { useBrandLocationContext } from "@/hooks/useBrandLocationContext";
import { REVIEW_CHANNELS, type ReviewChannel } from "@/types/database";

// Channel metadata for display
const CHANNEL_CONFIG = {
  google: {
    name: "Google",
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
    description: "Facebook Page reviews and recommendations",
    color: "bg-blue-600",
    idLabel: "Page ID",
    idPlaceholder: "123456789012345",
    helpText: "Find your Page ID in Facebook Page settings",
    helpLink: "https://www.facebook.com/help/1503421039731588",
    available: false,
  },
  yelp: {
    name: "Yelp",
    description: "Yelp business reviews",
    color: "bg-rose-500",
    idLabel: "Business ID",
    idPlaceholder: "your-business-san-francisco",
    helpText: "Your Yelp Business ID from your business URL",
    helpLink: "https://www.yelp.com/developers",
    available: false,
  },
  tripadvisor: {
    name: "TripAdvisor",
    description: "TripAdvisor reviews",
    color: "bg-emerald-500",
    idLabel: "Location ID",
    idPlaceholder: "12345678",
    helpText: "Find your Location ID in TripAdvisor Management Center",
    helpLink: "https://www.tripadvisor.com/Owners",
    available: false,
  },
} as const;

interface ReviewChannelsConfig {
  google?: {
    enabled: boolean;
    sync_frequency?: string;
    notification_email?: string;
    connected_at?: string;
  };
  facebook?: {
    enabled: boolean;
    sync_frequency?: string;
    notification_email?: string;
    connected_at?: string;
  };
  yelp?: {
    enabled: boolean;
    sync_frequency?: string;
    notification_email?: string;
    connected_at?: string;
  };
  tripadvisor?: {
    enabled: boolean;
    sync_frequency?: string;
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
  placeId: string;
  syncFrequency: string;
  notificationEmail: string;
}

export default function ReviewSettings() {
  const queryClient = useQueryClient();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewChannel>("google");
  const [configForm, setConfigForm] = useState<ConfigForm>({
    enabled: false,
    placeId: "",
    syncFrequency: "daily",
    notificationEmail: "",
  });

  const { effectiveBrandIds, effectiveLocationIds } = useBrandLocationContext();

  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations-with-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, address, google_place_id, review_channels_config, brand:brands(id, name)")
        .order("name");

      if (error) throw error;
      return data as Location[];
    },
  });

  // Filter locations based on global filters
  const filteredLocations = locations?.filter((loc) => {
    if (effectiveLocationIds.length > 0) {
      return effectiveLocationIds.includes(loc.id);
    }
    if (effectiveBrandIds.length > 0 && loc.brand) {
      return effectiveBrandIds.includes(loc.brand.id);
    }
    return true;
  });

  const saveMutation = useMutation({
    mutationFn: async ({ locationId, config, placeId }: { locationId: string; config: ReviewChannelsConfig; placeId: string }) => {
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
      toast.success("Review channel configuration saved");
      setSelectedLocation(null);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleOpenConfig = (location: Location) => {
    setSelectedLocation(location);
    setActiveTab("google");
    const googleConfig = location.review_channels_config?.google;
    setConfigForm({
      enabled: googleConfig?.enabled || false,
      placeId: location.google_place_id || "",
      syncFrequency: googleConfig?.sync_frequency || "daily",
      notificationEmail: googleConfig?.notification_email || "",
    });
  };

  const handleSave = () => {
    if (!selectedLocation) return;

    const config: ReviewChannelsConfig = {
      ...selectedLocation.review_channels_config,
      google: {
        enabled: configForm.enabled,
        sync_frequency: configForm.syncFrequency,
        notification_email: configForm.notificationEmail || undefined,
        connected_at: configForm.enabled ? new Date().toISOString() : undefined,
      },
    };

    saveMutation.mutate({
      locationId: selectedLocation.id,
      config,
      placeId: configForm.placeId,
    });
  };

  const getChannelStatus = (location: Location, channel: ReviewChannel) => {
    if (channel === "google") {
      const googleConfig = location.review_channels_config?.google;
      if (!googleConfig || !location.google_place_id) {
        return { status: "not_configured" as const, label: "—" };
      }
      if (googleConfig.enabled) {
        return { status: "active" as const, label: "Active" };
      }
      return { status: "paused" as const, label: "Paused" };
    }
    return { status: "not_available" as const, label: "—" };
  };

  // Count connected channels
  const getConnectedCount = (channel: ReviewChannel) => {
    if (!filteredLocations) return 0;
    return filteredLocations.filter(loc => {
      const status = getChannelStatus(loc, channel);
      return status.status === "active" || status.status === "paused";
    }).length;
  };

  const renderStatusBadge = (status: "active" | "paused" | "not_configured" | "not_available", label: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-success text-success-foreground"><Check className="h-3 w-3 mr-1" />{label}</Badge>;
      case "paused":
        return <Badge variant="outline" className="text-warning border-warning"><Clock className="h-3 w-3 mr-1" />{label}</Badge>;
      default:
        return <span className="text-muted-foreground">{label}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Review Sites"
        description="Connect and manage sites where customers review your business"
      />

      {/* Available Channels */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Available Channels</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {REVIEW_CHANNELS.map(({ value, label }) => {
            const config = CHANNEL_CONFIG[value as ReviewChannel];
            const connectedCount = getConnectedCount(value as ReviewChannel);
            
            return (
              <Card key={value} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${config.color}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{config.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {config.available ? (
                      <>
                        <span className="text-sm text-muted-foreground">
                          {connectedCount > 0 
                            ? `${connectedCount} location${connectedCount > 1 ? 's' : ''} connected`
                            : 'Not connected'}
                        </span>
                        <Badge variant="outline" className="text-success border-success">
                          Available
                        </Badge>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground">Integration pending</span>
                        <Badge variant="secondary">Coming Soon</Badge>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connected Review Sites Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Locations</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !filteredLocations?.length ? (
          <EmptyState
            icon={<MapPin className="h-8 w-8" />}
            title="No locations found"
            description="No locations match the current filter selection."
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${CHANNEL_CONFIG.google.color}`} />
                      Google
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${CHANNEL_CONFIG.facebook.color}`} />
                      Facebook
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${CHANNEL_CONFIG.yelp.color}`} />
                      Yelp
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${CHANNEL_CONFIG.tripadvisor.color}`} />
                      TripAdvisor
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLocations.map((location) => {
                  const googleStatus = getChannelStatus(location, "google");
                  const facebookStatus = getChannelStatus(location, "facebook");
                  const yelpStatus = getChannelStatus(location, "yelp");
                  const tripadvisorStatus = getChannelStatus(location, "tripadvisor");

                  return (
                    <TableRow key={location.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{location.name}</p>
                          {location.address && (
                            <p className="text-sm text-muted-foreground">{location.address}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{location.brand?.name || "—"}</TableCell>
                      <TableCell className="text-center">
                        {renderStatusBadge(googleStatus.status, googleStatus.label)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderStatusBadge(facebookStatus.status, facebookStatus.label)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderStatusBadge(yelpStatus.status, yelpStatus.label)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderStatusBadge(tripadvisorStatus.status, tripadvisorStatus.label)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenConfig(location)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Configuration Modal with Tabs */}
      <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Review Channels
            </DialogTitle>
            <DialogDescription>
              {selectedLocation?.name}
              {selectedLocation?.brand?.name && ` • ${selectedLocation.brand.name}`}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReviewChannel)} className="mt-2">
            <TabsList className="grid w-full grid-cols-4">
              {REVIEW_CHANNELS.map(({ value, label }) => (
                <TabsTrigger 
                  key={value} 
                  value={value}
                  disabled={!CHANNEL_CONFIG[value as ReviewChannel].available}
                  className="text-xs sm:text-sm"
                >
                  {label}
                  {!CHANNEL_CONFIG[value as ReviewChannel].available && (
                    <span className="sr-only">(Coming Soon)</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="google" className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Google Reviews</Label>
                  <p className="text-sm text-muted-foreground">Sync reviews from Google Business Profile</p>
                </div>
                <Switch
                  checked={configForm.enabled}
                  onCheckedChange={(checked) =>
                    setConfigForm((prev) => ({ ...prev, enabled: checked }))
                  }
                />
              </div>

              {configForm.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="place-id">Google Place ID *</Label>
                    <Input
                      id="place-id"
                      value={configForm.placeId}
                      onChange={(e) =>
                        setConfigForm((prev) => ({ ...prev, placeId: e.target.value }))
                      }
                      placeholder={CHANNEL_CONFIG.google.idPlaceholder}
                    />
                    <p className="text-xs text-muted-foreground">
                      {CHANNEL_CONFIG.google.helpText}{" "}
                      <a
                        href={CHANNEL_CONFIG.google.helpLink}
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
                        <SelectItem value="every_8_hours">Every 8 hours</SelectItem>
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
                    <p className="text-xs text-muted-foreground">
                      Get notified when new reviews are received
                    </p>
                  </div>
                </>
              )}
            </TabsContent>

            {/* Coming Soon Tabs */}
            {(["facebook", "yelp", "tripadvisor"] as const).map((channel) => (
              <TabsContent key={channel} value={channel} className="pt-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={`w-12 h-12 rounded-full ${CHANNEL_CONFIG[channel].color} flex items-center justify-center mb-4`}>
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">{CHANNEL_CONFIG[channel].name} Integration</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mb-4">
                    {CHANNEL_CONFIG[channel].description}. This integration is coming soon.
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLocation(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending || activeTab !== "google"}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
