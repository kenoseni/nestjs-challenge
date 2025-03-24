import { useState, useEffect } from 'react';
import axios from 'axios';
import Error from './Error';

interface Order {
  id: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      setOrders(response.data.data.items);
      setError(null);
    } catch (error) {
      setError('Failed to fetch orders. Please try again.');
      console.error('Error fetching orders:', error);
    }
  };

  const approveOrder = async (id: string) => {
    try {
      await axios.patch(`/orders/${id}/approve`);
      fetchOrders();
      setError(null);
    } catch (error) {
      setError('Failed to approve order. Please try again.');
      console.error('Error approving order:', error);
    }
  };

  const dismissError = () => setError(null);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Orders</h1>

      <Error message={error} onDismiss={dismissError} />

      <ul className="list-group">
        {orders.map((order) => (
          <li
            key={order.id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            Order #{order.id}
            <button
              className="btn btn-success btn-sm"
              onClick={() => approveOrder(order.id)}
            >
              Approve
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Orders;
