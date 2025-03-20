"use client";

import type React from "react";

import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SunIcon } from "@/components/ui/sun";
import { MoonIcon } from "@/components/ui/moon";
import { VolumeIcon } from "@/components/ui/volume";
import { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/contexts/supabase-context";
import { Skeleton } from "@/components/ui/skeleton";
import { PartyPopperIcon } from "./ui/party-popper";
import { useLocalStorage } from "usehooks-ts";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    email: string;
    avatar: string;
    id: string;
  };
  soundEnabled: boolean;
  onSave: (settings: {
    name: string;
    avatar: string;
    theme: string;
    sound: boolean;
    particles: boolean;
  }) => void;
}

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

export function SettingsDialog({
  open,
  onOpenChange,
  user,
  soundEnabled,
  onSave,
}: SettingsDialogProps) {
  const { supabase } = useSupabase();
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundEnabled);
  const [isParticlesEnabled, setIsParticlesEnabled] = useState(false);
  const [soundEnabledStorage, setSoundEnabledStorage] =
    useLocalStorage<boolean>("soundEnabled", true);
  const [particlesEnabledStorage, setParticlesEnabledStorage] =
    useLocalStorage<boolean>("particlesEnabled", true);
  const [activeAvatarCategory, setActiveAvatarCategory] = useState("Vercel");
  const { theme, setTheme } = useTheme();
  const isDarkMode =
    theme === "system"
      ? typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
        : false
      : theme === "dark";
  const [isAnimating, setIsAnimating] = useState(false);
  const [avatarsByCategory, setAvatarsByCategory] = useState<
    Record<string, string[]>
  >({
    Vercel: [],
    "Notion Style": [],
    Emoji: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // References to control icon animations
  const volumeIconRef = useRef<React.ElementRef<typeof VolumeIcon>>(null);
  const sunIconRef = useRef<React.ElementRef<typeof SunIcon>>(null);
  const moonIconRef = useRef<React.ElementRef<typeof MoonIcon>>(null);

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const fetchAvatarsByFolder = async (folder: string) => {
    const { data, error } = await supabase.storage
      .from("avatars")
      .list(folder, { limit: 4 });

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
    setIsLoading(true);
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
    setIsLoading(false);
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({ name: user.name });
      setAvatar(user.avatar);
      setIsSoundEnabled(soundEnabledStorage);
      setIsParticlesEnabled(particlesEnabledStorage);
      fetchAllAvatars();
      // Initialize volume icon state
      if (volumeIconRef.current) {
        if (soundEnabledStorage) {
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
    }
  }, [open, user, soundEnabledStorage, particlesEnabledStorage, isDarkMode]);

  const handleSave = async (formData: SettingsFormValues) => {
    setSoundEnabledStorage(isSoundEnabled);
    setParticlesEnabledStorage(isParticlesEnabled);

    onSave({
      name: formData.name,
      avatar,
      theme: theme!,
      sound: isSoundEnabled,
      particles: isParticlesEnabled,
    });

    onOpenChange(false);
  };

  const handleSoundToggle = (checked: boolean) => {
    setIsSoundEnabled(checked);
    setIsAnimating(true);
    // Trigger animation
    if (volumeIconRef.current) {
      if (checked) {
        volumeIconRef.current.startAnimation();
      } else {
        volumeIconRef.current.stopAnimation();
      }
    }
    // Hide animation after it completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const handleThemeToggle = (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    // Trigger animation when toggled
    if (checked && moonIconRef.current) {
      moonIconRef.current.startAnimation();
    } else if (!checked && sunIconRef.current) {
      sunIconRef.current.startAnimation();
    }
  };

  const handleParticlesToggle = (checked: boolean) => {
    setIsParticlesEnabled(checked);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your profile and preferences.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={avatar} alt="Selected avatar" />
                  <AvatarFallback>
                    {form.watch("name").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
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
            </div>

            {/* Avatar selection with tabs */}
            <div className="space-y-2">
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
                {Object.entries(avatarsByCategory).map(([category, urls]) => (
                  <TabsContent key={category} value={category} className="pt-4">
                    <div className="flex justify-center">
                      {isLoading ? (
                        <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex justify-center items-center"
                            >
                              <Skeleton className="h-16 w-16 rounded-full" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-4 w-full max-w-md">
                          {urls.map((url) => {
                            const isSelected = avatar === url;
                            return (
                              <div
                                key={url}
                                className="flex justify-center items-center cursor-pointer"
                                onClick={() => setAvatar(url)}
                              >
                                <Avatar
                                  className={`h-16 w-16 transition-all ${
                                    isSelected
                                      ? "ring-4 ring-primary ring-offset-2"
                                      : "hover:ring-2 hover:ring-muted-foreground/20"
                                  }`}
                                >
                                  <AvatarImage src={url} alt="Avatar option" />
                                  <AvatarFallback>
                                    {category.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Theme toggle with custom icons */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="theme-mode">Theme</Label>
                <div className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <SunIcon
                  ref={sunIconRef}
                  size={24}
                  className={`${isDarkMode ? "opacity-50" : "text-amber-500"} pointer-events-none`}
                />
                <Switch
                  id="theme-mode"
                  checked={isDarkMode}
                  onCheckedChange={handleThemeToggle}
                />
                <MoonIcon
                  ref={moonIconRef}
                  size={24}
                  className={`${!isDarkMode ? "opacity-50" : "text-blue-400"} pointer-events-none`}
                />
              </div>
            </div>

            {/* Sound toggle with VolumeIcon */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">Sound</Label>
                <div className="text-sm text-muted-foreground">
                  Enable or disable notification sounds
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <VolumeIcon
                  size={24}
                  isMuted={!isSoundEnabled}
                  onMutedChange={(muted) => setIsSoundEnabled(!muted)}
                  mutedColor="rgb(248 113 113)" // text-red-400
                  unmutedColor="rgb(34 197 94)" // text-green-500
                  className="pointer-events-none"
                />
                <Switch
                  id="sound"
                  checked={isSoundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
            </div>
          </form>
        </Form>

        {/* Particles/Confetti with Party-Popper Icon */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="particles">Particles</Label>
            <div className="text-sm text-muted-foreground">
              Enable or disable particles
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PartyPopperIcon
              size={24}
              color={isParticlesEnabled ? "rgb(34 197 94)" : "rgb(107 114 128)"}
              showConfetti={isParticlesEnabled}
              className="pointer-events-none"
            />
            <Switch
              id="particles"
              checked={isParticlesEnabled}
              onCheckedChange={handleParticlesToggle}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={form.handleSubmit(handleSave)}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
