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

export const StyledNavbar = styled(Box)`
  width: 200px;
  background-color: ${({ theme }) => theme.palette.background.paper};
  height: 100vh;
  // position: fixed;
  // top: 0;
  // left: 0;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};

`;

export const NavList = styled(List)`
  padding-top: ${({ theme }) => theme.spacing(2)};
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
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </NavList>
    </StyledNavbar>
  );
};

export default Navbar;
