import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  Zap,
  FileText,
  Mail,
  MessageSquare,
} from 'lucide-react';

interface OttoOnboardCardProps {
  eventId: string;
  brandId?: string;
  eventLocations: Array<{ id: string; name: string }>;
  // CNP state
  cnpEnabled: boolean;
  setCnpEnabled: (v: boolean) => void;
  cnpSelectedTriggers: string[];
  setCnpSelectedTriggers: (v: string[]) => void;
  cnpSelectedLocations: string[];
  setCnpSelectedLocations: (v: string[]) => void;
  cnpEventType: string;
  setCnpEventType: (v: string) => void;
  // Template state
  cnpEmailSubject: string;
  setCnpEmailSubject: (v: string) => void;
  cnpEmailBody: string;
  setCnpEmailBody: (v: string) => void;
  cnpSmsBody: string;
  setCnpSmsBody: (v: string) => void;
  // Actions
  onSave: () => void;
  onCancel: () => void;
  savePending: boolean;
}

export function OttoOnboardCard(props: OttoOnboardCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch CNP triggers from database
  const { data: cnpTriggers = [] } = useQuery({
    queryKey: ['cnp-triggers', props.brandId],
    queryFn: async () => {
      if (!props.brandId) return [];
      const { data, error } = await supabase
        .from('cnp_triggers')
        .select('id, name, description')
        .eq('brand_id', props.brandId)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!props.brandId,
  });

  const toggleTrigger = (triggerId: string) => {
    props.setCnpSelectedTriggers(
      props.cnpSelectedTriggers.includes(triggerId)
        ? props.cnpSelectedTriggers.filter(t => t !== triggerId)
        : [...props.cnpSelectedTriggers, triggerId]
    );
  };

  const toggleLocation = (locationId: string) => {
    props.setCnpSelectedLocations(
      props.cnpSelectedLocations.includes(locationId)
        ? props.cnpSelectedLocations.filter(l => l !== locationId)
        : [...props.cnpSelectedLocations, locationId]
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "shadow-soft transition-all duration-200",
        props.cnpEnabled ? "border-l-4 border-l-success border-border/50" : "border-l-4 border-l-muted border-border/50"
      )}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center",
                  props.cnpEnabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                )}>
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Otto Onboard</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Enable this to automatically trigger survey invitations from Otto Onboard system events
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={props.cnpEnabled ? "default" : "outline"} className={cn(
                  "text-xs",
                  props.cnpEnabled && "bg-success/10 text-success border-success/30"
                )}>
                  {props.cnpEnabled
                    ? `${props.cnpSelectedTriggers.length} trigger${props.cnpSelectedTriggers.length !== 1 ? 's' : ''}`
                    : 'Disabled'}
                </Badge>
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium text-sm">Connect this event with Otto Onboard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enable this to automatically trigger survey invitations from Otto Onboard system events
                </p>
              </div>
              <Switch
                checked={props.cnpEnabled}
                onCheckedChange={props.setCnpEnabled}
              />
            </div>

            {props.cnpEnabled && (
              <>
                {/* Select Triggers */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">
                      Select Triggers <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose which Otto Onboard events will trigger this survey invitation
                    </p>
                  </div>
                  <div className="space-y-2">
                    {cnpTriggers.length > 0 ? (
                      cnpTriggers.map((trigger: { id: string; name: string; description: string | null }) => (
                        <label
                          key={trigger.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            props.cnpSelectedTriggers.includes(trigger.id)
                              ? "border-primary/50 bg-primary/5"
                              : "border-border hover:bg-muted/30"
                          )}
                        >
                          <Checkbox
                            checked={props.cnpSelectedTriggers.includes(trigger.id)}
                            onCheckedChange={() => toggleTrigger(trigger.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {trigger.name}
                              </Badge>
                              {trigger.description && (
                                <span className="text-xs text-muted-foreground">{trigger.description}</span>
                              )}
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
                        No Otto Onboard triggers configured for this brand. Contact your administrator to set up trigger events.
                      </div>
                    )}
                  </div>
                </div>

                {/* Select Locations */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">
                      Select Locations <span className="text-destructive">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Choose which locations will send survey invitations for this event
                    </p>
                  </div>
                  <div className="space-y-2">
                    {props.eventLocations.length > 0 ? (
                      props.eventLocations.map((location) => (
                        <label
                          key={location.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            props.cnpSelectedLocations.includes(location.id)
                              ? "border-primary/50 bg-primary/5"
                              : "border-border hover:bg-muted/30"
                          )}
                        >
                          <Checkbox
                            checked={props.cnpSelectedLocations.includes(location.id)}
                            onCheckedChange={() => toggleLocation(location.id)}
                          />
                          <span className="text-sm">{location.name}</span>
                        </label>
                      ))
                    ) : (
                      <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
                        No locations configured for this event. Add locations in Event Setup.
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Event Type</Label>
                  <p className="text-xs text-muted-foreground">
                    The type of appointments that will trigger this survey
                  </p>
                  <Select value={props.cnpEventType} onValueChange={props.setCnpEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both (Onsite & Virtual)</SelectItem>
                      <SelectItem value="onsite">Onsite Only</SelectItem>
                      <SelectItem value="virtual">Virtual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Compose Message */}
                <div className="border-t pt-6 space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Compose Message
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Customize the email and SMS that will be sent automatically when triggered by Otto Onboard
                    </p>
                  </div>

                  {/* Email Content */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email Content
                    </h5>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Subject Line</Label>
                      <Input
                        value={props.cnpEmailSubject}
                        onChange={(e) => props.setCnpEmailSubject(e.target.value)}
                        placeholder="We'd appreciate your feedback"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Email Body</Label>
                      <Textarea
                        value={props.cnpEmailBody}
                        onChange={(e) => props.setCnpEmailBody(e.target.value)}
                        className="min-h-[180px] font-mono text-sm"
                        placeholder="Hi {first_name},&#10;&#10;Thank you for visiting {brand_name}..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Variables: <code className="bg-muted px-1 rounded">{'{first_name}'}</code>{' '}
                        <code className="bg-muted px-1 rounded">{'{last_name}'}</code>{' '}
                        <code className="bg-muted px-1 rounded">{'{location_name}'}</code>{' '}
                        <code className="bg-muted px-1 rounded">{'{brand_name}'}</code>{' '}
                        <code className="bg-muted px-1 rounded">{'{survey_link}'}</code>{' '}
                        <code className="bg-muted px-1 rounded">{'{unsubscribe_link}'}</code>
                      </p>
                    </div>
                  </div>

                  {/* SMS Content */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      SMS Content
                    </h5>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Message</Label>
                      <Textarea
                        value={props.cnpSmsBody}
                        onChange={(e) => props.setCnpSmsBody(e.target.value)}
                        className="min-h-[100px] font-mono text-sm"
                        placeholder="Hi {first_name}, Thank you for your recent visit..."
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Variables: <code className="bg-muted px-1 rounded">{'{first_name}'}</code>{' '}
                          <code className="bg-muted px-1 rounded">{'{brand_name}'}</code>{' '}
                          <code className="bg-muted px-1 rounded">{'{survey_link}'}</code>
                        </p>
                        <span className={cn(
                          "text-xs font-mono",
                          props.cnpSmsBody.length > 160 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {props.cnpSmsBody.length}/160
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={props.onCancel}>
                    Cancel
                  </Button>
                  <Button className="btn-coral" onClick={props.onSave} disabled={props.savePending}>
                    {props.savePending ? 'Saving...' : 'Save Otto Onboard Configuration'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
