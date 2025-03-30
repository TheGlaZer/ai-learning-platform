"use client";

import React from "react";
import { Box } from "@mui/material";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ 
      display: "flex", 
      minHeight: "100vh",
      alignItems: "center",
      justifyContent: "center"
    }}>
      {children}
    </Box>
  );
};

export default AuthLayout;