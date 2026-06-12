"use client";
import { useEffect } from "react";
import { initSocket } from "@/lib/ws";

export default function NotificationClient({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;
    const s = initSocket();
    s.on('connect', () => {
      console.log('WS connected', s.id);
      s.emit('join', userId);
    });
    s.on('notification', (n: any) => {
      console.log('WS notification', n);
      if (Notification && Notification.permission === 'granted') {
        new Notification(n.title, { body: n.message });
      }
    });

    return () => {
      if (s) s.off('notification');
    };
  }, [userId]);

  return null;
}
