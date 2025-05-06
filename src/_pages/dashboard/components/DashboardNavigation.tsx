"use client";
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton, 
  Divider 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  InsertDriveFile as InsertDriveFileIcon,
  AutoAwesome as AutoAwesomeIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { usePathname } from 'next/navigation';
import { styled } from '@mui/material/styles';
import * as colors from '../../../../colors';

const NavList = styled(List)`
  padding-top: 0;
`;

const NavItem = styled(ListItemButton)<{ active?: boolean }>`
  border-radius: 8px;
  margin: 4px 8px;
  padding: 8px 16px;
  background-color: ${props => props.active ? colors.primary.transparent : 'transparent'};
  
  &:hover {
    background-color: ${props => props.active ? colors.primary.transparentHover : colors.background.hover};
  }
  
  .MuiListItemIcon-root {
    color: ${props => props.active ? colors.primary.main : colors.text.secondary};
    min-width: 40px;
  }
  
  .MuiListItemText-primary {
    font-weight: ${props => props.active ? 600 : 400};
    color: ${props => props.active ? colors.primary.main : colors.text.primary};
  }
`;

const DashboardNavigation: React.FC = () => {
  const params = useParams();
  const pathname = usePathname();
  const t = useTranslations('Navigation');
  
  const locale = params?.locale as string;
  const workspaceId = params?.workspaceId as string;
  
  const navigationItems = [
    {
      path: `/${locale}/dashboard/${workspaceId}`,
      text: t('dashboard'),
      icon: <DashboardIcon />
    },
    {
      path: `/${locale}/dashboard/${workspaceId}/subjects`,
      text: t('subjects'),
      icon: <SchoolIcon />
    },
    {
      path: `/${locale}/dashboard/${workspaceId}/quizzes`,
      text: t('quizzes'),
      icon: <QuizIcon />
    },
    {
      path: `/${locale}/dashboard/${workspaceId}/past-exams`,
      text: t('pastExams'),
      icon: <InsertDriveFileIcon />
    },
    {
      path: `/${locale}/dashboard/${workspaceId}/patterns`,
      text: t('examPatterns'),
      icon: <AutoAwesomeIcon />
    },
    {
      path: `/${locale}/dashboard/${workspaceId}/analytics`,
      text: t('analytics'),
      icon: <AnalyticsIcon />
    },
  ];
  
  return (
    <Box component="nav" sx={{ width: '100%' }}>
      <NavList>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Link href={item.path} style={{ width: '100%', textDecoration: 'none' }}>
              <NavItem active={pathname === item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </NavItem>
            </Link>
          </ListItem>
        ))}
      </NavList>
      <Divider sx={{ my: 2 }} />
    </Box>
  );
};

export default DashboardNavigation; 