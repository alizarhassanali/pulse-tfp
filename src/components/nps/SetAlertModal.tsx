import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import { Bell, Plus, X, Lock } from 'lucide-react';

interface SetAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetAlertModal({ open, onOpenChange }: SetAlertModalProps) {
  const { toast } = useToast();
  const {
    availableBrands,
    availableLocations,
    effectiveBrandIds,
    effectiveLocationIds,
    isBrandLocked,
    isLocationLocked,
    getBrandName,
    getLocationName,
    isLoading,
  } = useBrandLocationContext();

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(50);
  const [evaluationWindow, setEvaluationWindow] = useState('7');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [emailSubject, setEmailSubject] = useState('NPS Alert: Score dropped below threshold');
  const [emailBody, setEmailBody] = useState(
    'Hello,\n\nThe NPS score for {{brand}} at {{location}} has dropped below {{threshold}}.\n\nCurrent Score: {{score}}\nEvaluation Period: Last {{days}} days\n\nPlease review and take action.\n\nBest regards,\nUserPulse'
  );

  // Auto-select brands/locations when locked
  useEffect(() => {
    if (isBrandLocked && effectiveBrandIds.length > 0) {
      setSelectedBrands(effectiveBrandIds);
    }
  }, [isBrandLocked, effectiveBrandIds]);

  useEffect(() => {
    if (isLocationLocked && effectiveLocationIds.length > 0) {
      setSelectedLocations(effectiveLocationIds);
    }
  }, [isLocationLocked, effectiveLocationIds]);

  // Filter locations based on selected brands
  const filteredLocations = selectedBrands.length > 0
    ? availableLocations.filter(loc => loc.brand_id && selectedBrands.includes(loc.brand_id))
    : availableLocations;

  const handleBrandToggle = (brandId: string) => {
    if (isBrandLocked) return;
    setSelectedBrands(prev => 
      prev.includes(brandId) 
        ? prev.filter(b => b !== brandId)
        : [...prev, brandId]
    );
    // Clear location selections when brands change
    setSelectedLocations([]);
  };

  const handleLocationToggle = (locationId: string) => {
    if (isLocationLocked) return;
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(l => l !== locationId)
        : [...prev, locationId]
    );
  };

  const addRecipient = () => {
    setRecipients(prev => [...prev, '']);
  };

  const removeRecipient = (index: number) => {
    setRecipients(prev => prev.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    setRecipients(prev => prev.map((r, i) => i === index ? value : r));
  };

  const handleSave = () => {
    const validRecipients = recipients.filter(r => r.trim() && r.includes('@'));
    if (validRecipients.length === 0) {
      toast({ title: 'Please add at least one valid email recipient', variant: 'destructive' });
      return;
    }

    // In a real app, this would save to the database
    toast({ 
      title: 'Alert configured successfully', 
      description: `You will be notified when NPS drops below ${threshold}` 
    });
    onOpenChange(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configure NPS Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when NPS score drops below your threshold
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Brands
              {isBrandLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            {isBrandLocked ? (
              <div className="flex flex-wrap gap-2">
                {effectiveBrandIds.map(brandId => (
                  <Badge key={brandId} variant="default">
                    {getBrandName(brandId)}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableBrands.map(brand => (
                  <Badge
                    key={brand.id}
                    variant={selectedBrands.includes(brand.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleBrandToggle(brand.id)}
                  >
                    {brand.name}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {isBrandLocked 
                ? 'Brand selection is locked based on your access'
                : selectedBrands.length === 0 
                  ? 'All brands selected' 
                  : `${selectedBrands.length} brand(s) selected`}
            </p>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Locations
              {isLocationLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </Label>
            {isLocationLocked ? (
              <div className="flex flex-wrap gap-2">
                {effectiveLocationIds.map(locationId => (
                  <Badge key={locationId} variant="default">
                    {getLocationName(locationId)}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {filteredLocations.map(location => (
                  <Badge
                    key={location.id}
                    variant={selectedLocations.includes(location.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleLocationToggle(location.id)}
                  >
                    {location.name}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {isLocationLocked 
                ? 'Location selection is locked based on your access'
                : selectedLocations.length === 0 
                  ? 'All locations selected' 
                  : `${selectedLocations.length} location(s) selected`}
            </p>
          </div>

          {/* Threshold */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>NPS Threshold</Label>
              <Input
                type="number"
                min={-100}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">Alert when NPS drops below this score</p>
            </div>
            <div className="space-y-2">
              <Label>Evaluation Window</Label>
              <Select value={evaluationWindow} onValueChange={setEvaluationWindow}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Email Recipients */}
          <div className="space-y-2">
            <Label>Email Recipients</Label>
            {recipients.map((email, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => updateRecipient(idx, e.target.value)}
                />
                {recipients.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeRecipient(idx)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addRecipient}>
              <Plus className="h-4 w-4 mr-1" />
              Add Recipient
            </Button>
          </div>

          {/* Email Content */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body</Label>
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Variables: {'{{brand}}'}, {'{{location}}'}, {'{{score}}'}, {'{{threshold}}'}, {'{{days}}'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
