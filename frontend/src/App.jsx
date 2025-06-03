import { useEffect, useState } from 'react';
import './App.css';
import { MdEdit, MdCancel, MdCheckCircle, MdSave } from 'react-icons/md';

const API_BASE = 'https://vigilant-happiness-v6wp5qrg5rrpfwwx5-3001.app.github.dev'; // your backend URL

function formatDate(dateString) {
  const parsed = new Date(dateString);
  if (isNaN(parsed)) return dateString; // fallback
  return `${parsed.getMonth() + 1}/${parsed.getDate()}/${parsed.getFullYear()}`;
}

export default function App() {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', date: '', newBin: null });

  useEffect(() => {
    fetch(`${API_BASE}/bins`)
      .then(res => res.json())
      .then(setBins);
  }, []);

  const handlePickedUp = (index) => {
    fetch(`${API_BASE}/bins/${index + 1}/clear`, { method: 'POST' })
      .then(() => {
        const newBins = [...bins];
        newBins[index] = [];
        setBins(newBins);
        setSelectedBin(null);
      });
  };

  const handleEdit = () => {
    const [name, date] = bins[selectedBin] || [];
    setEditData({
      name: name || '',
      date: date || '',
      newBin: selectedBin + 1
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    fetch(`${API_BASE}/bins/${selectedBin + 1}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editData.name,
        date: formatDate(editData.date),
        newBin: editData.newBin
      }),

    }).then(() => {
      const newBins = [...bins];
      if (editData.newBin !== selectedBin + 1) {
        newBins[selectedBin] = [];
        newBins[editData.newBin - 1] = [editData.name, editData.date];
      } else {
        newBins[selectedBin] = [editData.name, editData.date];
      }
      setBins(newBins);
      setSelectedBin(null);
      setIsEditing(false);
    });
  };

  const renderBin = (index) => {
    const data = bins[index] || [];
    const [name, date] = data;
    return (
      <div
        key={index}
        className={`bin ${name ? 'filled' : ''}`}
        onClick={() => setSelectedBin(index)}
      >
        <div className="bin-number">Bin {index + 1}</div>
        {name && <div className="bin-name">{name}</div>}
        {date && <div className="bin-date">{formatDate(date)}</div>}
      </div>
    );
  };


  return (
    <div className="app">
      <h1 className="title">📦 Pickup Station 📦</h1> 
      <p className="subtitle">
        Once you pick up your equipment, please select your name and mark it as picked up. Thank you!
      </p>
      <div className="shelf">{[...Array(15)].map((_, i) => renderBin(i))}</div>
      <div className="shelf large-row">{[...Array(3)].map((_, i) => renderBin(i + 15))}</div>

      {selectedBin !== null && (
        <div className="modal">
          <div className="modal-content">
            <h2>Bin {selectedBin + 1}</h2>

            {isEditing ? (
              <>
                <input
                  type="text"
                  placeholder="Name"
                  value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                />
                <input
                  type="date"
                  value={editData.date}
                  onChange={e => setEditData({ ...editData, date: e.target.value })}
                />
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={editData.newBin}
                  onChange={e => setEditData({ ...editData, newBin: parseInt(e.target.value) })}
                />
                <div className="modal-actions">
                  <button className="btn pickup" onClick={handleSaveEdit}>
                    <MdSave /> Save Changes
                  </button>
                  <button className="btn cancel" onClick={() => setIsEditing(false)}>
                    <MdCancel /> Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {bins[selectedBin]?.[0] || '-'}</p>
                <p><strong>Date:</strong> {bins[selectedBin]?.[1] || '-'}</p>
                <div className="modal-actions">
                  <button className="btn edit" onClick={handleEdit}>
                    <MdEdit /> Edit
                  </button>
                  <button className="btn pickup" onClick={() => handlePickedUp(selectedBin)}>
                    <MdCheckCircle /> Picked Up
                  </button>
                  <button className="btn cancel" onClick={() => setSelectedBin(null)}>
                    <MdCancel /> Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
