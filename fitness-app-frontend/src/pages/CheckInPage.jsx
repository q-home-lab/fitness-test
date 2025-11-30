import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Camera, Star, X } from 'lucide-react';

const CheckInPage = () => {
    const navigate = useNavigate();
    const [weight, setWeight] = useState('');
    const [feeling, setFeeling] = useState(0);
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState({ front: null, side: null, back: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Obtener el lunes de la semana actual
    const getMondayOfWeek = (date = new Date()) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff)).toISOString().split('T')[0];
    };

    const weekOf = getMondayOfWeek();

    const handlePhotoChange = (type, file) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotos(prev => ({ ...prev, [type]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!weight) {
            setError('El peso es requerido');
            return;
        }

        setLoading(true);

        try {
            await api.post('/checkin', {
                week_of: weekOf,
                weight: parseFloat(weight),
                feeling,
                notes,
                photo_front: photos.front,
                photo_side: photos.side,
                photo_back: photos.back,
            });

            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar el check-in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-gray-900 p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    Check-in Semanal
                </h1>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-600 dark:text-red-300">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Peso (kg)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            ¿Cómo te sientes? (1-5)
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setFeeling(num)}
                                    className={`p-3 rounded-lg transition-colors ${
                                        feeling === num
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <Star className={`w-6 h-6 ${feeling === num ? 'fill-current' : ''}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notas
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="¿Cómo ha ido la semana?"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Fotos de Progreso
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {['front', 'side', 'back'].map((type) => (
                                <div key={type} className="space-y-2">
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 capitalize mb-2">
                                        {type === 'front' ? 'Frontal' : type === 'side' ? 'Lateral' : 'Trasera'}
                                    </label>
                                    <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700">
                                        {photos[type] ? (
                                            <>
                                                <img src={photos[type]} alt={type} className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setPhotos(prev => ({ ...prev, [type]: null }))}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                                                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-xs text-gray-400">Subir foto</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handlePhotoChange(type, e.target.files[0])}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Guardando...' : 'Guardar Check-in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckInPage;

