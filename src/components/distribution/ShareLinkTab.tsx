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
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import { Link2, QrCode, Copy, Download, MapPin } from 'lucide-react';

interface ShareLinkTabProps {
  eventId: string;
}

export function ShareLinkTab({ eventId }: ShareLinkTabProps) {
  const { toast } = useToast();
  const {
    availableLocations,
    isLoading,
  } = useBrandLocationContext();

  const [qrSize, setQrSize] = useState('256');
  const [qrBorderText, setQrBorderText] = useState('');

  // Generate URL for a specific location
  const getSurveyUrl = (locationId?: string) => {
    if (!eventId) return '';
    let url = `https://survey.userpulse.io/s/${eventId.slice(0, 8)}`;
    if (locationId) {
      url += `?loc=${locationId.slice(0, 8)}`;
    }
    return url;
  };

  const handleCopyLink = (url: string, locationName?: string) => {
    if (!url) {
      toast({ title: 'No URL to copy', variant: 'destructive' });
      return;
    }
    navigator.clipboard.writeText(url);
    toast({ title: `Link copied${locationName ? ` for ${locationName}` : ''}` });
  };

  const handleDownloadQR = (format: 'png' | 'svg', locationName?: string) => {
    toast({ title: `QR Code downloaded as ${format.toUpperCase()}${locationName ? ` for ${locationName}` : ''}` });
  };

  const handleDownloadAllQR = () => {
    toast({ 
      title: 'Downloading all QR codes', 
      description: `${availableLocations.length} QR codes will be downloaded as a batch.` 
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-soft border-border/50">
        <CardContent className="p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Direct Survey Link & QR Code
        </CardTitle>
        <CardDescription>
          Generate location-specific QR codes for in-clinic distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Settings */}
        <div className="grid grid-cols-2 gap-4 max-w-md">
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

        {/* Download All Button */}
        {availableLocations.length > 1 && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleDownloadAllQR}>
              <Download className="h-4 w-4 mr-2" />
              Download All QR Codes
            </Button>
          </div>
        )}

        {/* Location-specific QR codes */}
        {availableLocations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No locations available</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableLocations.map((location) => {
              const surveyUrl = getSurveyUrl(location.id);
              return (
                <Card key={location.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {location.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* QR Code Preview */}
                    <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/30">
                      <div className="h-32 w-32 bg-background rounded-lg border flex items-center justify-center">
                        <QrCode className="h-24 w-24 text-foreground" />
                      </div>
                    </div>

                    {/* URL */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input 
                          readOnly 
                          value={surveyUrl} 
                          className="font-mono text-xs flex-1" 
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleCopyLink(surveyUrl, location.name)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Download buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleDownloadQR('png', location.name)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PNG
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => handleDownloadQR('svg', location.name)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        SVG
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tip */}
        <p className="text-xs text-muted-foreground">
          Each QR code embeds the location ID for accurate response tracking
        </p>
      </CardContent>
    </Card>
  );
}
