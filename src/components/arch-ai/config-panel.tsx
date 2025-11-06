"use client";

import type { UseFormReturn } from "react-hook-form";
import type { GeneratePlanSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { CounterInput } from "./counter-input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConfigPanelProps {
  form: UseFormReturn<Omit<GeneratePlanSchema, 'totalArea'>>;
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

  return (
    <ScrollArea className="h-full">
      <Form {...form}>
        <form id="config-form" onSubmit={onSubmit} className="space-y-6 p-4">
          <fieldset disabled={isLoading} className="space-y-6">
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
