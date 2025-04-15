// src/components/Navbar.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import styled from "@emotion/styled"; // Still use Emotion's styled
import { useAuth } from "@/contexts/AuthContext";
import { primary, accent, surface, text, background } from "../../colors";

export const StyledNavbar = styled(Box)`
  width: 200px;
  background-color: ${surface.paper};
  height: 100vh;
  // position: fixed;
  // top: 0;
  // left: 0;
  border-right: 1px solid ${surface.border};

`;

export const NavList = styled(List)`
  padding-top: 16px;
`;

const StyledListItemButton = styled(ListItemButton)`
  &:hover {
    background-color: ${background.hover};
  }
  
  &.active {
    background-color: ${primary.light}22;
    
    .MuiListItemIcon-root {
      color: ${primary.main};
    }
    
    .MuiListItemText-primary {
      color: ${text.primary};
      font-weight: 600;
    }
  }
`;

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
  { label: "Analytics", href: "/analytics", icon: <BarChartIcon /> },
  // Add more nav items here later
];

const Navbar: React.FC = () => {
  const { userId } = useAuth();
  
  return (
    <StyledNavbar>
      <NavList>
        {navItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <Link href={item.href} passHref legacyBehavior>
              <StyledListItemButton>
                <ListItemIcon sx={{ minWidth: 40, color: accent.purple.main }}>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ 
                    style: { 
                      color: text.secondary,
                      fontSize: '0.95rem',
                    } 
                  }} 
                />
              </StyledListItemButton>
            </Link>
          </ListItem>
        ))}
      </NavList>
    </StyledNavbar>
  );
};

export default Navbar;
