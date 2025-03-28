import { useState } from "react";
import { Share } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { createApiClient } from "@/utils/api-client";
import { toast } from "@/components/ui/use-toast";

interface ShareButtonProps {
  quizId: string;
  roomId?: string;
  type: "singleplayer" | "multiplayer";
  className?: string;
}

// Define the expected response type
interface ShareResponse {
  shareUrl: string;
  // Add other properties as needed
}

export function ShareButton({ quizId, roomId, type, className = "" }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isShared, setIsShared] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    
    try {
      const client = createApiClient();
      let response; // Explicitly define the type for response
      
      if (type === "singleplayer") {
        response = await client.api.v1.share.singleplayer.$post({
          json: {
            quizId,
            isAnonymous,
            isPublic
          }
        });
      } else {
        // For multiplayer quizzes
        if (!roomId) {
          throw new Error("Room ID is required for multiplayer quizzes");
        }
        
        response = await client.api.v1.share.multiplayer.$post({
          json: {
            quizId,
            roomId,
            isAnonymous,
            isPublic
          }
        });
      }
      
      const data = await response.json();
      
      if (data && data.shareUrl) {
        const frontendShareUrl = `${window.location.origin}/share/${data.shareId}`;
        setShareUrl(frontendShareUrl);
        setIsShared(true);
        toast({
          title: "Quiz shared successfully",
          description: "Share link has been generated.",
          variant: "success",
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to share quiz:", error);
      toast({
        title: "Failed to share quiz",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) {
      toast({
        title: "No link available",
        description: "Please generate a share link first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setIsOpen(true)}
            variant="ghost"
            size="icon"
            className={`text-[#c8b6ff] hover:text-[#c8b6ff]/80 hover:bg-[#c8b6ff]/10 ${className}`}
            aria-label="Share quiz"
          >
            <Share size={20} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share quiz</p>
        </TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#f8f8ff] dark:bg-[#0c0d0d] border-[#c8b6ff]/20">
          <DialogHeader>
            <DialogTitle className="text-[#c8b6ff]">Share Quiz</DialogTitle>
            <DialogDescription className="text-[#c8b6ff]/70">
              Create a shareable link for your quiz
            </DialogDescription>
          </DialogHeader>
          
          {!isShared ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="public" 
                  checked={isPublic}
                  onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                />
                <Label htmlFor="public" className="text-[#c8b6ff]">
                  Make quiz publicly accessible
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="anonymous" 
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
                />
                <Label htmlFor="anonymous" className="text-[#c8b6ff]">
                  Share anonymously (hide your name)
                </Label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <Badge variant="outline" className="bg-[#c8b6ff]/10 text-[#c8b6ff] border-[#c8b6ff]/20">
                  {isPublic ? "Public" : "Private"}
                </Badge>
                <Badge variant="outline" className="ml-2 bg-[#c8b6ff]/10 text-[#c8b6ff] border-[#c8b6ff]/20">
                  {isAnonymous ? "Anonymous" : "Named"}
                </Badge>
              </div>
              <div className="bg-[#c8b6ff]/5 p-3 rounded-md border border-[#c8b6ff]/20">
                <p className="text-sm font-mono text-[#c8b6ff] break-all">{shareUrl || "No share URL available"}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {!isShared ? (
              <Button 
                onClick={handleShare} 
                disabled={isLoading} 
                className="bg-[#c8b6ff] hover:bg-[#c8b6ff]/90 text-black"
              >
                {isLoading ? "Generating link..." : "Generate share link"}
              </Button>
            ) : (
              <div className="flex space-x-2 w-full justify-end">
                <Button 
                  onClick={() => setIsShared(false)} 
                  variant="outline" 
                  className="border-[#c8b6ff]/20 text-[#c8b6ff]"
                >
                  Back
                </Button>
                <Button 
                  onClick={copyToClipboard} 
                  className="bg-[#c8b6ff] hover:bg-[#c8b6ff]/90 text-black"
                >
                  Copy Link
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}