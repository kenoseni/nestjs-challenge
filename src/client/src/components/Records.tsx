import { useState, useEffect } from 'react';
import axios from 'axios';
import Error from './Error';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await axios.get('/records');
      setRecords(response.data.data.items);
      setError(null);
    } catch (error) {
      setError('Failed to fetch records. Please try again.');
      console.error('Error fetching records:', error);
    }
  };

  const editRecord = async (id: string, updatedRecord: Partial<Record>) => {
    try {
      await axios.put(`/v1/records/${id}`, updatedRecord);
      fetchRecords();
      setError(null);
    } catch (error) {
      setError('Failed to edit record. Please try again.');
      console.error('Error editing record:', error);
    }
  };

  const dismissError = () => setError(null);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Records</h1>

      <Error message={error} onDismiss={dismissError} />

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
                  <strong>Release Year:</strong> {record.releaseYear}
                </p>
                <p>
                  <strong>Country:</strong> {record.country}
                </p>
                <p>
                  <strong>MBID:</strong> {record.mbid ?? 'Not available'}
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
                <ul className="list-group">
                  {record.trackList.map((track) => (
                    <li className="list-group-item" key={track._id}>
                      {track.position}. {track.title} -{' '}
                      {(track.duration / 60000).toFixed(2)} min
                    </li>
                  ))}
                </ul>
                <button
                  className="btn btn-secondary mt-3"
                  onClick={() => editRecord(record.id, { qty: record.qty + 1 })}
                >
                  Increment Quantity
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Records;
