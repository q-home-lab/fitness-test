import React from 'react';
import Icon from './Icons';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';

const CalorieRadialChart = ({ consumed, goal = 2000 }) => {
    const consumedCalories = consumed || 0;
    const goalCalories = goal || 2000;
    const percentage = goalCalories > 0 ? Math.min(100, (consumedCalories / goalCalories) * 100) : 0;
    const remaining = Math.max(0, goalCalories - consumedCalories);
    
    // Detectar si estamos en modo oscuro
    const isDark = document.documentElement.classList.contains('dark');
    
    // Colores que responden al tema - Usar paleta personalizada
    const consumedColor = isDark ? '#3b82f6' : '#D45A0F'; // Primary color en modo claro (mejorado contraste)
    const remainingColor = isDark ? '#374151' : '#D4C4A8'; // Color más oscuro para mejor contraste en modo claro
    
    const data = [
        {
            name: 'Consumidas',
            value: percentage,
            fill: consumedColor,
        },
        {
            name: 'Restantes',
            value: Math.max(0, 100 - percentage),
            fill: remainingColor,
        },
    ];
    
    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="90%" 
                    data={data}
                    startAngle={90}
                    endAngle={-270}
                >
                    <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill={consumedColor}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </RadialBar>
                </RadialBarChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {consumedCalories.toFixed(0)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    de {goalCalories.toFixed(0)} kcal
                </div>
                <div className={`text-xs mt-2 font-medium ${percentage >= 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-500'}`}>
                    {remaining > 0 ? `${remaining.toFixed(0)} kcal restantes` : (
                        <span className="flex items-center gap-1">
                            <Icon name="success" className="w-4 h-4" /> Objetivo alcanzado
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalorieRadialChart;
