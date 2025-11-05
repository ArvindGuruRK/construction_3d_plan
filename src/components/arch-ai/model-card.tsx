"use client";

import * as React from "react";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';

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
  const [regenerationKey, setRegenerationKey] = React.useState(0);
  const sceneRef = React.useRef<THREE.Scene | null>(null);

  const handleDownload = () => {
    if (!sceneRef.current) {
       toast({
        variant: "destructive",
        title: "Download Failed",
        description: "The 3D model is not available for download.",
      });
      return;
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'floor-plan.gltf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: "Your model is being downloaded as floor-plan.gltf",
        });
      },
      (error) => {
         toast({
          variant: "destructive",
          title: "Download Error",
          description: "An error occurred while exporting the model.",
        });
        console.error('An error occurred during GLTF export:', error);
      }
    );
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "A shareable link has been copied to your clipboard.",
    });
  };
  
  const handleRegenerate = () => {
    setRegenerationKey(prev => prev + 1);
    toast({
      title: "Model Regenerated",
      description: "A new layout variation has been created.",
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
            <InteractiveViewer 
              planConfig={planConfig} 
              regenerationKey={regenerationKey}
              onSceneReady={(scene) => sceneRef.current = scene}
            />
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
