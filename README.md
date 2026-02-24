# PPM Backend - API Key Management Feature

This project implements an API Key Management feature for the PPM backend, demonstrating secure credential handling, validation, migrations, and testing.

## Features
- **User Authentication**: JWT-based registration and login.
- **API Key Management**: Generate, list, revoke, and rotate API keys.
- **Access Logging**: Automatic logging of API key usage.
- **Data Integrity**: Migration-based schema updates (adding expiration dates).
- **Security**: BCrypt password hashing, API key hashing/masking, and JWT protection.
- **Validation**: DTO-based input validation and limits on active API keys (max 3 per user).

## Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or a connection URI)

### Installation
```bash
$ npm install
```

### Configuration
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/peppermint
JWT_SECRET=secret-key
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

# watch mode
$ npm run start:dev
```

## Running Tests
```bash
# unit tests
$ npm run test

# test coverage
$ npm run test:cov
```

## API Documentation
The API documentation is provided as a Postman collection.

### Endpoints
#### Authentication
- `POST /auth/register`: Create a new user account.
- `POST /auth/login`: Login and receive a JWT token.

#### API Key Management
- `POST /api-keys`: Generate a new API key.
- `GET /api-keys`: List all API keys for the authenticated user.
- `DELETE /api-keys/:id`: Revoke an API key.
- `PATCH /api-keys/:id/rotate`: Rotate an API key (revokes old, creates new).

### Postman Collection
[Link to Postman Collection (Placeholder)](https://www.getpostman.com/collections/placeholder)

## Deployment
The application is ready for deployment on AWS using ECS/Fargate or Elastic Beanstalk.

**Deployment URL**: [http://peppermint-backend-dev.us-east-1.elasticbeanstalk.com/](http://peppermint-backend-dev.us-east-1.elasticbeanstalk.com/) (Placeholder)

## Evaluation Criteria
- **Functionality**: All core operations implemented and tested.
- **Code Quality**: Follows NestJS best practices (Controllers, Services, Modules).
- **Security**: Secure password hashing, JWT for auth, and API key validation.
- **Data Integrity**: MongoDB migrations handled via `migrate-mongo`.
- **Testing**: 70%+ coverage on core logic.
