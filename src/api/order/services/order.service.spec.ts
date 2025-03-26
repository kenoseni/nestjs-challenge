import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getModelToken } from '@nestjs/mongoose';
import { OrderService } from './order.service';
import { OrderStatus } from '../schemas/order.enum';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { generateObjectId } from 'src/api/common/helpers/generate-id';

const sessionMock = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

const withSession = (result: any) => ({
  session: jest.fn().mockResolvedValue(result),
});

const recordMock = (overrides = {}) => {
  const id = generateObjectId();
  return {
    _id: id,
    qty: 10,
    album: 'Test Album',
    save: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
};

class OrderModelMock {
  _id: string;
  record: string;
  quantity: number;
  status: OrderStatus;
  save = jest.fn().mockResolvedValue(this);

  id = generateObjectId();

  constructor(doc: Partial<OrderModelMock>) {
    Object.assign(this, doc);
    this._id = doc._id || this.id;
  }

  static findById = jest.fn();
  static countDocuments = jest.fn();
  static find = jest.fn();

  static db = {
    startSession: jest.fn().mockResolvedValue(sessionMock),
  };
}

const recordModelMock = {
  findById: jest.fn(),
};

const cacheManagerMock = {
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
};

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    // Clear previous calls.
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getModelToken('Record'), useValue: recordModelMock },
        { provide: getModelToken('Order'), useValue: OrderModelMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('createOrder', () => {
    const id = generateObjectId();
    const createOrderDto: CreateOrderRequestDTO = {
      recordId: id,
      quantity: 2,
    };

    it('should create order successfully', async () => {
      // Simulate record found with sufficient qty.
      const foundRecord = recordMock({ qty: 10 });
      recordModelMock.findById.mockReturnValue(withSession(foundRecord));

      const result = await service.createOrder(createOrderDto);

      expect(foundRecord.qty).toBe(10 - createOrderDto.quantity);

      expect(foundRecord.save).toHaveBeenCalledWith({ session: sessionMock });

      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.record).toBeDefined();

      expect(sessionMock.commitTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should throw NotFoundException if record is not found', async () => {
      recordModelMock.findById.mockReturnValue(withSession(null));

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(recordModelMock.findById).toHaveBeenCalledWith(
        createOrderDto.recordId,
      );
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const foundRecord = recordMock({ qty: 1 });
      recordModelMock.findById.mockReturnValue(withSession(foundRecord));

      await expect(service.createOrder(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(foundRecord.save).not.toHaveBeenCalled();
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    const id = generateObjectId();
    const orderId = id;

    it('should throw NotFoundException if order is not found', async () => {
      OrderModelMock.findById.mockReturnValue(withSession(null));

      await expect(service.cancelOrder(orderId)).rejects.toThrow(
        NotFoundException,
      );
      expect(OrderModelMock.findById).toHaveBeenCalledWith(orderId);
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order status is not pending', async () => {
      const id = generateObjectId();
      const order = new OrderModelMock({
        record: id,
        quantity: 2,
        status: OrderStatus.COMPLETED,
      });
      OrderModelMock.findById.mockReturnValue(withSession(order));

      await expect(service.cancelOrder(orderId)).rejects.toThrow(
        BadRequestException,
      );
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should throw NotFoundException if associated record is not found', async () => {
      // Simulate order found with PENDING status.
      const id = generateObjectId();
      const order = new OrderModelMock({
        record: id,
        quantity: 2,
        status: OrderStatus.PENDING,
      });
      OrderModelMock.findById.mockReturnValue(withSession(order));
      // Simulate record not found.
      recordModelMock.findById.mockReturnValue(withSession(null));

      await expect(service.cancelOrder(orderId)).rejects.toThrow(
        NotFoundException,
      );
      expect(recordModelMock.findById).toHaveBeenCalledWith(order.record);
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should cancel order successfully', async () => {
      const id = generateObjectId();
      const order = new OrderModelMock({
        record: id,
        quantity: 2,
        status: OrderStatus.PENDING,
      });
      OrderModelMock.findById.mockReturnValue(withSession(order));

      const foundRecord = recordMock({ qty: 5 });
      recordModelMock.findById.mockReturnValue(withSession(foundRecord));

      const result = await service.cancelOrder(orderId);
      // Verify stock is restored.
      expect(foundRecord.qty).toBe(5 + order.quantity);
      expect(foundRecord.save).toHaveBeenCalledWith({ session: sessionMock });
      // Verify order status updated.
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.save).toHaveBeenCalledWith({ session: sessionMock });
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });
  });

  describe('approveOrder', () => {
    const id = generateObjectId();
    const orderId = id;

    it('should throw NotFoundException if order is not found', async () => {
      OrderModelMock.findById.mockReturnValue(withSession(null));

      await expect(service.approveOrder(orderId)).rejects.toThrow(
        NotFoundException,
      );
      expect(OrderModelMock.findById).toHaveBeenCalledWith(orderId);
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should throw BadRequestException if order status is not pending', async () => {
      const id = generateObjectId();
      const order = new OrderModelMock({
        record: id,
        quantity: 2,
        status: OrderStatus.CANCELLED,
      });
      OrderModelMock.findById.mockReturnValue(withSession(order));

      await expect(service.approveOrder(orderId)).rejects.toThrow(
        BadRequestException,
      );
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should throw NotFoundException if associated record is not found', async () => {
      const id = generateObjectId();
      const order = new OrderModelMock({
        record: id,
        quantity: 2,
        status: OrderStatus.PENDING,
      });
      OrderModelMock.findById.mockReturnValue(withSession(order));

      recordModelMock.findById.mockReturnValue(withSession(null));

      await expect(service.approveOrder(orderId)).rejects.toThrow(
        NotFoundException,
      );
      expect(recordModelMock.findById).toHaveBeenCalledWith(order.record);
      expect(sessionMock.abortTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });

    it('should approve order successfully', async () => {
      const id = generateObjectId();
      const order = new OrderModelMock({
        record: id,
        quantity: 2,
        status: OrderStatus.PENDING,
      });
      OrderModelMock.findById.mockReturnValue(withSession(order));

      const foundRecord = recordMock();
      recordModelMock.findById.mockReturnValue(withSession(foundRecord));

      const result = await service.approveOrder(orderId);
      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(result.save).toHaveBeenCalledWith({ session: sessionMock });
      expect(sessionMock.commitTransaction).toHaveBeenCalled();
      expect(sessionMock.endSession).toHaveBeenCalled();
    });
  });

  describe('findAllOrders', () => {
    const pagination = { skip: 0, limit: 10 };
    const cacheKey = `orders_${JSON.stringify(pagination)}`;

    it('should return cached result if available', async () => {
      const id = generateObjectId();
      const cachedResult = { items: [{ _id: id }], total: 1 };
      cacheManagerMock.get.mockResolvedValue(cachedResult);

      const result = await service.findAllOrders(pagination);
      expect(cacheManagerMock.get).toHaveBeenCalledWith(cacheKey);
      expect(result).toEqual(cachedResult);
    });

    it('should query database and cache result if no cached data', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      const id1 = generateObjectId();
      const id2 = generateObjectId();
      // Mock find and countDocuments on the OrderModelMock.
      const ordersList = [{ _id: id1 }, { _id: id2 }];
      const totalCount = 2;
      const execFind = jest.fn().mockResolvedValue(ordersList);
      const execCount = jest.fn().mockResolvedValue(totalCount);

      OrderModelMock.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: execFind,
      });
      OrderModelMock.countDocuments.mockReturnValue({
        exec: execCount,
      });

      const result = await service.findAllOrders(pagination);
      expect(OrderModelMock.find).toHaveBeenCalled();
      expect(OrderModelMock.countDocuments).toHaveBeenCalled();
      expect(cacheManagerMock.set).toHaveBeenCalledWith(cacheKey, {
        items: ordersList,
        total: totalCount,
      });
      expect(result).toEqual({ items: ordersList, total: totalCount });
    });
  });
});
