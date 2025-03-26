"use client";

import type React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoonIcon } from "@/components/ui/moon";
import { PartyPopperIcon } from "@/components/ui/party-popper";
import { Skeleton } from "@/components/ui/skeleton";
import { SunIcon } from "@/components/ui/sun";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { VolumeIcon } from "@/components/ui/volume";
import { useSupabase } from "@/contexts/supabase-context";
import { useAuth } from "@/contexts/user-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";
import * as z from "zod";

// Define the form schema
const settingsFormSchema = z.object({
  name: z
    .string()
    .min(3, {
      message: "Display name must be at least 2 characters.",
    })
    .max(100, {
      message: "Display name cannot exceed 100 characters.",
    }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { supabase } = useSupabase();
  const { updateUserProfile, currentUser } = useAuth();
  const { toast } = useToast();
  // Start with initialLoading as true to show skeletons immediately
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [activeAvatarCategory, setActiveAvatarCategory] = useState("Vercel");
  const [soundEnabled, setSoundEnabled] = useLocalStorage<boolean>(
    "soundEnabled",
    true,
  );
  const [particlesEnabled, setParticlesEnabled] = useLocalStorage<boolean>(
    "particlesEnabled",
    true,
  );
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Check if theme is defined; if not, assume it's not dark mode initially
  const isDarkMode = mounted ? theme === "dark" : false;

  // Force theme to re-evaluate after component mounts
  useEffect(() => {
    // This ensures the theme is properly detected after hydration
    setMounted(true);
  }, []);

  // Initialize with empty arrays - we'll show skeletons based on initialLoading
  const [avatarsByCategory, setAvatarsByCategory] = useState<
    Record<string, string[]>
  >({
    Vercel: [],
    "Notion Style": [],
    Emoji: [],
  });

  // Add these new refs for icon animations
  const volumeIconRef = useRef<React.ElementRef<typeof VolumeIcon>>(null);
  const sunIconRef = useRef<React.ElementRef<typeof SunIcon>>(null);
  const moonIconRef = useRef<React.ElementRef<typeof MoonIcon>>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const getProfile = useCallback(async () => {
    try {
      if (currentUser) {
        setAvatar(currentUser.img);
        form.reset({ name: currentUser.name });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [form, currentUser]);

  const fetchAvatarsByFolder = async (folder: string) => {
    const { data, error } = await supabase.storage
      .from("avatars")
      .list(folder, { limit: 12 });

    if (error) {
      console.error(`Error fetching avatars from ${folder}:`, error);
      return [];
    }

    const urls = await Promise.all(
      data
        .filter((file) => file.name.endsWith(".png"))
        .map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from("avatars")
            .getPublicUrl(`${folder}/${file.name}`);
          return urlData?.publicUrl;
        }),
    );

    return urls.filter(Boolean) as string[];
  };

  const fetchAllAvatars = async () => {
    const folders = ["vercel", "notion", "emoji"];
    const results = await Promise.all(
      folders.map(async (folder) => {
        const urls = await fetchAvatarsByFolder(folder);
        return [folder, urls];
      }),
    );

    setAvatarsByCategory({
      Vercel: results[0][1] as string[],
      "Notion Style": results[1][1] as string[],
      Emoji: results[2][1] as string[],
    });

    // Only set loading to false after all data is loaded
    setInitialLoading(false);
    setIsAvatarLoading(false);
  };

  // Update the useEffect to fetch avatars
  useEffect(() => {
    // Start with loading states as true
    setInitialLoading(true);
    setIsAvatarLoading(true);

    // Fetch data
    getProfile();
    fetchAllAvatars();

    // Don't set loading to false here - we'll do that after data loads
  }, [getProfile]);

  // Update the existing useEffect for animations
  useEffect(() => {
    if (!currentUser) return;

    // Initialize volume icon state
    if (volumeIconRef.current) {
      if (soundEnabled) {
        volumeIconRef.current.startAnimation();
      } else {
        volumeIconRef.current.stopAnimation();
      }
    }
    // Initialize theme icons based on current theme
    if (isDarkMode && moonIconRef.current) {
      moonIconRef.current.startAnimation();
    } else if (!isDarkMode && sunIconRef.current) {
      sunIconRef.current.startAnimation();
    }
  }, [currentUser, soundEnabled, isDarkMode]);

  // Simplified handlers with consistent animation patterns
  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked);
    setIsAnimating(true);
    if (volumeIconRef.current) {
      if (checked) {
        volumeIconRef.current.startAnimation();
      } else {
        volumeIconRef.current.stopAnimation();
      }
    }
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const handleThemeToggle = (checked: boolean) => {
    // Set the theme directly based on the checked state
    setTheme(checked ? "dark" : "light");

    // Animations
    setTimeout(() => {
      if (checked && moonIconRef.current) {
        moonIconRef.current.startAnimation();
      } else if (!checked && sunIconRef.current) {
        sunIconRef.current.startAnimation();
      }
    }, 100);
  };

  const handleParticlesToggle = (checked: boolean) => {
    setParticlesEnabled(checked);
  };

  // Separate handlers for profile and preferences
  const handleSaveProfile = async (formData: SettingsFormValues) => {
    try {
      setIsSavingProfile(true);

      // Update user context
      await updateUserProfile({
        name: formData.name,
        avatar: avatar,
      });

      toast({
        title: "Profile saved",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setIsSavingPreferences(true);

      // Apply preferences
      setTheme(theme!);
      setSoundEnabled(soundEnabled);
      setParticlesEnabled(particlesEnabled);

      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        title: "Error updating preferences",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const currentAvatar = currentUser?.img || avatar;
  const currentName = currentUser?.name || form.watch("name");

  return (
<div className="container max-w-4xl px-4 py-6 sm:py-10">
  <div className="mb-6 sm:mb-8">
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
    <p className="text-sm sm:text-base text-muted-foreground">
      Manage your account settings and preferences.
    </p>
  </div>

  <div className="grid gap-6 sm:gap-8">
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal information and how others see you on the
          site.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSaveProfile)}>
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="flex flex-col items-center space-y-4">
                {/* Fixed height container for avatar */}
                <div className="h-24 w-24 sm:h-32 sm:w-32 relative">
                  {isAvatarLoading ? (
                    <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full absolute" />
                  ) : (
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-2 border-primary/20 absolute">
                      <AvatarImage
                        src={currentAvatar}
                        alt="Selected avatar"
                      />
                      <AvatarFallback>
                        {currentName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your display name" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-muted-foreground">
                  Email:{" "}
                  {isAvatarLoading ? (
                    <Skeleton className="h-4 w-[180px] inline-block ml-1 align-middle" />
                  ) : (
                    currentUser?.email
                  )}
                </div>
              </div>
            </div>

            {/* Avatar selection with tabs */}
            <div className="space-y-4 mt-6">
              <Label>Choose Avatar</Label>
              <Tabs
                value={activeAvatarCategory}
                onValueChange={setActiveAvatarCategory}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="Vercel">Vercel</TabsTrigger>
                  <TabsTrigger value="Notion Style">Notion</TabsTrigger>
                  <TabsTrigger value="Emoji">Emoji</TabsTrigger>
                </TabsList>
                {Object.entries(avatarsByCategory).map(
                  ([category, urls]) => (
                    <TabsContent
                      key={category}
                      value={category}
                      className="pt-4"
                    >
                      {/* Fixed height container for avatar grid */}
                      <div className="min-h-[200px]">
                        {initialLoading ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 w-full">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex justify-center items-center"
                              >
                                <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 w-full">
                            {urls.length > 0 ? (
                              urls.map((url) => {
                                const isSelected = avatar === url;
                                return (
                                  <div
                                    key={url}
                                    className="flex justify-center items-center cursor-pointer"
                                    onClick={() => setAvatar(url)}
                                  >
                                    <Avatar
                                      className={`h-12 w-12 sm:h-16 sm:w-16 transition-all ${
                                        isSelected
                                          ? "ring-2 sm:ring-4 ring-primary ring-offset-1 sm:ring-offset-2"
                                          : "hover:ring-2 hover:ring-muted-foreground/20"
                                      }`}
                                    >
                                      <AvatarImage
                                        src={url}
                                        alt="Avatar option"
                                      />
                                      <AvatarFallback>
                                        {category.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="col-span-full text-center py-4 text-muted-foreground">
                                No avatars found in this category
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ),
                )}
              </Tabs>
            </div>
            <div className="flex justify-end mt-6">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>Preferences</CardTitle>
        <CardDescription>
          Customize your application experience.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6">
        {/* Theme toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div className="space-y-0.5">
            <Label htmlFor="theme-mode">Theme</Label>
            <div className="text-sm text-muted-foreground">
              Choose your preferred theme
            </div>
          </div>
          {mounted ? (
            <div className="flex items-center space-x-2">
              <SunIcon
                ref={sunIconRef}
                size={20}
                className={`${isDarkMode ? "opacity-50" : "text-amber-500"} pointer-events-none sm:size-24`}
              />
              <Switch
                id="theme-mode"
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
              />
              <MoonIcon
                ref={moonIconRef}
                size={20}
                className={`${!isDarkMode ? "opacity-50" : "text-blue-400"} pointer-events-none sm:size-24`}
              />
            </div>
          ) : (
            // Show a placeholder while theme is being determined
            <div className="flex items-center space-x-2">
              <SunIcon
                size={20}
                className="opacity-50 pointer-events-none sm:size-24"
              />
              <Skeleton className="h-6 w-11" /> {/* Match Switch dimensions */}
              <MoonIcon
                size={20}
                className="opacity-50 pointer-events-none sm:size-24"
              />
            </div>
          )}
        </div>

        {/* Sound toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div className="space-y-0.5">
            <Label htmlFor="sound">Sound</Label>
            <div className="text-sm text-muted-foreground">
              Enable or disable notification sounds
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <VolumeIcon
              ref={volumeIconRef}
              size={20}
              isMuted={!soundEnabled}
              onMutedChange={(muted) => setSoundEnabled(!muted)}
              mutedColor="rgb(248 113 113)" // text-red-400
              unmutedColor="rgb(34 197 94)" // text-green-500
              className="pointer-events-none sm:size-24"
            />
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>
        </div>

        {/* Particles toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <div className="space-y-0.5">
            <Label htmlFor="particles">Particles</Label>
            <div className="text-sm text-muted-foreground">
              Enable or disable particles and confetti effects
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PartyPopperIcon
              size={20}
              color={
                particlesEnabled ? "rgb(34 197 94)" : "rgb(107 114 128)"
              }
              showConfetti={particlesEnabled}
              className="pointer-events-none sm:size-24"
            />
            <Switch
              id="particles"
              checked={particlesEnabled}
              onCheckedChange={handleParticlesToggle}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSavePreferences}
            disabled={isSavingPreferences}
          >
            {isSavingPreferences ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
  );
}
