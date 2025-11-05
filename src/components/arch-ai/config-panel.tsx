"use client";

import type { UseFormReturn } from "react-hook-form";
import type { GeneratePlanSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { CounterInput } from "./counter-input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConfigPanelProps {
  form: UseFormReturn<GeneratePlanSchema>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

const roomTypes: (keyof GeneratePlanSchema["roomCounts"])[] = [
  "Bedroom",
  "Bathroom",
  "Kitchen",
  "LivingRoom",
  "DiningRoom",
];

export function ConfigPanel({ form, onSubmit, isLoading }: ConfigPanelProps) {
  const unit = "ft²";

  return (
    <ScrollArea className="h-full">
      <Form {...form}>
        <form id="config-form" onSubmit={onSubmit} className="space-y-6 p-4">
          <fieldset disabled={isLoading} className="space-y-6">
            <FormField
              control={form.control}
              name="totalArea"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Total Area</FormLabel>
                    <span className="text-sm text-muted-foreground">{field.value} {unit}</span>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      min={50}
                      max={1500}
                      step={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Rooms</h3>
              {roomTypes.map((room) => (
                <FormField
                  key={room}
                  control={form.control}
                  name={`roomCounts.${room}`}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel className="font-normal">
                        {room.replace(/([A-Z])/g, " $1").trim()}
                      </FormLabel>
                      <FormControl>
                        <CounterInput
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </fieldset>
        </form>
      </Form>
    </ScrollArea>
  );
}
