/**
 * Utilidades para exportar datos a CSV y otros formatos
 */

/**
 * Exporta datos a CSV
 * @param {Array} data - Array de objetos a exportar
 * @param {string} filename - Nombre del archivo (sin extensión)
 * @param {Array} headers - Array de headers personalizados [['key', 'Label'], ...]
 */
export const exportToCSV = (data, filename = 'export', headers = null) => {
    if (!data || data.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    // Si no se proporcionan headers, usar las claves del primer objeto
    const csvHeaders = headers || Object.keys(data[0]).map(key => [key, key]);
    
    // Crear header row
    // eslint-disable-next-line no-unused-vars
    const headerRow = csvHeaders.map(([_, label]) => `"${label}"`).join(',');
    
    // Crear data rows
    const dataRows = data.map(row => {
        // eslint-disable-next-line no-unused-vars
        return csvHeaders.map(([key, _]) => {
            const value = row[key];
            // Manejar valores nulos, undefined y objetos
            if (value === null || value === undefined) return '""';
            if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
            // Escapar comillas dobles
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    // Combinar todo
    const csvContent = [headerRow, ...dataRows].join('\n');
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};

/**
 * Exporta historial de peso a CSV
 * @param {Array} weightHistory - Array de objetos con {date, weight, consumed_calories, burned_calories}
 */
export const exportWeightHistory = (weightHistory) => {
    const headers = [
        ['date', 'Fecha'],
        ['weight', 'Peso (kg)'],
        ['consumed_calories', 'Calorías Consumidas'],
        ['burned_calories', 'Calorías Quemadas'],
    ];
    
    exportToCSV(weightHistory, 'historial_peso', headers);
};

/**
 * Exporta rutina a formato de texto compartible
 * @param {Object} routine - Objeto de rutina con ejercicios
 */
export const exportRoutine = (routine) => {
    if (!routine || !routine.exercises || routine.exercises.length === 0) {
        alert('La rutina no tiene ejercicios para exportar');
        return;
    }

    let content = `RUTINA: ${routine.name}\n`;
    if (routine.description) {
        content += `Descripción: ${routine.description}\n`;
    }
    content += `\n${'='.repeat(50)}\n\n`;
    
    // Agrupar por día si hay días asignados
    const exercisesByDay = {};
    const exercisesNoDay = [];
    
    routine.exercises.forEach(ex => {
        if (ex.day_of_week !== null && ex.day_of_week !== undefined) {
            if (!exercisesByDay[ex.day_of_week]) {
                exercisesByDay[ex.day_of_week] = [];
            }
            exercisesByDay[ex.day_of_week].push(ex);
        } else {
            exercisesNoDay.push(ex);
        }
    });
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Ejercicios por día
    Object.keys(exercisesByDay).sort().forEach(day => {
        content += `${dayNames[parseInt(day)]}:\n`;
        content += '-'.repeat(30) + '\n';
        exercisesByDay[day].forEach((ex, idx) => {
            content += `${idx + 1}. ${ex.exercise_name || ex.name}\n`;
            content += `   Series: ${ex.sets}`;
            if (ex.reps) content += ` × ${ex.reps} reps`;
            if (ex.duration_minutes) content += ` × ${ex.duration_minutes} min`;
            if (ex.weight_kg > 0) content += ` @ ${ex.weight_kg}kg`;
            content += '\n';
        });
        content += '\n';
    });
    
    // Ejercicios sin día específico
    if (exercisesNoDay.length > 0) {
        content += `Ejercicios (todos los días):\n`;
        content += '-'.repeat(30) + '\n';
        exercisesNoDay.forEach((ex, idx) => {
            content += `${idx + 1}. ${ex.exercise_name || ex.name}\n`;
            content += `   Series: ${ex.sets}`;
            if (ex.reps) content += ` × ${ex.reps} reps`;
            if (ex.duration_minutes) content += ` × ${ex.duration_minutes} min`;
            if (ex.weight_kg > 0) content += ` @ ${ex.weight_kg}kg`;
            content += '\n';
        });
    }
    
    // Crear y descargar
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${routine.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};

