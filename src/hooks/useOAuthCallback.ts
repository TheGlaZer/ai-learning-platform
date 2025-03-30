"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { supabase } from "../app/lib-server/supabaseClient";
import { useAuth } from "../contexts/AuthContext";

export function useOAuthCallback(redirectUrl: string = "/dashboard") {
  const router = useRouter();
  const { updateAuthState } = useAuth();

  useEffect(() => {
    async function handleOAuthCallback() {
      // Check if the URL hash contains an access token
      if (window.location.hash.includes("access_token")) {
        // Remove the leading '#' and parse the URL hash parameters
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          // Manually set the session using the parsed tokens.
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            console.error("Error setting session:", error.message);
          } else {
            console.log("Session successfully set:", data);
            
            // Save tokens to global context
            if (data.session) {
              updateAuthState(
                data.session.access_token,
                data.session.refresh_token,
                data.user?.id || null
              );
            }
          }
        }

        // Clean up the URL (remove the hash fragment)
        window.history.replaceState(null, "", window.location.pathname);

        // Redirect to the specified page (default: /dashboard)
        router.push(redirectUrl);
      }
    }
    handleOAuthCallback();
  }, [router, redirectUrl, updateAuthState]);
}
