import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    try {
      const saved = window.localStorage.getItem('theme');
      return (saved as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Remove any existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    // Add the current theme class
    document.documentElement.classList.add(theme);

    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      // Ignore write errors (e.g. disabled localStorage)
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="glass-professional p-3 rounded-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-5 h-5 transition-all duration-500 text-amber-500 ${
            theme === 'light' ? 'rotate-0 opacity-100 scale-100' : 'rotate-90 opacity-0 scale-75'
          }`}
        />
        <Moon
          className={`absolute inset-0 w-5 h-5 transition-all duration-500 text-blue-400 ${
            theme === 'dark' ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'
          }`}
        />
      </div>
      {/* Add glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
    </button>
  );
}
