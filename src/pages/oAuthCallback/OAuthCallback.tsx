"use client";

import { CircularProgress, Box } from "@mui/material";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";

export default function OAuthCallback() {
  // The hook will process the tokens and redirect the user.
  useOAuthCallback("/");

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <CircularProgress />
    </Box>
  );
}
