"use client";

import type { ReactNode } from "react";
import { AppProvider } from "./app-context";
import { WorkspaceProvider } from "./workspace-context";
import Overlays from "./overlays";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <WorkspaceProvider>
        {children}
        <Overlays />
      </WorkspaceProvider>
    </AppProvider>
  );
}
