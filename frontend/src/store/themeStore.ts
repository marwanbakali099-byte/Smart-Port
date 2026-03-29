import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      isDark: true, // dark mode by default (naval theme)
      toggleTheme: () =>
        set((state) => {
          const newDark = !state.isDark;
          if (newDark) {
            document.documentElement.classList.remove('light');
          } else {
            document.documentElement.classList.add('light');
          }
          return { isDark: newDark };
        }),
    }),
    {
      name: 'smart-port-theme',
      onRehydrateStorage: () => (state) => {
        if (state && !state.isDark) {
          document.documentElement.classList.add('light');
        }
      },
    }
  )
);
