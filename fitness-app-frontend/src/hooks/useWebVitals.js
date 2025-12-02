import { useEffect } from 'react';
import logger from '../utils/logger';

/**
 * Hook para trackear Web Vitals (Core Web Vitals)
 * Mide LCP, FID, CLS, FCP, TTFB
 */
export const useWebVitals = () => {
  useEffect(() => {
    // Solo en producción o si está habilitado
    if (!import.meta.env.PROD && import.meta.env.VITE_ENABLE_WEB_VITALS !== 'true') {
      return;
    }

    // Función para enviar métricas
    const sendToAnalytics = (metric) => {
      // Log en desarrollo
      if (import.meta.env.DEV) {
        logger.info(`Web Vital: ${metric.name}`, {
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
        });
      }

      // Enviar a servicio de analytics si está configurado
      if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') {
        // Ejemplo: enviar a Google Analytics, Sentry, etc.
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_category: 'Web Vitals',
            event_label: metric.id,
            non_interaction: true,
          });
        }

        // Enviar a backend si está configurado
        if (import.meta.env.VITE_API_URL) {
          fetch(`${import.meta.env.VITE_API_URL}/analytics/web-vitals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: metric.name,
              value: metric.value,
              rating: metric.rating,
              delta: metric.delta,
              id: metric.id,
              url: window.location.href,
            }),
          }).catch(() => {
            // Silenciar errores de analytics
          });
        }
      }
    };

    // Importar y usar web-vitals si está disponible
    if (typeof window !== 'undefined') {
      // Intentar cargar web-vitals dinámicamente
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
        
        // INP (Interaction to Next Paint) - disponible en versiones recientes
        if (onINP) {
          onINP(sendToAnalytics);
        }
      }).catch(() => {
        // Si web-vitals no está instalado, usar API nativa del navegador
        if ('PerformanceObserver' in window) {
          try {
            // Medir LCP (Largest Contentful Paint)
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const lastEntry = entries[entries.length - 1];
              sendToAnalytics({
                name: 'LCP',
                value: lastEntry.renderTime || lastEntry.loadTime,
                rating: lastEntry.renderTime < 2500 ? 'good' : lastEntry.renderTime < 4000 ? 'needs-improvement' : 'poor',
                delta: lastEntry.renderTime || lastEntry.loadTime,
                id: 'lcp',
              });
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Medir FCP (First Contentful Paint)
            const fcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries();
              entries.forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                  sendToAnalytics({
                    name: 'FCP',
                    value: entry.startTime,
                    rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor',
                    delta: entry.startTime,
                    id: 'fcp',
                  });
                }
              });
            });
            fcpObserver.observe({ entryTypes: ['paint'] });
          } catch (error) {
            logger.warn('No se pudieron medir Web Vitals:', error);
          }
        }
      });
    }
  }, []);
};

