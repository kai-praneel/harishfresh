import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminStore {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      token: null,
      username: null,
      isAuthenticated: false,
      login: (token, username) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("hf_admin_token", token);
        }
        set({ token, username, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("hf_admin_token");
        }
        set({ token: null, username: null, isAuthenticated: false });
      },
    }),
    { name: "harishfresh-admin" }
  )
);
