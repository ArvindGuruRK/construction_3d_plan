"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModelCardProps {
  title: string;
  imageUrl: string;
  imageHint: string;
  description: string;
}

export function ModelCard({ title, imageUrl, imageHint, description }: ModelCardProps) {
  const { toast } = useToast();

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `${title.replace(/\s/g, "_").toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast({
      title: "Download Started",
      description: `Downloading ${a.download}`,
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
      <CardContent className="flex-grow">
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={title}
            width={600}
            height={400}
            data-ai-hint={imageHint}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
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
