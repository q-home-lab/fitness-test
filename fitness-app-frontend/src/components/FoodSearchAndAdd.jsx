import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import VirtualizedList from './VirtualizedList';
import useToastStore from '../stores/useToastStore';
import { useDebounce } from '../hooks/useDebounce';
import { useRateLimit } from '../hooks/useRateLimit';
import logger from '../utils/logger';

const MealType = {
    DESAYUNO: 'Desayuno',
    ALMUERZO: 'Almuerzo',
    CENA: 'Cena',
    SNACK: 'Snack',
};

// Alimentos comunes para sugerencias rápidas
const COMMON_FOODS_SUGGESTIONS = [
    { name: 'Pollo (pechuga sin piel)', calories_base: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    { name: 'Arroz blanco (cocido)', calories_base: 130, protein_g: 2.7, carbs_g: 28, fat_g: 0.3 },
    { name: 'Ternera (lomo)', calories_base: 250, protein_g: 26, carbs_g: 0, fat_g: 17 },
    { name: 'Salmón', calories_base: 208, protein_g: 20, carbs_g: 0, fat_g: 13 },
    { name: 'Huevos (enteros)', calories_base: 155, protein_g: 13, carbs_g: 1.1, fat_g: 11 },
    { name: 'Plátano', calories_base: 89, protein_g: 1.1, carbs_g: 23, fat_g: 0.3 },
    { name: 'Aguacate', calories_base: 160, protein_g: 2, carbs_g: 9, fat_g: 15 },
    { name: 'Yogur griego natural', calories_base: 59, protein_g: 10, carbs_g: 3.6, fat_g: 0.4 },
    { name: 'Pasta (cocida)', calories_base: 131, protein_g: 5, carbs_g: 25, fat_g: 1.1 },
    { name: 'Patata (cocida)', calories_base: 87, protein_g: 2, carbs_g: 20, fat_g: 0.1 },
    { name: 'Pavo (pechuga)', calories_base: 135, protein_g: 30, carbs_g: 0, fat_g: 1 },
    { name: 'Atún en lata (agua)', calories_base: 116, protein_g: 26, carbs_g: 0, fat_g: 1 },
    { name: 'Avena (cocida)', calories_base: 68, protein_g: 2.4, carbs_g: 12, fat_g: 1.4 },
    { name: 'Quinoa (cocida)', calories_base: 120, protein_g: 4.4, carbs_g: 22, fat_g: 1.9 },
    { name: 'Lentejas (cocidas)', calories_base: 116, protein_g: 9, carbs_g: 20, fat_g: 0.4 },
];

const FoodSearchAndAdd = React.memo(({ log, onLogUpdated, date }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedFood, setSelectedFood] = useState(null);
    const [quantity, setQuantity] = useState(100);
    const [mealType, setMealType] = useState(MealType.DESAYUNO);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);
    const dropdownRef = useRef(null);
    const logId = log?.log_id;
    const toast = useToastStore();
    
    // Función de búsqueda con useCallback
    const handleSearch = useCallback(async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }
        
        setSearchLoading(true);
        try {
            const response = await api.get(`/foods/search?name=${encodeURIComponent(query)}`);
            const foods = response.data.foods || [];
            
            // Filtrar resultados para que coincidan mejor con el query
            const queryLower = query.toLowerCase().trim();
            const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
            
            const filteredFoods = foods.filter(food => {
                const foodNameLower = food.name.toLowerCase();
                return queryWords.every(word => foodNameLower.includes(word));
            });
            
            setSearchResults(filteredFoods);
        } catch (error) {
            logger.error('Error en la búsqueda:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, []);
    
    // Debounce del query de búsqueda
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    
    // Rate limiting para búsquedas (máximo 10 por segundo)
    const rateLimitedSearch = useRateLimit(handleSearch, 10, 1000);

    // Mostrar sugerencias comunes cuando el input está vacío
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            if (!selectedFood && searchQuery.length === 0) {
                setSearchResults([]);
                setShowSuggestions(true);
            } else {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }
    }, [searchQuery, selectedFood]);

    // Manejar clics fuera del dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                searchRef.current &&
                !searchRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
                if (!selectedFood) {
                    setSearchResults([]);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedFood]);

    useEffect(() => {
        if (!selectedFood && debouncedSearchQuery.length >= 2) {
            rateLimitedSearch(debouncedSearchQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery, rateLimitedSearch]);

    // Función para seleccionar alimento desde sugerencia común o búsqueda
    const handleSelectFood = async (food) => {
        // Si el alimento tiene food_id, usarlo directamente
        if (food.food_id && typeof food.food_id === 'number') {
            setSelectedFood(food);
            setSearchQuery(food.name);
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }

        // Si es una sugerencia común sin food_id, intentar buscarlo o crearlo
        try {
            setSearchLoading(true);
            // Primero buscar si ya existe
            const searchResponse = await api.get(`/foods/search?name=${encodeURIComponent(food.name)}`);
            
            if (searchResponse.data.foods && searchResponse.data.foods.length > 0) {
                // Si existe, usar el de la base de datos
                const existingFood = searchResponse.data.foods[0];
                setSelectedFood(existingFood);
                setSearchQuery(existingFood.name);
            } else {
                // Si no existe, crear el alimento
                const createResponse = await api.post('/foods', {
                    name: food.name,
                    calories_base: food.calories_base,
                    protein_g: food.protein_g || 0,
                    carbs_g: food.carbs_g || 0,
                    fat_g: food.fat_g || 0,
                });
                
                const createdFood = createResponse.data?.food || food;
                setSelectedFood({
                    ...createdFood,
                    food_id: createdFood.food_id || Date.now()
                });
                setSearchQuery(createdFood.name);
            }
        } catch (error) {
            logger.error('Error al buscar/crear alimento:', error);
            // Si falla, usar la sugerencia directamente como fallback
            setSelectedFood({
                ...food,
                food_id: Date.now()
            });
            setSearchQuery(food.name);
        } finally {
            setSearchLoading(false);
            setSearchResults([]);
            setShowSuggestions(false);
        }
    };

    const calculateCalories = () => {
        if (!selectedFood || !quantity || isNaN(quantity) || parseFloat(quantity) <= 0) return 0;
        const baseCalories = parseFloat(selectedFood.calories_base);
        return (baseCalories / 100) * parseFloat(quantity);
    };

    const calculateMacros = () => {
        if (!selectedFood || !quantity || isNaN(quantity) || parseFloat(quantity) <= 0) {
            return { protein: 0, carbs: 0, fat: 0 };
        }
        const multiplier = parseFloat(quantity) / 100;
        return {
            protein: (parseFloat(selectedFood.protein_g || 0) * multiplier).toFixed(1),
            carbs: (parseFloat(selectedFood.carbs_g || 0) * multiplier).toFixed(1),
            fat: (parseFloat(selectedFood.fat_g || 0) * multiplier).toFixed(1),
        };
    };

    const handleLogMeal = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedFood) {
            toast.error('Por favor, selecciona un alimento.');
            setLoading(false);
            return;
        }

        try {
            // Si no hay log, crear uno automáticamente
            let currentLogId = logId;
            if (!currentLogId && date) {
                try {
                    // Crear el log con peso 0 (se puede actualizar después)
                    const createLogResponse = await api.post('/logs', {
                        date: date,
                        weight: 0
                    });
                    currentLogId = createLogResponse.data.log.log_id;
                    // Recargar el log completo con mealItems vacíos para mantener consistencia
                    // Esto se actualizará después cuando añadamos la comida
                } catch (error) {
                    logger.error('Error al crear log:', error);
                    const errorMessage = error.response?.data?.error || 'Error al crear el registro del día. Por favor, intenta nuevamente.';
                    toast.error(errorMessage);
                    setLoading(false);
                    return;
                }
            }

            if (!currentLogId) {
                toast.error('No se pudo crear el registro del día. Por favor, intenta nuevamente.');
                setLoading(false);
                return;
            }

            const consumed_calories = calculateCalories().toFixed(2);
            
            // Asegurar que tenemos un food_id válido
            let foodId = selectedFood.food_id;
            
            // Si no tenemos food_id válido, buscar o crear el alimento
            if (!foodId || typeof foodId === 'string' || isNaN(foodId)) {
                try {
                    // Buscar primero
                    const searchResponse = await api.get(`/foods/search?name=${encodeURIComponent(selectedFood.name)}`);
                    if (searchResponse.data.foods && searchResponse.data.foods.length > 0) {
                        foodId = searchResponse.data.foods[0].food_id;
                    } else {
                        // Crear si no existe
                        const createResponse = await api.post('/foods', {
                            name: selectedFood.name,
                            calories_base: selectedFood.calories_base,
                            protein_g: selectedFood.protein_g || 0,
                            carbs_g: selectedFood.carbs_g || 0,
                            fat_g: selectedFood.fat_g || 0,
                        });
                        foodId = createResponse.data?.food?.food_id;
                    }
                } catch (error) {
                    logger.error('Error al obtener/crear food_id:', error);
                    toast.error('Error al registrar el alimento. Por favor, intenta nuevamente.');
                    setLoading(false);
                    return;
                }
            }
            
            const response = await api.post('/meal-items', {
                log_id: currentLogId,
                food_id: foodId,
                quantity_grams: parseFloat(quantity).toFixed(2),
                meal_type: mealType,
                consumed_calories: consumed_calories,
            });

            toast.success('Comida registrada correctamente');
            onLogUpdated(response.data.updatedLog);

            setSelectedFood(null);
            setSearchQuery('');
            setQuantity(100);
            setShowSuggestions(false);
            setSearchResults([]);

        } catch (error) {
            logger.error('Error al registrar comida:', error.response?.data);
            toast.error(error.response?.data?.error || 'Error al registrar la comida. Por favor, intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };
    
    // Ya no bloqueamos si no hay log, permitimos crear uno automáticamente

    const macros = calculateMacros();

    return (
        <div className="backdrop-blur-xl bg-white/60 dark:bg-black/60 rounded-3xl border border-gray-200/50 dark:border-gray-800/50 p-8 shadow-sm hover:shadow-lg hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-500">
            <h2 className="text-2xl font-light tracking-tight text-gray-900 dark:text-white mb-6">Añadir Comida</h2>
            
            {/* Búsqueda */}
            <div className="mb-6" ref={searchRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Buscar alimento
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar alimento... (ej: pollo, arroz, ternera)"
                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            if (selectedFood) {
                                setSelectedFood(null);
                            }
                        }}
                        onFocus={() => {
                            if (!selectedFood && searchQuery.length < 2) {
                                setShowSuggestions(true);
                            }
                        }}
                    />
                    {searchLoading && (
                        <div className="absolute right-12 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setSearchResults([]);
                                setSelectedFood(null);
                                setShowSuggestions(true);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Sugerencias comunes */}
                {showSuggestions && !selectedFood && searchQuery.length < 2 && (
                    <div ref={dropdownRef} className="mt-2 backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
                        <div className="px-4 py-2 backdrop-blur-sm bg-gray-100/60 dark:bg-gray-800/60 border-b border-gray-200/50 dark:border-gray-800/50">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Alimentos comunes</span>
                        </div>
                        <VirtualizedList
                            items={COMMON_FOODS_SUGGESTIONS}
                            itemHeight={70}
                            className="max-h-60"
                            renderItem={(suggestion, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSelectFood(suggestion)}
                                    className="w-full px-4 py-3.5 text-left hover:backdrop-blur-md hover:bg-white/60 dark:hover:bg-black/60 transition-all duration-200 border-b border-gray-200/50 dark:border-gray-800/50 last:border-b-0"
                                >
                                    <div className="font-medium text-gray-900 dark:text-white">{suggestion.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {suggestion.calories_base} kcal / 100g
                                        {suggestion.protein_g > 0 && (
                                            <span className="ml-2">• P: {suggestion.protein_g}g • C: {suggestion.carbs_g}g • G: {suggestion.fat_g}g</span>
                                        )}
                                    </div>
                                </button>
                            )}
                        />
                    </div>
                )}

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && searchQuery.length >= 2 && !selectedFood && (
                    <div ref={dropdownRef} className="mt-2 backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-gray-200/50 dark:border-gray-800/50 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
                        <VirtualizedList
                            items={searchResults}
                            itemHeight={70}
                            className="max-h-60"
                            renderItem={(food) => (
                                <button
                                    key={food.food_id}
                                    type="button"
                                    onClick={() => handleSelectFood(food)}
                                    className="w-full px-4 py-3.5 text-left hover:backdrop-blur-md hover:bg-white/60 dark:hover:bg-black/60 transition-all duration-200 border-b border-gray-200/50 dark:border-gray-800/50 last:border-b-0"
                                >
                                    <div className="font-medium text-gray-900 dark:text-white">{food.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {food.calories_base} kcal / 100g
                                        {food.protein_g && (
                                            <span className="ml-2">• P: {food.protein_g}g • C: {food.carbs_g || 0}g • G: {food.fat_g || 0}g</span>
                                        )}
                                    </div>
                                </button>
                            )}
                        />
                    </div>
                )}

                {/* Mensaje cuando no hay resultados */}
                {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && !selectedFood && !showSuggestions && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 px-4 py-2">
                        No se encontraron alimentos. Intenta con otro término o selecciona uno de los alimentos comunes.
                    </div>
                )}
            </div>

            {/* Formulario de registro */}
            {selectedFood && (
                <form onSubmit={handleLogMeal} className="space-y-5">
                    {/* Información del alimento seleccionado */}
                    <div className="backdrop-blur-md bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300">
                        <div className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{selectedFood.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedFood.calories_base} kcal por 100g
                            {selectedFood.protein_g > 0 && (
                                <span className="ml-2">• Proteína: {selectedFood.protein_g}g • Carbos: {selectedFood.carbs_g || 0}g • Grasa: {selectedFood.fat_g || 0}g</span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cantidad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cantidad (g)
                            </label>
                            <input
                                type="number"
                                step="1"
                                min="1"
                                placeholder="100"
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>

                        {/* Tipo de comida */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Momento
                            </label>
                            <select 
                                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-400 transition-all"
                                value={mealType} 
                                onChange={(e) => setMealType(e.target.value)}
                                required
                            >
                                {Object.values(MealType).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Calorías y macronutrientes calculados */}
                    <div className="backdrop-blur-md bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-5 transition-all duration-300">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">Valores calculados</div>
                        <div className="space-y-2">
                            <div className="flex items-baseline justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Calorías totales</span>
                                <span className="text-3xl font-semibold text-blue-600 dark:text-blue-400">
                                    {calculateCalories().toFixed(0)} <span className="text-lg">kcal</span>
                                </span>
                            </div>
                            {selectedFood.protein_g > 0 && (
                                <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                                    <div className="grid grid-cols-3 gap-4 flex-1">
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Proteína</div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{macros.protein}g</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Carbohidratos</div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{macros.carbs}g</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">Grasa</div>
                                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{macros.fat}g</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    <button 
                        type="submit" 
                        className="w-full py-3.5 bg-blue-600 dark:bg-blue-500 text-white rounded-2xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Registrando...
                            </>
                        ) : (
                            `Registrar ${selectedFood.name}`
                        )}
                    </button>
                </form>
            )}
        </div>
    );
});

FoodSearchAndAdd.displayName = 'FoodSearchAndAdd';

export default FoodSearchAndAdd;
