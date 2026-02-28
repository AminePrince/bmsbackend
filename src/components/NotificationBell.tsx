import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { api } from '../services/api.service';
import { Notification } from '../types';
import { cn } from './ui';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all', {});
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-700"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-gray-400">Aucune notification</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors relative group",
                      !n.read && "bg-blue-50/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className={cn("text-xs font-bold", n.read ? "text-gray-700" : "text-blue-900")}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <button 
                          onClick={() => markAsRead(n.id)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{n.message}</p>
                    <p className="text-[9px] text-gray-400">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
