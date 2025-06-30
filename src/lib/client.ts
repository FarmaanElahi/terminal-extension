import { QueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/generated/supabase";
export const API_BASE_URL =
  typeof window !== "undefined"
    ? localStorage.getItem("BASE_API_URL") || import.meta.env.VITE_BASE_API_URL
    : import.meta.env.VITE_BASE_API_URL;

export const queryClient = new QueryClient();
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
