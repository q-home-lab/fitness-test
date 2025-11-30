import React, { useState } from 'react';
import api from '../services/api'; 
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const WeightForm = ({ currentDate, currentWeight, onLogUpdated }) => {
    const [weight, setWeight] = useState(currentWeight || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const weightValue = parseFloat(weight);
        if (isNaN(weightValue) || weightValue <= 0) {
            setMessage({ type: 'error', text: 'Por favor, introduce un peso válido.' });
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/logs', {
                date: formattedDate,
                weight: weightValue.toFixed(2),
            });

            setMessage({ type: 'success', text: response.data.message || 'Peso registrado correctamente' });
            onLogUpdated(response.data.log); 

        } catch (error) {
            console.error('Error al actualizar peso:', error.response?.data);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Error al actualizar el peso.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Peso</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{format(currentDate, 'd MMM', { locale: es })}</p>
                </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="weight-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Peso actual (kg)
                    </label>
                    <input
                        id="weight-input"
                        type="number"
                        step="0.1"
                        placeholder="Ej: 75.5"
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                    />
                    {currentWeight && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 ml-1">
                            Último registro: <span className="font-medium">{currentWeight} kg</span>
                        </p>
                    )}
                </div>
                
                {message.text && (
                    <div className={`rounded-2xl p-4 ${
                        message.type === 'success' 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800' 
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}
                
                <button 
                    type="submit" 
                    className="w-full py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Guardando...
                        </>
                    ) : currentWeight ? (
                        'Actualizar Peso'
                    ) : (
                        'Registrar Peso'
                    )}
                </button>
            </form>
        </div>
    );
};

export default WeightForm;
