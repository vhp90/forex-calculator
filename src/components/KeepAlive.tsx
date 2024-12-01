'use client';

import { useEffect } from 'react';

export function KeepAlive() {
  useEffect(() => {
    // Function to ping the uptime endpoint
    const pingServer = async () => {
      try {
        await fetch('/api/uptime');
      } catch (error) {
        console.error('Error pinging server:', error);
      }
    };

    // Ping immediately
    pingServer();

    // Set up interval to ping every 5 minutes
    const interval = setInterval(pingServer, 5 * 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  // This component doesn't render anything
  return null;
}
