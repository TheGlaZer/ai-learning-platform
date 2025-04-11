"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircularProgress, Box } from "@mui/material";
import { supabase } from "@/app/lib-server/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export default function OAuthCallback() {
  const router = useRouter();
  const { updateAuthState } = useAuth();

  useEffect(() => {
    async function handleOAuthCallback() {
      if (window.location.hash.includes("access_token")) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (error) {
            console.error("Error setting session:", error.message);
          } else if (data.session) {
            updateAuthState(
              data.session.access_token,
              data.session.refresh_token,
              data.user?.id || null
            );
          }
        }

        window.history.replaceState(null, "", window.location.pathname);
        router.push("/dashboard");
      }
    }
    handleOAuthCallback();
  }, [router, updateAuthState]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <CircularProgress />
    </Box>
  );
} 