import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';
import useToastStore from '../stores/useToastStore';
import useUserStore from '../stores/useUserStore';
import logger from '../utils/logger';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';

const RequestCoachAttention = () => {
    const user = useUserStore((state) => state.user);
    const [hasCoach, setHasCoach] = useState(false);
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingCoach, setCheckingCoach] = useState(true);
    const toast = useToastStore();
    
    // Focus trap para mantener el foco dentro del modal
    const contentRef = useFocusTrap(open);
    
    // Cerrar con Escape
    useEscapeKey(() => {
        if (open && !loading) {
            setOpen(false);
        }
    }, open);

    useEffect(() => {
        const checkCoach = async () => {
            if (!user) {
                setHasCoach(false);
                setCheckingCoach(false);
                return;
            }

            // Primero verificar si el usuario ya tiene coach_id en el store
            if (user.coach_id !== undefined && user.coach_id !== null) {
                setHasCoach(!!user.coach_id);
                setCheckingCoach(false);
                return;
            }

            // Si no está en el store, hacer la llamada a la API
            try {
                const response = await api.get('/profile');
                // El endpoint devuelve response.data.profile según index.js línea 170
                const coachId = response.data.profile?.coach_id;
                const hasCoachValue = !!coachId;
                setHasCoach(hasCoachValue);
                
                // Actualizar el store con el coach_id si está disponible
                if (coachId !== undefined && user) {
                    useUserStore.getState().setUser({ ...user, coach_id: coachId });
                }
            } catch (error) {
                logger.error('Error verificando coach:', error);
                setHasCoach(false);
            } finally {
                setCheckingCoach(false);
            }
        };

        checkCoach();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!message.trim()) {
            toast.error('Por favor, escribe un mensaje');
            return;
        }

        setLoading(true);
        try {
            await api.post('/client/request-attention', {
                message: message.trim(),
            });
            toast.success('Solicitud enviada. Tu entrenador te contactará pronto.');
            setMessage('');
            setOpen(false);
        } catch (error) {
            logger.error('Error solicitando atención:', error);
            toast.error(error.response?.data?.error || 'Error al enviar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    // No mostrar el botón si no tiene coach o está verificando
    if (checkingCoach || !hasCoach) {
        return null;
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button
                    className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 w-14 h-14 md:w-16 md:h-16 backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group"
                    aria-label="Solicitar atención del entrenador"
                >
                    <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
                </button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content 
                    ref={contentRef}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl shadow-xl p-6 w-full max-w-md z-50 border border-gray-200/50 dark:border-gray-800/50 focus:outline-none"
                    onEscapeKeyDown={(e) => {
                        if (loading) {
                            e.preventDefault();
                        }
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 backdrop-blur-sm bg-blue-100/60 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
                                <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <Dialog.Title className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
                                    Solicitar Atención
                                </Dialog.Title>
                                <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Envía un mensaje a tu entrenador
                                </Dialog.Description>
                            </div>
                        </div>
                        <Dialog.Close asChild>
                            <button 
                                className="w-10 h-10 rounded-xl backdrop-blur-sm bg-gray-100/60 dark:bg-gray-800/60 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 border border-gray-200/50 dark:border-gray-800/50 flex items-center justify-center transition-all text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                aria-label="Cerrar modal de solicitud"
                                disabled={loading}
                            >
                                <X className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulario de solicitud de atención">
                        <div>
                            <label htmlFor="coach-message-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                ¿En qué necesitas ayuda?
                            </label>
                            <textarea
                                id="coach-message-textarea"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ej: Tengo dudas sobre mi rutina, necesito ajustar mi dieta, etc."
                                rows={5}
                                aria-required="true"
                                aria-label="Mensaje para el entrenador"
                                className="w-full px-4 py-3 backdrop-blur-sm bg-white/60 dark:bg-black/60 border border-gray-300/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 transition-all shadow-sm resize-none"
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2" role="group" aria-label="Acciones del formulario">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    aria-label="Cancelar solicitud"
                                    className="flex-1 px-6 py-3 backdrop-blur-sm bg-gray-200/60 dark:bg-gray-700/60 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-300/60 dark:hover:bg-gray-600/60 transition-all shadow-sm hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    Cancelar
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={loading || !message.trim()}
                                aria-label={loading ? "Enviando solicitud" : "Enviar solicitud al entrenador"}
                                className="flex-1 px-6 py-3 backdrop-blur-xl bg-blue-600 dark:bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                {loading ? (
                                    <>
                                        <span className="sr-only">Enviando</span>
                                        <span aria-hidden="true">Enviando...</span>
                                    </>
                                ) : (
                                    'Enviar Solicitud'
                                )}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default RequestCoachAttention;

