import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MacroBarChart = ({ macros, goal = null }) => {
    const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
    
    // Calcular porcentajes si hay objetivo
    const totalCalories = (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9);
    
    // Objetivos por defecto (pueden venir del goal)
    const proteinGoal = goal?.protein_g || (totalCalories * 0.25 / 4); // 25% de calorías
    const carbsGoal = goal?.carbs_g || (totalCalories * 0.45 / 4); // 45% de calorías
    const fatGoal = goal?.fat_g || (totalCalories * 0.30 / 9); // 30% de calorías
    
    const data = [
        {
            name: 'Proteína',
            consumido: parseFloat(macros.protein.toFixed(1)) || 0,
            objetivo: parseFloat(proteinGoal.toFixed(1)) || 0,
            color: isDark ? '#3b82f6' : '#D45A0F',
        },
        {
            name: 'Carbohidratos',
            consumido: parseFloat(macros.carbs.toFixed(1)) || 0,
            objetivo: parseFloat(carbsGoal.toFixed(1)) || 0,
            color: isDark ? '#10b981' : '#22c55e',
        },
        {
            name: 'Grasas',
            consumido: parseFloat(macros.fat.toFixed(1)) || 0,
            objetivo: parseFloat(fatGoal.toFixed(1)) || 0,
            color: isDark ? '#f59e0b' : '#f97316',
        },
    ];
    
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDark ? '#9ca3af' : '#666666';
    const tooltipBg = isDark ? '#111827' : '#ffffff';
    const tooltipBorder = isDark ? '#374151' : '#E5D9C8';
    const tooltipText = isDark ? '#f9fafb' : '#222222';
    
    return (
        <div className="w-full">
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis 
                        dataKey="name" 
                        stroke={textColor}
                        style={{ fontSize: '12px', fill: textColor }}
                        tick={{ fill: textColor }}
                    />
                    <YAxis 
                        stroke={textColor}
                        style={{ fontSize: '12px', fill: textColor }}
                        tick={{ fill: textColor }}
                        label={{ 
                            value: 'Gramos (g)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: textColor, fontSize: '12px' }
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: tooltipBg,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: '12px',
                            padding: '12px',
                        }}
                        labelStyle={{ 
                            fontWeight: '600', 
                            marginBottom: '4px',
                            color: tooltipText
                        }}
                        itemStyle={{ color: tooltipText }}
                        formatter={(value, name) => {
                            if (name === 'consumido') return [`${value} g`, 'Consumido'];
                            if (name === 'objetivo') return [`${value} g`, 'Objetivo'];
                            return value;
                        }}
                    />
                    <Legend 
                        wrapperStyle={{ color: textColor, fontSize: '12px' }}
                        formatter={(value) => {
                            if (value === 'consumido') return 'Consumido';
                            if (value === 'objetivo') return 'Objetivo';
                            return value;
                        }}
                    />
                    <Bar 
                        dataKey="consumido" 
                        fill={isDark ? '#3b82f6' : '#D45A0F'} 
                        radius={[8, 8, 0, 0]}
                        name="Consumido"
                    />
                    <Bar 
                        dataKey="objetivo" 
                        fill={isDark ? '#6b7280' : '#D4C4A8'} 
                        radius={[8, 8, 0, 0]}
                        name="Objetivo"
                        opacity={0.5}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MacroBarChart;

