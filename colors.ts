// Modern learning-themed color palette

// Main colors
export const primary = {
  main: '#4F6CFF', // Bright blue - represents knowledge
  light: '#7B8FFF',
  dark: '#2A49D1',
  contrastText: '#FFFFFF',
  transparent: 'rgba(79, 108, 255, 0.2)' // Semi-transparent version for shadows/overlays
};

export const secondary = {
  main: '#FF7A5A', // Coral orange - represents creativity
  light: '#FF9C85',
  dark: '#E55C3B',
  contrastText: '#FFFFFF'
};

// Accent colors
export const accent = {
  purple: {
    main: '#9776FF', // Purple - represents imagination
    light: '#B59DFF',
    dark: '#7450E8',
    contrastText: '#FFFFFF'
  },
  green: {
    main: '#36D6B7', // Teal - represents growth
    light: '#5DE9CE',
    dark: '#27B79A',
    contrastText: '#FFFFFF'
  },
  yellow: {
    main: '#FFD166', // Yellow - represents inspiration
    light: '#FFDE8A',
    dark: '#FFBA33',
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
  primary: '#333333',
  secondary: '#666666',
  light: '#FFFFFF',
  disabled: '#999999',
  white: '#FFFFFF' // Added for direct reference
};

// Surface colors
export const surface = {
  paper: '#FFFFFF',
  background: '#F8F9FE',
  card: '#FFFFFF',
  border: '#EEEEEE'
}; 

// Additional colors for backgrounds
export const background = {
  default: '#F8F9FE',
  paper: '#FFFFFF',
  lighter: '#F4F6FC',
  lightest: '#FAFBFF',
  hover: '#F0F2FA',
  white: '#FFFFFF'
};

// Border colors
export const border = {
  light: '#EEEEEE',
  medium: '#E0E0E0',
  dark: '#CCCCCC'
}; 