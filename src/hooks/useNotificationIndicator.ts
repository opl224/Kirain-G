
'use client';

import { useState, useEffect, useCallback } from 'react';

interface IndicatorState {
  hasUnreadNotifications: boolean;
  hasNewPosts: boolean;
}

export function useNotificationIndicator(): IndicatorState {
  const [indicators, setIndicators] = useState<IndicatorState>({
    hasUnreadNotifications: false,
    hasNewPosts: false,
  });

  const updateIndicators = useCallback(() => {
    const newUnread = localStorage.getItem('hasUnreadNotifications') === 'true';
    const newPosts = localStorage.getItem('hasNewPosts') === 'true';

    setIndicators(prev => {
        if (prev.hasUnreadNotifications !== newUnread || prev.hasNewPosts !== newPosts) {
            return {
                hasUnreadNotifications: newUnread,
                hasNewPosts: newPosts,
            };
        }
        return prev;
    });
  }, []);

  useEffect(() => {
    // Initial check on mount, guaranteed to be client-side
    updateIndicators();

    // Listen for custom event
    window.addEventListener('storageUpdated', updateIndicators);

    // Also listen for direct storage changes from other tabs
    window.addEventListener('storage', updateIndicators);

    return () => {
      window.removeEventListener('storageUpdated', updateIndicators);
      window.removeEventListener('storage', updateIndicators);
    };
  }, [updateIndicators]);

  return indicators;
}
