"use client"
import { createTheme, Theme, ThemeOptions } from "@mui/material/styles";
import { PaletteMode } from "@mui/material";

// Create a base theme with common settings
const createAppTheme = (direction: 'ltr' | 'rtl', mode: PaletteMode = 'light'): Theme => {
  const baseThemeOptions: ThemeOptions = {
    direction,
    breakpoints: {
      values: {
        xs: 0,     // Extra Small (default for MUI)
        sm: 768,   // Mobile
        md: 1024,  // Medium Desktop
        lg: 1440,  // Large Desktop
        xl: 1920,  // Extra Large (keep for consistency)
      },
    },
    palette: {
      mode,
    },
    // Additional theming options can be added here
  };

  return createTheme(baseThemeOptions);
};

// Default theme is LTR
const ltrTheme = createAppTheme('ltr');

// RTL theme variation
const rtlTheme = createAppTheme('rtl');

export { ltrTheme, rtlTheme, createAppTheme };
export default ltrTheme;
