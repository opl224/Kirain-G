
'use client';

import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';

export function DarkModeSwitch() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Switch id="dark-mode-switch" disabled />;
  }

  const isDarkMode = theme === 'dark';

  const handleCheckedChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <Switch
      id="dark-mode-switch"
      checked={isDarkMode}
      onCheckedChange={handleCheckedChange}
    />
  );
}
