import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '@/services/api';

/**
 * Panel de tareas pendientes de hoy
 * Muestra las tareas de comida y ejercicio que el usuario debe completar
 */
const TodayTasksPanel = ({ onTaskComplete }) => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasRoutines, setHasRoutines] = useState(false);
  const [hasGoal, setHasGoal] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Cargar tareas pendientes
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener datos en paralelo
      const [logResponse, routinesResponse, scheduledResponse, goalResponse] = await Promise.all([
        api.get(`/logs/${today}`).catch(() => ({ data: { log: null, mealItems: [] } })),
        api.get('/routines?limit=1').catch(() => ({ data: { routines: [] } })),
        api.get(`/calendar/schedule?start_date=${today}&end_date=${today}`).catch(() => ({ data: { scheduled: [] } })),
        api.get('/goals').catch(() => ({ data: { goal: null } })),
      ]);

      const log = logResponse.data.log;
      const mealItems = logResponse.data.mealItems || [];
      const routines = routinesResponse.data.routines || [];
      const scheduled = scheduledResponse.data.scheduled || [];
      const goal = goalResponse.data.goal;

      setHasRoutines(routines.length > 0);
      setHasGoal(!!goal);

      const newTasks = [];

      // Si no tiene rutinas o objetivo configurado, mostrar tarea de configuración
      if (routines.length === 0 || !goal) {
        if (routines.length === 0) {
          newTasks.push({
            id: 'setup-routine',
            type: 'setup',
            category: 'exercise',
            title: 'Crear tu primera rutina',
            description: 'Configura tu plan de entrenamiento para empezar',
            priority: 'high',
            action: () => navigate('/routines'),
            completed: false,
          });
        }
        if (!goal) {
          newTasks.push({
            id: 'setup-goal',
            type: 'setup',
            category: 'nutrition',
            title: 'Definir tu objetivo',
            description: 'Establece tu meta de calorías y peso',
            priority: 'high',
            action: () => navigate('/weight'),
            completed: false,
          });
        }
      } else {
        // Tareas de comida
        const calorieGoal = goal?.daily_calorie_goal ? parseFloat(goal.daily_calorie_goal) : 2000;
        const caloriesConsumed = log ? parseFloat(log.consumed_calories) : 0;
        const calorieProgress = (caloriesConsumed / calorieGoal) * 100;

        // Tarea: Registrar comidas del día
        if (mealItems.length === 0) {
          newTasks.push({
            id: 'add-meals',
            type: 'nutrition',
            category: 'nutrition',
            title: 'Registrar comidas de hoy',
            description: 'Añade tu desayuno, comida, cena y snacks',
            priority: 'high',
            action: () => navigate('/diet'),
            completed: false,
          });
        } else if (calorieProgress < 50) {
          newTasks.push({
            id: 'complete-meals',
            type: 'nutrition',
            category: 'nutrition',
            title: `Completar calorías del día (${caloriesConsumed.toFixed(0)}/${calorieGoal.toFixed(0)} kcal)`,
            description: `Te faltan ${(calorieGoal - caloriesConsumed).toFixed(0)} calorías`,
            priority: 'medium',
            action: () => navigate('/diet'),
            completed: false,
          });
        }

        // Tarea: Registrar peso de hoy
        if (!log || !log.weight) {
          newTasks.push({
            id: 'add-weight',
            type: 'weight',
            category: 'nutrition',
            title: 'Registrar peso de hoy',
            description: 'Mantén un seguimiento diario de tu progreso',
            priority: 'medium',
            action: () => navigate('/weight'),
            completed: false,
          });
        }

        // Tareas de ejercicio
        const todayScheduled = scheduled.filter(s => s.scheduled_date === today);
        
        if (todayScheduled.length > 0) {
          todayScheduled.forEach((schedule) => {
            if (!schedule.is_completed) {
              newTasks.push({
                id: `routine-${schedule.routine_id}`,
                type: 'exercise',
                category: 'exercise',
                title: `Completar: ${schedule.routine_name}`,
                description: schedule.routine_description || 'Rutina programada para hoy',
                priority: 'high',
                action: () => navigate(`/routines/${schedule.routine_id}`),
                completed: false,
                routineId: schedule.routine_id,
              });
            }
          });
        } else if (routines.length > 0) {
          // Si hay rutinas pero ninguna programada para hoy, sugerir registrar entrenamiento
          const hasExerciseLog = log && log.burned_calories > 0;
          if (!hasExerciseLog) {
            newTasks.push({
              id: 'log-workout',
              type: 'exercise',
              category: 'exercise',
              title: 'Registrar entrenamiento de hoy',
              description: 'Marca tu entrenamiento como completado',
              priority: 'medium',
              action: () => navigate('/daily-log'),
              completed: false,
            });
          }
        }
      }

      // Ordenar por prioridad (high primero)
      newTasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setTasks(newTasks);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [today, navigate]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskClick = (task) => {
    if (task.action) {
      task.action();
    }
  };

  const handleTaskComplete = async (task) => {
    // Marcar como completada localmente
    setTasks(prev => prev.filter(t => t.id !== task.id));
    
    // Recargar tareas
    await loadTasks();
    
    // Notificar al padre
    if (onTaskComplete) {
      onTaskComplete(task);
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200/60 dark:bg-gray-700/60 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200/60 dark:bg-gray-700/60 rounded"></div>
          <div className="h-16 bg-gray-200/60 dark:bg-gray-700/60 rounded"></div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-gradient-to-br from-green-50/60 to-emerald-50/60 dark:from-green-900/20 dark:to-emerald-900/20 rounded-3xl border border-green-200/50 dark:border-green-800/50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-green-100/60 dark:bg-green-900/30 backdrop-blur-sm flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white">
            ¡Todo al día!
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Has completado todas tus tareas de hoy. ¡Sigue así!
        </p>
      </div>
    );
  }

  // Calcular progreso
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-1">
            Hoy te queda por hacer
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalCount} {totalCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
          </p>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-100/60 dark:bg-blue-900/30 backdrop-blur-sm flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {totalCount}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      {totalCount > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span>Progreso del día</span>
            <span>{Math.round(100 - progress)}% restante</span>
          </div>
          <div className="w-full bg-gray-200/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${100 - progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Lista de tareas */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const IconComponent = getTaskIcon(task.type);
          const priorityColor = getPriorityColor(task.priority);

          return (
            <div
              key={task.id}
              className={`group relative backdrop-blur-md bg-gradient-to-r ${priorityColor.bg} border ${priorityColor.border} rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.01] hover:border-opacity-70`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="flex items-start gap-4">
                {/* Icono */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl backdrop-blur-sm ${priorityColor.iconBg} flex items-center justify-center`}>
                  <IconComponent className={`h-6 w-6 ${priorityColor.iconColor}`} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Botón de acción */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskClick(task);
                      }}
                      className={`flex-shrink-0 px-4 py-2 rounded-xl ${priorityColor.button} text-white font-medium text-sm transition-colors hover:opacity-90`}
                    >
                      {task.type === 'setup' ? 'Configurar' : 'Hacer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acción recomendada destacada */}
      {tasks.length > 0 && tasks[0] && (
        <div className="mt-6 p-4 backdrop-blur-md bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span className="font-medium">Siguiente acción recomendada:</span>
          </p>
          <button
            onClick={() => handleTaskClick(tasks[0])}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            {tasks[0].title}
          </button>
        </div>
      )}
    </div>
  );
};

// Iconos por tipo de tarea
const getTaskIcon = (type) => {
  switch (type) {
    case 'nutrition':
      return ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      );
    case 'exercise':
      return ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'weight':
      return ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'setup':
      return ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return ({ className }) => (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
  }
};

// Colores por prioridad
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high':
      return {
        bg: 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
        border: 'border-red-200 dark:border-red-800',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        button: 'bg-red-600 hover:bg-red-700',
      };
    case 'medium':
      return {
        bg: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
        button: 'bg-yellow-600 hover:bg-yellow-700',
      };
    default:
      return {
        bg: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
        border: 'border-gray-200 dark:border-gray-700',
        iconBg: 'bg-gray-100 dark:bg-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400',
        button: 'bg-gray-600 hover:bg-gray-700',
      };
  }
};

export default TodayTasksPanel;

