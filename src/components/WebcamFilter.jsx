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

    useImperativeHandle(ref, () => ({
        getScreenshot: () => {
            if (canvasRef.current) {
                return canvasRef.current.toDataURL('image/png');
            }
            return null;
        }
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

        let animationFrameId;

        const drawFrame = () => {
            const video = webcamRef.current.video;
            if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
                // Ajustar canvas para proporção do vídeo real
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;

                canvas.width = videoWidth;
                canvas.height = videoHeight;

                // Desenhar vídeo no canvas mantendo proporção
                context.drawImage(video, 0, 0, videoWidth, videoHeight);

                // Aplicar LUT
                if (lutData) {
                    const imageData = context.getImageData(0, 0, videoWidth, videoHeight);
                    applyLUTFilter(imageData, lutData);
                    context.putImageData(imageData, 0, 0);
                }

                // Overlay mantendo proporção e centralizado
                if (overlayImg) {
                    const imgRatio = overlayImg.width / overlayImg.height;
                    const canvasRatio = videoWidth / videoHeight;

                    let drawWidth, drawHeight, offsetX, offsetY;

                    if (imgRatio > canvasRatio) {
                        drawWidth = videoWidth;
                        drawHeight = videoWidth / imgRatio;
                        offsetX = 0;
                        offsetY = (videoHeight - drawHeight) / 2;
                    } else {
                        drawHeight = videoHeight;
                        drawWidth = videoHeight * imgRatio;
                        offsetX = (videoWidth - drawWidth) / 2;
                        offsetY = 0;
                    }

                    context.drawImage(overlayImg, offsetX, offsetY, drawWidth, drawHeight);
                }
            }

            animationFrameId = requestAnimationFrame(drawFrame);
        };

        drawFrame();

        return () => cancelAnimationFrame(animationFrameId);
    }, [lutData, isFilterLoaded, isWebcamReady, overlayImg]);



    const videoConstraints = {
        width: { ideal: 1080 },
        height: { ideal: 1920 },
        facingMode: "user"
    };

    const handleWebcamLoad = () => {
        setIsWebcamReady(true);
        console.log('Webcam carregada');
    };

    const handleWebcamError = (error) => {
        console.error('Erro na webcam:', error);
        setIsWebcamReady(false);
    };

    return (
        <div className={`webcam-filter ${className}`}>
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
                mirrored={true}
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
                    <p>Se a câmera não carregar, verifique as permissões do navegador.</p>
                </div>
            )}

            {!isFilterLoaded && filterPath && (
                <div className="loading">Carregando filtro...</div>
            )}
        </div>
    );
});

// Parser para arquivos .cube
function parseCUBE(cubeText) {
    const lines = cubeText.split('\n');
    const lut = {
        size: 0,
        data: []
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

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
