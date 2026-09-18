"use client";

import { WelcomeGuide } from "@/components/guide/WelcomeGuide";
import { ToastProvider } from "@/components/ui/Toast";
import { GuideProvider } from "@/context/GuideContext";
import { ProfileProvider } from "@/context/ProfileContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ProfileProvider>
        <GuideProvider>
          {children}
          <WelcomeGuide />
        </GuideProvider>
      </ProfileProvider>
    </ToastProvider>
  );
}
