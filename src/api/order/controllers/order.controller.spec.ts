import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from './order.controller';
import { OrderService } from '../services/order.service';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { ResponseCode } from 'src/api/common/constant';
import { OrderStatus } from '../schemas/order.enum';

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: Partial<Record<keyof OrderService, jest.Mock>>;

  const mockOrder = {
    _id: 'order-id',
    record: 'record-id',
    quantity: 2,
    status: OrderStatus.PENDING,
  };

  beforeEach(async () => {
    orderService = {
      createOrder: jest.fn().mockResolvedValue(mockOrder),
      findAllOrders: jest
        .fn()
        .mockResolvedValue({ items: [mockOrder], total: 1 }),
      cancelOrder: jest
        .fn()
        .mockResolvedValue({ ...mockOrder, status: 'CANCELLED' }),
      approveOrder: jest
        .fn()
        .mockResolvedValue({ ...mockOrder, status: 'COMPLETED' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: orderService,
        },
      ],
    }).compile();

    controller = module.get<OrderController>(OrderController);
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
      const createOrderDto: CreateOrderRequestDTO = {
        recordId: 'record-id',
        quantity: 2,
      };

      const result = await controller.createOrder(createOrderDto);

      expect(orderService.createOrder).toHaveBeenCalledWith(createOrderDto);

      expect(result).toEqual({
        responseCode: ResponseCode.SUCCESSFUL,
        responseText: 'Order successfully created.',
        data: mockOrder,
      });
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of orders', async () => {
      const pagination = { skip: 0, limit: 10 };

      const result = await controller.findAll(pagination);

      expect(orderService.findAllOrders).toHaveBeenCalledWith(pagination);
      expect(result).toEqual({
        responseCode: ResponseCode.SUCCESSFUL,
        responseText: 'Orders successfully fetched.',
        data: { items: [mockOrder], total: 1 },
      });
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      const orderId = 'order-id';

      const result = await controller.cancelOrder(orderId);

      expect(orderService.cancelOrder).toHaveBeenCalledWith(orderId);
      expect(result).toEqual({
        responseCode: ResponseCode.SUCCESSFUL,
        responseText: 'Order successfully cancelled.',
        data: { ...mockOrder, status: 'CANCELLED' },
      });
    });
  });

  describe('approveOrder', () => {
    it('should approve an order successfully', async () => {
      const orderId = 'order-id';

      const result = await controller.approveOrder(orderId);

      expect(orderService.approveOrder).toHaveBeenCalledWith(orderId);
      expect(result).toEqual({
        responseCode: ResponseCode.SUCCESSFUL,
        responseText: 'Order successfully approved.',
        data: { ...mockOrder, status: 'COMPLETED' },
      });
    });
  });
});
