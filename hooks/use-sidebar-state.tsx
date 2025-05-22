"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarStateContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined);

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const toggleCollapsed = () => {
    setIsCollapsed(prev => !prev);
  };
  
  return (
    <SidebarStateContext.Provider value={{ isCollapsed, setIsCollapsed, toggleCollapsed }}>
      {children}
    </SidebarStateContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext);
  
  if (context === undefined) {
    throw new Error("useSidebarState must be used within a SidebarStateProvider");
  }
  
  return context;
} 