'use client';

import { useTheme } from '../context/ThemeContext';

/**
 * ThemeToggle component for switching between light and dark modes.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`theme-toggle ${theme === 'dark' ? 'dark' : ''}`}
      onClick={toggleTheme}
      role="button"
      aria-label="Toggle theme"
    />
  );
}