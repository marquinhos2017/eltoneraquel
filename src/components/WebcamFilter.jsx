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
    const [facingMode, setFacingMode] = useState('user'); // 'user' = frontal, 'environment' = traseira
    const [screenshot, setScreenshot] = useState(null); // Imagem capturada

    useImperativeHandle(ref, () => ({
        getScreenshot: () => screenshot
    }));

    // Carregar imagem de overlay
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = '/filters/a.png';
        img.onload = () => setOverlayImg(img);
    }, []);

    // Carregar arquivo .cube (LUT)
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
        const context = canvas.getContext('2d');
        const width = 1080;
        const height = 1920;

        canvas.width = width;
        canvas.height = height;

        let animationFrameId;

        const drawFrame = () => {
            const video = webcamRef.current.video;

            if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;

                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                const videoRatio = videoWidth / videoHeight;
                const canvasRatio = canvasWidth / canvasHeight;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (videoRatio > canvasRatio) {
                    drawHeight = canvasHeight;
                    drawWidth = drawHeight * videoRatio;
                    offsetX = (canvasWidth - drawWidth) / 2;
                    offsetY = 0;
                } else {
                    drawWidth = canvasWidth;
                    drawHeight = drawWidth / videoRatio;
                    offsetX = 0;
                    offsetY = (canvasHeight - drawHeight) / 2;
                }

                context.fillStyle = "#000";
                context.fillRect(0, 0, canvasWidth, canvasHeight);

                context.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

                if (lutData) {
                    const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
                    applyLUTFilter(imageData, lutData);
                    context.putImageData(imageData, 0, 0);
                }

                if (overlayImg) {
                    context.drawImage(overlayImg, 0, 0, canvasWidth, canvasHeight);
                }
            }

            animationFrameId = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        return () => cancelAnimationFrame(animationFrameId);
    }, [lutData, isFilterLoaded, isWebcamReady, overlayImg, facingMode]);

    const videoConstraints = {
        width: { ideal: 2160 },
        height: { ideal: 3840 },
        facingMode
    };

    const handleWebcamLoad = () => {
        setIsWebcamReady(true);
    };

    const handleWebcamError = (error) => {
        console.error('Erro na webcam:', error);
        setIsWebcamReady(false);
    };

    // Capturar screenshot
    const handleTakeScreenshot = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/png');

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'foto.png';
        link.click();

        setScreenshot(dataUrl); // Salva a imagem capturada
    };

    // Compartilhar no Instagram
    const handleShareToInstagram = async () => {
        if (!screenshot) return;

        try {
            const res = await fetch(screenshot);
            const blob = await res.blob();
            const filesArray = [new File([blob], 'story.png', { type: 'image/png' })];

            if (navigator.canShare && navigator.canShare({ files: filesArray })) {
                await navigator.share({
                    files: filesArray,
                    title: 'Minha foto filtrada',
                    text: 'Olha só essa foto!',
                });
            } else {
                const link = document.createElement('a');
                link.href = screenshot;
                link.download = 'story.png';
                link.click();
                alert('Imagem baixada. Abra o Instagram e compartilhe no Stories!');
            }
        } catch (err) {
            console.error('Erro ao compartilhar:', err);
        }
    };

    return (
        <div className={`webcam-filter ${className}`} style={{ position: 'relative', textAlign: 'center' }}>
            {/* Alternar câmera */}
            <button
                onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: '#FFA500',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 10
                }}
            >
                Alternar Câmera
            </button>

            <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/png"
                videoConstraints={videoConstraints}
                onUserMedia={handleWebcamLoad}
                onUserMediaError={handleWebcamError}
                style={{
                    visibility: 'hidden',
                    position: 'absolute',
                    width: 0,
                    height: 0
                }}
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

            {/* Botão bater foto */}
            <button
                onClick={handleTakeScreenshot}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '15px 30px',
                    borderRadius: '50%',
                    backgroundColor: '#34A853',
                    color: '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 10
                }}
            >
                📸
            </button>

            {/* Botão compartilhar Instagram (apenas após salvar) */}
            {screenshot && (
                <button
                    onClick={handleShareToInstagram}
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        backgroundColor: '#405DE6',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    Compartilhar no Instagram
                </button>
            )}
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
