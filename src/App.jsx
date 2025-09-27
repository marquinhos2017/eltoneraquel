import React, { useState, useRef, useEffect } from 'react';
import WebcamFilter from './components/WebcamFilter';
import { FaPalette } from 'react-icons/fa';
import './App.css';

function App() {
  const [selectedFilter, setSelectedFilter] = useState('');
  const [showSplash, setShowSplash] = useState(true);
  const webcamRef = useRef(null);

  const filters = [
    { name: '1', value: '' },
    { name: '2', value: '/filters/a.cube' },
    { name: '3', value: '/filters/b.cube' },
    { name: '4', value: '/filters/1.cube' },
    { name: '5', value: '/filters/2.cube' },
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

  // Fechar splash automaticamente após 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000); // 4 segundos
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {showSplash ? (
        <div className="splash-screen fade-in">
          <h1>Bem-vindo ao Casamento de Elton e Raquel</h1>
          <p>Compartilhe esse momento especial com o filtro oficial do casamento. Não esqueça de marcar os noivos!</p>
          <div className="loading">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </div>
        </div>
      ) : (
        <>
          <header className="App-header fade-in">
            <div className="controls horizontal-scroll">
              {filters.map(filter => (
                <button
                  key={filter.value || 'nofilter'}
                  className={`filter-btn ${selectedFilter === filter.value ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(filter.value || null)}
                >
                  <FaPalette style={{ marginRight: 8 }} />
                  {filter.name}
                </button>
              ))}
            </div>
          </header>

          <main className="main-content fade-in">
            <WebcamFilter
              ref={webcamRef}
              filterPath={selectedFilter}
              className="webcam-container"
            />

            <button className="capture-btn-ios" onClick={capturePhoto}>
              📸
            </button>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
