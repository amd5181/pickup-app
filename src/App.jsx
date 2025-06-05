import React, { useEffect, useState } from 'react';
import './App.css';

const App = () => {
  const [bins, setBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [form, setForm] = useState({ bin: '', employee: '', date: '' });

  useEffect(() => {
    fetchBins();
  }, []);

  useEffect(() => {
        const interval = setInterval(() => {
            fetchBins();
        }, 10000); // 10 seconds

        return () => clearInterval(interval); // cleanup
    }, []);


  const fetchBins = () => {
    fetch('/api/getbins')
      .then((res) => res.json())
      .then((data) => setBins(data))
      .catch((err) => console.error('Failed to load bins:', err));
  };

  const handleBinClick = (bin) => {
    setSelectedBin(bin);
    setForm({
      bin: bin.bin,
      employee: bin.employee || '',
      date: bin.date || '',
    });
  };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };


  const handleSave = async () => {
    await submitUpdate(form);
    setSelectedBin(null);
  };

  const handlePickup = async () => {
    await submitUpdate({ ...form, employee: '', date: '' });
    setSelectedBin(null);
  };

  const submitUpdate = async (payload) => {
    try {
      const res = await fetch('/api/updatebins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      fetchBins();
    } catch {
      alert('Update failed');
    }
  };

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(Date.UTC(year, month - 1, day)); // use UTC to avoid shifting
        return d.toISOString().split('T')[0]; // returns yyyy-mm-dd
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-'); // expect YYYY-MM-DD
        if (parts.length !== 3) return '';
        const [year, month, day] = parts;
        return `${parseInt(month)}/${parseInt(day)}/${year.slice(-2)}`;
    };



  return (
    <div className="container">
      <h1 className="title">Equipment Pickup Station</h1>
      <p className="subtitle">
        Once you have received your equipment, please select your name and mark it as picked up. Thank you!
      </p>

      <div className="bin-grid main-grid">
        {bins.slice(0, 15).map((bin, index) => (
          <div
            key={index}
            className={`bin-card ${bin.employee ? 'assigned' : 'empty'}`}
            onClick={() => handleBinClick(bin)}
          >
            <div className="bin-label">Bin {bin.bin}</div>
            <div className="employee">{bin.employee}</div>
            <div className="date">{formatDate(bin.date)}</div>
          </div>
        ))}
      </div>

      <div className="bin-grid button-row">
        {bins.slice(15, 18).map((bin, index) => (
          <div
            key={index + 15}
            className={`bin-card big ${bin.employee ? 'assigned' : 'empty'}`}
            onClick={() => handleBinClick(bin)}
          >
            <div className="bin-label">Bin {bin.bin}</div>
            <div className="employee">{bin.employee}</div>
            <div className="date">{formatDate(bin.date)}</div>
          </div>
        ))}
      </div>

      {selectedBin && (
        <div className="modal">
          <div className="modal-content">
            <h2>Edit Bin {selectedBin.bin}</h2>
            <input
              type="text"
              name="employee"
              value={form.employee}
              onChange={handleChange}
              placeholder="Employee"
            />
            <input
              type="date"
              name="date"
              value={formatDateForInput(form.date)}
              onChange={handleChange}
            />
            <div className="modal-actions">
                <button onClick={handlePickup}>Mark as Picked Up</button>
                <button onClick={handleSave}>Save Update</button>
                <button onClick={() => setSelectedBin(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
