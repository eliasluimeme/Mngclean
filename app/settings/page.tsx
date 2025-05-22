"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Dummy user data (replace with real user context or API call)
const initialProfile = {
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  phone: "+212600000000", // E.164 format, no spaces
  role: ""
};

function cleanPhone(phone: string) {
  return phone.replace(/\s+/g, '');
}

export default function SettingsPage() {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<{ [key: string]: string }>({});
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true);
      try {
        // Get current user id
        const resMe = await fetch("/api/auth/me");
        const dataMe = await resMe.json();
        if (!dataMe.user || !dataMe.user.id) throw new Error("No user session");
        setUserId(dataMe.user.id);
        setUserRole(dataMe.user.role || null);
        // Fetch profile
        const resProfile = await fetch(`/api/users?query=${dataMe.user.email}`);
        const dataProfile = await resProfile.json();
        // Find the profile with matching id
        const userProfile = Array.isArray(dataProfile)
          ? dataProfile.find((u) => u.id === dataMe.user.id)
          : null;
        if (userProfile) {
          console.log("Profile ", userProfile)
          setProfile({
            first_name: userProfile.first_name || "",
            last_name: userProfile.last_name || "",
            email: userProfile.email || "",
            phone: cleanPhone(userProfile.phone || ""),
            role: userProfile.role || ""
          });
        }
        console.log("Role ", profile.role)
      } catch (err) {
        // fallback: keep initialProfile
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!profile.first_name) errs.first_name = 'First name is required.';
    if (!profile.last_name) errs.last_name = 'Last name is required.';
    if (!profile.email) errs.email = 'Email is required.';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) errs.email = 'Invalid email address.';
    if (!profile.phone) errs.phone = 'Phone number is required.';
    else if (profile.phone.length < 8) errs.phone = 'Invalid phone number.';
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (value: string | undefined) => {
    setProfile({ ...profile, phone: cleanPhone(value || '') });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      if (!userId) throw new Error("No user id");
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: cleanPhone(profile.phone),
          role: profile.role
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      toast({ title: 'Profile updated', description: 'Your profile information has been saved.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const validatePasswordChange = () => {
    const errs: { [key: string]: string } = {};
    if (!passwords.current) errs.current = 'Current password is required.';
    if (!passwords.new) errs.new = 'New password is required.';
    else if (passwords.new.length < 8) errs.new = 'New password must be at least 8 characters.';
    if (!passwords.confirm) errs.confirm = 'Please confirm your new password.';
    else if (passwords.new !== passwords.confirm) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validatePasswordChange();
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setPwLoading(true);
    try {
      if (!userId) throw new Error('No user id');
      const res = await fetch(`/api/users/${userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordForm(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to change password', variant: 'destructive' });
    } finally {
      setPwLoading(false);
    }
  };

  if (fetching) {
    return (
      <MainLayout title="Settings" subtitle="Manage your account and preferences">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleChange}
                    required
                  />
                  {errors.first_name && <div className="text-xs text-red-500 mt-1">{errors.first_name}</div>}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleChange}
                    required
                  />
                  {errors.last_name && <div className="text-xs text-red-500 mt-1">{errors.last_name}</div>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    required
                  />
                  {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handlePhoneChange}
                    defaultCountry="MA"
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
            {/* Change Password Section (staff only) */}
            {userRole === 'staff' && (
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">Change Password</h3>
                </div>
                
                  <form className="space-y-4 mt-4" onSubmit={handleChangePassword}>
                    <div>
                      <Label htmlFor="current">Current Password</Label>
                      <Input
                        id="current"
                        name="current"
                        type="password"
                        value={passwords.current}
                        onChange={handlePasswordChange}
                        required
                      />
                      {pwErrors.current && <div className="text-xs text-red-500 mt-1">{pwErrors.current}</div>}
                    </div>
                    <div>
                      <Label htmlFor="new">New Password</Label>
                      <Input
                        id="new"
                        name="new"
                        type="password"
                        value={passwords.new}
                        onChange={handlePasswordChange}
                        required
                      />
                      {pwErrors.new && <div className="text-xs text-red-500 mt-1">{pwErrors.new}</div>}
                    </div>
                    <div>
                      <Label htmlFor="confirm">Confirm New Password</Label>
                      <Input
                        id="confirm"
                        name="confirm"
                        type="password"
                        value={passwords.confirm}
                        onChange={handlePasswordChange}
                        required
                      />
                      {pwErrors.confirm && <div className="text-xs text-red-500 mt-1">{pwErrors.confirm}</div>}
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={pwLoading}>
                        {pwLoading ? 'Saving...' : 'Change Password'}
                      </Button>
                    </div>
                  </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 