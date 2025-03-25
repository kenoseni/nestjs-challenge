import { useState, useEffect } from 'react';
import axios from 'axios';
import Error from './Error';
import { getToken } from '../utils/auth';
import Pagination from './Page';

interface Order {
  id: string;
  quantity: number;
  record: string;
  status: string;
}

interface OrdersData {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  items: Order[];
}

interface AvailableRecord {
  id: string;
  artist: string;
  album: string;
  qty: number;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableRecords, setAvailableRecords] = useState<AvailableRecord[]>(
    [],
  );
  const [pagination, setPagination] = useState<OrdersData | null>(null);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const limit = 5;

  useEffect(() => {
    fetchOrders(page);
    fetchAvailableRecords();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const fetchOrders = async (pageNumber: number = 1) => {
    setLoadingOrders(true);
    try {
      const response = await axios.get('/orders', {
        params: { page: pageNumber, limit },
      });

      const data: OrdersData = response.data.data;

      setOrders(data.items);
      setPagination(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch orders. Please try again.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAvailableRecords = async () => {
    setLoadingRecords(true);
    try {
      const response = await axios.get('/records');
      setAvailableRecords(response.data.data.items);
      setError(null);
    } catch (err) {
      setError('Failed to fetch available records. Please try again.');
      console.error('Error fetching available records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const createOrderForRecord = async (recordId: string) => {
    try {
      const token = getToken();
      if (!token) {
        setError('You must be logged in to create an order.');
        return null;
      }
      await axios.post(
        '/orders',
        { recordId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchOrders(page);
      fetchAvailableRecords();
      setError(null);
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to create order. Please try again.');
        console.error('Error creating order:', err);
      }
    }
  };

  const approveOrder = async (id: string) => {
    try {
      const token = getToken();
      if (!token) {
        setError('You must be logged in to approve an order.');
        return null;
      }
      await axios.patch(
        `/orders/${id}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchOrders(page);
      setError(null);
    } catch (err) {
      setError('Failed to approve order. Please try again.');
      console.error('Error approving order:', err);
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      const token = getToken();
      if (!token) {
        setError('You must be logged in to cancel an order.');
        return null;
      }
      await axios.patch(
        `/orders/${id}/cancel`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      fetchOrders(page);
      fetchAvailableRecords();
      setError(null);
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to cancel order. Please try again.');
        console.error('Error cancelling order:', err);
      }
    }
  };

  const dismissError = () => setError(null);

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Orders</h1>
      <Error message={error} onDismiss={dismissError} />

      <div className="card shadow-sm mb-4">
        <div className="card-header text-black">
          <h5 className="mb-0">Available Records</h5>
        </div>
        <div className="card-body">
          {loadingRecords ? (
            <div className="d-flex justify-content-center align-items-center p-4">
              <div className="spinner-border text-info" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : availableRecords.length > 0 ? (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Artist</th>
                    <th>Album</th>
                    <th>Quantity</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.id}</td>
                      <td>{record.artist}</td>
                      <td>{record.album}</td>
                      <td>{record.qty}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => createOrderForRecord(record.id)}
                          disabled={record.qty === 0}
                        >
                          Create Order
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="text-center p-3">
              <p>No records available to order.</p>
            </div>
          )}
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-header  text-black">
          <h5 className="mb-0">Order List</h5>
        </div>
        <div className="card-body p-0">
          {loadingOrders ? (
            <div className="d-flex justify-content-center align-items-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : orders.length > 0 ? (
            <>
              <table className="table mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order ID</th>
                    <th>Quantity</th>
                    <th>Record</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.quantity}</td>
                      <td>{order.record}</td>
                      <td>{order.status}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => approveOrder(order.id)}
                          disabled={
                            order.status === 'completed' ||
                            order.status === 'cancelled'
                          }
                        >
                          Approve
                        </button>

                        {order.status === 'pending' && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => cancelOrder(order.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="mb-0">No orders available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
