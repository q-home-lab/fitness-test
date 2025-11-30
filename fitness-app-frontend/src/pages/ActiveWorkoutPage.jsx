import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ModernNavbar from '../components/ModernNavbar';
import BottomNavigation from '../components/BottomNavigation';
import api from '../services/api';

const ActiveWorkoutPage = () => {
    const { routineId } = useParams();
    const navigate = useNavigate();
    
    const [routine, setRoutine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSet, setCurrentSet] = useState(1);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(0);
    const [exerciseTime, setExerciseTime] = useState(0);
    const [workoutStartTime, setWorkoutStartTime] = useState(null);
    const [completedExercises, setCompletedExercises] = useState([]);
    const [exerciseData, setExerciseData] = useState({});
    
    const restIntervalRef = useRef(null);
    const exerciseIntervalRef = useRef(null);
    const audioRef = useRef(null);

    const restDuration = 90; // 90 segundos de descanso por defecto

    useEffect(() => {
        fetchRoutineDetails();
        return () => {
            if (restIntervalRef.current) clearInterval(restIntervalRef.current);
            if (exerciseIntervalRef.current) clearInterval(exerciseIntervalRef.current);
        };
    }, [routineId]);

    const fetchRoutineDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/routines/${routineId}`);
            setRoutine(response.data.routine);
            setWorkoutStartTime(new Date());
        } catch (error) {
            console.error('Error al cargar rutina:', error);
            alert('Error al cargar la rutina');
            navigate('/routines');
        } finally {
            setLoading(false);
        }
    };

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Error al reproducir sonido:', e));
        }
    };

    const startRest = () => {
        setIsResting(true);
        setRestTime(restDuration);
        
        if (restIntervalRef.current) clearInterval(restIntervalRef.current);
        
        restIntervalRef.current = setInterval(() => {
            setRestTime((prev) => {
                if (prev <= 1) {
                    clearInterval(restIntervalRef.current);
                    setIsResting(false);
                    playSound();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const skipRest = () => {
        if (restIntervalRef.current) clearInterval(restIntervalRef.current);
        setIsResting(false);
        setRestTime(0);
    };

    const startExerciseTimer = () => {
        if (exerciseIntervalRef.current) clearInterval(exerciseIntervalRef.current);
        
        exerciseIntervalRef.current = setInterval(() => {
            setExerciseTime((prev) => prev + 1);
        }, 1000);
    };

    const stopExerciseTimer = () => {
        if (exerciseIntervalRef.current) clearInterval(exerciseIntervalRef.current);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getTotalWorkoutTime = () => {
        if (!workoutStartTime) return 0;
        return Math.floor((new Date() - workoutStartTime) / 1000);
    };

    const handleSetComplete = async () => {
        const currentExercise = routine.exercises[currentExerciseIndex];
        if (!currentExercise) return;

        const exerciseKey = `${currentExercise.exercise_id}-${currentExerciseIndex}`;
        const currentData = exerciseData[exerciseKey] || {
            sets: [],
            reps: [],
            weights: [],
            durations: [],
        };

        const newSet = {
            setNumber: currentSet,
            reps: currentExercise.reps || null,
            weight: parseFloat(currentExercise.weight_kg) || 0,
            duration: exerciseTime,
        };

        currentData.sets.push(newSet);
        setExerciseData({
            ...exerciseData,
            [exerciseKey]: currentData,
        });

        stopExerciseTimer();

        // Si hay más series, avanzar a la siguiente
        if (currentSet < currentExercise.sets) {
            setCurrentSet(currentSet + 1);
            setExerciseTime(0);
            startRest();
        } else {
            // Ejercicio completado
            handleExerciseComplete();
        }
    };

    const handleExerciseComplete = async () => {
        const currentExercise = routine.exercises[currentExerciseIndex];
        if (!currentExercise) return;

        const exerciseKey = `${currentExercise.exercise_id}-${currentExerciseIndex}`;
        const data = exerciseData[exerciseKey];

        // Calcular totales
        const totalSets = data.sets.length;
        const totalReps = data.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
        const totalDuration = data.sets.reduce((sum, s) => sum + (s.duration || 0), 0);
        const avgWeight = data.sets.length > 0
            ? data.sets.reduce((sum, s) => sum + (s.weight || 0), 0) / data.sets.length
            : 0;

        // Calcular calorías (estimación)
        let burnedCalories = 0;
        if (currentExercise.category === 'Cardio' && totalDuration > 0) {
            const minutes = totalDuration / 60;
            burnedCalories = minutes * (parseFloat(currentExercise.default_calories_per_minute) || 10);
        } else if (totalReps > 0) {
            burnedCalories = totalReps * 0.5 + totalSets * 5;
        } else {
            burnedCalories = totalSets * 5;
        }

        // Guardar ejercicio completado
        try {
            await api.post('/workouts/log', {
                exercise_id: currentExercise.exercise_id,
                sets_done: totalSets,
                reps_done: totalReps > 0 ? totalReps : null,
                duration_minutes: totalDuration > 0 ? (totalDuration / 60).toFixed(2) : null,
                weight_kg: avgWeight,
                burned_calories: Math.round(burnedCalories),
            });

            setCompletedExercises([...completedExercises, currentExercise.exercise_id]);
            setCurrentSet(1);
            setExerciseTime(0);
            stopExerciseTimer();

            // Avanzar al siguiente ejercicio o finalizar
            if (currentExerciseIndex < routine.exercises.length - 1) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                startRest();
            } else {
                handleWorkoutComplete();
            }
        } catch (error) {
            console.error('Error al guardar ejercicio:', error);
            alert('Error al guardar el ejercicio. Continuando...');
            // Continuar de todas formas
            if (currentExerciseIndex < routine.exercises.length - 1) {
                setCurrentExerciseIndex(currentExerciseIndex + 1);
                startRest();
            } else {
                handleWorkoutComplete();
            }
        }
    };

    const handleWorkoutComplete = () => {
        const totalTime = getTotalWorkoutTime();
        alert(`¡Rutina completada! Tiempo total: ${formatTime(totalTime)}`);
        navigate('/routines');
    };

    const handleSkipExercise = () => {
        if (currentExerciseIndex < routine.exercises.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
            setCurrentSet(1);
            setExerciseTime(0);
            stopExerciseTimer();
            startRest();
        }
    };

    if (loading) {
        return (
            <>
                <ModernNavbar />
                <main className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>
                </main>
                <BottomNavigation />
            </>
        );
    }

    if (!routine || routine.exercises.length === 0) {
        return (
            <>
                <ModernNavbar />
                <main className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-red-600 dark:text-red-400">
                            Esta rutina no tiene ejercicios.
                        </div>
                        <button
                            onClick={() => navigate('/routines')}
                            className="mt-4 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                            Volver a Rutinas
                        </button>
                    </div>
                </main>
                <BottomNavigation />
            </>
        );
    }

    const currentExercise = routine.exercises[currentExerciseIndex];
    const progress = ((currentExerciseIndex + 1) / routine.exercises.length) * 100;
    const exerciseKey = `${currentExercise.exercise_id}-${currentExerciseIndex}`;
    const exerciseDataForCurrent = exerciseData[exerciseKey] || { sets: [] };

    return (
        <>
            <ModernNavbar />
            <main className="min-h-screen bg-[#FAF3E1] dark:bg-black pb-24 md:pb-8 transition-colors duration-300">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    {/* Header con progreso */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {routine.name}
                            </h1>
                            <button
                                onClick={() => {
                                    if (confirm('¿Estás seguro de que quieres salir? El progreso no guardado se perderá.')) {
                                        navigate('/routines');
                                    }
                                }}
                                className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                            >
                                Salir
                            </button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>Ejercicio {currentExerciseIndex + 1} de {routine.exercises.length}</span>
                            <span>•</span>
                            <span>Tiempo: {formatTime(getTotalWorkoutTime())}</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Modo Descanso */}
                    {isResting && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-3xl p-8 text-center mb-6">
                            <h2 className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-4">
                                Descanso
                            </h2>
                            <div className="text-6xl font-bold text-yellow-700 dark:text-yellow-300 mb-4">
                                {formatTime(restTime)}
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Prepárate para el siguiente ejercicio
                            </p>
                            <button
                                onClick={skipRest}
                                className="px-6 py-3 bg-yellow-600 dark:bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-700 dark:hover:bg-yellow-600 transition-colors"
                            >
                                Saltar Descanso
                            </button>
                        </div>
                    )}

                    {/* Ejercicio Actual */}
                    {!isResting && (
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 mb-6 shadow-lg">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {currentExercise.exercise_name || currentExercise.name}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {currentExercise.category}
                                </p>
                            </div>

                            {/* Información del ejercicio */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        Serie {currentSet} / {currentExercise.sets}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Series
                                    </div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {formatTime(exerciseTime)}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Tiempo
                                    </div>
                                </div>
                            </div>

                            {/* Detalles de la serie */}
                            {currentExercise.reps && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                            Objetivo: {currentExercise.reps} repeticiones
                                        </div>
                                        {currentExercise.weight_kg > 0 && (
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Peso: {currentExercise.weight_kg} kg
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {currentExercise.duration_minutes && (
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                            Duración objetivo: {currentExercise.duration_minutes} minutos
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Series completadas */}
                            {exerciseDataForCurrent.sets.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Series completadas:
                                    </h3>
                                    <div className="space-y-2">
                                        {exerciseDataForCurrent.sets.map((set, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2 text-sm"
                                            >
                                                Serie {set.setNumber}: {set.reps || 'N/A'} reps
                                                {set.weight > 0 && ` @ ${set.weight}kg`}
                                                {set.duration > 0 && ` (${formatTime(set.duration)})`}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        if (exerciseTime === 0) startExerciseTimer();
                                        handleSetComplete();
                                    }}
                                    className="flex-1 px-6 py-4 bg-green-600 dark:bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                                >
                                    {exerciseTime === 0 ? 'Iniciar Serie' : 'Completar Serie'}
                                </button>
                                <button
                                    onClick={handleSkipExercise}
                                    className="px-6 py-4 bg-gray-600 dark:bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Saltar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Lista de ejercicios */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Ejercicios de la rutina
                        </h3>
                        <div className="space-y-2">
                            {routine.exercises.map((ex, idx) => (
                                <div
                                    key={ex.routine_exercise_id || idx}
                                    className={`p-3 rounded-xl border-2 transition-colors ${
                                        idx === currentExerciseIndex
                                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                            : completedExercises.includes(ex.exercise_id)
                                            ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                                            : 'border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {completedExercises.includes(ex.exercise_id) && (
                                                <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                                            )}
                                            {idx === currentExerciseIndex && !completedExercises.includes(ex.exercise_id) && (
                                                <span className="text-blue-600 dark:text-blue-400 text-xl">▶</span>
                                            )}
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {ex.exercise_name || ex.name}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {ex.sets} series
                                            {ex.reps && ` × ${ex.reps} reps`}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <BottomNavigation />
            
            {/* Audio para notificaciones */}
            <audio ref={audioRef} preload="auto">
                <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77+efTRAMUKfj8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBlou+/nn00QDFCn4/C2YxwGOJHX8sx5LAUkd8fw3ZBAC" />
            </audio>
        </>
    );
};

export default ActiveWorkoutPage;

