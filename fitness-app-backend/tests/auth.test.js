const request = require('supertest');
const app = require('../index');
const { db } = require('../db/db_config');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcrypt');

describe('Auth Routes', () => {
    let testUser;

    beforeAll(async () => {
        // Limpiar usuarios de prueba antes de comenzar
        await db.delete(users).where(eq(users.email, 'test@example.com'));
        await db.delete(users).where(eq(users.email, 'register@example.com'));
    });

    afterAll(async () => {
        // Limpiar después de las pruebas
        await db.delete(users).where(eq(users.email, 'test@example.com'));
        await db.delete(users).where(eq(users.email, 'register@example.com'));
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'register@example.com',
                    password: 'Password123!'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe('register@example.com');
        });

        it('should reject registration with missing email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject registration with missing password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

    });

    describe('POST /api/auth/login', () => {
        beforeAll(async () => {
            // Limpiar usuario de prueba si existe
            await db.delete(users).where(eq(users.email, 'test@example.com'));
            
            // Crear un usuario de prueba para login
            const passwordHash = await bcrypt.hash('Password123!', 10);
            const result = await db.insert(users).values({
                email: 'test@example.com',
                password_hash: passwordHash
            }).returning();
            testUser = result[0];
        });

        it('should login successfully with valid credentials', async () => {
            // Esperar un poco para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('test@example.com');
        });

        it('should reject login with incorrect password', async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword123!'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject login with non-existent email', async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Password123!'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject login with missing email', async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'Password123!'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject login with missing password', async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
});

