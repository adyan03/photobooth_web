import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export default function ResultAction() {
    const [stripDataUrl, setStripDataUrl] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const renderStrip = async () => {
            const photosJson = sessionStorage.getItem('photobooth-photos');
            const templateId = sessionStorage.getItem('photobooth-template') || 'frame-pink';
            
            if (!photosJson) {
                window.location.href = '/session';
                return;
            }

            const photos: string[] = JSON.parse(photosJson);
            if (photos.length === 0) return;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Load template image
            const templateImg = new Image();
            templateImg.src = `/frames/${templateId}.png`;
            await new Promise((resolve, reject) => {
                templateImg.onload = resolve;
                templateImg.onerror = reject;
            });

            // Set canvas size to match the template image exactly
            canvas.width = templateImg.width;
            canvas.height = templateImg.height;

            // Clear canvas (it will be transparent)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the template FIRST because the placeholders in the image are opaque
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

            const photoCount = photos.length;

            // Draw photos on top, clipped to the placeholder shapes
            for (let i = 0; i < photoCount; i++) {
                const img = new Image();
                img.src = photos[i];
                await new Promise((resolve) => {
                    img.onload = resolve;
                });
                
                ctx.save();
                ctx.beginPath();
                
                let px = 0, py = 0, pw = 0, ph = 0;

                if (templateId === 'frame-pink') {
                    // Circles
                    const yCenters = [172, 497, 823];
                    const radius = 112;
                    ctx.arc(171, yCenters[i] || 0, radius, 0, Math.PI * 2);
                    px = 171 - radius; py = (yCenters[i] || 0) - radius; pw = radius * 2; ph = radius * 2;
                    ctx.clip();
                } else if (templateId === 'frame-gray') {
                    // Rounded Squares
                    const yStarts = [128, 411, 719];
                    px = 66; py = yStarts[i] || 0; pw = 200; ph = 197;
                    ctx.roundRect(px, py, pw, ph, 15);
                    ctx.clip();
                } else if (templateId === 'frame-blue') {
                    // Squares
                    const yStarts = [91, 398, 705];
                    px = 68; py = yStarts[i] || 0; pw = 206; ph = 206;
                    ctx.rect(px, py, pw, ph);
                    ctx.clip();
                } else if (templateId === 'frame-yellow') {
                    // Hearts
                    const yStarts = [86, 407, 728];
                    px = 74; py = yStarts[i] || 0; pw = 195; ph = 186;
                    
                    ctx.translate(px, py);
                    const scaleX = pw / 120;
                    const scaleY = ph / 120;
                    ctx.scale(scaleX, scaleY);
                    
                    ctx.moveTo(60, 30);
                    ctx.bezierCurveTo(60, 27, 55, 0, 30, 0);
                    ctx.bezierCurveTo(0, 0, 0, 33.75, 0, 33.75);
                    ctx.bezierCurveTo(0, 60, 30, 85.5, 60, 110);
                    ctx.bezierCurveTo(90, 85.5, 120, 60, 120, 33.75);
                    ctx.bezierCurveTo(120, 33.75, 120, 0, 90, 0);
                    ctx.bezierCurveTo(65, 0, 60, 27, 60, 30);
                    
                    ctx.clip();
                    // Reset transform before drawing image
                    ctx.setTransform(1, 0, 0, 1, 0, 0); 
                } else if (templateId === 'frame-film') {
                    // Film strip rectangles
                    const yStarts = [76, 520];
                    px = 75; py = yStarts[i] || 0; pw = 196; ph = 294;
                    ctx.rect(px, py, pw, ph);
                    ctx.clip();
                }

                // Calculate object-cover dimensions to fill the hole
                const imgRatio = img.width / img.height;
                const sliceRatio = pw / ph;
                
                let sWidth = img.width;
                let sHeight = img.height;
                let sx = 0;
                let sy = 0;

                if (imgRatio > sliceRatio) {
                    // Image is wider than slice, crop width
                    sWidth = img.height * sliceRatio;
                    sx = (img.width - sWidth) / 2;
                } else {
                    // Image is taller than slice, crop height
                    sHeight = img.width / sliceRatio;
                    sy = (img.height - sHeight) / 2;
                }

                ctx.filter = 'contrast(105%) saturate(110%)';
                ctx.drawImage(img, sx, sy, sWidth, sHeight, px, py, pw, ph);
                ctx.restore();
            }

            // Set final image
            setStripDataUrl(canvas.toDataURL('image/png'));
            setIsLoading(false);
        };

        renderStrip();
    }, []);

    const handleSaveToGallery = () => {
        if (!stripDataUrl) return;
        try {
            const existingGallery = sessionStorage.getItem('photobooth-gallery');
            let gallery: string[] = existingGallery ? JSON.parse(existingGallery) : [];
            
            // Add new photo to the beginning
            gallery.unshift(stripDataUrl);
            
            // Limit gallery to 10 items to prevent storage quota issues
            if (gallery.length > 10) {
                gallery = gallery.slice(0, 10);
            }
            
            sessionStorage.setItem('photobooth-gallery', JSON.stringify(gallery));
            window.location.href = '/gallery';
        } catch (e) {
            console.error("Gallery save error:", e);
            alert("Gagal menyimpan ke galeri. Mungkin memori browser penuh.");
        }
    };

    const handleDownload = () => {
        if (!stripDataUrl) return;
        const a = document.createElement('a');
        a.href = stripDataUrl;
        a.download = `photobooth-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDiscard = () => {
        window.location.href = '/session';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-on-surface-variant font-body-md">Memproses fotomu...</p>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full">
            {/* Success Indicator */}
            <div className="flex flex-col items-center justify-center mb-10 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(124,58,237,0.2)]">
                    <span className="material-symbols-outlined text-[32px] text-primary" style={{fontVariationSettings: "'FILL' 1"}}>task_alt</span>
                </div>
                <h1 className="font-h2 text-h2 text-on-surface mb-2">Fotomu sudah siap!</h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl px-4 text-balance">Sesi photobooth Anda telah berhasil diproses dan siap untuk disimpan.</p>
            </div>

            {/* Photobooth Strip Canvas */}
            <div className="relative group perspective-[1000px] mb-12">
                <div className="absolute inset-0 bg-primary/20 blur-[40px] transform scale-105 rounded-xl z-0 transition-opacity duration-300 opacity-70 group-hover:opacity-100"></div>
                
                <div className="relative z-10 p-2 w-[280px] sm:w-[320px] rounded-sm shadow-[0_25px_50px_-12px_rgba(99,14,212,0.25)] transform rotate-[-2deg] hover:rotate-0 hover:scale-[1.02] transition-all duration-500 ease-out bg-white border border-outline-variant/40">
                    {stripDataUrl && (
                        <img src={stripDataUrl} alt="Photobooth Result" className="w-full h-auto rounded-sm object-contain" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none rounded-sm"></div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full max-w-3xl px-4 justify-center">
                <Button 
                    onClick={handleSaveToGallery}
                    className="flex-1 min-w-[200px] bg-primary text-on-primary py-6 px-6 rounded-full font-label-sm text-label-sm flex items-center justify-center gap-2 hover:scale-[1.02] hover:bg-primary/95 transition-all shadow-[0_8px_24px_rgba(99,14,212,0.3)] hover:shadow-[0_12px_32px_rgba(99,14,212,0.4)] relative overflow-hidden group border-none"
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                    <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>collections_bookmark</span>
                    Simpan ke Gallery
                </Button>
                
                <Button 
                    onClick={handleDownload}
                    className="flex-1 min-w-[200px] bg-surface-container-highest text-on-surface py-6 px-6 rounded-full font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors border border-outline-variant/30 hover:border-outline-variant/60 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>download</span>
                    Download Hasil
                </Button>
                
                <Button 
                    onClick={handleDiscard}
                    variant="outline" 
                    className="flex-1 min-w-[200px] bg-error-container text-on-error-container py-6 px-6 rounded-full font-label-sm text-label-sm flex items-center justify-center gap-2 hover:bg-error hover:text-on-error transition-colors border border-error/20"
                >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                    Buang & Mulai Baru
                </Button>
            </div>

            {/* Hidden Canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
