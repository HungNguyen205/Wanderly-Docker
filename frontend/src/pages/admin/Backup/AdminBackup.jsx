import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminBackup = () => {
  const [backupFiles, setBackupFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    fetchBackupFiles();
  }, []);

  const fetchBackupFiles = async () => {
    try {
      const response = await axios.get('/api/backup/backups');
      setBackupFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching backup files:', error);
    }
  };

  const handleBackup = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.post('/api/backup/backup');
      setMessage(`Backup successful: ${response.data.file}`);
      fetchBackupFiles();
    } catch (error) {
      setMessage('Backup failed');
      console.error('Backup error:', error);
    }
    setLoading(false);
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      setMessage('Please select a backup file');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/backup/restore', { fileName: selectedFile });
      setMessage('Restore successful');
    } catch (error) {
      setMessage('Restore failed');
      console.error('Restore error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Database Backup & Restore</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Create Backup</h2>
        <button
          onClick={handleBackup}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating Backup...' : 'Create Full Backup'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Restore from Backup</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Backup File:</label>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="">Choose a file...</option>
            {backupFiles.map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleRestore}
          disabled={loading || !selectedFile}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? 'Restoring...' : 'Restore Database'}
        </button>
      </div>

      {message && (
        <div className={`mt-4 p-4 rounded ${message.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default AdminBackup;