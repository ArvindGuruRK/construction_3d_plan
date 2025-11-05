"use client";

import { ModelCard } from "./model-card";
import type { ImagePlaceholder } from "@/lib/placeholder-images";
import { LayoutTemplate, Loader } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { GeneratePlanSchema } from "@/lib/schemas";


interface ViewerGridProps {
  isLoading: boolean;
  results: ImagePlaceholder[];
  formData: GeneratePlanSchema | null;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 grid-bg">
      <div className="bg-background/80 p-8 rounded-lg shadow-lg backdrop-blur-sm">
        <LayoutTemplate className="mx-auto h-16 w-16 text-muted-foreground" />
        <h2 className="mt-6 text-2xl font-semibold font-headline">Design Your Space</h2>
        <p className="mt-2 text-muted-foreground">
          Use the panel on the left to configure your requirements and click
          "Generate Plans" to begin.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 grid-bg">
       <div className="bg-background/80 p-8 rounded-lg shadow-lg backdrop-blur-sm w-full max-w-md">
        <Loader className="mx-auto h-16 w-16 text-primary animate-spin" />
        <h2 className="mt-6 text-2xl font-semibold font-headline">Generating Your Plans...</h2>
        <p className="mt-2 text-muted-foreground">
          Our AI is working hard to create unique floor plans for you. This may take a moment.
        </p>
        <Progress value={50} className="mt-6 h-2 indeterminate-progress" />
      </div>
    </div>
  );
}

export function ViewerGrid({ isLoading, results, formData }: ViewerGridProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (results.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
        {results.map((result, index) => (
          <ModelCard
            key={result.id}
            title={`Variation ${index + 1}`}
            description={result.description}
            planConfig={formData}
          />
        ))}
      </div>
    </div>
  );
}
