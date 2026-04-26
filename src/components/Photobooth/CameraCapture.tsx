import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

type SessionStep = 'IDLE' | 'WAITING' | 'COUNTDOWN' | 'REVIEW';

export default function CameraCapture() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [photos, setPhotos] = useState<(string | null)[]>([]);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [targetPhotoCount, setTargetPhotoCount] = useState<number>(3);
    
    // New States
    const [step, setStep] = useState<SessionStep>('IDLE');
    const [activeIndex, setActiveIndex] = useState<number>(0);

    useEffect(() => {
        const countStr = sessionStorage.getItem('photobooth-photo-count');
        const count = countStr ? parseInt(countStr, 10) : 3;
        setTargetPhotoCount(count);
        // Initialize photos array with nulls
        setPhotos(Array(count).fill(null));

        async function setupCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
            }
        }
        setupCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Mirror the capture horizontally
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Reset transform
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            return canvas.toDataURL('image/jpeg', 0.8);
        }
        return null;
    }, []);

    const handleStartSession = () => {
        setStep('WAITING');
        setActiveIndex(0);
        setPhotos(Array(targetPhotoCount).fill(null));
    };

    const handleReady = async () => {
        setStep('COUNTDOWN');
        
        // Countdown
        for (let c = 3; c > 0; c--) {
            setCountdown(c);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setCountdown(null);
        
        const photo = capturePhoto();
        
        setPhotos(prev => {
            const newPhotos = [...prev];
            if (photo) newPhotos[activeIndex] = photo;
            
            // Find next empty slot
            const nextEmptyIndex = newPhotos.findIndex(p => p === null);
            
            if (nextEmptyIndex === -1) {
                // All full
                setStep('REVIEW');
            } else {
                setActiveIndex(nextEmptyIndex);
                setStep('WAITING');
            }
            
            return newPhotos;
        });
    };

    const handleSelectSlot = (index: number) => {
        if (step === 'COUNTDOWN') return; // Don't interrupt countdown
        setActiveIndex(index);
        setStep('WAITING');
    };

    const handleFinish = () => {
        // Filter out any potential nulls
        const finalPhotos = photos.filter(p => p !== null) as string[];
        sessionStorage.setItem('photobooth-photos', JSON.stringify(finalPhotos));
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        window.location.href = '/result';
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto gap-4 md:gap-8 p-4 mt-2 md:mt-8">
            <div className="text-center mb-2 md:mb-4">
                <h2 className="font-h2 text-2xl md:text-h2 text-on-surface mb-1 md:mb-2">Sesi Foto</h2>
                <p className="font-body-sm md:font-body-md text-on-surface-variant">Bersiaplah, kami akan mengambil {targetPhotoCount} foto!</p>
            </div>

            <div className="relative w-full max-w-2xl aspect-[3/4] md:aspect-video bg-black rounded-2xl overflow-hidden border-4 border-primary/20 shadow-2xl">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
                        <span className="text-white text-7xl md:text-9xl font-bold drop-shadow-2xl font-h1 animate-pulse-shadow">
                            {countdown}
                        </span>
                    </div>
                )}
            </div>

            {/* Interactive Thumbnails for Retake */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                {photos.map((p, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSelectSlot(i)}
                        disabled={step === 'COUNTDOWN'}
                        className={`w-16 md:w-24 aspect-[4/3] rounded-md overflow-hidden border-2 transition-all cursor-pointer relative group ${
                            activeIndex === i && step !== 'IDLE' && step !== 'REVIEW'
                                ? 'border-primary ring-4 ring-primary/30 scale-105 shadow-lg z-10' 
                                : p ? 'border-transparent hover:border-primary/50' : 'border-dashed border-outline-variant bg-surface-variant/50 hover:border-primary/50'
                        }`}
                    >
                        {p ? (
                            <>
                                <img src={p} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-xl">refresh</span>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-outline">
                                <span className="material-symbols-outlined text-3xl">photo_camera</span>
                            </div>
                        )}
                        
                        {/* Active Badge */}
                        {activeIndex === i && step !== 'IDLE' && step !== 'REVIEW' && (
                            <div className="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                {i + 1}
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Dynamic Control Buttons */}
            <div className="mt-2 md:mt-4 flex flex-col items-center">
                {step === 'IDLE' && (
                    <Button 
                        onClick={handleStartSession} 
                        disabled={!stream}
                        className="bg-primary text-on-primary font-label-sm text-label-sm px-8 py-4 md:px-12 md:py-6 btn-3d-glossy"
                    >
                        <span className="material-symbols-outlined text-xl md:text-2xl mr-2">camera</span>
                        Mulai Sesi
                    </Button>
                )}

                {step === 'WAITING' && (
                    <Button 
                        onClick={handleReady} 
                        className="bg-primary text-on-primary font-label-sm text-base md:text-lg px-8 py-5 md:px-12 md:py-8 btn-3d-glossy"
                    >
                        <span className="material-symbols-outlined text-2xl md:text-3xl mr-2">camera</span>
                        {photos[activeIndex] ? `Retake Foto ke-${activeIndex + 1}` : `Siap! (Foto ke-${activeIndex + 1})`}
                    </Button>
                )}

                {step === 'COUNTDOWN' && (
                    <Button disabled className="bg-surface-variant text-on-surface-variant font-label-sm text-base md:text-lg px-8 py-5 md:px-12 md:py-8 rounded-2xl shadow-none opacity-80 cursor-not-allowed">
                        <span className="material-symbols-outlined text-2xl md:text-3xl mr-2 animate-spin">hourglass_empty</span>
                        Bersiaplah...
                    </Button>
                )}

                {step === 'REVIEW' && (
                    <Button 
                        onClick={handleFinish} 
                        className="bg-primary text-on-primary font-label-sm text-base md:text-lg px-8 py-5 md:px-12 md:py-8 btn-3d-glossy"
                    >
                        <span className="material-symbols-outlined text-2xl md:text-3xl mr-2">check_circle</span>
                        Lanjut ke Hasil
                    </Button>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
