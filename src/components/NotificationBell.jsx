import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useUser } from "@clerk/clerk-react";
import { useAuth } from "@clerk/clerk-react";
import { getNotifications, markNotificationAsRead } from '@/api/apiApplication';

export function NotificationBell() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await getToken({ template: "supabase" });
        const data = await getNotifications(user.id, token);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    if (user) {
      fetchNotifications();
      // Refresh notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        const token = await getToken({ template: "supabase" });
        await markNotificationAsRead(notification.id, token);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => prev - 1);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Notifications</DrawerTitle>
          <DrawerDescription>
            Stay updated with your job postings
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-4">
          {notifications.length === 0 ? (
            <p className="text-center text-gray-500">No notifications</p>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {notification.message}
                </p>
                {notification.type === 'application' && notification.data && (
                  <div className="mt-2 text-sm">
                    <p><strong>Email:</strong> {notification.data.candidate_email}</p>
                    {notification.data.files && (
                      <p><strong>Files:</strong> {notification.data.files.join(', ')}</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 