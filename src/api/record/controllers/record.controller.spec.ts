import { Test, TestingModule } from '@nestjs/testing';
import { RecordController } from './record.controller';
import { RecordService } from '../services/record.service';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { UpdateRecordRequestDTO } from '../dtos/update-record.request.dto';
import { FindAllQueryDto } from '../dtos/filter-record.dto';
import { ResponseCode } from 'src/api/common/constant';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { Record as RecordModel } from '../schemas/record.schema';

describe('RecordController', () => {
  let controller: RecordController;
  let recordService: Partial<Record<keyof RecordService, jest.Mock>>;

  const mockRecord = {
    _id: 'record-id',
    album: 'Test Album',
    artist: 'Test Artist',
    price: 10,
    qty: 1,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
    mbid: '',
  };

  beforeEach(async () => {
    recordService = {
      createRecord: jest.fn().mockResolvedValue(mockRecord),
      updateRecord: jest
        .fn()
        .mockResolvedValue({ ...mockRecord, album: 'Updated Album' }),
      findAllRecords: jest
        .fn()
        .mockResolvedValue({ items: [mockRecord], total: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecordController],
      providers: [
        { provide: RecordService, useValue: recordService },
        { provide: RecordModel.name, useValue: {} },
      ],
    }).compile();

    controller = module.get<RecordController>(RecordController);
  });

  describe('create', () => {
    it('should create a record successfully', async () => {
      const createRecordDto: CreateRecordRequestDTO = {
        album: 'Test Album',
        artist: 'Test Artist',
        price: 10,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: '',
      };

      const result = await controller.create(createRecordDto);

      expect(recordService.createRecord).toHaveBeenCalledWith(createRecordDto);
      expect(recordService.createRecord).toHaveBeenCalledWith(createRecordDto);
      expect(result).toEqual({
        responseCode: ResponseCode.SUCCESSFUL,
        responseText: 'Record successfully created.',
        data: mockRecord,
      });
    });
  });

  describe('update', () => {
    it('should update a record successfully', async () => {
      const updateDto: UpdateRecordRequestDTO = {
        album: 'Updated Album',
        artist: 'Test Artist',
        price: 15,
        qty: 2,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: '',
      };
      const recordId = 'record-id';

      const result = await controller.update(recordId, updateDto);

      expect(recordService.updateRecord).toHaveBeenCalledWith(
        recordId,
        updateDto,
      );
      expect(result).toEqual({
        responseCode: ResponseCode.SUCCESSFUL,
        responseText: 'Record successfully updated.',
        data: { ...mockRecord, album: 'Updated Album' },
      });
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of records with filters', async () => {
      const query: FindAllQueryDto = {
        q: 'Test',
        artist: 'Test Artist',
        album: undefined,
        format: undefined,
        category: undefined,
      };
      const pagination = { skip: 0, limit: 10 };

      const result = await controller.findAll(query, pagination);

      expect(recordService.findAllRecords).toHaveBeenCalledWith(
        query,
        pagination,
      );
      expect(result).toEqual({
        responseCode: ResponseCode.SUCCESSFUL,
        responseText: 'Record successfully fetched.',
        data: { items: [mockRecord], total: 1 },
      });
    });
  });
});
