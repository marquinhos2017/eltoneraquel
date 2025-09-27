import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import { applyLUTFilter } from './LUTFilter';

const WebcamFilter = forwardRef(({ filterPath, className }, ref) => {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [lutData, setLutData] = useState(null);
    const [isFilterLoaded, setIsFilterLoaded] = useState(false);
    const [isWebcamReady, setIsWebcamReady] = useState(false);
    const [overlayImg, setOverlayImg] = useState(null);
    const [facingMode, setFacingMode] = useState('user');

    useImperativeHandle(ref, () => ({
        getScreenshot: () => canvasRef.current?.toDataURL('image/png') || null
    }));

    // Carregar overlay
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = '/filters/a.png';
        img.onload = () => setOverlayImg(img);
    }, []);

    // Carregar LUT
    useEffect(() => {
        const loadLUT = async () => {
            if (!filterPath) {
                setLutData(null);
                setIsFilterLoaded(true);
                return;
            }
            try {
                const response = await fetch(filterPath);
                const cubeText = await response.text();
                const lut = parseCUBE(cubeText);
                setLutData(lut);
                setIsFilterLoaded(true);
            } catch (error) {
                console.error('Erro ao carregar filtro LUT:', error);
                setIsFilterLoaded(true);
            }
        };
        loadLUT();
    }, [filterPath]);

    // Aplicar filtro em tempo real
    useEffect(() => {
        if (!webcamRef.current || !canvasRef.current || !isWebcamReady || !isFilterLoaded) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = 1080;
        canvas.height = 1920;

        let animationFrameId;

        const draw = () => {
            const video = webcamRef.current.video;
            if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
                const cw = 540;  // processa em resolução menor
                const ch = 960;

                const offCanvas = document.createElement('canvas');
                offCanvas.width = cw;
                offCanvas.height = ch;
                const offCtx = offCanvas.getContext('2d');

                const vw = video.videoWidth;
                const vh = video.videoHeight;
                const videoRatio = vw / vh;
                const canvasRatio = cw / ch;
                let dw, dh, dx, dy;

                if (videoRatio > canvasRatio) {
                    dh = ch;
                    dw = dh * videoRatio;
                    dx = (cw - dw) / 2;
                    dy = 0;
                } else {
                    dw = cw;
                    dh = dw / videoRatio;
                    dx = 0;
                    dy = (ch - dh) / 2;
                }

                offCtx.drawImage(video, dx, dy, dw, dh);

                if (lutData) {
                    const imageData = offCtx.getImageData(0, 0, cw, ch);
                    applyLUTFilter(imageData, lutData);
                    offCtx.putImageData(imageData, 0, 0);
                }

                if (overlayImg) {
                    offCtx.drawImage(overlayImg, 0, 0, cw, ch);
                }

                const mainCtx = canvas.getContext('2d');
                mainCtx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
            }

            animationFrameId = requestAnimationFrame(draw);
        };

        draw();
        return () => cancelAnimationFrame(animationFrameId);
    }, [lutData, isFilterLoaded, isWebcamReady, overlayImg, facingMode]);

    const videoConstraints = {
        width: { min: 1080, ideal: 2160, max: 3840 },
        height: { min: 1920, ideal: 3840, max: 7680 },
        facingMode
    };

    const handleWebcamLoad = () => setIsWebcamReady(true);
    const handleWebcamError = () => setIsWebcamReady(false);

    // Tirar foto, salvar e compartilhar
    const handleTakeAndShare = async () => {
        if (!canvasRef.current) return;

        const dataUrl = canvasRef.current.toDataURL('image/png');

        // Salvar no dispositivo
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `foto-${Date.now()}.png`;
        link.click();

        // Compartilhar
        try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const filesArray = [new File([blob], 'story.png', { type: 'image/png' })];

            if (navigator.canShare && navigator.canShare({ files: filesArray })) {
                await navigator.share({
                    files: filesArray,
                    title: 'Minha foto filtrada',
                    text: 'Olha só essa foto!',
                });
            } else {
                alert('Imagem salva! Abra o Instagram e compartilhe no Stories.');
            }
        } catch (err) {
            console.error('Erro ao compartilhar:', err);
        }
    };

    return (
        <div className={`webcam-filter ${className}`} style={{ position: 'relative', textAlign: 'center' }}>
            {/* Botão alternar câmera */}
            <button
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '10px',
                    borderRadius: '50%',
                    backgroundColor: '#FFA500',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 10,
                    fontSize: '18px'
                }}
            >
                🔄
            </button>

            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/png"
                videoConstraints={videoConstraints}
                onUserMedia={handleWebcamLoad}
                onUserMediaError={handleWebcamError}
                style={{ visibility: 'hidden', position: 'absolute', width: 0, height: 0 }}
                mirrored={facingMode === 'user'}
            />

            <canvas
                ref={canvasRef}
                className="webcam-canvas"
                style={{
                    width: '90%',
                    height: '90%',
                    maxWidth: '1080px',
                    maxHeight: '1920px',
                    margin: 'auto',
                    display: 'block',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    backgroundColor: isWebcamReady ? 'transparent' : '#333',
                    objectFit: 'cover'
                }}
            />

            {!isWebcamReady && (
                <div className="webcam-status">
                    <p>Carregando webcam... Por favor, permita o acesso à câmera.</p>
                </div>
            )}

            {!isFilterLoaded && filterPath && (
                <div className="loading">Carregando filtro...</div>
            )}

            {/* Botão tirar foto e compartilhar */}
            <button
                onClick={handleTakeAndShare}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    border: '4px solid rgba(0,0,0,0.2)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '32px',
                    cursor: 'pointer',
                    zIndex: 10,
                    transition: 'transform 0.1s ease-in-out'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'translateX(-50%) scale(0.9)'}
                onMouseUp={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
            >
                📸
            </button>

        </div>
    );
});

// Parser para arquivos .cube
function parseCUBE(cubeText) {
    const lines = cubeText.split('\n');
    const lut = { size: 0, data: [] };

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('TITLE')) continue;
        if (line.startsWith('LUT_3D_SIZE')) {
            lut.size = parseInt(line.split(' ')[1]);
            continue;
        }
        if (line.startsWith('#') || line === '') continue;

        const rgb = line.split(/\s+/).filter(Boolean);
        if (rgb.length >= 3) {
            lut.data.push({
                r: parseFloat(rgb[0]),
                g: parseFloat(rgb[1]),
                b: parseFloat(rgb[2])
            });
        }
    }
    return lut;
}

export default WebcamFilter;
