import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Profile, UpdateProfileInput } from "@/types/domain";

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<Profile>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.profile.get();
      setProfile(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const data = await api.profile.update(input);
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ profile, loading, error, refresh, updateProfile }),
    [profile, loading, error, refresh, updateProfile],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
