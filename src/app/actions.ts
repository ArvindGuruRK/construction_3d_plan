'use server';

import type { GeneratePlanSchema } from '@/lib/schemas';
import { floorPlanImages } from '@/lib/placeholder-images';

export async function getPlanVariations(data: GeneratePlanSchema) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log("Form Data Received:", data);

  // Return static placeholder images instead of calling the AI
  return { success: true, data: floorPlanImages };
}
