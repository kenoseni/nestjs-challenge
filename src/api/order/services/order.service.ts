import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Record } from 'src/api/record/schemas/record.schema';
import { Order } from '../schemas/order.schema';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { OrderStatus } from '../schemas/order.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Record.name) private recordModel: Model<Record>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Creates a new order based on the provided DTO
   * @param createOrderDto - The DTO containing order creation data.
   * @throws NotFoundException if the record is not found.
   * @throws BadRequestException if stock is insufficient or input is invalid.
   * @returns The created Order document.
   */
  async createOrder(createOrderDto: CreateOrderRequestDTO) {
    const session = await this.orderModel.db.startSession();

    session.startTransaction();

    try {
      // Get latest state of  record
      const record = await this.recordModel
        .findById(createOrderDto.recordId)
        .session(session);
      if (!record) {
        throw new NotFoundException('Record not found');
      }
      if (record.qty < createOrderDto.quantity) {
        throw new BadRequestException(
          `Insufficient stock for record ${record.album}: ${record.qty} available, ${createOrderDto.quantity} requested`,
        );
      }

      record.qty -= createOrderDto.quantity;

      await record.save({ session });

      const order = new this.orderModel({
        record: record._id,
        quantity: createOrderDto.quantity,
        status: OrderStatus.PENDING,
      });
      await order.save({ session });

      await session.commitTransaction();

      await this.cacheManager.clear();

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(`Order creation failed: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Cancels an existing order and restores stock.
   * @param orderId - The ID of the order to cancel.
   * @returns The cancelled Order document.
   * @throws BadRequestException if order cannot be cancelled.
   * @throws NotFoundException if order or record is not found.
   */
  async cancelOrder(orderId: string) {
    const session: ClientSession = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel.findById(orderId).session(session);

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `Order ${orderId} cannot be cancelled; current status: ${order.status}`,
        );
      }

      const record = await this.recordModel
        .findById(order.record)
        .session(session);

      if (!record) {
        throw new NotFoundException('Record not found');
      }
      // Restore stock
      record.qty += order.quantity;
      await record.save({ session });

      // Update order status
      order.status = OrderStatus.CANCELLED;
      await order.save({ session });

      await session.commitTransaction();

      await this.cacheManager.clear();

      return order;
    } catch (error) {
      await session.abortTransaction();

      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            `Order cancellation failed: ${error.message}`,
          );
    } finally {
      session.endSession();
    }
  }

  /**
   * Approves an existing order in pending state by marking it complete.
   * @param orderId - The ID of the order to cancel.
   * @returns The approved Order document.
   * @throws BadRequestException if order cannot be approved.
   * @throws NotFoundException if order or record is not found.
   */
  async approveOrder(orderId: string): Promise<Order> {
    const session: ClientSession = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const order = await this.orderModel.findById(orderId).session(session);
      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          `Order ${orderId} cannot be approved; current status: ${order.status}`,
        );
      }

      const record = await this.recordModel
        .findById(order.record)
        .session(session);
      if (!record) {
        throw new NotFoundException(`Record ${order.record} not found`);
      }

      order.status = OrderStatus.COMPLETED;
      await order.save({ session });

      await session.commitTransaction();

      await this.cacheManager.clear();

      return order;
    } catch (error) {
      await session.abortTransaction();

      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            `Order cancellation failed: ${error.message}`,
          );
    } finally {
      session.endSession();
    }
  }

  async findAllOrders(pagination: {
    skip: number;
    limit: number;
  }): Promise<{ items: Order[]; total: number }> {
    const cacheKey = this.generateCacheKey(pagination);

    const cachedResult = await this.cacheManager.get<{
      items: Order[];
      total: number;
    }>(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    const { skip, limit } = pagination;

    const [orders, total] = await Promise.all([
      this.orderModel.find().skip(skip).limit(limit).exec(),
      this.orderModel.countDocuments().exec(),
    ]);

    const result = { items: orders, total };

    try {
      await this.cacheManager.set(cacheKey, result);
    } catch (error) {
      // console.error('Failed to cache records data:', error);
    }

    return result;
  }

  private generateCacheKey(pagination: {
    skip: number;
    limit: number;
  }): string {
    const paginationString = JSON.stringify(pagination);
    return `orders_${paginationString}`;
  }
}
