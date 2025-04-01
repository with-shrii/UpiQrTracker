import * as React from "react";
import { useToast as useToastOriginal } from "@/components/ui/use-toast";

// Re-export the useToast hook
export const useToast = () => {
  return useToastOriginal();
}
