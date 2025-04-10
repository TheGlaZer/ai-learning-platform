"use client";

import React from "react";
import AppLayout from "./AppLayout";

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

const AnalyticsLayout: React.FC<AnalyticsLayoutProps> = ({ children }) => {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
};

export default AnalyticsLayout; 