"use client";

import React from "react";
import AppLayout from "./AppLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
};

export default DashboardLayout;