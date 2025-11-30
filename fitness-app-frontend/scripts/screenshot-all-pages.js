import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración
const BASE_URL = process.env.VITE_BASE_URL || 'http://localhost:5173';
const API_URL = process.env.VITE_API_URL || 'http://localhost:4000/api';
const SCREENSHOTS_DIR = join(__dirname, '..', 'screenshots');
const VIEWPORT_WIDTH = 1920;
const VIEWPORT_HEIGHT = 1080;

// Credenciales para autenticación (puedes cambiarlas o usar variables de entorno)
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test123456';

// Definir todas las rutas del frontend
const publicRoutes = [
  { path: '/', name: 'landing-page' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/forgot-password', name: 'forgot-password' },
  { path: '/reset-password', name: 'reset-password' },
];

const protectedRoutes = [
  { path: '/welcome', name: 'welcome' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/weight', name: 'weight-tracking' },
  { path: '/diet', name: 'diet' },
  { path: '/routines', name: 'routines' },
  { path: '/daily-log', name: 'daily-log' },
  { path: '/calendar', name: 'calendar' },
  { path: '/achievements', name: 'achievements' },
  { path: '/admin', name: 'admin-dashboard' },
];

// Crear directorio de capturas si no existe
if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  console.log(`📁 Creada carpeta: ${SCREENSHOTS_DIR}`);
}

/**
 * Autentica al usuario y devuelve el token
 */
async function authenticate() {
  try {
    console.log('🔐 Autenticando usuario...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    const { token, refreshToken, user } = response.data;
    console.log(`✅ Autenticado como: ${user.email} (ID: ${user.id})`);
    return { token, refreshToken, user };
  } catch (error) {
    // Si el login falla, intentar registrar el usuario
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log('⚠️  Usuario no existe, intentando registrar...');
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });
        const { token, refreshToken, user } = response.data;
        console.log(`✅ Usuario registrado y autenticado: ${user.email}`);
        return { token, refreshToken, user };
      } catch (registerError) {
        console.error('❌ Error al registrar usuario:', registerError.response?.data || registerError.message);
        throw registerError;
      }
    }
    throw error;
  }
}

/**
 * Configura el contexto del navegador con el token de autenticación
 */
async function setupAuthContext(context, token, refreshToken, userId) {
  // Inyectar tokens en localStorage para todas las páginas del contexto
  await context.addInitScript((token, refreshToken, userId) => {
    localStorage.setItem('userToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (userId) {
      localStorage.setItem('userId', userId);
    }
  }, token, refreshToken, userId);
}

/**
 * Espera a que la página esté completamente renderizada
 */
async function waitForPageReady(page) {
  // Esperar a que el DOM esté listo
  await page.waitForLoadState('domcontentloaded');
  
  // Esperar a que no haya más requests de red (con timeout)
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch (e) {
    // Si hay requests continuos, continuar de todas formas
    console.log('   ⚠️  Algunas requests aún activas, continuando...');
  }
  
  // Esperar a que React haya renderizado (buscar elementos comunes)
  try {
    await page.waitForSelector('body', { timeout: 5000 });
  } catch (e) {
    // Continuar aunque no encuentre el selector
  }
  
  // Esperar un poco más para animaciones y contenido dinámico
  await page.waitForTimeout(3000);
  
  // Scroll para activar lazy loading de imágenes y contenido
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    return new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          setTimeout(resolve, 500);
        }
      }, 100);
    });
  });
}

/**
 * Toma una captura de pantalla de una ruta
 */
