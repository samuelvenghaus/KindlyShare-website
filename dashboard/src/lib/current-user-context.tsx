"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface CurrentUser {
  name: string;
  email: string;
  role: "owner" | "member";
}

const CurrentUserContext = createContext<CurrentUser | null>(null);

export function CurrentUserProvider({ user, children }: { user: CurrentUser; children: ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext);
  if (!user) {
    throw new Error("useCurrentUser moet binnen een CurrentUserProvider gebruikt worden.");
  }
  return user;
}
