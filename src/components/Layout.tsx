// src/components/Layout.tsx
"use client";

import React from "react";
import { Box } from "@mui/material";
import Header from "./Header";
import Navbar from "./Navbar";
import PageContainer from "./PageContainer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box>
      <Header />
      <Box sx={{ display: "flex", pt: 8 }}>
        {/* <Navbar /> */}
        <PageContainer>
        {children}
      </PageContainer>
      </Box>
    </Box>
  );
};

export default Layout;
