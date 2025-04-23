// Modern learning-themed color palette with black and gray tones

// Main colors
export const primary = {
  main: '#333333', // Dark gray - primary color
  light: '#555555',
  dark: '#111111',
  contrastText: '#FFFFFF',
  transparent: 'rgba(51, 51, 51, 0.2)' // Semi-transparent version for shadows/overlays
};

export const secondary = {
  main: '#666666', // Medium gray - secondary color
  light: '#888888',
  dark: '#444444',
  contrastText: '#FFFFFF'
};

// Accent colors
export const accent = {
  purple: {
    main: '#444444', // Dark gray - accent
    light: '#666666',
    dark: '#222222',
    contrastText: '#FFFFFF'
  },
  green: {
    main: '#777777', // Medium gray - accent
    light: '#999999',
    dark: '#555555',
    contrastText: '#FFFFFF'
  },
  yellow: {
    main: '#AAAAAA', // Light gray - accent
    light: '#CCCCCC',
    dark: '#888888',
    contrastText: '#333333'
  }
};

// Background gradients
export const gradients = {
  primaryGradient: `linear-gradient(135deg, ${primary.main}, ${accent.purple.main})`,
  secondaryGradient: `linear-gradient(135deg, ${secondary.main}, ${accent.yellow.main})`,
  accentGradient: `linear-gradient(135deg, ${accent.green.main}, ${accent.yellow.main})`,
  heroGradient: `linear-gradient(135deg, ${primary.light}22, ${accent.purple.light}33)`,
  testimonialGradient: `linear-gradient(135deg, ${accent.green.light}22, ${primary.light}33)`,
  ctaGradient: `linear-gradient(135deg, ${primary.main}, ${accent.purple.dark})`,
  featureIconGradient: `linear-gradient(135deg, ${accent.purple.light}33, ${primary.light}22)`,
  textGradient: `linear-gradient(135deg, ${primary.main}, ${accent.purple.main})`
};

// Text colors
export const text = {
  primary: '#111111',
  secondary: '#333333',
  light: '#FFFFFF',
  disabled: '#777777',
  white: '#FFFFFF' // Added for direct reference
};

// Surface colors
export const surface = {
  paper: '#FFFFFF',
  background: '#F5F5F5',
  card: '#FFFFFF',
  border: '#DDDDDD'
}; 

// Additional colors for backgrounds
export const background = {
  default: '#F5F5F5',
  paper: '#FFFFFF',
  lighter: '#F9F9F9',
  lightest: '#FCFCFC',
  hover: '#EEEEEE',
  white: '#FFFFFF'
};

// Border colors
export const border = {
  light: '#DDDDDD',
  medium: '#CCCCCC',
  dark: '#AAAAAA'
};