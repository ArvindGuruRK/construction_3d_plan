import { z } from "zod";

export const generatePlanSchema = z.object({
  totalArea: z.number().min(500, "Area must be at least 500").max(5000, "Area cannot exceed 5000"),
  roomCounts: z.object({
    Bedroom: z.number().min(0).max(10),
    Bathroom: z.number().min(0).max(10),
    Kitchen: z.number().min(0).max(10),
    LivingRoom: z.number().min(0).max(10),
    DiningRoom: z.number().min(0).max(10),
  }),
  roomSqft: z.object({
    Bedroom: z.number().min(60).max(500),
    Bathroom: z.number().min(30).max(200),
    Kitchen: z.number().min(50).max(400),
    LivingRoom: z.number().min(100).max(1000),
    DiningRoom: z.number().min(80).max(500),
  })
});

export type GeneratePlanSchema = z.infer<typeof generatePlanSchema>;
