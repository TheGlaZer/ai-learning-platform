"use client"
import { createTheme } from "@mui/material/styles";

// Define custom breakpoints including required xs and xl
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,     // Extra Small (default for MUI)
      sm: 768,   // Mobile
      md: 1024,  // Medium Desktop
      lg: 1440,  // Large Desktop
      xl: 1920,  // Extra Large (keep for consistency)
    },
  },
});

export default theme;
