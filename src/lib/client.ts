import { QueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/generated/supabase";

export const queryClient = new QueryClient();
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
