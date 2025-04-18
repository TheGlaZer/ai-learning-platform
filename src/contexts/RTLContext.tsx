"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

// Define the RTL context type
type RTLContextType = {
  isRTL: boolean;
  direction: 'rtl' | 'ltr';
  toggleDirection: () => void;
};

// Create the context with default values
const RTLContext = createContext<RTLContextType>({
  isRTL: false,
  direction: 'ltr',
  toggleDirection: () => {},
});

// RTL languages list
const RTL_LANGUAGES = ['he', 'ar', 'fa'];

// Hook to use the RTL context
export const useRTL = () => useContext(RTLContext);

export const RTLProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const locale = useLocale();
  
  const [isRTL, setIsRTL] = useState<boolean>(RTL_LANGUAGES.includes(locale));

  useEffect(() => {
    // Set the dir attribute on the html element
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Clean up when component unmounts
    return () => {
      document.documentElement.dir = 'ltr';
    };
  }, [isRTL, locale, pathname]);

  const toggleDirection = () => {
    setIsRTL((prev) => !prev);
    document.documentElement.dir = !isRTL ? 'rtl' : 'ltr';
  };

  return (
    <RTLContext.Provider value={{ 
      isRTL, 
      direction: isRTL ? 'rtl' : 'ltr',
      toggleDirection 
    }}>
      {children}
    </RTLContext.Provider>
  );
};

export default RTLProvider; 