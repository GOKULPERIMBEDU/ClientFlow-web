import { WelcomeGuide } from "@/components/guide/WelcomeGuide";
import { ToastProvider } from "@/components/ui/Toast";
import { GuideProvider } from "@/context/GuideContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { TeamProvider } from "@/context/TeamContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ProfileProvider>
        <TeamProvider>
        <GuideProvider>
          {children}
          <WelcomeGuide />
        </GuideProvider>
        </TeamProvider>
      </ProfileProvider>
    </ToastProvider>
  );
}
