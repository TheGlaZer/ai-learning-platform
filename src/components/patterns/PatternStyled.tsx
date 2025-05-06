import { 
  Card, 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  LinearProgress 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as colors from '../../../colors';

// Styled components
export const PatternCard = styled(Card)(({ theme }) => ({
  marginBottom: '20px',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  }
}));

export const CardTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 600,
}));

export const ChartContainer = styled(Box)(({ theme }) => ({
  marginTop: '16px',
  height: '250px',
  width: '100%',
}));

export const PatternMetric = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '8px',
}));

export const PatternMetricLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  marginRight: '8px',
  minWidth: '180px',
}));

export const PatternMetricValue = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
}));

export const ConfidenceBar = styled(LinearProgress)<{ value: number }>(({ theme, value }) => ({
  flex: 1,
  height: '10px',
  borderRadius: '5px',
  backgroundColor: colors.background.lighter,
  '& .MuiLinearProgress-bar': {
    backgroundColor: 
      value >= 80 ? '#4caf50' : // Using direct color values instead of colors.success.main
      value >= 60 ? colors.primary.main : 
      value >= 40 ? '#ff9800' : // Using direct color values instead of colors.warning.main
      '#f44336', // Using direct color values instead of colors.error.main
  }
}));

export const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: '24px',
  '& .MuiTabs-indicator': {
    backgroundColor: colors.primary.main,
  },
}));

export const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  textTransform: 'none',
  minWidth: '120px',
})); 