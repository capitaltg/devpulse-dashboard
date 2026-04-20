import { useState } from 'react';
import { useTheme } from 'next-themes';
import { DashboardHeader } from '@/components/DashboardHeader';
import { TopNav } from '@/components/TopNav';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Bell, Palette, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { useSettings, PERIOD_OPTIONS, type PeriodDays } from '@/contexts/SettingsContext';

const Profile = () => {
  const { userData, loading } = useUser();
  const { theme, setTheme } = useTheme();
  const { days, setDays } = useSettings();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [prNotifications, setPrNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const displayName = userData?.display_name || userData?.username || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  const handleSave = () => {
    toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <TopNav />
        <main className="container mx-auto py-6 px-4 max-w-2xl">
          <p className="text-muted-foreground">Loading profile…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <TopNav />
      <main className="container mx-auto py-6 px-4 space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

        {/* Account Settings */}
        <div className="dashboard-section space-y-5">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4" /> Account Settings
          </h2>

          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              {userData?.email && (
                <p className="text-xs text-muted-foreground">{userData.email}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm">Display Name</Label>
              <Input id="name" value={displayName} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </Label>
              <Input id="email" type="email" value={userData?.email ?? ''} readOnly className="bg-muted/50" />
            </div>
          </div>

        </div>

        <Separator />

        {/* Notifications */}
        <div className="dashboard-section space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">PR review requests</p>
                <p className="text-xs text-muted-foreground">Notify when you're assigned as reviewer</p>
              </div>
              <Switch checked={prNotifications} onCheckedChange={setPrNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Weekly digest</p>
                <p className="text-xs text-muted-foreground">Summary of team activity every Monday</p>
              </div>
              <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
            </div>
          </div>
        </div>

        <Separator />

        {/* Dashboard Preferences */}
        <div className="dashboard-section space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" /> Dashboard Preferences
          </h2>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Theme
              </Label>
              <Select value={theme ?? 'system'} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Default time period
              </Label>
              <Select
                value={String(days)}
                onValueChange={(v) => setDays(Number(v) as PeriodDays)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.days} value={String(opt.days)}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;
