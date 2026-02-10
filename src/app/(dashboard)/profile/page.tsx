"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Shield, Calendar, Camera, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: {
    id: number;
    name: string;
    description: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: session?.user?.name || "",
    email: (session?.user as any)?.email || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await axiosInstance.get<{ data: UserProfile }>("/api/users/me");
      return response.data.data;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const response = await axiosInstance.patch("/api/users/me", data);
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      await update();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update profile", {
        description: error.response?.data?.error || error.message,
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await axiosInstance.patch("/api/users/me/password", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setIsPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: any) => {
      toast.error("Failed to change password", {
        description: error.response?.data?.error || error.message,
      });
    },
  });

  const handleUpdateProfile = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const user = profile || session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const userImage = (user as any)?.image;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardContent className="p-6">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-muted" />
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Avatar className="w-24 h-24">
                <AvatarImage src={userImage || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
                <p className="text-sm text-muted-foreground">@{user?.username || "user"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditForm({
                    name: user?.name || "",
                    email: (user as any)?.email || "",
                  });
                  setIsEditDialogOpen(true);
                }}
              >
                <Camera className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Username */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Username</p>
                <p className="text-sm font-medium">{user?.username}</p>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="text-sm font-medium">{user?.name || "-"}</p>
              </div>
            </div>

            <Separator />

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{(user as any)?.email || "-"}</p>
              </div>
            </div>

            <Separator />

            {/* Role */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">
                  {(user as any)?.role?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(user as any)?.role?.description || ""}
                </p>
              </div>
            </div>

            <Separator />

            {/* Joined Date */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">
                  {(user as any)?.createdAt
                    ? new Date((user as any).createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </p>
              </div>
            </div>

            <Separator />

            {/* Change Password Button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              <Key className="w-4 h-4" />
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
