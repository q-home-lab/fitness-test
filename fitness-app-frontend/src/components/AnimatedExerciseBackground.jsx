/**
 * Componente de fondo animado con iconos de ejercicios usando GSAP
 * Usa iconos de lucide-react para una mejor experiencia visual
 */
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Dumbbell,
  Activity,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  Rocket,
  Shield,
  Gauge,
} from 'lucide-react';

// Registrar el plugin de ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const AnimatedExerciseBackground = () => {
  const containerRef = useRef(null);
  const iconsRef = useRef([]);
  const particlesRef = useRef([]);

  // Iconos disponibles de lucide-react
  const iconComponents = [
    Dumbbell,
    Activity,
    Heart,
    Zap,
    Target,
    TrendingUp,
    Flame,
    Award,
    Sparkles,
    Rocket,
    Shield,
    Gauge,
  ];

  // Configuración de iconos con posiciones y propiedades
  const iconConfigs = [
    { icon: 0, size: 50, x: '8%', y: '15%', color: 'blue', delay: 0, duration: 12 },
    { icon: 1, size: 45, x: '85%', y: '12%', color: 'purple', delay: 1.5, duration: 14 },
    { icon: 2, size: 55, x: '18%', y: '75%', color: 'pink', delay: 3, duration: 11 },
    { icon: 3, size: 48, x: '78%', y: '68%', color: 'blue', delay: 0.8, duration: 13 },
    { icon: 4, size: 42, x: '3%', y: '48%', color: 'purple', delay: 2.2, duration: 10 },
    { icon: 5, size: 50, x: '92%', y: '42%', color: 'pink', delay: 3.5, duration: 12 },
    { icon: 6, size: 46, x: '52%', y: '8%', color: 'blue', delay: 1.2, duration: 11 },
    { icon: 7, size: 44, x: '65%', y: '82%', color: 'purple', delay: 2.8, duration: 15 },
    { icon: 8, size: 38, x: '28%', y: '28%', color: 'pink', delay: 4, duration: 9 },
    { icon: 9, size: 52, x: '88%', y: '78%', color: 'blue', delay: 1.8, duration: 13 },
    { icon: 10, size: 40, x: '12%', y: '88%', color: 'purple', delay: 3.2, duration: 10 },
    { icon: 11, size: 48, x: '72%', y: '22%', color: 'pink', delay: 1, duration: 14 },
    { icon: 0, size: 35, x: '45%', y: '55%', color: 'blue', delay: 2.5, duration: 11 },
    { icon: 1, size: 43, x: '38%', y: '18%', color: 'purple', delay: 3.8, duration: 12 },
    { icon: 2, size: 41, x: '58%', y: '72%', color: 'pink', delay: 1.5, duration: 13 },
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: 'text-blue-500/25 dark:text-blue-400/15',
      purple: 'text-purple-500/25 dark:text-purple-400/15',
      pink: 'text-pink-500/25 dark:text-pink-400/15',
    };
    return colors[color] || colors.blue;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Animar cada icono individualmente con GSAP
      iconsRef.current.forEach((iconEl, index) => {
        if (!iconEl) return;
        
        const config = iconConfigs[index];
        const IconComponent = iconComponents[config.icon];

        // Animación de flotación y rotación
        gsap.to(iconEl, {
          y: -40,
          x: 30,
          rotation: 360,
          opacity: 0.35,
          scale: 1.3,
          duration: config.duration,
          delay: config.delay,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // Animación de escala pulsante
        gsap.to(iconEl, {
          scale: 1.3,
          opacity: 0.35,
          duration: config.duration * 0.5,
          delay: config.delay,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        });

        // Animación de rotación continua
        gsap.to(iconEl, {
          rotation: 360,
          duration: config.duration * 2,
          delay: config.delay,
          repeat: -1,
          ease: 'none',
        });
      });

      // Animar partículas
      particlesRef.current.forEach((particleEl, index) => {
        if (!particleEl) return;

        const randomDuration = Math.random() * 5 + 4;
        const randomDelay = Math.random() * 3;

        gsap.to(particleEl, {
          y: -30,
          x: Math.random() * 20 - 10,
          opacity: 0.6,
          scale: 1.8,
          duration: randomDuration,
          delay: randomDelay,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      });

      // Animación basada en scroll
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          iconsRef.current.forEach((iconEl, index) => {
            if (!iconEl) return;
            gsap.to(iconEl, {
              opacity: 0.15 + progress * 0.2,
              scale: 0.7 + progress * 0.3,
              duration: 0.3,
            });
          });
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Iconos animados */}
      {iconConfigs.map((config, index) => {
        const IconComponent = iconComponents[config.icon];
        return (
          <div
            key={`icon-${index}`}
            ref={(el) => (iconsRef.current[index] = el)}
            className={`absolute ${getColorClass(config.color)}`}
            style={{
              left: config.x,
              top: config.y,
              width: config.size,
              height: config.size,
            }}
          >
            <IconComponent className="w-full h-full drop-shadow-lg" />
          </div>
        );
      })}

      {/* Partículas decorativas */}
      {[...Array(25)].map((_, i) => {
        const colors = ['blue', 'purple', 'pink'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const colorClasses = {
          blue: 'bg-gradient-to-br from-blue-400/30 to-blue-600/20 dark:from-blue-500/15 dark:to-blue-700/10',
          purple: 'bg-gradient-to-br from-purple-400/30 to-purple-600/20 dark:from-purple-500/15 dark:to-purple-700/10',
          pink: 'bg-gradient-to-br from-pink-400/30 to-pink-600/20 dark:from-pink-500/15 dark:to-pink-700/10',
        };

        return (
          <div
            key={`particle-${i}`}
            ref={(el) => (particlesRef.current[i] = el)}
            className={`absolute rounded-full ${colorClasses[color]} blur-sm`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: Math.random() * 12 + 6,
              height: Math.random() * 12 + 6,
            }}
          />
        );
      })}

      {/* Líneas de conexión sutiles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.08 }}>
        <defs>
          <linearGradient id="exercise-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {[...Array(6)].map((_, i) => {
          const x1 = Math.random() * 100;
          const y1 = Math.random() * 100;
          const x2 = Math.random() * 100;
          const y2 = Math.random() * 100;

          return (
            <line
              key={`line-${i}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="url(#exercise-gradient)"
              strokeWidth="1.5"
              strokeDasharray="5,5"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default AnimatedExerciseBackground;
