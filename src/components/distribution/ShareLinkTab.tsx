import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link2, QrCode, Copy, Download } from 'lucide-react';

interface Location {
  id: string;
  name: string;
}

interface ShareLinkTabProps {
  eventId: string;
  locations: Location[];
}

export function ShareLinkTab({ eventId, locations }: ShareLinkTabProps) {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [qrSize, setQrSize] = useState('256');
  const [qrBorderText, setQrBorderText] = useState('');

  const surveyUrl = useMemo(() => {
    if (!eventId) return '';
    let url = `https://survey.userpulse.io/s/${eventId.slice(0, 8)}`;
    if (selectedLocation) {
      url += `?loc=${selectedLocation.slice(0, 8)}`;
    }
    return url;
  }, [eventId, selectedLocation]);

  const handleCopyLink = () => {
    if (!surveyUrl) {
      toast({ title: 'No URL to copy', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(surveyUrl);
    toast({ title: 'Link copied to clipboard' });
  };

  const handleDownloadQR = (format: 'png' | 'svg') => {
    toast({ title: `QR Code downloaded as ${format.toUpperCase()}` });
  };

  return (
    <Card className="shadow-soft border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Direct Survey Link & QR Code
        </CardTitle>
        <CardDescription>
          Share via link or QR code for in-clinic distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Selector */}
        {locations.length > 1 && (
          <div className="space-y-2">
            <Label>Select Location (for location-specific URL)</Label>
            <Select
              value={selectedLocation || 'all'}
              onValueChange={(val) => setSelectedLocation(val === 'all' ? '' : val)}
            >
              <SelectTrigger className="max-w-[300px]">
                <SelectValue placeholder="All Locations (generic URL)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecting a location embeds it in the URL for accurate tracking
            </p>
          </div>
        )}

        {/* URL Section */}
        <div className="space-y-2">
          <Label>Survey URL</Label>
          <div className="flex gap-2">
            <Input readOnly value={surveyUrl} className="font-mono text-sm" />
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>

        {/* QR Code */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="border rounded-lg p-8 flex items-center justify-center bg-muted/30">
              <div className="h-48 w-48 bg-background rounded-lg border flex items-center justify-center">
                <QrCode className="h-32 w-32 text-foreground" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => handleDownloadQR('png')}>
                <Download className="h-4 w-4 mr-2" />
                PNG
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleDownloadQR('svg')}>
                <Download className="h-4 w-4 mr-2" />
                SVG
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>QR Code Size</Label>
              <Select value={qrSize} onValueChange={setQrSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="128">128px (Small)</SelectItem>
                  <SelectItem value="256">256px (Medium)</SelectItem>
                  <SelectItem value="512">512px (Large)</SelectItem>
                  <SelectItem value="1024">1024px (Print)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Border Text (optional)</Label>
              <Input
                placeholder="Scan to rate your visit"
                value={qrBorderText}
                onChange={(e) => setQrBorderText(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
