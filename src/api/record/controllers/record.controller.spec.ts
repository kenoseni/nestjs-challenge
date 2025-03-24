import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from '../schemas/record.schema';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';

describe('RecordController', () => {
  let recordController: RecordController;
  let recordModel: Model<Record>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        {
          provide: getModelToken('Record'),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    recordController = module.get<RecordController>(RecordController);
    recordModel = module.get<Model<Record>>(getModelToken('Record'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // it('should create a new record', async () => {
  //   const createRecordDto: CreateRecordRequestDTO = {
  //     artist: 'Test',
  //     album: 'Test Record',
  //     price: 100,
  //     qty: 10,
  //     format: RecordFormat.VINYL,
  //     category: RecordCategory.ALTERNATIVE,
  //   };

  //   const savedRecord = {
  //     _id: '1',
  //     name: 'Test Record',
  //     price: 100,
  //     qty: 10,
  //   };

  //   jest.spyOn(recordModel, 'create').mockResolvedValue(savedRecord as any);

  //   const result = await recordController.create(createRecordDto);
  //   expect(result).toEqual(savedRecord);
  //   expect(recordModel.create).toHaveBeenCalledWith({
  //     artist: 'Test',
  //     album: 'Test Record',
  //     price: 100,
  //     qty: 10,
  //     category: RecordCategory.ALTERNATIVE,
  //     format: RecordFormat.VINYL,
  //   });
  // });

  // it('should return an array of records', async () => {
  //   const records = [
  //     { _id: '1', name: 'Record 1', price: 100, qty: 10 },
  //     { _id: '2', name: 'Record 2', price: 200, qty: 20 },
  //   ];

  //   jest.spyOn(recordModel, 'find').mockReturnValue({
  //     exec: jest.fn().mockResolvedValue(records),
  //   } as any);

  //   const result = await recordController.findAll();
  //   expect(result).toEqual(records);
  //   expect(recordModel.find).toHaveBeenCalled();
  // });

  // Create Method Tests
  describe('create', () => {
    it('should create a new record with valid input', async () => {
      const createRecordDto: CreateRecordRequestDTO = {
        artist: 'Test Artist',
        album: 'Test Album',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
      };

      const savedRecord = {
        _id: '1',
        artist: 'Test Artist',
        album: 'Test Album',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
      };

      jest.spyOn(recordModel, 'create').mockResolvedValue(savedRecord as any);

      const result = await recordController.create(createRecordDto);

      expect(result).toEqual(savedRecord);
      expect(recordModel.create).toHaveBeenCalledWith(createRecordDto);
    });

    it('should throw an error if artist is missing', async () => {
      const createRecordDto: Partial<CreateRecordRequestDTO> = {
        artist: '',
        album: 'Test Album',
        price: 100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
      };

      await expect(
        recordController.create(createRecordDto as CreateRecordRequestDTO),
      ).rejects.toThrow('Validation failed: artist is required');
    });

    it('should throw an error if price is negative', async () => {
      const createRecordDto: CreateRecordRequestDTO = {
        artist: 'Test Artist',
        album: 'Test Album',
        price: -100,
        qty: 10,
        format: RecordFormat.VINYL,
        category: RecordCategory.ALTERNATIVE,
      };

      await expect(recordController.create(createRecordDto)).rejects.toThrow(
        'Validation failed: price must be positive',
      );
    });
  });
});
