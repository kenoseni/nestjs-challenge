import { useState, ChangeEvent, FormEvent, FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RecordCategory } from '../types/record-category';
import { RecordFormat } from '../types/record-format';
import Error from './Error';

interface CreateRecordInput {
  artist: string;
  album: string;
  price: number;
  qty: number;
  format: string;
  category: string;
  mbid: string;
}

const initialRecordState: CreateRecordInput = {
  artist: '',
  album: '',
  price: 0,
  qty: 0,
  format: '',
  category: '',
  mbid: '',
};

const Dashboard: FC = () => {
  const [newRecord, setNewRecord] =
    useState<CreateRecordInput>(initialRecordState);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for token on mount. If none exists, redirect to login.
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const updateField = (
    field: keyof CreateRecordInput,
    value: string | number,
  ) => {
    setNewRecord((prev) => ({ ...prev, [field]: value }));
  };

  const createRecord = async (record: CreateRecordInput) => {
    try {
      await axios.post('/records', record);
      setError(null);
      setNewRecord(initialRecordState);
    } catch (err) {
      setError('Failed to create record. Please check your input.');
      console.error('Error creating record:', err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // If no token exists, user should not create a record
    if (!localStorage.getItem('token')) {
      setError('You must be logged in to create a record.');
      return;
    }
    await createRecord(newRecord);
  };

  const dismissError = () => setError(null);

  const isFormValid = (): boolean =>
    newRecord.artist.trim() !== '' &&
    newRecord.album.trim() !== '' &&
    newRecord.price > 0 &&
    newRecord.qty > 0 &&
    newRecord.format !== '' &&
    newRecord.category !== '';

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Dashboard</h2>
      <Error message={error} onDismiss={dismissError} />

      <div className="card shadow-sm">
        <div className="card-header text-black">Create New Record</div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="mbid" className="form-label">
                  MBID
                </label>
                <input
                  id="mbid"
                  type="text"
                  className="form-control"
                  placeholder="Enter MBID"
                  value={newRecord.mbid}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('mbid', e.target.value)
                  }
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="artist" className="form-label">
                  Artist
                </label>
                <input
                  id="artist"
                  type="text"
                  className="form-control"
                  placeholder="Enter Artist Name"
                  value={newRecord.artist}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('artist', e.target.value)
                  }
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="album" className="form-label">
                  Album
                </label>
                <input
                  id="album"
                  type="text"
                  className="form-control"
                  placeholder="Enter Album Name"
                  value={newRecord.album}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('album', e.target.value)
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="price" className="form-label">
                  Price
                </label>
                <input
                  id="price"
                  type="number"
                  className="form-control"
                  placeholder="Enter Price"
                  value={newRecord.price || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('price', Number(e.target.value))
                  }
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="qty" className="form-label">
                  Quantity
                </label>
                <input
                  id="qty"
                  type="number"
                  className="form-control"
                  placeholder="Enter Quantity"
                  value={newRecord.qty || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('qty', Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="format" className="form-label">
                  Format
                </label>
                <select
                  id="format"
                  className="form-select"
                  value={newRecord.format}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    updateField('format', e.target.value as RecordFormat)
                  }
                >
                  <option value="" disabled>
                    Select Format
                  </option>
                  {Object.values(RecordFormat).map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="category" className="form-label">
                  Category
                </label>
                <select
                  id="category"
                  className="form-select"
                  value={newRecord.category}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    updateField('category', e.target.value as RecordCategory)
                  }
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  {Object.values(RecordCategory).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-success"
                disabled={!isFormValid()}
              >
                Create Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