async function takeScreenshot(page, route, authenticated = false) {
  try {
    // Configurar viewport
    await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });
    
    // Navegar a la ruta
    const url = `${BASE_URL}${route.path}`;
    console.log(`📸 Capturando: ${route.name} (${url})...`);
    
    // Navegar a la página
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Esperar a que la página esté completamente renderizada
    await waitForPageReady(page);
    
    // Verificar si estamos en la página correcta o si redirigió
    const currentUrl = page.url();
    if (!currentUrl.includes(route.path) && authenticated) {
      console.log(`   ⚠️  Redirigido a: ${currentUrl}`);
    }
    
    // Tomar captura de pantalla con alta calidad
    const screenshotPath = join(SCREENSHOTS_DIR, `${route.name}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true, // Captura toda la página, no solo el viewport
      type: 'png',
      animations: 'disabled', // Deshabilitar animaciones para captura más estable
    });
    
    console.log(`✅ Guardada: ${screenshotPath}`);
    return { success: true, route: route.name, path: screenshotPath, url: currentUrl };
    
  } catch (error) {
    console.error(`❌ Error capturando ${route.name}:`, error.message);
    
    // Intentar capturar aunque haya error (puede mostrar página de error o login)
    try {
      await page.waitForTimeout(1000);
      const screenshotPath = join(SCREENSHOTS_DIR, `${route.name}-error.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true,
        type: 'png',
      });
      console.log(`⚠️  Guardada captura de error: ${screenshotPath}`);
    } catch (screenshotError) {
      console.error(`❌ No se pudo guardar captura de error para ${route.name}`);
    }
    
    return { success: false, route: route.name, error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando captura de pantallas del frontend...\n');
  console.log(`📍 URL base: ${BASE_URL}`);
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`📁 Carpeta de destino: ${SCREENSHOTS_DIR}\n`);
  
  // Verificar que el servidor esté corriendo
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(BASE_URL, { timeout: 5000, waitUntil: 'domcontentloaded' });
    await page.close();
    await browser.close();
    console.log('✅ Servidor frontend detectado y accesible');
  } catch (error) {
    console.error('❌ Error: No se puede conectar al servidor de desarrollo.');
    console.error(`   Asegúrate de que el servidor esté corriendo en ${BASE_URL}`);
    console.error('   Ejecuta: npm run dev\n');
    process.exit(1);
  }
  
  // Verificar que el backend esté corriendo
  try {
    await axios.get(`${API_URL}/health`).catch(() => {
      // Si no hay endpoint /health, intentar cualquier endpoint
      return axios.get(`${API_URL}/brand`).catch(() => null);
    });
    console.log('✅ Servidor backend detectado y accesible\n');
  } catch (error) {
    console.warn('⚠️  No se pudo verificar el backend, continuando de todas formas...\n');
  }
  
  // Autenticar usuario
  let authData = null;
  try {
    authData = await authenticate();
    console.log('');
  } catch (error) {
    console.error('❌ Error de autenticación:', error.response?.data || error.message);
    console.error('⚠️  Continuando solo con rutas públicas...\n');
  }
  
  // Iniciar navegador
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  
  const results = [];
  
  // Crear contexto con autenticación si está disponible
  let context = null;
  if (authData) {
    context = await browser.newContext();
    // Configurar el script de inicialización para todas las páginas del contexto
    await setupAuthContext(
      context,
      authData.token,
      authData.refreshToken,
      authData.user.id
    );
  }
  
  // Capturar rutas públicas
  console.log('📸 Capturando rutas públicas...\n');
  for (const route of publicRoutes) {
    const page = context 
      ? await context.newPage()
      : await browser.newPage();
    
    try {
      const result = await takeScreenshot(page, route, false);
      results.push(result);
    } finally {
      await page.close();
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Capturar rutas protegidas (solo si hay autenticación)
  if (authData && context) {
    console.log('\n📸 Capturando rutas protegidas...\n');
    for (const route of protectedRoutes) {
      const page = await context.newPage();
      
      try {
        const result = await takeScreenshot(page, route, true);
        results.push(result);
      } finally {
        await page.close();
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  } else {
    console.log('\n⚠️  Saltando rutas protegidas (sin autenticación)\n');
  }
  
  await browser.close();
  
  // Resumen
  console.log('\n📊 Resumen:');
  console.log('─'.repeat(50));
  const totalRoutes = publicRoutes.length + (authData ? protectedRoutes.length : 0);
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`✅ Exitosas: ${successful}/${totalRoutes}`);
  console.log(`❌ Fallidas: ${failed}/${totalRoutes}`);
  console.log(`📁 Carpeta: ${SCREENSHOTS_DIR}\n`);
  
  if (failed > 0) {
    console.log('⚠️  Rutas con errores:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.route}: ${r.error}`);
    });
    console.log('');
  }
  
  if (!authData) {
    console.log('💡 Tip: Para capturar rutas protegidas, asegúrate de que:');
    console.log('   1. El backend esté corriendo');
    console.log('   2. Las credenciales de prueba sean válidas');
    console.log('   3. O configura TEST_EMAIL y TEST_PASSWORD como variables de entorno\n');
  }
}

main().catch(console.error);

