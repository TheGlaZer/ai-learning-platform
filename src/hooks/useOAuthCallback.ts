"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // For Next.js 13+ in the app directory; if using pages directory, import from "next/router"
import { supabase } from "../app/lib-server/supabaseClient";

export function useOAuthCallback(redirectUrl: string = "/dashboard") {
  const router = useRouter();

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
          // Note: Depending on your Supabase version, you may need to adjust the session object.
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            console.error("Error setting session:", error.message);
          } else {
            console.log("Session successfully set:", data);
          }
        }

        // Clean up the URL (remove the hash fragment)
        window.history.replaceState(null, "", window.location.pathname);

        // Redirect to the specified page (default: /dashboard)
        router.push(redirectUrl);
      }
    }

    handleOAuthCallback();
  }, [router, redirectUrl]);
}
