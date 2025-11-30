import React, { useState, useEffect } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Icon from './Icons';

// Hook para detectar el tema
const useTheme = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('themechange', checkTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', checkTheme);
    };
  }, []);

  return isDark;
};

// Dashboard Preview
export const DashboardPreview = () => {
  const isDark = useTheme();
  
  const consumedColor = isDark ? '#3b82f6' : '#D45A0F'; // Primary color en modo claro (mejorado contraste)
  const remainingColor = isDark ? '#374151' : '#D4C4A8'; // Color más oscuro para mejor contraste
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(34, 34, 34, 0.15)'; // Más visible
  // const textColor = isDark ? '#9ca3af' : '#555555'; // Reservado para uso futuro
  const secondaryTextColor = isDark ? '#9ca3af' : '#666666'; // Mejor contraste
  
  const calorieData = [
    { name: 'Consumidas', value: 75, fill: consumedColor },
    { name: 'Restantes', value: 25, fill: remainingColor },
  ];

  const weightData = [
    { date: 'Ene', weight: 75.2 },
    { date: 'Feb', weight: 74.8 },
    { date: 'Mar', weight: 74.5 },
    { date: 'Abr', weight: 74.1 },
    { date: 'May', weight: 73.8 },
    { date: 'Jun', weight: 73.5 },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Hoy, 15 de Enero</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-3">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">1,850</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">de 2,000 kcal</div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={calorieData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={10}>
                {calorieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </RadialBar>
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-200 dark:border-gray-700">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Proteína</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">145g</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Carbohidratos</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">220g</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Grasa</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">65g</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 font-medium">Evolución de Peso</div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={weightData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" stroke={secondaryTextColor} fontSize={10} tick={{ fill: secondaryTextColor }} />
            <YAxis stroke={secondaryTextColor} fontSize={10} tick={{ fill: secondaryTextColor }} />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke={consumedColor} 
              strokeWidth={2} 
              dot={{ r: 3, fill: consumedColor }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Routines Preview
export const RoutinesPreview = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rutina: Tren Superior</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Lunes, Miércoles, Viernes</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { name: 'Press de Banca', sets: '4x8', weight: '80kg' },
          { name: 'Sentadillas', sets: '4x10', weight: '100kg' },
          { name: 'Peso Muerto', sets: '3x5', weight: '120kg' },
        ].map((exercise, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900 dark:text-white">{exercise.name}</div>
              <Icon name="workout" className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{exercise.sets}</span> series
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">{exercise.weight}</span> peso
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">3</span> ejercicios • Duración: 45 min
        </div>
      </div>
    </div>
  );
};

// Nutrition Preview
export const NutritionPreview = () => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seguimiento Nutricional</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Hoy, 15 de Enero</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">1,450</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">kcal consumidas</div>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { meal: 'Desayuno', food: 'Avena con frutas', calories: 350, time: '08:00' },
          { meal: 'Almuerzo', food: 'Pollo con arroz', calories: 650, time: '13:30' },
          { meal: 'Cena', food: 'Salmón con verduras', calories: 450, time: '20:00' },
        ].map((meal, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{meal.meal}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{meal.food}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900 dark:text-white">{meal.calories} kcal</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{meal.time}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Proteína</div>
            <div className="font-bold text-gray-900 dark:text-white">120g</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Carbs</div>
            <div className="font-bold text-gray-900 dark:text-white">180g</div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Grasa</div>
            <div className="font-bold text-gray-900 dark:text-white">55g</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Preview
export const ProgressPreview = () => {
  const isDark = useTheme();
  
  const lineColor = isDark ? '#3b82f6' : '#D45A0F'; // Primary color en modo claro (mejorado contraste)
  const goalColor = isDark ? '#10b981' : '#86c4c2'; // Accent color en modo claro
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(34, 34, 34, 0.15)'; // Más visible
  const textColor = isDark ? '#9ca3af' : '#666666'; // Mejor contraste en modo claro
  const tooltipBg = isDark ? '#111827' : '#ffffff';
  const tooltipBorder = isDark ? '#374151' : '#E5D9C8'; // Usar color border de la paleta
  const tooltipText = isDark ? '#f9fafb' : '#222222'; // Usar color de texto de la paleta
  
  const progressData = [
    { month: 'Ene', weight: 75.2, goal: 73.0 },
    { month: 'Feb', weight: 74.8, goal: 73.0 },
    { month: 'Mar', weight: 74.5, goal: 73.0 },
    { month: 'Abr', weight: 74.1, goal: 73.0 },
    { month: 'May', weight: 73.8, goal: 73.0 },
    { month: 'Jun', weight: 73.5, goal: 73.0 },
  ];

  const stats = [
    { label: 'Peso Actual', value: '73.5 kg', change: '-1.7 kg' },
    { label: 'IMC', value: '23.2', change: '-0.5' },
    { label: 'Días activos', value: '28', change: 'este mes' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 space-y-6 border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progreso Visual</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Últimos 6 meses</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="month" stroke={textColor} fontSize={10} tick={{ fill: textColor }} />
            <YAxis stroke={textColor} fontSize={10} tick={{ fill: textColor }} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '8px',
                color: tooltipText,
              }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke={lineColor} 
              strokeWidth={2} 
              dot={{ r: 4, fill: lineColor }} 
              name="Peso" 
            />
            <Line 
              type="monotone" 
              dataKey="goal" 
              stroke={goalColor} 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={{ r: 0 }} 
              name="Objetivo" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">{stat.label}</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-xs font-semibold text-green-600 dark:text-green-400">{stat.change}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
