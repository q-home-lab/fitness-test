import React from 'react';
import ModernNavbar from '../../components/ModernNavbar';
import BottomNavigation from '../../components/BottomNavigation';

/**
 * Layout principal de la aplicación
 * Envuelve todas las páginas protegidas con navbar y bottom navigation
 * Elimina la necesidad de importar estos componentes en cada página
 */
export const AppLayout = ({ children }) => {
  return (
    <>
      <ModernNavbar />
      <main 
        id="main-content" 
        className="min-h-screen bg-[#FAF3E1] dark:bg-black pt-16 lg:pt-20 pb-16 sm:pb-20 md:pb-8 transition-colors duration-300" 
        role="main"
      >
        {children}
      </main>
      <BottomNavigation />
    </>
  );
};

export default AppLayout;

