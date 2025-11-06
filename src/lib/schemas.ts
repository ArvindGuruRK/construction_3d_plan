import { z } from "zod";

export const generatePlanSchema = z.object({
  totalArea: z.number().min(50, "Area must be at least 50").max(1500, "Area cannot exceed 1500").optional(),
  roomCounts: z.object({
    Bedroom: z.number().min(0).max(10),
    Bathroom: z.number().min(0).max(10),
    Kitchen: z.number().min(0).max(10),
    LivingRoom: z.number().min(0).max(10),
    DiningRoom: z.number().min(0).max(10),
  }),
});

export type GeneratePlanSchema = z.infer<typeof generatePlanSchema>;
