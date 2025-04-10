"use client";

import { CircularProgress, Box } from "@mui/material";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";

export default function OAuthCallback() {
  // Use the hook to process the OAuth tokens and redirect to dashboard
  useOAuthCallback("/dashboard");

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <CircularProgress />
    </Box>
  );
}
