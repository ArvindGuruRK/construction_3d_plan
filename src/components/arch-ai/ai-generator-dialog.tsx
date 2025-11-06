"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WandSparkles, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const examplePrompts = [
  "Generate a floor planner with a large li...",
  "Modern apartment with open kitchen, spac...",
  "Single-story house with three bedrooms, ...",
  "Studio apartment with combined living an...",
];

export function AiGeneratorDialog() {
  const [prompt, setPrompt] = React.useState(
    "Generate a floor planner with a large living room, one kitchen, two bedrooms, and two bathrooms"
  );
  const { toast } = useToast();

  const handleGenerate = () => {
    // Placeholder for actual AI generation logic
    toast({
      title: "Generation in Progress",
      description: "The AI is processing your request. This is a placeholder.",
    });
  };
  
  const handleSample = () => {
     toast({
      title: "Sample Requested",
      description: "Loading a sample floor planner. This is a placeholder.",
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-full shadow-lg">
          <WandSparkles className="mr-2 h-5 w-5" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] bg-card text-card-foreground p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold">
            Generate 3D Floor Plan with AI
          </DialogTitle>
          <DialogDescription>
            Use natural language to describe the floor plan you want to create as a 3D model.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] text-base bg-background border-primary focus:border-primary focus:ring-primary"
            placeholder="e.g., A cozy two-story house with a fireplace and a balcony"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((p, i) => (
                <Button key={i} variant="outline" size="sm" className="rounded-full" onClick={() => setPrompt(p.replace('...',''))}>
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 bg-card flex-row justify-between">
          <Button variant="outline" size="lg" onClick={handleSample}>
            <FlaskConical className="mr-2 h-5 w-5" />
            Sample Floor Planner
          </Button>
          <Button size="lg" onClick={handleGenerate}>
            <WandSparkles className="mr-2 h-5 w-5" />
            Generate 3D Model
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
