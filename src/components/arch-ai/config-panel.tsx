
"use client";

import type { UseFormReturn } from "react-hook-form";
import type { GeneratePlanSchema } from "@/lib/schemas";
import { generatePlanSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { CounterInput } from "./counter-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

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
  const watchRoomCounts = form.watch("roomCounts");

  return (
    <ScrollArea className="h-full">
      <Form {...form}>
        <form id="config-form" onSubmit={onSubmit} className="space-y-6 p-4">
          <fieldset disabled={isLoading} className="space-y-6">
            <div className="space-y-2">
               <FormField
                  control={form.control}
                  name="totalArea"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                         <FormLabel>Total Area (sqft)</FormLabel>
                         <span className="text-sm font-medium text-muted-foreground">{field.value} sqft</span>
                      </div>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          min={500}
                          max={5000}
                          step={50}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Rooms</h3>
              {roomTypes.map((room) => (
                <div key={room} className="space-y-3">
                  <FormField
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
                  {watchRoomCounts[room] > 0 && (
                     <FormField
                      control={form.control}
                      name={`roomSqft.${room}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <FormLabel>Avg. Size</FormLabel>
                            <span>{field.value} sqft</span>
                          </div>
                          <FormControl>
                            <Slider
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              min={generatePlanSchema.shape.roomSqft.shape[room]._def.checks.find(c => c.kind === 'min')?.value}
                              max={generatePlanSchema.shape.roomSqft.shape[room]._def.checks.find(c => c.kind === 'max')?.value}
                              step={10}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        </form>
      </Form>
    </ScrollArea>
  );
}
