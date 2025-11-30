import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useBrandStore from '../stores/useBrandStore';
import useToastStore from '../stores/useToastStore';
import useUserStore from '../stores/useUserStore';
import api from '../services/api';
import Icon from '../components/Icons';

const WelcomePage = () => {
    const navigate = useNavigate();
    const brandSettings = useBrandStore((state) => state.brandSettings);
    const toast = useToastStore();
    const loadUser = useUserStore((state) => state.loadUser);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        gender: '',
        age: '',
        height: '',
        initial_weight: '',
        target_weight: '',
        goal_type: 'weight_loss',
        daily_calorie_goal: '',
        activity_level: 'moderate',
    });
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNext = () => {
        // Validar campos antes de avanzar
        if (currentStep === 2) {
            if (!formData.gender || !formData.age || !formData.height) {
                toast.warning('Por favor completa todos los campos obligatorios');
                return;
            }
        }
        if (currentStep === 3) {
            if (!formData.initial_weight) {
                toast.warning('Por favor ingresa tu peso actual');
                return;
            }
        }
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        // Validar todos los campos obligatorios
        if (!formData.gender || !formData.age || !formData.height || !formData.initial_weight) {
            toast.warning('Por favor completa todos los campos obligatorios');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/onboarding/initial-setup', {
                gender: formData.gender,
                age: parseInt(formData.age),
                height: parseFloat(formData.height),
                initial_weight: parseFloat(formData.initial_weight),
                target_weight: formData.target_weight ? parseFloat(formData.target_weight) : null,
                goal_type: formData.goal_type,
                daily_calorie_goal: formData.daily_calorie_goal ? parseFloat(formData.daily_calorie_goal) : null,
                activity_level: formData.activity_level,
            });
            
            // Recargar el usuario para obtener el estado actualizado de onboarding
            await loadUser();
            
            // Guardar recomendaciones si vienen en la respuesta
            if (response.data.recommendations) {
                setRecommendations(response.data.recommendations);
                setCurrentStep(5); // Mostrar paso de recomendaciones
            } else {
                // Si no hay recomendaciones, redirigir al dashboard
                // El OnboardingGuard se encargará de verificar el estado
                navigate('/dashboard', { replace: true });
            }
        } catch (error) {
            console.error('Error al completar onboarding:', error);
            toast.error(error.response?.data?.error || 'Error al completar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        // Recargar el usuario antes de redirigir
        await loadUser();
        navigate('/dashboard', { replace: true });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#fafafa] via-white to-[#f5f5f5] dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8 md:p-12">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Paso {currentStep} de {recommendations ? 5 : 4}
                        </span>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {Math.round((currentStep / (recommendations ? 5 : 4)) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                            className="bg-blue-600 dark:bg-blue-500 rounded-full h-2 transition-all duration-300"
                            style={{ width: `${(currentStep / (recommendations ? 5 : 4)) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step 1: Bienvenida */}
                {currentStep === 1 && (
                    <div className="text-center space-y-6 animate-fadeIn">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                            ¡Bienvenido a {brandSettings.brand_name}!
                        </h1>
                        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-md mx-auto">
                            Estamos emocionados de acompañarte en tu viaje hacia una vida más saludable.
                        </p>
                        <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                            Te guiaremos a través de unos sencillos pasos para configurar tu perfil y empezar a alcanzar tus objetivos.
                        </p>
                    </div>
                )}

                {/* Step 2: Datos Personales */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Información Personal
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Necesitamos estos datos para calcular recomendaciones personalizadas
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Género *
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'male', label: 'Hombre', icon: '👨' },
                                        { value: 'female', label: 'Mujer', icon: '👩' },
                                        { value: 'other', label: 'Otro', icon: '🧑' },
                                    ].map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, gender: option.value }))}
                                            className={`p-4 rounded-2xl border-2 transition-all ${
                                                formData.gender === option.value
                                                    ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600'
                                            }`}
                                        >
                                            <div className="text-3xl mb-2">{option.icon}</div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{option.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Edad (años) *
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white"
                                    placeholder="Ej: 30"
                                    min="1"
                                    max="120"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Altura (cm) *
                                </label>
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white"
                                    placeholder="Ej: 170"
                                    min="50"
                                    max="300"
                                    required
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Tu altura nos ayudará a calcular tu IMC y recomendaciones personalizadas
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Peso */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Tu Peso
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Esto nos ayudará a hacer un seguimiento de tu progreso
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Peso actual (kg) *
                                </label>
                                <input
                                    type="number"
                                    name="initial_weight"
                                    value={formData.initial_weight}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white"
                                    placeholder="Ej: 70"
                                    step="0.1"
                                    min="20"
                                    max="300"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Peso objetivo (kg) <span className="text-xs text-gray-500 dark:text-gray-400">(opcional)</span>
                                </label>
                                <input
                                    type="number"
                                    name="target_weight"
                                    value={formData.target_weight}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white"
                                    placeholder="Ej: 65"
                                    step="0.1"
                                    min="20"
                                    max="300"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    ¿Cuál es tu peso ideal? Esto nos ayudará a crear un plan personalizado
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Objetivos */}
                {currentStep === 4 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Tus Objetivos
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                ¿Qué quieres lograr?
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Objetivo principal
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { value: 'weight_loss', label: 'Perder Peso', iconName: 'weightLoss' },
                                        { value: 'weight_gain', label: 'Ganar Peso', iconName: 'weightGain' },
                                        { value: 'maintain', label: 'Mantener Peso', iconName: 'scale' },
                                        { value: 'muscle_gain', label: 'Ganar Músculo', iconName: 'muscleGain' },
                                    ].map((goal) => (
                                        <button
                                            key={goal.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, goal_type: goal.value }))}
                                            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                                formData.goal_type === goal.value
                                                    ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-600'
                                            }`}
                                        >
                                            <div className="flex-shrink-0">
                                                <Icon name={goal.iconName} className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                                            </div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{goal.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Objetivo de calorías diarias (kcal)
                                </label>
                                <input
                                    type="number"
                                    name="daily_calorie_goal"
                                    value={formData.daily_calorie_goal}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white"
                                    placeholder="Ej: 2000"
                                    min="500"
                                    max="10000"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Dejaremos que la app calcule tu objetivo calórico si no lo ingresas
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nivel de actividad física
                                </label>
                                <select
                                    name="activity_level"
                                    value={formData.activity_level}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all text-gray-900 dark:text-white"
                                >
                                    <option value="sedentary">Sedentario (poco o nada de ejercicio)</option>
                                    <option value="light">Ligera (ejercicio ligero/deportes 1-3 días/semana)</option>
                                    <option value="moderate">Moderado (ejercicio moderado 3-5 días/semana)</option>
                                    <option value="active">Activo (ejercicio fuerte 6-7 días/semana)</option>
                                    <option value="very_active">Muy activo (ejercicio muy fuerte, trabajo físico)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Recommendations */}
                {currentStep === 5 && recommendations && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Tus Recomendaciones Personalizadas
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Basado en tu información, hemos calculado estos valores
                            </p>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Current stats */}
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Estado Actual</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">BMI:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{recommendations.current.bmi}</span>
                                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({recommendations.current.bmiCategory})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Grasa Corporal:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{recommendations.current.bodyFat}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">BMR (Metabolismo Basal):</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{recommendations.current.bmr} kcal</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">TDEE (Gasto Calórico Diario):</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">{recommendations.current.tdee} kcal</span>
                                    </div>
                                </div>
                            </div>

                            {/* Target stats */}
                            {recommendations.target && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Objetivos Recomendados</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Peso Objetivo:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{recommendations.target.weight} kg</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">BMI Objetivo:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{recommendations.target.bmi}</span>
                                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">({recommendations.target.bmiCategory})</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Grasa Corporal Objetivo:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{recommendations.target.bodyFat}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Calorías Diarias Recomendadas:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{recommendations.target.dailyCalories} kcal</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {recommendations.message && (
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border border-green-200 dark:border-green-800">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <Icon name="recommendation" className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        Recomendación
                                    </h3>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {recommendations.message}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                    {currentStep > 1 && currentStep < 5 && (
                        <button
                            onClick={handleBack}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Atrás
                        </button>
                    )}
                    {currentStep < 4 && (
                        <button
                            onClick={handleNext}
                            className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                        >
                            Siguiente
                        </button>
                    )}
                    {currentStep === 4 && (
                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Procesando...
                                </>
                            ) : (
                                'Completar Configuración'
                            )}
                        </button>
                    )}
                    {currentStep === 5 && (
                        <button
                            onClick={handleFinish}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Ir al Dashboard
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;
