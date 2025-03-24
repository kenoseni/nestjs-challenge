import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

// Define the props interface
interface PrivateRouteProps {
  children: ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
