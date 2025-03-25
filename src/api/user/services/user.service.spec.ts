import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';

describe('UserService', () => {
  let service: UserService;
  let userModelMock: any;

  const fakeUser = {
    _id: 'user-id',
    username: 'testuser',
    roles: ['user'],
  };

  beforeEach(async () => {
    userModelMock = jest.fn().mockImplementation((userData) => ({
      ...userData,
      _id: 'new-user-id',
      save: jest.fn().mockResolvedValue({ _id: 'new-user-id', ...userData }),
    }));

    // Attach a static findOne method to the mock constructor.
    userModelMock.findOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: userModelMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUsername', () => {
    it('should return a user when found', async () => {
      userModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeUser),
      });

      const result = await service.findByUsername('tester');
      expect(userModelMock.findOne).toHaveBeenCalledWith({
        username: 'tester',
      });
      expect(result).toEqual(fakeUser);
    });

    it('should return null when no user is found', async () => {
      userModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByUsername('nonexistent');
      expect(userModelMock.findOne).toHaveBeenCalledWith({
        username: 'nonexistent',
      });
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const userData = { username: 'newuser', roles: ['admin'] };

      const result = await service.createUser(userData);

      expect(userModelMock).toHaveBeenCalledWith(userData);
      expect(result).toEqual({ _id: 'new-user-id', ...userData });
    });
  });
});
