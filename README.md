# Peppermint - API Key Management Feature

This repository contains a backend implementation for an API Key Management feature, designed as a take-home assessment for PPM. The project focuses on API design, security, data modelling, migrations, testing, and deployment.

## Features

### Core CRUD Operations
- **Generate API key**: Create a new API key with a default 30-day expiration.
- **List API keys**: View all API keys for the authenticated user.
- **Revoke API key**: Immediately invalidate an API key.
- **Rotate API key**: Revoke an existing key and generate a new one with the same configuration.

### Security & Requirements
- **Authentication**: JWT-based authentication for all management endpoints.
- **Authorization**: Users can only manage their own keys.
- **Edge Case Handling**: Users are limited to **3 active API keys** at any given time.
- **Safe Auth Errors**: Clear and secure error messages for authentication failures.
- **DTO Validation**: Strict input validation using `class-validator`.

### Data Modelling & Migrations
- **Schema Updates**: Migration using `migrate-mongo` to add expiration dates to existing keys.
- **Backward Compatibility**: Handles keys without expiration dates gracefully.

### Bonus Features
- **Rate Limiting**: Implemented rate limiting per API key (10 requests per minute by default).
- **Audit Logs**:
  - **Access Logs**: Automatically logs all usage of API keys (endpoint, method, IP, User-Agent).
  - **Management Logs**: Logs all key management actions (creation, revocation, rotation) with user and IP context.

## Minimal Client Interface
A simple, built-in UI is available to interact with the API directly from your browser.
- **URL**: `http://localhost:3000/` (when running locally)
- **Features**: Register, Login, Generate Keys, List Keys, and Revoke/Rotate keys.

## Local Setup

### Prerequisites
- Node.js (v22+)
- MongoDB (running locally or a connection URI)

### Installation
```bash
$ npm install
```

### Configuration
Create a `.env` file in the root directory (refer to `.env.example`):
```env
MONGODB_URI=mongodb://localhost:27017/peppermint
JWT_SECRET=your-secret-key
PORT=3000
MAX_API_KEYS_PER_USER=3
```

### Run Migrations
```bash
$ npx migrate-mongo up
```

### Start the Application
```bash
# development
$ npm run start

# watch mode (recommended for development)
$ npm run start:dev
```

## Running Tests
The project maintains a high test coverage (>80%) for all core logic.

```bash
# run all tests
$ npm run test

# run tests with coverage report
$ npm run test:cov
```

## API Documentation
A Postman collection is included in the repository root: `peppermint.postman_collection.json`. 
Import this file into Postman to test the endpoints.

### Key Endpoints (prefixed with `/api`)
- `POST /auth/register`: Create a new user.
- `POST /auth/login`: Authenticate and receive a JWT.
- `POST /api-keys`: Create a new API key (Auth required).
- `GET /api-keys`: List user's keys (Auth required).
- `DELETE /api-keys/:id`: Revoke a key (Auth required).
- `PATCH /api-keys/:id/rotate`: Rotate a key (Auth required).
- `GET /api/protected-data`: Access data using an API Key (API Key required via `x-api-key` header).

## Deployment (AWS Elastic Beanstalk)
A `Procfile` is included for AWS Elastic Beanstalk deployment.

### Steps for AWS Elastic Beanstalk Deployment:
1. **Initialize EB CLI**:
   ```bash
   eb init -p node.js peppermint-backend
   ```
2. **Create Environment**:
   ```bash
   eb create peppermint-prod
   ```
3. **Configure Environment Variables**:
   Set the following variables in the Elastic Beanstalk console (**Environment → Configuration → Environment properties**):
   
   | Key | Example Value |
   |-----|---------------|
   | `MONGODB_URI` (or `MONGO_URI`) | `mongodb+srv://user:pass@cluster.mongodb.net/peppermint` |
   | `JWT_SECRET` | `your-secure-secret-key` |
   | `MAX_API_KEYS_PER_USER` | `3` |
   | `PORT` | `8080` (Default if not set) |

   You can also set them via CLI:
   ```bash
   eb setenv MONGODB_URI=... JWT_SECRET=...
   ```
4. **Deploy**:
   ```bash
   eb deploy
   ```

- **Deployment URL**: `http://ppm-api-env-prod.eba-ps9mgicu.eu-north-1.elasticbeanstalk.com/`
- **Status**: Live on AWS Elastic Beanstalk (eu-north-1).

A `Dockerfile` is also provided if containerized deployment is preferred.

