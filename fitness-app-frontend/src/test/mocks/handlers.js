import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Mock data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  isAdmin: false,
};

const mockTokens = {
  token: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

const mockLog = {
  log_id: 1,
  user_id: 1,
  date: '2024-01-01',
  weight_kg: 70.5,
};

const mockGoal = {
  goal_id: 1,
  user_id: 1,
  target_weight: 65,
  current_weight: 70.5,
  weekly_weight_change_goal: -0.5,
  goal_type: 'weight_loss',
};

const mockFood = {
  food_id: 1,
  name: 'Pollo',
  calories_base: 165,
  protein_g: 31,
  carbs_g: 0,
  fat_g: 3.6,
};

const mockMealItem = {
  meal_item_id: 1,
  log_id: 1,
  food_id: 1,
  quantity_grams: 100,
  meal_type: 'Desayuno',
  consumed_calories: 165,
};

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    const { email, password } = body;

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        message: 'Login exitoso.',
        token: mockTokens.token,
        refreshToken: mockTokens.refreshToken,
        user: mockUser,
      });
    }

    return HttpResponse.json(
      { error: 'Credenciales inválidas.' },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();
    const { email } = body;

    if (email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'El email ya está registrado.' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      message: 'Registro exitoso.',
      token: mockTokens.token,
      refreshToken: mockTokens.refreshToken,
      user: { ...mockUser, email },
    }, { status: 201 });
  }),

  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    const body = await request.json();
    const { refreshToken } = body;

    if (refreshToken === 'invalid-token') {
      return HttpResponse.json(
        { error: 'Token inválido o expirado.' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      token: 'new-access-token',
    });
  }),

  // Profile endpoint
  http.get(`${API_URL}/profile`, () => {
    return HttpResponse.json({
      profile: mockUser,
    });
  }),

  // Logs endpoints
  http.get(`${API_URL}/logs/:date`, ({ params }) => {
    const { date } = params;
    return HttpResponse.json({
      log: { ...mockLog, date },
      mealItems: [mockMealItem],
      dailyExercises: [],
    });
  }),

  http.get(`${API_URL}/logs/weight/history`, ({ request }) => {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';
    return HttpResponse.json({
      data: [
        { date: '2024-01-01', weight_kg: 70.5 },
        { date: '2024-01-02', weight_kg: 70.3 },
        { date: '2024-01-03', weight_kg: 70.1 },
      ],
    });
  }),

  http.post(`${API_URL}/logs`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      log: { ...mockLog, weight_kg: body.weight || body.weight_kg, date: body.date || mockLog.date },
      message: 'Peso registrado correctamente',
    }, { status: 201 });
  }),

  // Goals endpoints
  http.get(`${API_URL}/goals`, () => {
    return HttpResponse.json({
      goal: mockGoal,
    });
  }),

  http.post(`${API_URL}/goals`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      goal: { ...mockGoal, ...body },
    });
  }),

  // Foods endpoints
  http.get(`${API_URL}/foods/search`, ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';
    
    if (name.toLowerCase().includes('pollo')) {
      return HttpResponse.json({
        foods: [mockFood],
      });
    }

    return HttpResponse.json({
      foods: [],
    });
  }),

  http.post(`${API_URL}/foods`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      food: { ...mockFood, ...body, food_id: Date.now() },
    }, { status: 201 });
  }),

  // Meal items endpoints
  http.post(`${API_URL}/meal-items`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      mealItem: { ...mockMealItem, ...body, meal_item_id: Date.now() },
      updatedLog: mockLog,
    }, { status: 201 });
  }),

  // Onboarding endpoints
  http.get(`${API_URL}/onboarding/status`, () => {
    return HttpResponse.json({
      onboarding_completed: false,
      has_weight: false,
      has_goal: false,
    });
  }),

  http.post(`${API_URL}/onboarding/initial-setup`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Onboarding completado',
      recommendations: {
        current: {
          bmi: 22.5,
          bmiCategory: 'Normal',
          bodyFat: 15,
          bmr: 1800,
          tdee: 2200,
        },
        target: {
          weight: body.target_weight || 65,
          bmi: 20.5,
          bmiCategory: 'Normal',
          bodyFat: 12,
          dailyCalories: 2000,
        },
      },
    });
  }),

  // Notifications endpoints
  http.get(`${API_URL}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    return HttpResponse.json({
      notifications: [],
      unreadCount: 0,
    });
  }),

  http.put(`${API_URL}/notifications/:id/read`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.put(`${API_URL}/notifications/read-all`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.delete(`${API_URL}/notifications/:id`, () => {
    return HttpResponse.json({ success: true });
  }),
];

