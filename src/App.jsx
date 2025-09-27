import React, { useState, useRef, useEffect } from 'react';
import WebcamFilter from './components/WebcamFilter';
import { FaCamera, FaPalette } from 'react-icons/fa';
import './App.css';

function App() {
  const [selectedFilter, setSelectedFilter] = useState('');
  const [showSplash, setShowSplash] = useState(true); // splash inicial
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

  // Esconde splash após 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // 2000ms = 2 segundos

    return () => clearTimeout(timer); // limpa timeout se componente desmontar
  }, []);

  if (showSplash) {
    return (
      <div className="splash-screen">
        <h1>Registre aqui sua foto do casamento</h1>
      </div>
    );
  }

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

          <button onClick={capturePhoto} className="capture-btn">
            <FaCamera style={{ marginRight: 8 }} />
            Capturar
          </button>
        </div>
      </header>

      <main className="main-content">
        <WebcamFilter
          ref={webcamRef}
          filterPath={selectedFilter}
          className="webcam-container"
        />
      </main>
    </div>
  );
}

export default App;
