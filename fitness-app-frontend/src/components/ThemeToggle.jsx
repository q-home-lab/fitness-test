import React from 'react';
import * as Switch from '@radix-ui/react-switch';
import useThemeStore from '../stores/useThemeStore';

const ThemeToggle = () => {
    const theme = useThemeStore((state) => state.theme);
    const toggleTheme = useThemeStore((state) => state.toggleTheme);
    const isDark = theme === 'dark';

    return (
        <div className="flex items-center gap-2">
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-gray-600 dark:text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <Switch.Root
                checked={isDark}
                onCheckedChange={toggleTheme}
                className="relative w-11 h-6 bg-gray-300 dark:bg-gray-700 rounded-full outline-none cursor-pointer data-[state=checked]:bg-gray-700 dark:data-[state=checked]:bg-gray-500 transition-colors"
                aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
                role="switch"
                aria-checked={isDark}
            >
                <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 text-gray-600 dark:text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        </div>
    );
};

export default ThemeToggle;
