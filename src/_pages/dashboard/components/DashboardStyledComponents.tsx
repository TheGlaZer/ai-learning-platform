import styled from '@emotion/styled';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Paper,
  Tabs,
  Tab,
  Button,
  IconButton,
  Avatar,
  Fab,
  Chip,
  Grid
} from '@mui/material';
import { primary, secondary, accent, text, surface, gradients } from '../../../../colors';

// Main container styling
export const DashboardContainer = styled(Box)`
  padding: 1rem;
`;

export const ContentPaper = styled(Paper)`
  border-radius: 12px;
  padding: 1.5rem;
  min-height: 400px;
  max-height: calc(100vh - 140px);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  background-color: ${surface.paper};
  display: flex;
  flex-direction: column;
`;

export const ContentScrollArea = styled(Box)`
  overflow-y: auto;
  flex-grow: 1;
  margin: 0 -1.5rem;
  padding: 0 1.5rem;
  scrollbar-width: thin;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${surface.background}; 
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: ${primary.light}33;
    border-radius: 20px;
  }
`;

// Header section
export const HeaderContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

export const WorkspaceTitle = styled(Typography)`
  font-weight: 700;
  color: ${text.primary};
  background: ${gradients.textGradient};
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`;

export const WorkspaceDescription = styled(Typography)`
  color: ${text.secondary};
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
`;

export const ButtonGroup = styled(Box)`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

// Tabs styling
export const StyledTabs = styled(Tabs)`
  margin-bottom: 1.5rem;
  
  .MuiTabs-indicator {
    background: ${gradients.primaryGradient};
    height: 3px;
    border-radius: 3px;
  }
`;

export const StyledTab = styled(Tab)`
  text-transform: none;
  font-weight: 500;
  color: ${text.secondary};
  
  &.Mui-selected {
    color: ${primary.main};
    font-weight: 600;
  }
`;

// Card styling
export const BaseCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
`;

export const CardHeader = styled(Box)`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

export const CardTitleContainer = styled(Box)`
  display: flex;
  align-items: center;
  max-width: calc(100% - 40px);
`;

export const CardIconAvatar = styled(Avatar)`
  width: 32px;
  height: 32px;
  margin-right: 0.75rem;
  font-size: 1rem;
`;

export const CardTitle = styled(Typography)`
  font-weight: 600;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const CardMenuButton = styled(IconButton)`
  padding: 4px;
  margin-left: auto;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

export const CardFooter = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
`;

export const CardDate = styled(Typography)`
  color: ${text.secondary};
  font-size: 0.7rem;
`;

export const CardChip = styled(Chip)`
  height: 20px;
  font-size: 0.65rem;
  
  .MuiChip-label {
    padding: 0 0.5rem;
  }
`;

// Empty state styling
export const EmptyStateContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1rem;
  background-color: ${surface.background}11;
  border-radius: 12px;
  margin: 1rem 0;
`;

export const EmptyStateText = styled(Typography)`
  color: ${text.secondary};
  margin-bottom: 1.5rem;
  max-width: 400px;
`;

export const AddButtonBox = styled(Box)`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed ${primary.light}66;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${primary.main};
    background-color: ${primary.light}11;
    transform: translateY(-4px);
  }
`;

// Action buttons
export const PrimaryButton = styled(Button)`
  background: ${gradients.primaryGradient};
  text-transform: none;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px ${primary.main}33;
  
  &:hover {
    box-shadow: 0 6px 12px ${primary.main}55;
  }
`;

export const SecondaryButton = styled(Button)`
  text-transform: none;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  border-color: ${primary.main};
  color: ${primary.main};
  
  &:hover {
    background-color: ${primary.main}11;
  }
`;

export const ActionFab = styled(Fab)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: ${gradients.primaryGradient};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  
  &:hover {
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
  }
`;

export const GridContainer = styled(Grid)`
  margin-top: 1rem;
`;

export const ResponsiveGrid = styled(Grid)`
  display: flex;
  flex-direction: column;
  height: 100%;
`; 