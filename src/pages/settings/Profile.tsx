import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Save } from 'lucide-react';

const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris'];

export default function ProfileSettings() {
  const { toast } = useToast();
  const { profile, setProfile } = useAuthStore();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [timezone, setTimezone] = useState(profile?.timezone || 'America/New_York');
  const [isSaving, setIsSaving] = useState(false);

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U';

  const handleSave = async () => {
    if (!profile?.user_id) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ name, phone, timezone }).eq('user_id', profile.user_id);
    if (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } else {
      setProfile({ ...profile, name, phone, timezone });
      toast({ title: 'Profile updated successfully' });
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader title="Profile Settings" description="Manage your personal information and preferences" />

      <Card className="shadow-soft border-border/50">
        <CardHeader><CardTitle>Profile Picture</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <Button size="icon" className="absolute bottom-0 right-0 h-8 w-8 rounded-full btn-coral"><Camera className="h-4 w-4" /></Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Upload a profile picture</p>
            <p>JPG, PNG. Max 2MB</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-border/50">
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={profile?.email || ''} disabled className="bg-muted" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" /></div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button className="btn-coral" onClick={handleSave} disabled={isSaving}><Save className="h-4 w-4 mr-2" />{isSaving ? 'Saving...' : 'Save Changes'}</Button>
        </CardContent>
      </Card>

      <Card className="shadow-soft border-border/50">
        <CardHeader><CardTitle>Change Password</CardTitle><CardDescription>Update your password to keep your account secure</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" /></div>
          <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" /></div>
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
