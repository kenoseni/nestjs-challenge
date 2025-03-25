import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RecordService } from './record.service';
import { MbidService } from 'src/api/integrations/mbid/mbid.service';
import { RecordCategory, RecordFormat } from '../schemas/record.enum';
import { CreateRecordRequestDTO } from '../dtos/create-record.request.dto';
import { Record } from '../schemas/record.schema';

describe('RecordService', () => {
  let service: RecordService;
  let recordModel: any;
  let cacheManager: any;
  let mbidService: any;

  const baseCreateDto: CreateRecordRequestDTO = {
    album: 'Test Album',
    artist: 'Test Artist',
    price: 10,
    qty: 1,
    format: RecordFormat.VINYL,
    category: RecordCategory.ROCK,
    mbid: '',
  };

  const sampleXmlResponse = `<metadata>
    <release>
      <date>2020</date>
      <title>Test Album</title>
      <medium-list>
        <medium>
          <track-list>
            <track>
              <position>1</position>
              <recording>
                <title>Track 1</title>
              </recording>
              <length>300</length>
            </track>
          </track-list>
        </medium>
      </medium-list>
    </release>
  </metadata>`;

  beforeEach(async () => {
    jest.clearAllMocks();

    const recordModelMock: any = jest.fn((recordData) => ({
      ...recordData,
      save: jest.fn().mockResolvedValue(recordData),
    }));
    // Attach static methods.
    recordModelMock.findById = jest.fn();
    recordModelMock.find = jest.fn();
    recordModelMock.countDocuments = jest.fn();

    cacheManager = { get: jest.fn(), set: jest.fn(), clear: jest.fn() };
    mbidService = { getTrackList: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordService,
        { provide: getModelToken(Record.name), useValue: recordModelMock },
        { provide: CACHE_MANAGER, useValue: cacheManager },
        { provide: MbidService, useValue: mbidService },
      ],
    }).compile();

    service = module.get<RecordService>(RecordService);
    recordModel = module.get(getModelToken(Record.name));
  });

  describe('createRecord', () => {
    it('creates a record successfully without mbid', async () => {
      const createDto = new CreateRecordRequestDTO();
      const record = await service.createRecord(createDto);
      expect(record).toEqual(createDto);
    });

    it('creates a record with mbid and merges API details', async () => {
      const createDto = { ...baseCreateDto, mbid: '123' };
      const xmlResponse = sampleXmlResponse;
      cacheManager.get.mockResolvedValue(null);
      mbidService.getTrackList.mockResolvedValue(xmlResponse);

      const record = await service.createRecord(createDto);
      expect(record).toHaveProperty('mbid', '123');
      expect(record).toHaveProperty('album', 'Test Album');
    });

    it('throws ConflictException on duplicate record', async () => {
      const createDto = { ...baseCreateDto };
      const duplicateError = { code: 11000 };
      const recordInstance = {
        ...createDto,
        save: jest.fn().mockRejectedValue(duplicateError),
      };
      (recordModel as any).mockImplementation(() => recordInstance);

      await expect(service.createRecord(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateRecord', () => {
    it('updates a record successfully without changing mbid', async () => {
      const existingRecord = {
        _id: '1',
        album: 'Old Album',
        mbid: '123',
        price: 10,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        save: jest
          .fn()
          .mockResolvedValue({ album: 'Updated Album', mbid: '123' }),
      };
      recordModel.findById.mockResolvedValue(existingRecord);

      const updatePayload = {
        album: 'Updated Album',
        mbid: '123',
        price: 10,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };
      const updatedRecord = await service.updateRecord('1', updatePayload);

      expect(existingRecord.save).toHaveBeenCalled();
      expect(updatedRecord.album).toEqual('Updated Album');
    });

    it('updates a record and fetches new API details if mbid changes', async () => {
      const existingRecord = {
        _id: '1',
        album: 'Old Album',
        mbid: '123',
        price: 10,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        save: jest.fn().mockResolvedValue({
          album: 'Updated Album',
          mbid: '456',
          trackList: [{ title: 'Track 1' }],
        }),
      };
      recordModel.findById.mockResolvedValue(existingRecord);

      const updateDto = {
        album: 'Updated Album',
        mbid: '456',
        price: 10,
        qty: 1,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
      };
      const xmlResponse = sampleXmlResponse;
      cacheManager.get.mockResolvedValue(null);
      mbidService.getTrackList.mockResolvedValue(xmlResponse);

      const updatedRecord = await service.updateRecord('1', updateDto);
      expect(existingRecord.save).toHaveBeenCalled();
      expect(updatedRecord).toHaveProperty('mbid', '456');
    });

    it('throws NotFoundException if record does not exist', async () => {
      recordModel.findById.mockResolvedValue(null);
      await expect(
        service.updateRecord('nonexistent', {
          price: 10,
          qty: 1,
          format: RecordFormat.VINYL,
          category: RecordCategory.ROCK,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllRecords', () => {
    it('returns cached result if available', async () => {
      const query = { q: 'test' };
      const pagination = { skip: 0, limit: 10 };
      const cacheKey = `records_${JSON.stringify(query)}_${JSON.stringify(pagination)}`;
      const cachedResult = { items: [{ album: 'Cached Album' }], total: 1 };

      cacheManager.get.mockResolvedValue(cachedResult);
      const result = await service.findAllRecords(query, pagination);

      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedResult);
    });

    it('queries the database and caches the result if not in cache', async () => {
      const query = { artist: 'Artist' };
      const pagination = { skip: 0, limit: 10 };
      cacheManager.get.mockResolvedValue(null);

      const recordsArray = [{ album: 'DB Album' }];
      const execFind = jest.fn().mockResolvedValue(recordsArray);
      recordModel.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnValue({ exec: execFind }),
      });
      const execCount = jest.fn().mockResolvedValue(1);
      recordModel.countDocuments.mockReturnValue({ exec: execCount });

      const result = await service.findAllRecords(query, pagination);
      expect(result).toEqual({ items: recordsArray, total: 1 });
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });
});
