import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api'; 
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '../utils/logger';

// Esquema de validación para el formulario de peso
const weightFormSchema = z.object({
    weight: z
        .number({
            required_error: 'El peso es requerido',
            invalid_type_error: 'El peso debe ser un número',
        })
        .min(20, 'El peso debe ser al menos 20 kg')
        .max(300, 'El peso no puede exceder 300 kg'),
});

const WeightForm = ({ currentDate, currentWeight, onLogUpdated }) => {
    const formattedDate = format(currentDate, 'yyyy-MM-dd');
    
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
    } = useForm({
        resolver: zodResolver(weightFormSchema),
        defaultValues: {
            weight: currentWeight ? parseFloat(currentWeight) : undefined,
        },
    });

    // Actualizar el valor cuando cambie currentWeight
    useEffect(() => {
        if (currentWeight) {
            setValue('weight', parseFloat(currentWeight));
        }
    }, [currentWeight, setValue]);

    const onSubmit = async (data) => {
        try {
            const response = await api.post('/logs', {
                date: formattedDate,
                weight: data.weight.toFixed(2),
            });

            // Mostrar mensaje de éxito (puedes usar toast aquí)
            if (onLogUpdated) {
                onLogUpdated(response.data.log);
            }
            
            // Resetear formulario después de éxito
            reset();
        } catch (error) {
            logger.error('Error al actualizar peso:', error.response?.data);
            // El error se mostrará a través del toast o mensaje de error
            throw error; // Re-lanzar para que react-hook-form maneje el error
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
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" aria-label="Formulario de registro de peso">
                <div>
                    <label htmlFor="weight-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Peso actual (kg)
                    </label>
                    <input
                        id="weight-input"
                        type="number"
                        step="0.1"
                        placeholder="Ej: 75.5"
                        aria-describedby={errors.weight ? "weight-error" : currentWeight ? "weight-hint" : undefined}
                        aria-invalid={errors.weight ? "true" : "false"}
                        aria-required="true"
                        className={`w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-2xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 text-gray-900 dark:text-white transition-colors duration-300 ${
                            errors.weight 
                                ? 'border-red-300 dark:border-red-700' 
                                : 'border-gray-300 dark:border-gray-700'
                        }`}
                        {...register('weight', { valueAsNumber: true })}
                    />
                    {errors.weight && (
                        <p id="weight-error" className="text-xs text-red-600 dark:text-red-400 mt-2 ml-1" role="alert" aria-live="polite">
                            {errors.weight.message}
                        </p>
                    )}
                    {currentWeight && !errors.weight && (
                        <p id="weight-hint" className="text-xs text-gray-500 dark:text-gray-500 mt-2 ml-1">
                            Último registro: <span className="font-medium">{currentWeight} kg</span>
                        </p>
                    )}
                </div>
                
                <button 
                    type="submit" 
                    aria-label={isSubmitting ? "Guardando peso" : currentWeight ? "Actualizar peso registrado" : "Registrar nuevo peso"}
                    className="w-full py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                            <span aria-live="polite">Guardando...</span>
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
