
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { GeneratePlanSchema } from "@/lib/schemas";
import { generatePlanSchema } from "@/lib/schemas";
import { getPlanVariations } from "@/app/actions";
import type { ImagePlaceholder } from "@/lib/placeholder-images";

import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { ConfigPanel } from "@/components/arch-ai/config-panel";
import { ViewerGrid } from "@/components/arch-ai/viewer-grid";
import { Logo } from "@/components/arch-ai/icons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AiGeneratorDialog } from "@/components/arch-ai/ai-generator-dialog";

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ImagePlaceholder | null>(null);
  const [formData, setFormData] = React.useState<GeneratePlanSchema | null>(null);

  const { toast } = useToast();

  const form = useForm<GeneratePlanSchema>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      totalArea: 1200,
      roomCounts: {
        Bedroom: 0,
        Bathroom: 0,
        Kitchen: 0,
        LivingRoom: 0,
        DiningRoom: 0,
      },
      roomSqft: {
        Bedroom: 150,
        Bathroom: 60,
        Kitchen: 100,
        LivingRoom: 250,
        DiningRoom: 120,
      }
    },
  });

  const onSubmit = async (data: GeneratePlanSchema) => {
    setIsLoading(true);
    setResult(null);
    setFormData(data);

    try {
      const response = await getPlanVariations(data);
      if (response.success && response.data) {
        // We are now only focused on a single variation
        setResult(response.data[0]);
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: "An unknown error occurred.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "An unexpected error occurred while generating plans.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar className="flex flex-col">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Construction 3D</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ConfigPanel form={form} onSubmit={form.handleSubmit(onSubmit)} isLoading={isLoading} />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
           <Button variant="default" type="submit" form="config-form" disabled={isLoading} className="w-full">
            Generate Plan
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 relative">
          <ViewerGrid isLoading={isLoading} result={result} formData={formData} />
          <div className="absolute bottom-6 right-6">
            <AiGeneratorDialog />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
