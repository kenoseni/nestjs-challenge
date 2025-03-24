import { useState, ChangeEvent } from 'react';
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

const Dashboard = () => {
  const [newRecord, setNewRecord] = useState<CreateRecordInput>({
    artist: '',
    album: '',
    price: 0,
    qty: 0,
    format: '',
    category: '',
    mbid: '',
  });
  const [error, setError] = useState<string | null>(null);

  const createRecord = async (record: CreateRecordInput) => {
    try {
      await axios.post('/records', record);
      setError(null);
      setNewRecord({
        artist: '',
        album: '',
        price: 0,
        qty: 0,
        format: '',
        category: '',
        mbid: '',
      });
    } catch (error) {
      setError('Failed to create record. Please check your input.');
      console.error('Error creating record:', error);
    }
  };

  const handleCreateRecord = async () => {
    await createRecord(newRecord);
  };

  const dismissError = () => setError(null);

  const isFormValid = () => {
    return (
      newRecord.artist.trim() !== '' &&
      newRecord.album.trim() !== '' &&
      newRecord.price > 0 &&
      newRecord.qty > 0 &&
      newRecord.format !== '' &&
      newRecord.category !== ''
    );
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Dashboard</h2>

      <Error message={error} onDismiss={dismissError} />

      <section className="mb-4">
        <div className="card p-3">
          <div className="row">
            <div className="col-md-4 mb-3">
              <input
                type="text"
                className="form-control"
                value={newRecord.mbid}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, mbid: e.target.value })
                }
                placeholder="MBID"
              />
            </div>
            <div className="col-md-4 mb-3">
              <input
                type="text"
                className="form-control"
                value={newRecord.artist}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, artist: e.target.value })
                }
                placeholder="Artist"
              />
            </div>
            <div className="col-md-4 mb-3">
              <input
                type="text"
                className="form-control"
                value={newRecord.album}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, album: e.target.value })
                }
                placeholder="Album"
              />
            </div>
            <div className="col-md-4 mb-3">
              <input
                type="number"
                className="form-control"
                value={newRecord.price || ''}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, price: Number(e.target.value) })
                }
                placeholder="Price"
              />
            </div>
            <div className="col-md-4 mb-3">
              <input
                type="number"
                className="form-control"
                value={newRecord.qty || ''}
                onChange={(e) =>
                  setNewRecord({ ...newRecord, qty: Number(e.target.value) })
                }
                placeholder="Quantity"
              />
            </div>
            <div className="col-md-4 mb-3">
              <select
                className="form-select shadow-sm custom-select"
                value={newRecord.format}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewRecord({
                    ...newRecord,
                    format: e.target.value as RecordFormat,
                  })
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
            <div className="col-md-4 mb-3">
              <select
                className="form-select shadow-sm custom-select"
                value={newRecord.category}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setNewRecord({
                    ...newRecord,
                    category: e.target.value as RecordCategory,
                  })
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
            <div className="col-md-12">
              <button
                className="btn btn-primary w-100"
                onClick={handleCreateRecord}
                disabled={!isFormValid()}
              >
                Create Record
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
