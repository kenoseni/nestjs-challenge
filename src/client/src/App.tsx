import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Records from './components/Records';
import Orders from './components/Orders';
import PrivateRoute from './components/PrivateRoute'; // Assuming you have this
import Login from './components/Login';

const App = () => {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container">
          <Link className="navbar-brand unique-brand" to="/">
            Broken Record Store
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link text-label" to="/">
                  Dashboard
                </Link>
              </li>
              <li className="nav-item text-label">
                <Link className="nav-link" to="/records">
                  Records
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-label" to="/orders">
                  Orders
                </Link>
              </li>
              <li className="nav-item text-label">
                <Link className="nav-link text-label" to="/login">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
        <Route path="/records" element={<Records />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
