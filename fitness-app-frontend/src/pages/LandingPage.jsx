import React, { useState, useEffect, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useUserStore from '../stores/useUserStore';
import useBrandStore from '../stores/useBrandStore';
import * as Tabs from '@radix-ui/react-tabs';
import { DashboardPreview, RoutinesPreview, NutritionPreview, ProgressPreview } from '../components/DemoPreview';
import ThemeToggle from '../components/ThemeToggle';
import Icon from '../components/Icons';
import AnimatedExerciseBackground from '../components/AnimatedExerciseBackground';

// Registrar el plugin de ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const LandingPage = () => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated());
  const brandSettings = useBrandStore((state) => state.brandSettings);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  // eslint-disable-next-line no-unused-vars
  const [activeFeature, setActiveFeature] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Refs para animaciones GSAP
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);
  const ctaRef = useRef(null);
  const featureCardsRef = useRef([]);
  const benefitCardsRef = useRef([]);
  const containerRef = useRef(null);

  // Smooth scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallax transforms
  const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.3], [0, -50]);
  const heroScale = useTransform(smoothProgress, [0, 0.3], [1, 0.95]);

  // Track scroll for navbar
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setIsScrolled(latest > 0.1);
  });

  const features = [
    {
      title: 'Dashboard Inteligente',
      description: 'Visualiza tu progreso diario con gráficos interactivos y métricas en tiempo real.',
      iconName: 'dashboard',
      color: 'rgba(59, 130, 246, 0.1)',
      preview: DashboardPreview,
    },
    {
      title: 'Rutinas Personalizadas',
      description: 'Crea y gestiona tus rutinas de entrenamiento con ejercicios detallados y GIFs animados.',
      iconName: 'workout',
      color: 'rgba(168, 85, 247, 0.1)',
      preview: RoutinesPreview,
    },
    {
      title: 'Seguimiento Nutricional',
      description: 'Registra tus comidas y controla tus macronutrientes con precisión.',
      iconName: 'nutrition',
      color: 'rgba(34, 197, 94, 0.1)',
      preview: NutritionPreview,
    },
    {
      title: 'Progreso Visual',
      description: 'Observa tu evolución con gráficos de peso y métricas detalladas.',
      iconName: 'trendUp',
      color: 'rgba(249, 115, 22, 0.1)',
      preview: ProgressPreview,
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Animaciones GSAP para efectos dinámicos al navegar
  useEffect(() => {
    let ctx;
    // Esperar a que el DOM esté completamente cargado
    const timer = setTimeout(() => {
      ctx = gsap.context(() => {
        // Animación de entrada para las tarjetas de características
        featureCardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.set(card, { opacity: 0, y: 40 });
            gsap.to(card, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              delay: index * 0.15,
              ease: 'back.out(1.4)',
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none',
                once: true,
              },
            });

            // Efecto hover con GSAP
            const handleMouseEnter = () => {
              gsap.to(card, {
                y: -8,
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out',
              });
            };

            const handleMouseLeave = () => {
              gsap.to(card, {
                y: 0,
                scale: 1,
                duration: 0.3,
                ease: 'power2.out',
              });
            };

            card.addEventListener('mouseenter', handleMouseEnter);
            card.addEventListener('mouseleave', handleMouseLeave);
          }
        });

        // Animación de entrada para las tarjetas de beneficios
        benefitCardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.set(card, { opacity: 0, x: index % 2 === 0 ? -30 : 30 });
            gsap.to(card, {
              opacity: 1,
              x: 0,
              rotation: 0,
              duration: 0.8,
              delay: index * 0.1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none',
                once: true,
              },
            });
          }
        });

        // Animación de entrada para la sección CTA
        if (ctaRef.current) {
          gsap.set(ctaRef.current, { opacity: 0, scale: 0.95 });
          gsap.to(ctaRef.current, {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
              once: true,
            },
          });

          // Animación pulsante continua para el CTA (solo después de que aparezca)
          ScrollTrigger.create({
            trigger: ctaRef.current,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              gsap.to(ctaRef.current, {
                scale: 1.02,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
              });
            },
          });
        }

        // Animación de números en la sección de estadísticas
        const statsNumbers = document.querySelectorAll('[data-stat-number]');
        statsNumbers.forEach((stat) => {
          const originalText = stat.textContent.trim();
          const parentElement = stat.parentElement;
          
          // Guardar el texto original como atributo data antes de cualquier cambio
          stat.setAttribute('data-original', originalText);
          
          ScrollTrigger.create({
            trigger: parentElement,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              const savedText = stat.getAttribute('data-original') || originalText;
              
              if (savedText.includes('K+')) {
                // Manejar formato "10K+" - extraer el número antes de K
                const match = savedText.match(/(\d+)K\+/);
                if (match) {
                  const numValue = parseInt(match[1]);
                  const obj = { value: 0 };
                  gsap.to(obj, {
                    value: numValue,
                    duration: 2,
                    ease: 'power2.out',
                    onUpdate: function() {
                      stat.textContent = Math.floor(obj.value) + 'K+';
                    },
                  });
                }
              } else if (savedText.includes('+') && !savedText.includes('K')) {
                // Manejar formato "500+" - extraer el número antes de +
                const match = savedText.match(/(\d+)\+/);
                if (match) {
                  const numValue = parseInt(match[1]);
                  const obj = { value: 0 };
                  gsap.to(obj, {
                    value: numValue,
                    duration: 2,
                    ease: 'power2.out',
                    onUpdate: function() {
                      stat.textContent = Math.floor(obj.value) + '+';
                    },
                  });
                }
              } else if (savedText.includes('/')) {
                // Manejar formato "24/7" - no animar, solo mostrar
                stat.textContent = savedText;
              } else {
                // Manejar números normales
                const numMatch = savedText.match(/(\d+)/);
                if (numMatch) {
                  const numValue = parseInt(numMatch[1]);
                  const suffix = savedText.replace(/\d/g, '');
                  const obj = { value: 0 };
                  gsap.to(obj, {
                    value: numValue,
                    duration: 2,
                    ease: 'power2.out',
                    onUpdate: function() {
                      stat.textContent = Math.floor(obj.value) + suffix;
                    },
                  });
                }
              }
            },
          });
        });

        // Animación de texto con efecto de escritura para títulos principales
        const titles = document.querySelectorAll('[data-animate-title]');
        titles.forEach((title) => {
          gsap.set(title, { opacity: 0, y: 20 });
          gsap.to(title, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: title,
              start: 'top 90%',
              toggleActions: 'play none none none',
              once: true,
            },
          });
        });

        // Efecto de ondas en botones principales
        const buttons = document.querySelectorAll('[data-gsap-button]');
        buttons.forEach((button) => {
          const handleClick = (e) => {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            button.appendChild(ripple);

            gsap.from(ripple, {
              scale: 0,
              opacity: 0.6,
              duration: 0.6,
              ease: 'power2.out',
              onComplete: () => ripple.remove(),
            });
          };

          button.addEventListener('click', handleClick);
        });
      }, containerRef.current || document.body);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (ctx) {
        ctx.revert();
      }
    };
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#FAF3E1] dark:bg-black overflow-x-hidden transition-colors duration-300">
      {/* Minimalist Navbar with Glassmorphism */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'backdrop-blur-xl bg-white/95 dark:bg-black/95 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm'
            : 'backdrop-blur-md bg-white/60 dark:bg-black/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2"
            >
              {brandSettings.logo_url ? (
                <img 
                  src={brandSettings.logo_url} 
                  alt={brandSettings.brand_name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-base">
                    {brandSettings.brand_name?.charAt(0).toUpperCase() || 'F'}
                  </span>
                </div>
              )}
              <span className="hidden sm:inline">{brandSettings.brand_name}</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 sm:gap-4"
            >
              <ThemeToggle />
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGetStarted}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-full transition-all hover:bg-gray-800 dark:hover:bg-gray-100 whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Comenzar</span>
                    <span className="sm:hidden">Inicio</span>
                  </motion.button>
                </>
              ) : (
                <Link
                  to="/dashboard"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-full transition-all hover:bg-gray-800 dark:hover:bg-gray-100 whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">App</span>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Minimalist Apple Style */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF3E1] via-[#FAF3E1] to-[#F5E7C6] dark:from-gray-950 dark:via-black dark:to-black transition-colors duration-300" />
        
        {/* Animated gradient orbs with glassmorphism */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{
              background: `radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{
              background: `radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Animated Exercise Background */}
        <AnimatedExerciseBackground />

        {/* Hero Content */}
        <motion.div
          ref={heroRef}
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 w-full flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 flex justify-center"
          >
            <span className="inline-block px-4 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-400 bg-white/60 dark:bg-black/60 backdrop-blur-md rounded-full border border-gray-200/50 dark:border-gray-800/50">
              {brandSettings.tagline}
            </span>
          </motion.div>

          <motion.h1
            data-animate-title
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-gray-900 dark:text-white mb-4 sm:mb-6 leading-[1.1] px-4 relative z-10 text-center"
          >
            Transforma tu cuerpo,
            <br />
            <span className="font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              transforma tu vida.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4 relative z-10 font-medium text-center"
          >
            La plataforma de fitness más completa. Crea rutinas personalizadas, 
            controla tu nutrición y alcanza tus objetivos con el seguimiento perfecto.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
          >
            <motion.button
              data-gsap-button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="relative z-10 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 rounded-full transition-all shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 overflow-hidden"
            >
              <span className="relative z-10">Comenzar Gratis</span>
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="relative z-10 w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-semibold text-gray-900 dark:text-white bg-white/80 dark:bg-black/80 backdrop-blur-xl rounded-full border-2 border-gray-300/50 dark:border-gray-700/50 transition-all hover:bg-white dark:hover:bg-gray-900 shadow-lg hover:shadow-xl"
            >
              Ver Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-6 h-10 border border-gray-300 dark:border-gray-700 rounded-full flex justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section with Glassmorphism Cards */}
      <section ref={featuresRef} id="features" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12 relative bg-gradient-to-b from-transparent via-white/20 dark:via-black/20 to-transparent">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            data-animate-title
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12 sm:mb-16 md:mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-light tracking-tight text-gray-900 dark:text-white mb-3 sm:mb-4 text-center">
              Diseñado para{' '}
              <span className="font-medium bg-gradient-to-r from-gray-900 via-gray-800 to-gray-800 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                resultados
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-400 max-w-2xl mx-auto px-4 text-center">
              Todo lo que necesitas para alcanzar tus objetivos de fitness
            </p>
          </motion.div>

          {/* Feature Cards with Glassmorphism */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                ref={(el) => (featureCardsRef.current[index] = el)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="group relative"
              >
                <div
                  className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-500 hover:border-gray-300/50 dark:hover:border-gray-700/50 hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color} 0%, rgba(255, 255, 255, 0.1) 100%)`,
                  }}
                >
                  <div className="mb-3 sm:mb-4 flex items-center justify-center w-full">
                    <Icon name={feature.iconName} className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700 dark:text-gray-300" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white mb-2 text-center w-full">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-400 leading-relaxed text-center w-full">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Interactive Demo with Radix Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20"
          >
            <Tabs.Root
              defaultValue={features[0].title}
              className="w-full"
              onValueChange={(value) => {
                const index = features.findIndex((f) => f.title === value);
                setActiveFeature(index);
              }}
            >
              <Tabs.List className="flex gap-2 mb-6 sm:mb-8 justify-center flex-wrap px-4">
                {features.map((feature, index) => (
                  <Tabs.Trigger
                    key={index}
                    value={feature.title}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-black/60 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 transition-all data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:dark:bg-white data-[state=active]:dark:text-gray-900 hover:bg-white/80 dark:hover:bg-black/80"
                  >
                    <span className="hidden sm:inline">{feature.title}</span>
                    <span className="sm:hidden">{feature.title.split(' ')[0]}</span>
                  </Tabs.Trigger>
                ))}
              </Tabs.List>

              <div className="relative">
                {features.map((feature, index) => {
                  const PreviewComponent = feature.preview;
                  return (
                    <Tabs.Content
                      key={index}
                      value={feature.title}
                      className="mt-6"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-black/80 border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
                      >
                        <div className="p-8">
                          <PreviewComponent />
                        </div>
                      </motion.div>
                    </Tabs.Content>
                  );
                })}
              </div>
            </Tabs.Root>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-white/30 dark:bg-gray-950/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <motion.div
            data-animate-title
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12 sm:mb-16 w-full"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-3 sm:mb-4 text-center w-full">
              ¿Por qué elegir{' '}
              <span className="font-medium bg-gradient-to-r from-gray-900 via-gray-800 to-gray-800 dark:from-white dark:via-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                {brandSettings.brand_name || 'nosotros'}?
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-400 max-w-2xl mx-auto px-4 text-center w-full">
              Todo lo que necesitas en un solo lugar
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ),
                title: 'Todo en uno',
                description: 'Dashboard, rutinas, nutrición y progreso en una sola aplicación.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: 'Rutinas personalizadas',
                description: 'Crea y gestiona tus entrenamientos con ejercicios detallados.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                ),
                title: 'Seguimiento nutricional',
                description: 'Registra comidas y controla tus macronutrientes fácilmente.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Progreso visual',
                description: 'Gráficos y métricas para ver tu evolución en tiempo real.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Fácil de usar',
                description: 'Interfaz intuitiva diseñada para que cualquier persona pueda usarla.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Acceso 24/7',
                description: 'Disponible en cualquier momento y lugar desde tu dispositivo.',
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                ref={(el) => (benefitCardsRef.current[index] = el)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-white/60 dark:bg-black/60 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300/50 dark:hover:border-gray-700/50 transition-all duration-300"
              >
                <div className="mb-4 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-pink-100 dark:from-blue-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <div className="text-blue-600 dark:text-blue-400">
                      {benefit.icon}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-white mb-2 text-center">
                  {benefit.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-400 text-center leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Minimalist */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-8 text-center">
            {[
              { number: '10K+', label: 'Usuarios Activos' },
              { number: '500+', label: 'Ejercicios' },
              { number: '24/7', label: 'Disponible' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div data-stat-number className="text-3xl sm:text-5xl md:text-6xl font-light text-gray-900 dark:text-white mb-1 sm:mb-2 text-center w-full">
                  {stat.number}
                </div>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-400 font-medium px-1 text-center w-full">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Minimalist */}
      <section className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12 relative overflow-hidden">
        {/* Fondo animado sutil para CTA */}
        <div className="absolute inset-0 opacity-30">
          <AnimatedExerciseBackground />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-3xl backdrop-blur-xl bg-gradient-to-br from-white/90 via-[#F5E7C6]/80 to-white/90 dark:from-gray-950/90 dark:via-black/80 dark:to-gray-950/90 border-2 border-gray-200/50 dark:border-gray-800/50 shadow-2xl"
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 blur-xl"
            />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-gray-900 dark:text-white mb-4 sm:mb-6 text-center">
                ¿Listo para{' '}
                <span className="font-medium bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  transformarte?
                </span>
              </h2>
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 max-w-xl mx-auto px-4 font-medium text-center">
                Únete a miles de usuarios que ya están alcanzando sus objetivos
              </p>
              <motion.button
                data-gsap-button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="relative px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-500 dark:via-purple-500 dark:to-pink-500 rounded-full transition-all shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 overflow-hidden"
              >
                <span className="relative z-10">Comenzar Ahora - Es Gratis</span>
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Minimalist */}
      <footer className="py-12 px-6 md:px-12 border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            {brandSettings.brand_name}
          </div>
          {brandSettings.tagline && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {brandSettings.tagline}
            </p>
          )}
          
          {/* Redes Sociales */}
          {(brandSettings.instagram_url || brandSettings.facebook_url || brandSettings.twitter_url || 
            brandSettings.linkedin_url || brandSettings.youtube_url || brandSettings.tiktok_url || 
            brandSettings.website_url) && (
            <div className="flex justify-center gap-4 mb-6 flex-wrap">
              {brandSettings.instagram_url && (
                <a
                  href={brandSettings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              {brandSettings.facebook_url && (
                <a
                  href={brandSettings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {brandSettings.twitter_url && (
                <a
                  href={brandSettings.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-400 dark:hover:text-blue-400 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              )}
              {brandSettings.linkedin_url && (
                <a
                  href={brandSettings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {brandSettings.youtube_url && (
                <a
                  href={brandSettings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label="YouTube"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              {brandSettings.tiktok_url && (
                <a
                  href={brandSettings.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
              {brandSettings.website_url && (
                <a
                  href={brandSettings.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Sitio Web"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </a>
              )}
            </div>
          )}

          <div className="flex justify-center gap-6">
            <Link
              to="/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

