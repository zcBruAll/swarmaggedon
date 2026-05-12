import jwt from 'jsonwebtoken';

// We extract the exact logic you use in app.js into a standalone function for testing.
// In a real refactor, you would export this function from app.js or an auth.js file.
const generateContext = (req, res) => {
    const token = req.cookies.auth_token;
    let user = null;

    if (token) {
        try {
            // Assuming JWT_SECRET is set in environment during tests
            user = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
        } catch (err) {
            // Token is invalid/expired
        }
    }
    const adminToken = req.cookies.admin_token || null;
    return { res, user, adminToken };
};

describe('GraphQL Context & JWT Auth', () => {
    const SECRET = 'test-secret';

    beforeAll(() => {
        process.env.JWT_SECRET = SECRET;
    });

    it('should return null user if no auth_token cookie is provided', () => {
        const req = { cookies: {} }; // No cookies
        const context = generateContext(req, {});

        expect(context.user).toBeNull();
        expect(context.adminToken).toBeNull();
    });

    it('should decode user correctly if a valid token is provided', () => {
        const validUserPayload = { id: '123', username: 'ProGamer' };
        const token = jwt.sign(validUserPayload, SECRET);

        const req = { cookies: { auth_token: token } };
        const context = generateContext(req, {});

        expect(context.user).toHaveProperty('id', '123');
        expect(context.user).toHaveProperty('username', 'ProGamer');
    });

    it('should fail silently and return null user if token is expired or malformed', () => {
        const req = { cookies: { auth_token: 'this.is.not.a.real.jwt' } };

        // This should NOT throw an error, it should just return user: null
        const context = generateContext(req, {});

        expect(context.user).toBeNull();
    });

    it('should extract admin token completely separate from user token', () => {
        const req = {
            cookies: {
                admin_token: 'super-secret-admin-key'
            }
        };
        const context = generateContext(req, {});

        expect(context.user).toBeNull();
        expect(context.adminToken).toBe('super-secret-admin-key');
    });
});