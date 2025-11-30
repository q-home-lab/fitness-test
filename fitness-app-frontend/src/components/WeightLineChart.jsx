import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { exportWeightHistory } from '../utils/exportData';

const WeightLineChart = ({ macros = null }) => {
    const [weightData, setWeightData] = useState([]);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    // Escuchar cambios de tema
    useEffect(() => {
        const checkTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        // Verificar al montar
        checkTheme();

        // Escuchar cambios de tema
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // También escuchar el evento personalizado
        window.addEventListener('themechange', checkTheme);

        return () => {
            observer.disconnect();
            window.removeEventListener('themechange', checkTheme);
        };
    }, []);

    const fetchWeightHistory = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get(`/logs/weight/history?period=${period}`);
            
            const formattedData = response.data.data.map(item => {
                const date = parseISO(item.date);
                let label = '';
                
                switch (period) {
                    case 'day':
                        label = format(date, 'EEE d', { locale: es });
                        break;
                    case 'week':
                        label = format(date, 'dd MMM', { locale: es });
                        break;
                    case 'month':
                        label = format(date, 'MMM', { locale: es });
                        break;
                    case 'year':
                        label = format(date, 'MMM yyyy', { locale: es });
                        break;
                    default:
                        label = format(date, 'dd MMM', { locale: es });
                }
                
                return {
                    date: item.date,
                    weight: item.weight,
                    label: label,
                };
            });
            
            setWeightData(formattedData);
        } catch (error) {
            console.error('Error al cargar histórico de peso:', error);
            setWeightData([]);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchWeightHistory();
    }, [fetchWeightHistory]);

    const periods = [
        { value: 'day', label: 'Día' },
        { value: 'week', label: 'Semana' },
        { value: 'month', label: 'Mes' },
        { value: 'year', label: 'Año' },
    ];

    // Colores que responden al tema - Usar paleta personalizada
    const lineColor = isDark ? '#3b82f6' : '#D45A0F'; // Primary color en modo claro (mejorado contraste)
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(34, 34, 34, 0.15)'; // Más visible en modo claro
    const tooltipBg = isDark ? '#111827' : '#ffffff';
    const tooltipBorder = isDark ? '#374151' : '#E5D9C8'; // Usar color border de la paleta
    const tooltipText = isDark ? '#f9fafb' : '#222222'; // Usar color de texto de la paleta
    const axisColor = isDark ? '#9ca3af' : '#666666'; // Mejor contraste para ejes

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm transition-colors duration-300">
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-2 border-[#D45A0F] dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    if (weightData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm transition-colors duration-300">
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">No hay datos de peso disponibles</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">Registra tu peso para ver la evolución</p>
                </div>
            </div>
        );
    }

    const weights = weightData.map(d => parseFloat(d.weight)).filter(w => !isNaN(w));
    const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
    const currentWeight = weights.length > 0 ? weights[weights.length - 1] : 0;
    const previousWeight = weights.length > 1 ? weights[weights.length - 2] : null;
    const weightChange = previousWeight ? currentWeight - previousWeight : 0;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300 overflow-hidden">
            <div className="p-6">
                {/* Sección 1: Header - Solo Título y Botones */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
                        Evolución de Peso
                    </h2>
                    
                    {/* Botones de período y exportación */}
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={() => {
                                const historyData = weightData.map(d => ({
                                    date: d.date,
                                    weight: parseFloat(d.weight) || 0,
                                    consumed_calories: parseFloat(d.consumed_calories) || 0,
                                    burned_calories: parseFloat(d.burned_calories) || 0,
                                }));
                                exportWeightHistory(historyData);
                            }}
                            className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-2"
                            title="Exportar a CSV"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Exportar
                        </button>
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                    period === p.value
                                        ? 'bg-[#D45A0F] dark:bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sección 2: Estadísticas de peso */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Peso Actual</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {currentWeight.toFixed(1)} kg
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cambio</div>
                        <div className={`text-lg font-semibold ${weightChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 col-span-2 md:col-span-1">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Rango</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {minWeight.toFixed(1)} - {maxWeight.toFixed(1)} kg
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección 3: Gráfica */}
            <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-800 overflow-x-auto">
                <div className="w-full min-w-[600px]">
                    <ResponsiveContainer width="100%" height={450}>
                        <LineChart 
                            data={weightData} 
                            margin={{ 
                                top: 20, 
                                right: 30, 
                                left: 40, 
                                bottom: 100 
                            }}
                        >
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                stroke={gridColor}
                            />
                            <XAxis 
                                dataKey="label" 
                                stroke={axisColor}
                                style={{ fontSize: '11px', fill: axisColor }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={0}
                                tick={{ fill: axisColor, dy: 8 }}
                                dx={-5}
                            />
                            <YAxis 
                                stroke={axisColor}
                                style={{ fontSize: '12px', fill: axisColor }}
                                domain={['dataMin - 1', 'dataMax + 1']}
                                tick={{ fill: axisColor }}
                                width={50}
                                label={{ 
                                    value: 'Peso (kg)', 
                                    angle: -90, 
                                    position: 'insideLeft',
                                    offset: -10,
                                    style: { 
                                        textAnchor: 'middle', 
                                        fill: axisColor, 
                                        fontSize: '12px',
                                        fontWeight: '500'
                                    }
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: tooltipBg,
                                    border: `1px solid ${tooltipBorder}`,
                                    borderRadius: '12px',
                                    padding: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                }}
                                formatter={(value) => [`${value.toFixed(1)} kg`, 'Peso']}
                                labelStyle={{ 
                                    fontWeight: '600', 
                                    marginBottom: '4px',
                                    color: tooltipText
                                }}
                                itemStyle={{
                                    color: tooltipText
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="weight"
                                stroke={lineColor}
                                strokeWidth={3}
                                dot={{ 
                                    fill: lineColor, 
                                    r: 5, 
                                    strokeWidth: 2, 
                                    stroke: tooltipBg
                                }}
                                activeDot={{ 
                                    r: 8, 
                                    strokeWidth: 2, 
                                    stroke: tooltipBg
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sección 4: Tabla con Registros - DEBAJO de la gráfica */}
            <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                    Fecha
                                </th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                                    Peso (kg)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {weightData.map((item, index) => (
                                <tr 
                                    key={index} 
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {item.label}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                        {(parseFloat(item.weight) || 0).toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {/* Macronutrientes - Solo si se proporcionan */}
                    {macros && (
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Proteína</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{(parseFloat(macros.protein) || 0).toFixed(0)}g</div>
                                </div>
                                <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Carbohidratos</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{(parseFloat(macros.carbs) || 0).toFixed(0)}g</div>
                                </div>
                                <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Grasa</div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{(parseFloat(macros.fat) || 0).toFixed(0)}g</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeightLineChart;
