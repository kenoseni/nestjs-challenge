import { useState, useEffect } from 'react';
import axios from 'axios';
import Error from './Error';
import { getToken } from '../utils/auth';

interface Track {
  title: string;
  duration: number;
  position: number;
  _id: string;
}

interface Record {
  id: string;
  artist: string;
  album: string;
  price: number;
  qty: number;
  format: string;
  category: string;
  mbid: string;
  trackList: Track[];
  created: string;
  lastModified: string;
  country: string;
  releaseYear: number;
}

const Records = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/records');
      setRecords(response.data.data.items);
      setError(null);
    } catch (err) {
      setError('Failed to fetch records. Please try again.');
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const editRecord = async (id: string, updatedRecord: Partial<Record>) => {
    try {
      const token = getToken();
      if (!token) {
        setError('You must be logged in to edit an record.');
        return null;
      }
      await axios.put(`/records/${id}`, updatedRecord, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRecords();
      setError(null);
    } catch (err: any) {
      if (err.response && err.response.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to edit record. Please try again.');
        console.error('Error editing record:', err);
      }
    }
  };

  const dismissError = () => setError(null);

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">Records</h1>
      <Error message={error} onDismiss={dismissError} />

      {loading ? (
        <div className="d-flex justify-content-center align-items-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <h5 className="card-title">No Records Available</h5>
            <p className="card-text">
              There are currently no records to display.
            </p>
          </div>
        </div>
      ) : (
        <div className="accordion" id="recordsAccordion">
          {records.map((record) => (
            <div className="accordion-item" key={record.id}>
              <h2 className="accordion-header" id={`heading-${record.id}`}>
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapse-${record.id}`}
                  aria-expanded="false"
                  aria-controls={`collapse-${record.id}`}
                >
                  {record.artist} - {record.album} ({record.format})
                </button>
              </h2>
              <div
                id={`collapse-${record.id}`}
                className="accordion-collapse collapse"
                aria-labelledby={`heading-${record.id}`}
                data-bs-parent="#recordsAccordion"
              >
                <div className="accordion-body">
                  <p>
                    <strong>Price:</strong> ${record.price}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {record.qty}
                  </p>
                  <p>
                    <strong>Category:</strong> {record.category}
                  </p>
                  <p>
                    <strong>Release Year:</strong>{' '}
                    {record.releaseYear || 'Not available'}
                  </p>
                  <p>
                    <strong>Country:</strong>{' '}
                    {record.country || 'Not available'}
                  </p>
                  <p>
                    <strong>MBID:</strong> {record.mbid || 'Not available'}
                  </p>
                  <p>
                    <strong>Created:</strong>{' '}
                    {new Date(record.created).toLocaleString()}
                  </p>
                  <p>
                    <strong>Last Modified:</strong>{' '}
                    {new Date(record.lastModified).toLocaleString()}
                  </p>
                  <h5>Track List</h5>
                  {record.trackList.length > 0 ? (
                    <ul className="list-group mb-3">
                      {record.trackList.map((track) => (
                        <li className="list-group-item" key={track._id}>
                          {track.position}. {track.title} -{' '}
                          {(track.duration / 60000).toFixed(2)} min
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No tracks available.</p>
                  )}
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      editRecord(record.id, { qty: record.qty + 1 })
                    }
                  >
                    Increment Quantity
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Records;
