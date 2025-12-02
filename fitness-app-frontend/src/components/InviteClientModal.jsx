import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useEscapeKey } from '../hooks/useEscapeKey';

const InviteClientModal = ({ open, onOpenChange }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    // Focus trap para mantener el foco dentro del modal
    const contentRef = useFocusTrap(open);
    
    // Cerrar con Escape
    useEscapeKey(() => {
        if (open && !loading) {
            onOpenChange(false);
        }
    }, open);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!email || !email.includes('@')) {
            setError('Por favor, ingresa un email válido.');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/coach/invite', { email });
            setSuccess(true);
            setEmail('');
            
            // Cerrar el modal después de 2 segundos
            setTimeout(() => {
                onOpenChange(false);
                setSuccess(false);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error al enviar la invitación. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content 
                    ref={contentRef}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md z-50 border border-gray-200 dark:border-gray-800 focus:outline-none"
                    onEscapeKeyDown={(e) => {
                        if (loading) {
                            e.preventDefault();
                        }
                    }}
                >
                    <Dialog.Title className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                        Invitar Cliente
                    </Dialog.Title>
                    <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-6">
                        Envía una invitación por email para que un cliente se una a tu plataforma.
                    </Dialog.Description>

                    {success ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4" role="alert" aria-live="polite">
                            <p className="text-green-600 dark:text-green-300 text-sm">
                                ¡Invitación enviada exitosamente!
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" role="alert" aria-live="assertive">
                                    <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email del Cliente
                                </label>
                                <input
                                    id="invite-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="cliente@ejemplo.com"
                                    aria-required="true"
                                    aria-invalid={error ? "true" : "false"}
                                    aria-describedby={error ? "invite-email-error" : undefined}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors focus:outline-none"
                                />
                                {error && (
                                    <p id="invite-email-error" className="sr-only">{error}</p>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Dialog.Close asChild>
                                    <button
                                        type="button"
                                        aria-label="Cancelar invitación"
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    >
                                        Cancelar
                                    </button>
                                </Dialog.Close>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    aria-label={loading ? "Enviando invitación" : "Enviar invitación"}
                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="sr-only">Enviando</span>
                                            <span aria-hidden="true">Enviando...</span>
                                        </>
                                    ) : (
                                        'Enviar Invitación'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    <Dialog.Close asChild>
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg p-1"
                            aria-label="Cerrar modal de invitación"
                            disabled={loading}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default InviteClientModal;

