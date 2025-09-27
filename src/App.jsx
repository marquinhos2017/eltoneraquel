import React, { useState, useRef } from 'react';
import WebcamFilter from './components/WebcamFilter';
import { FaPalette } from 'react-icons/fa';
import './App.css';

function App() {
  const [selectedFilter, setSelectedFilter] = useState('');
  const webcamRef = useRef(null);

  const filters = [
    { name: 'Sem Filtro', value: '' },
    { name: 'Efeito 1', value: '/filters/a.cube' },
    { name: 'Efeito 2', value: '/filters/b.cube' },
    { name: 'Efeito 3', value: '/filters/1.cube' },
    { name: 'Efeito 4', value: '/filters/2.cube' },
  ];

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = 'webcam-photo.png';
      link.click();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="controls">
          {filters.map(filter => (
            <button
              key={filter.value}
              className={`filter-btn ${selectedFilter === filter.value ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.value)}
            >
              <FaPalette style={{ marginRight: 8 }} />
              {filter.name}
            </button>
          ))}
        </div>
      </header>

      <main className="main-content">
        <WebcamFilter
          ref={webcamRef}
          filterPath={selectedFilter}
          className="webcam-container"
        />

        {/* Botão de captura estilo bolinha do iOS */}
        <button className="capture-btn-ios" onClick={capturePhoto} />
      </main>
    </div>
  );
}

export default App;
