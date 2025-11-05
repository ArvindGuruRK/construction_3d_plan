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

export default function Home() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<ImagePlaceholder[]>([]);
  const { toast } = useToast();

  const form = useForm<GeneratePlanSchema>({
    resolver: zodResolver(generatePlanSchema),
    defaultValues: {
      totalArea: 300,
      roomCounts: {
        Bedroom: 1,
        Bathroom: 1,
        Kitchen: 1,
        LivingRoom: 1,
        DiningRoom: 1,
      },
    },
  });

  const onSubmit = async (data: GeneratePlanSchema) => {
    setIsLoading(true);
    setResults([]);
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      const response = await getPlanVariations(data);
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: response.error || "An unknown error occurred.",
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
            <h1 className="text-xl font-semibold font-headline">builderAI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ConfigPanel form={form} onSubmit={form.handleSubmit(onSubmit)} isLoading={isLoading} />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t">
           <Button variant="default" type="submit" form="config-form" disabled={isLoading} className="w-full">
            Generate Plans
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1">
          <ViewerGrid isLoading={isLoading} results={results} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
