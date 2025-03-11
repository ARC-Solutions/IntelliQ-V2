"use client";

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

// Avatar options by category
const avatarOptions = {
  Vercel: [
    "/avatars/vercel/vercel-1.png",
    "/avatars/vercel/vercel-2.png",
    "/avatars/vercel/vercel-3.png",
    "/avatars/vercel/vercel-4.png",
  ],
  "Notion Style": [
    "/avatars/notion/notion-1.png",
    "/avatars/notion/notion-2.png",
    "/avatars/notion/notion-3.png",
    "/avatars/notion/notion-4.png",
  ],
  Emoji: [
    "/avatars/emoji/emoji-1.png",
    "/avatars/emoji/emoji-2.png",
    "/avatars/emoji/emoji-3.png",
    "/avatars/emoji/emoji-4.png",
  ],
};

// For demo purposes, we'll use placeholder images
const getPlaceholderUrl = (path: string) => {
  //   const parts = path.split("/");
  //   const filename = parts[parts.length - 1];
  //   return `/placeholder.svg?height=40&width=40&text=${filename}`;
};

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onSave: (settings: {
    name: string;
    avatar: string;
    theme: string;
    sound: boolean;
  }) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: SettingsDialogProps) {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [activeAvatarCategory, setActiveAvatarCategory] = useState("Vercel");
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  // References to control icon animations
  const volumeIconRef = useRef<React.ElementRef<typeof VolumeIcon>>(null);
  const sunIconRef = useRef<React.ElementRef<typeof SunIcon>>(null);
  const moonIconRef = useRef<React.ElementRef<typeof MoonIcon>>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(user.name);
      setAvatar(user.avatar);
    }
  }, [open, user]);

  const handleSave = () => {
    onSave({
      name,
      avatar,
      theme: theme || "light",
      sound: isSoundEnabled,
    });
    onOpenChange(false);
  };

  const handleSoundToggle = (checked: boolean) => {
    setIsSoundEnabled(checked);
    // Trigger animation when toggled
    if (volumeIconRef.current) {
      if (checked) {
        volumeIconRef.current.startAnimation();
      } else {
        volumeIconRef.current.stopAnimation();
      }
    }
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
    // Trigger animation when toggled
    if (checked && moonIconRef.current) {
      moonIconRef.current.startAnimation();
    } else if (!checked && sunIconRef.current) {
      sunIconRef.current.startAnimation();
    }
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

        <div className="space-y-6 py-4">
          {/* Username field with larger avatar preview */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage
                //   src={getPlaceholderUrl(avatar)}
                  alt="Selected avatar"
                />
                <AvatarFallback>
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
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
              {Object.entries(avatarOptions).map(([category, avatars]) => (
                <TabsContent key={category} value={category} className="pt-4">
                  <div className="grid grid-cols-4 gap-2">
                    {avatars.map((avatarSrc) => {
                      const isSelected = avatar === avatarSrc;
                      return (
                        <div
                          key={avatarSrc}
                          className="relative cursor-pointer p-1"
                          onClick={() => setAvatar(avatarSrc)}
                        >
                          <Avatar
                            className={`h-16 w-16 transition-all ${
                              isSelected
                                ? "ring-4 ring-primary ring-offset-2"
                                : "hover:ring-2 hover:ring-muted-foreground/20"
                            }`}
                          >
                            <AvatarImage
                            //   src={getPlaceholderUrl(avatarSrc)}
                              alt="Avatar option"
                            />
                            <AvatarFallback>AV</AvatarFallback>
                          </Avatar>
                        </div>
                      );
                    })}
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
                className={isDarkMode ? "opacity-50" : "text-amber-500"}
              />
              <Switch
                id="theme-mode"
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
              />
              <MoonIcon
                ref={moonIconRef}
                size={24}
                className={!isDarkMode ? "opacity-50" : "text-blue-400"}
              />
            </div>
          </div>

          {/* Sound toggle with custom icon */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound">Sound</Label>
              <div className="text-sm text-muted-foreground">
                Enable or disable notification sounds
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <VolumeIcon
                ref={volumeIconRef}
                size={24}
                className={!isSoundEnabled ? "text-red-400" : "text-green-500"}
              />
              <Switch
                id="sound"
                checked={isSoundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
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
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
