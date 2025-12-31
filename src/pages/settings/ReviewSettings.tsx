import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Settings, MapPin, Star, Loader2 } from "lucide-react";
import { useBrandLocationContext } from "@/hooks/useBrandLocationContext";

interface ReviewChannelsConfig {
  google?: {
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
      toast.success("Google Reviews configuration saved");
      setSelectedLocation(null);
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleOpenConfig = (location: Location) => {
    setSelectedLocation(location);
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

  const getLocationStatus = (location: Location) => {
    const googleConfig = location.review_channels_config?.google;
    if (!googleConfig || !location.google_place_id) {
      return { label: "Not Set Up", variant: "secondary" as const };
    }
    if (googleConfig.enabled) {
      return { label: "Active", variant: "default" as const };
    }
    return { label: "Paused", variant: "outline" as const };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Google Reviews"
        description="Configure Google Business Profile review syncing for your locations"
      />

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
                <TableHead>Status</TableHead>
                <TableHead>Place ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => {
                const { label, variant } = getLocationStatus(location);
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
                    <TableCell>
                      <Badge variant={variant}>{label}</Badge>
                    </TableCell>
                    <TableCell>
                      {location.google_place_id ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {location.google_place_id.length > 20
                            ? `${location.google_place_id.slice(0, 20)}...`
                            : location.google_place_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenConfig(location)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        {label === "Not Set Up" ? "Set Up" : "Configure"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Configuration Modal */}
      <Dialog open={!!selectedLocation} onOpenChange={(open) => !open && setSelectedLocation(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Configure Google Reviews
            </DialogTitle>
            <DialogDescription>
              {selectedLocation?.name}
              {selectedLocation?.brand?.name && ` • ${selectedLocation.brand.name}`}
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
                onCheckedChange={(checked) =>
                  setConfigForm((prev) => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="place-id">Google Place ID *</Label>
              <Input
                id="place-id"
                value={configForm.placeId}
                onChange={(e) =>
                  setConfigForm((prev) => ({ ...prev, placeId: e.target.value }))
                }
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
              />
              <p className="text-xs text-muted-foreground">
                Find your Place ID at{" "}
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLocation(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
