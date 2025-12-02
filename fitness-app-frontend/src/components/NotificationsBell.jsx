import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Icon from './Icons';
import logger from '../utils/logger';

const NotificationsBell = React.memo(() => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();
        // Refrescar cada 30 segundos
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications?limit=10');
            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            // Silenciar errores 403/401 ya que son parte del flujo normal de autenticación
            // El interceptor de axios ya maneja estos casos
            if (error.response?.status !== 403 && error.response?.status !== 401) {
                logger.error('Error al cargar notificaciones:', error);
            }
            // Establecer valores por defecto en caso de error
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            setNotifications(prev => 
                prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            // Silenciar errores 403/401
            if (error.response?.status !== 403 && error.response?.status !== 401) {
                logger.error('Error al marcar notificación como leída:', error);
            }
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            // Silenciar errores 403/401
            if (error.response?.status !== 403 && error.response?.status !== 401) {
                logger.error('Error al marcar todas como leídas:', error);
            }
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
            // Actualizar contador si era no leída
            const notification = notifications.find(n => n.notification_id === notificationId);
            if (notification && !notification.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            // Silenciar errores 403/401
            if (error.response?.status !== 403 && error.response?.status !== 401) {
                logger.error('Error al eliminar notificación:', error);
            }
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <Icon name="success" className="w-5 h-5" />;
            case 'warning': return <Icon name="warning" className="w-5 h-5" />;
            case 'achievement': return <Icon name="achievement" className="w-5 h-5" />;
            case 'reminder': return <Icon name="reminder" className="w-5 h-5" />;
            default: return <Icon name="info" className="w-5 h-5" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
            case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
            case 'achievement': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
            case 'reminder': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-600 dark:bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notificaciones
                            {unreadCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-red-600 dark:bg-red-500 text-white text-xs rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                            >
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                                <div className="flex justify-center mb-3">
                                    <Icon name="bell" className="w-12 h-12 text-gray-400 dark:text-gray-600" />
                                </div>
                                <p className="text-sm">No hay notificaciones</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.notification_id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                            !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
                                                {getTypeIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h4 className={`text-sm font-semibold text-gray-900 dark:text-white ${!notification.is_read ? 'font-bold' : ''}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                                        </p>
                                                    </div>
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0 mt-1"></div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => {
                                                            if (!notification.is_read) markAsRead(notification.notification_id);
                                                            if (notification.link_url) {
                                                                window.location.href = notification.link_url;
                                                            }
                                                        }}
                                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                                    >
                                                        {notification.link_url ? 'Ver' : notification.is_read ? 'Leída' : 'Marcar como leída'}
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNotification(notification.notification_id)}
                                                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

NotificationsBell.displayName = 'NotificationsBell';

export default NotificationsBell;

