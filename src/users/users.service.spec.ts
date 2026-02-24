import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './user.schema';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let model: any;

  const mockUser = {
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    save: jest
      .fn()
      .mockResolvedValue({ email: 'test@example.com', name: 'Test User' }),
  };

  const mockUserModel = jest.fn().mockImplementation(() => mockUser);
  (mockUserModel as any).findOne = jest.fn();
  (mockUserModel as any).findById = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash password and save user', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const result = await service.create(
        'test@example.com',
        'password',
        'Test User',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
      expect(result.email).toBe('test@example.com');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      const exec = jest.fn().mockResolvedValue(mockUser);
      model.findOne.mockReturnValue({ exec });

      const result = await service.findByEmail('test@example.com');
      expect(model.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBe(mockUser);
    });
  });

  describe('findById', () => {
    it('should return a user if found by id', async () => {
      const exec = jest.fn().mockResolvedValue(mockUser);
      model.findById.mockReturnValue({ exec });

      const result = await service.findById('someid');
      expect(model.findById).toHaveBeenCalledWith('someid');
      expect(result).toBe(mockUser);
    });
  });
});
