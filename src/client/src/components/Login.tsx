import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
interface Credentials {
  username: string;
}

const Login = () => {
  // Type the state with the Credentials interface
  const [credentials, setCredentials] = useState<Credentials>({
    username: '',
  });
  const navigate = useNavigate();

  // Handle form submission with typed FormEvent
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post('/v1/auth/login', credentials);
      const { token } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="text-center mb-4">Admin Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                placeholder="Enter your username"
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
