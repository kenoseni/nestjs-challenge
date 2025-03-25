import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Logger,
  UseGuards,
  Get,
  UseInterceptors,
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CreateOrderRequestDTO } from '../dtos/create-order.request.dto';
import { ResponseCode } from 'src/api/common/constant';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/api/user/guards/role.guard';
import { Roles } from 'src/api/common/decorators/roles.decorator';
import { Order } from '../schemas/order.schema';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination } from 'src/api/common/decorators/pagination.decorator';
import { PaginationInterceptor } from 'src/api/common/interceptors/pagination.interceptor';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(private readonly orderService: OrderService) {}

  /**
   * Creates a new order.
   * @param createOrderDto - The DTO containing order creation data.
   * @returns The created Order document.
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createOrder(@Body() createOrderDto: CreateOrderRequestDTO) {
    // this.logger.log(`Creating order for record ${createOrderDto.recordId}`);
    const order = await this.orderService.createOrder(createOrderDto);
    // this.logger.log(`Order created: ${order._id}`);
    return {
      responseCode: ResponseCode.SUCCESSFUL,
      responseText: 'Order successfully created.',
      data: order,
    };
  }

  /**
   * Gets all record and filters by specified queries.
   * @returns The a paginated object containing array of order documents.
   */
  @Get()
  @UseInterceptors(PaginationInterceptor)
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [Order],
  })
  async findAll(@Pagination() pagination: { skip: number; limit: number }) {
    const orders = await this.orderService.findAllOrders(pagination);

    return {
      responseCode: ResponseCode.SUCCESSFUL,
      responseText: 'Orders successfully fetched.',
      data: orders,
    };
  }

  /**
   * Cancels an existing order.
   * @param orderId - The ID of the order to cancel.
   * @returns The cancelled Order document.
   */
  @Patch(':id/cancel')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('creator')
  @ApiOperation({ summary: 'Update an existing order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Cannot find order to cancel' })
  async cancelOrder(@Param('id') orderId: string) {
    // this.logger.log(`Cancelling order ${orderId}`);
    const order = await this.orderService.cancelOrder(orderId);
    this.logger.log(`Order ${orderId} cancelled`);
    return {
      responseCode: ResponseCode.SUCCESSFUL,
      responseText: 'Order successfully cancelled.',
      data: order,
    };
  }

  /**
   * Approves an existing pending order.
   * @param orderId - The ID of the order to cancel.
   * @returns The approved Order document.
   */
  @Patch(':id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('creator')
  @ApiOperation({ summary: 'Update an existing record' })
  @ApiResponse({ status: 200, description: 'Order approved successfully' })
  @ApiResponse({ status: 404, description: 'Cannot find order to cancel' })
  async approveOrder(@Param('id') orderId: string) {
    const order = await this.orderService.approveOrder(orderId);

    return {
      responseCode: ResponseCode.SUCCESSFUL,
      responseText: 'Order successfully approved.',
      data: order,
    };
  }
}
