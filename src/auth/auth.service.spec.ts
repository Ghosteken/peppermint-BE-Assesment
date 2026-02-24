import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let jwtService: any;

  const mockUser = {
    _id: 'userid',
    email: 'test@example.com',
    password: 'hashedPassword',
    toObject: jest.fn().mockReturnValue({
      _id: 'userid',
      email: 'test@example.com',
      password: 'hashedPassword',
    }),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if valid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({ _id: 'userid', email: 'test@example.com' });
    });

    it('should return null if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should sign a token', async () => {
      jwtService.sign.mockReturnValue('token');
      const result = await service.login({
        email: 'test@example.com',
        _id: 'userid',
        name: 'Test User',
      });
      expect(result).toEqual({
        access_token: 'token',
        user: {
          _id: 'userid',
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });
  });

  describe('register', () => {
    it('should create and login user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockUser,
        name: 'Test User',
      });
      jwtService.sign.mockReturnValue('token');

      const result = await service.register(
        'test@example.com',
        'password',
        'Test User',
      );
      expect(result).toEqual({
        access_token: 'token',
        user: {
          _id: 'userid',
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    });

    it('should throw UnauthorizedException if user exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      await expect(
        service.register('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
