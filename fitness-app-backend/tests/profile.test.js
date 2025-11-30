const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { db } = require('../db/db_config');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Profile Route', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        // Crear usuario de prueba y obtener token
        const passwordHash = await bcrypt.hash('testpassword', 10);
        const result = await db.insert(users).values({
            email: 'profile-test@example.com',
            password_hash: passwordHash
        }).returning();
        userId = result[0].user_id;

        authToken = jwt.sign(
            { id: userId, email: result[0].email },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '7d' }
        );
    });

    afterAll(async () => {
        // Limpiar datos de prueba
        await db.delete(users).where(eq(users.user_id, userId));
    });

    describe('GET /api/profile', () => {
        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('profile');
            expect(response.body.profile).toHaveProperty('id');
            expect(response.body.profile).toHaveProperty('email');
            expect(response.body.profile.email).toBe('profile-test@example.com');
        });

        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/profile');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject request with invalid token', async () => {
            const response = await request(app)
                .get('/api/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('error');
        });
    });
});

