import { useState, useEffect } from 'react';
import { useUser } from '@clerk/react';
import { useGetMe, useUpdateMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  User, Mail, MapPin, GraduationCap, AtSign, FileText,
  Calendar, Shield, ExternalLink, Camera, Save, Link2
} from 'lucide-react';
import { Link } from 'wouter';

export default function ProfilePage() {
  const { user: clerkUser } = useUser();
  const { data: me, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    college: '',
    graduationYear: '',
  });

  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (me) {
      setForm({
        name: me.name ?? '',
        username: me.username ?? '',
        bio: me.bio ?? '',
        location: me.location ?? '',
        college: me.college ?? '',
        graduationYear: me.graduationYear?.toString() ?? '',
      });
    }
  }, [me]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, string | number | undefined> = {};
    if (form.name.trim()) payload.name = form.name.trim();
    if (form.username.trim()) payload.username = form.username.trim();
    if (form.bio.trim()) payload.bio = form.bio.trim();
    if (form.location.trim()) payload.location = form.location.trim();
    if (form.college.trim()) payload.college = form.college.trim();
    if (form.graduationYear.trim()) {
      const yr = parseInt(form.graduationYear, 10);
      if (!isNaN(yr)) payload.graduationYear = yr;
    }

    updateMe.mutate({ data: payload as any }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setDirty(false);
        toast({ title: "Profile updated", description: "Your changes have been saved successfully." });
      },
      onError: () => {
        toast({ title: "Update failed", description: "Could not save changes. Please try again.", variant: "destructive" });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="pt-6 space-y-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information and public presence.</p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Profile Picture
          </CardTitle>
          <CardDescription>Your photo is synced from your sign-in account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full border-2 border-border overflow-hidden bg-muted shrink-0">
              {clerkUser?.imageUrl
                ? <img src={clerkUser.imageUrl} alt="Avatar" className="h-full w-full object-cover" />
                : <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                    {(form.name || 'U').charAt(0).toUpperCase()}
                  </div>
              }
            </div>
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Profile pictures are managed through your Clerk account.</p>
              <Link href="/account/manage-clerk">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Manage on Clerk
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal info form */}
      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
            <CardDescription>Update your public profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" /> Full Name
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Arjun Sharma"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5 text-muted-foreground" /> Username
                </Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="arjun_sharma"
                />
                <p className="text-xs text-muted-foreground">
                  Your public profile: <span className="font-mono">/profile/{form.username || 'username'}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Bio
              </Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Full-stack engineer passionate about building scalable products. Open to SDE-2 opportunities in Bengaluru."
                className="min-h-[80px] resize-none"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">{form.bio.length}/200</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location
                </Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder="Bengaluru, Karnataka"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college" className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> College / University
                </Label>
                <Input
                  id="college"
                  value={form.college}
                  onChange={(e) => handleChange('college', e.target.value)}
                  placeholder="IIT Bombay"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="gradYear" className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Graduation Year
                </Label>
                <Input
                  id="gradYear"
                  type="number"
                  min="2000"
                  max="2035"
                  value={form.graduationYear}
                  onChange={(e) => handleChange('graduationYear', e.target.value)}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {form.username && (
                <Link href={`/profile/${form.username}`}>
                  <Button type="button" variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" /> View Public Profile
                  </Button>
                </Link>
              )}
              <div className="ml-auto">
                <Button
                  type="submit"
                  disabled={!dirty || updateMe.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {updateMe.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Account info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Account Details
          </CardTitle>
          <CardDescription>Read-only account information managed by Clerk.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> Email address
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{clerkUser?.primaryEmailAddress?.emailAddress ?? '—'}</span>
              <Badge variant="secondary" className="text-[10px]">Verified</Badge>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3.5 w-3.5" /> Member since
            </div>
            <span className="text-sm font-medium">
              {me?.createdAt ? new Date(me.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Account ID
            </div>
            <span className="text-sm font-mono text-muted-foreground">{me?.id ?? '—'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
