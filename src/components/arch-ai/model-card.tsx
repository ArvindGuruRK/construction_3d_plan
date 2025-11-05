"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InteractiveViewer } from "./interactive-viewer";
import type { GeneratePlanSchema } from "@/lib/schemas";


interface ModelCardProps {
  title: string;
  description: string;
  planConfig: GeneratePlanSchema | null;
}

export function ModelCard({ title, description, planConfig }: ModelCardProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    toast({
      title: "Download Not Implemented",
      description: "Downloading .glb files will be available soon.",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "A shareable link has been copied to your clipboard.",
    });
  };
  
  const handleRegenerate = () => {
    toast({
      title: "Not Implemented",
      description: "This feature will be available in a future update.",
    });
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-xl flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="line-clamp-3 h-[60px]">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {planConfig ? (
            <InteractiveViewer planConfig={planConfig} />
          ) : (
             <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">No plan to display</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="w-5 h-5" />
          <span className="sr-only">Share</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleRegenerate}>
          <RefreshCw className="w-5 h-5" />
          <span className="sr-only">Regenerate</span>
        </Button>
        <Button variant="default" onClick={handleDownload}>
          <Download className="w-5 h-5 mr-2" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
