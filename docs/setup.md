# Setup Instructions for Auth Service

## Prerequisites
- Node.js v22.13.1
- Docker and Docker Compose
- Google OAuth credentials (set up in Google Developer Console)

## Local Setup
1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd collaborative_code_editor
   ```

2. **Set up environment variables**:
   - In .env file
     ```
     DATABASE_URL=postgresql://user:password@localhost:5432/code_editor_db
     REDIS_URL=redis://localhost:6379
     JWT_SECRET=your-secret-key
     GOOGLE_CLIENT_ID=your-google-client-id
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     ```

3. **Start Postgres and Redis**:
   ```bash
   docker-compose up -d
   ```

4. **Install dependencies and generate Prisma Client**:
   ```bash
   cd backend/auth-service
   npm install
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Run the service**:
   ```bash
   npm start
   ```

6. **Test endpoints**:
   - Use Postman or curl:
     - `POST http://localhost:3000/api/auth/signup` with `{"name":"Test","email": "test@example.com", "password": "secure123"}`
     - `POST http://localhost:3000/api/auth/login` with the same credentials by excluding 'name' field.
     - `GET http://localhost:3000/api/auth/google` (browser)
     - `GET http://localhost:3000/api/auth/profile` with `Authorization: Bearer <accessToken>`
   - Run tests: `npm test`

## Docker Setup
1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Access the service at `http://localhost:3000`.

## Troubleshooting
- **Prisma errors**: Run `npx prisma generate` and verify `DATABASE_URL`.
- **Redis errors**: Ensure Redis is running (`redis-cli PING`).
- **OAuth errors**: Check Google Console redirect URI (`http://localhost:3000/api/auth/google/callback`).

// E:\collaborative_code_editor\docs\api-spec.md (New: API documentation)
# Auth Service API Specification

## Endpoints

### POST /api/auth/signup
- **Description**: Register a new user with email and password.
- **Request**:
  ```json
  {
    "name": "Test User",
    "email": "test@example.com",
    "password": "secure123"
  }
  ```
- **Response** (201):
  ```json
  {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "userId": 1
  }
  ```
- **Errors**:
  - 400: Invalid email or password
  - 400: Email already registered
  - 500: Internal server error

### POST /api/auth/login
- **Description**: Log in a user with email and password.
- **Request**:
  ```json
  {
    "email": "test@example.com",
    "password": "secure123"
  }
  ```
- **Response** (200):
  ```json
  {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "userId": 1
  }
  ```
- **Errors**:
  - 401: Invalid credentials
  - 500: Internal server error

### GET /api/auth/profile
- **Description**: Get authenticated user's profile.
- **Headers**:
  - Authorization: Bearer <accessToken>
- **Response** (200):
  ```json
  {
    "email": "test@example.com",
    "id": 1
  }
  ```
- **Errors**:
  - 401: No token or invalid token
  - 404: User not found
  - 500: Internal server error

### GET /api/auth/google
- **Description**: Initiate Google OAuth login.
- **Response**: Redirects to Google login page.

### GET /api/auth/google/callback
- **Description**: Handle Google OAuth callback and issue JWTs.
- **Response** (200):
  ```json
  {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "userId": 1
  }
  ```
- **Errors**:
  - 500: Internal server error