
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function DarkModeSwitch() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render a placeholder or null on the server
    return <div style={{width: '3.5em', height: '2em'}}></div>;
  }

  const isDarkMode = theme === 'dark';

  const handleCheckedChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <label htmlFor="dark-mode-switch" className="switch">
      <input 
        id="dark-mode-switch" 
        type="checkbox" 
        checked={isDarkMode}
        onChange={(e) => handleCheckedChange(e.target.checked)}
        />
      <span className="slider"></span>
      <span className="decoration"></span>
    </label>
  );
}
