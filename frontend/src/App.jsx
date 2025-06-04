import { useEffect, useState } from 'react';
import './App.css';
import { MdEdit, MdCancel, MdCheckCircle, MdSave } from 'react-icons/md';

function formatDate(dateString) {
  const parsed = new Date(dateString);
  if (isNaN(parsed)) return dateString;
  return `${parsed.getMonth() + 1}/${parsed.getDate()}/${parsed.getFullYear()}`;
}

export default function App() {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', date: '', newBin: null });

  useEffect(() => {
    fetch('/api/bins')
      .then(res => res.json())
      .then(setBins);

    const interval = setInterval(() => {
      fetch('/api/bins')
        .then(res => res.json())
        .then(setBins);
    }, 300000); // 5 min refresh

    return () => clearInterval(interval);
  }, []);

  const handlePickedUp = (index) => {
    fetch(`/api/clear?binNumber=${index + 1}`, { method: 'POST' })
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
      date: date ? new Date(date).toISOString().split('T')[0] : '',
      newBin: selectedBin + 1
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const formatted = new Date(editData.date + 'T12:00:00').toLocaleDateString('en-US');

    fetch('/api/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldBin: selectedBin + 1,
        newBin: editData.newBin,
        name: editData.name,
        date: formatted
      }),
    }).then(() => {
      const newBins = [...bins];
      if (editData.newBin !== selectedBin + 1) {
        newBins[selectedBin] = [];
        newBins[editData.newBin - 1] = [editData.name, formatted];
      } else {
        newBins[selectedBin] = [editData.name, formatted];
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
      <h1 className="title">📦 Equipment Pick-Up Station 📦</h1>
      <p className="subtitle">
        Once you receive your equipment, please select your name and mark it as picked up. Thank you!
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
