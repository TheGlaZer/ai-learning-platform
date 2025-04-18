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
  Grid,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon
} from '@mui/material';
import { primary, secondary, accent, text, surface, gradients } from '../../../../colors';

// Main container styling
export const DashboardContainer = styled(Box)`
  border: none;
  height: 100%;
  transition: all 0.3s ease;
`;

export const ContentPaper = styled(Paper)`
  height: 100%;
  background-color: transparent;
  padding: 1.5rem;
  padding-top: 0px;
  padding-left: 12px;
  border: none;
  min-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: none;
`;

export const ContentScrollArea = styled(Box)`
  overflow-y: auto;
  flex-grow: 1;
  margin: 0 -1.5rem;
  padding: 0 1.5rem;
  scrollbar-width: thin;
  
  // &::-webkit-scrollbar {
  //   width: 6px;
  // }
  
  // &::-webkit-scrollbar-track {
  //   background: ${surface.background}; 
  // }
  
  // &::-webkit-scrollbar-thumb {
  //   background-color: ${primary.light}33;
  //   border-radius: 20px;
  // }
`;

// Header section
export const HeaderContainer = styled(Box)<{ isRTL: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  padding-top: 1.5rem;
  padding-left: ${({ isRTL }) => isRTL ? '0' : '2rem'};
  padding-right: ${({ isRTL }) => isRTL ? '2rem' : '0'};
`;

export const WorkspaceTitle = styled(Typography)`
  font-weight: 700;
  color: ${text.primary};
  background: ${gradients.textGradient};
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 2.3rem;
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

// New Action Menu styling
export const ActionMenuButton = styled(IconButton)`
  background: ${gradients.primaryGradient};
  border-radius: 50%;
  color: ${text.white};
  padding: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }
`;

export const ActionMenuAvatar = styled(Avatar)`
  width: 50px;
  height: 50px;
  background: ${gradients.primaryGradient};
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }
`;

export const StyledMenu = styled(Menu)`
  .MuiPaper-root {
    border-radius: 12px;
    min-width: 230px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    overflow: visible;
    
    &:before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      right: 14px;
      width: 10px;
      height: 10px;
      background-color: ${surface.paper};
      transform: translateY(-50%) rotate(45deg);
      z-index: 0;
    }
  }
`;

export const StyledMenuItem = styled(MenuItem)<{ color?: string }>`
  padding: 12px 16px;
  transition: background-color 0.2s;
  
  .MuiListItemIcon-root {
    color: ${props => props.color || primary.main};
    min-width: 42px;
  }
  
  .MuiTypography-root {
    font-weight: 500;
    color: ${text.primary};
  }
  
  &:hover {
    background-color: ${surface.background}80;
  }
`;

export const MenuDivider = styled(Box)`
  height: 1px;
  background-color: ${surface.border};
  margin: 8px 16px;
`;

export const StyledSpeedDial = styled(SpeedDial)`
  position: absolute;
  right: 16px;
  top: -28px;
  
  .MuiFab-primary {
    background: ${gradients.primaryGradient};
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  
  .MuiSpeedDialAction-staticTooltipLabel {
    background-color: ${surface.paper};
    color: ${text.primary};
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 6px 12px;
    border-radius: 6px;
  }
`;

// Tabs styling
export const StyledTabs = styled(Tabs)<{ isRTL: boolean }>`
  // margin-bottom: 1.5rem;
  width: 75%;
  margin-left: ${({ isRTL }) => isRTL ? 'auto' : '0'};
  margin-right: ${({ isRTL }) => isRTL ? '0' : 'auto'};
  
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
  overflow: visible;
  margin-bottom: 1rem;
  height: auto;
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
  margin-left: 0.75rem;
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
  border: 2px dashed ${accent.green.light};
  border-radius: 8px;
  padding: 0.8rem 1rem 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: transparent;
  position: relative;
  
  &:hover {
    border-color: ${accent.green.main};
    background-color: ${accent.green.light}11;
  }
`;

// Action buttons
export const PrimaryButton = styled(Button)`
  background: ${gradients.primaryGradient};
  color: ${text.white};
  text-transform: none;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px ${primary.main}33;
  
  .MuiButton-startIcon {
    margin-right: 8px;
    margin-left: 8px;
  }
  
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
  
  .MuiButton-startIcon {
    margin-right: 8px;
    margin-left: 8px;
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

// Section styling
export const SectionContainer = styled(Box)`
  margin-bottom: 2rem;
`;

export const SectionTitle = styled(Typography)`
  margin-bottom: 1rem;
  font-weight: 600;
  color: ${text.primary};
  padding-left: 0.5rem;
`; 