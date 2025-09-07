"use client";

import * as React from "react";
import { Button } from "./button";
import { PanelLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "./utils";

interface SimpleSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function SimpleSidebar({ children, className }: SimpleSidebarProps) {
  // Start with sidebar closed by default
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Keyboard shortcut to toggle sidebar (Ctrl+B or Cmd+B)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative overflow-hidden",
          isOpen ? "w-64" : "w-0",
          className
        )}
      >
        <div className="flex h-full flex-col min-w-64">
          {/* Header */}
          <div className="border-b border-sidebar-border p-4">
            <div className="flex items-center justify-between">
              {isOpen && (
                <h2 className="text-sidebar-foreground font-bold text-lg transition-opacity duration-200">
                  Shankh
                </h2>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 hover:bg-sidebar-accent hover:text-sidebar-accent hover:text-sidebar-accent-foreground transition-colors relative group"
                title={`${isOpen ? "Collapse" : "Expand"} Sidebar (Ctrl+B)`}
              >
                {isOpen ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-sidebar-primary text-sidebar-primary-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {isOpen ? "Collapse" : "Expand"} Sidebar
                  <div className="text-xs opacity-75">Ctrl+B</div>
                </div>
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className={cn(
              "transition-opacity duration-200",
              isOpen ? "opacity-100" : "opacity-0"
            )}>
              {children}
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <div className={cn(
              "transition-opacity duration-200",
              isOpen ? "opacity-100" : "opacity-0"
            )}>
              <div className="text-xs text-sidebar-foreground/60 text-center">
                Dashboard v1.0
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar toggle button when collapsed */}
      {!isOpen && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-12 w-12 bg-sidebar border-r border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors rounded-r-lg"
            title="Expand Sidebar (Ctrl+B)"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
