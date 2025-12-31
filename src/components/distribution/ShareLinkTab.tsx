import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import { Link2, QrCode, Copy, Download, MapPin, Code } from 'lucide-react';

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
  const [buttonColor, setButtonColor] = useState('#FF887C');

  // Generate URL for a specific location
  const getSurveyUrl = (locationId?: string) => {
    if (!eventId) return '';
    let url = `https://survey.userpulse.io/s/${eventId.slice(0, 8)}`;
    if (locationId) {
      url += `?loc=${locationId.slice(0, 8)}`;
    }
    return url;
  };

  const surveyUrl = getSurveyUrl();

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
    <div className="space-y-6">
      {/* QR Codes Section */}
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
                const locationSurveyUrl = getSurveyUrl(location.id);
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
                            value={locationSurveyUrl} 
                            className="font-mono text-xs flex-1" 
                          />
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleCopyLink(locationSurveyUrl, location.name)}
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

      {/* Web Embed Section */}
      <Card className="shadow-soft border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Web Embed
          </CardTitle>
          <CardDescription>Embed the survey on your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <Label>Button Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setButtonColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input value={buttonColor} onChange={(e) => setButtonColor(e.target.value)} placeholder="#FF887C" />
              </div>
            </div>
          </div>

          <Tabs defaultValue="javascript">
            <TabsList>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="iframe">iFrame</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
            </TabsList>
            <TabsContent value="javascript" className="pt-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {`<script src="https://cdn.userpulse.io/widget.js"></script>
<script>
  UserPulse.init({
    eventId: '${eventId || 'your-event-id'}',
    trigger: 'button',
    buttonColor: '${buttonColor}'
  });
</script>`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`<script src="https://cdn.userpulse.io/widget.js"></script>
<script>
  UserPulse.init({
    eventId: '${eventId || 'your-event-id'}',
    trigger: 'button',
    buttonColor: '${buttonColor}'
  });
</script>`);
                    toast({ title: 'Code copied' });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="iframe" className="pt-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {`<iframe 
  src="${surveyUrl}"
  width="100%"
  height="500"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`}
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="${surveyUrl}" width="100%" height="500" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`);
                    toast({ title: 'Code copied' });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="react" className="pt-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                  {`import { UserPulseWidget } from '@userpulse/react';

function App() {
  return (
    <UserPulseWidget 
      eventId="${eventId || 'your-event-id'}"
      buttonColor="${buttonColor}"
    />
  );
}`}
                </pre>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`import { UserPulseWidget } from '@userpulse/react';

function App() {
  return (
    <UserPulseWidget 
      eventId="${eventId || 'your-event-id'}"
      buttonColor="${buttonColor}"
    />
  );
}`);
                    toast({ title: 'Code copied' });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
