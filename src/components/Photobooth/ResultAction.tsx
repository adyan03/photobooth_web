import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

// ─── Frame Configuration ──────────────────────────────────────────────────────
// Each frame defines how to composite photos onto the template.
// bgColor: the main frame background color (pixels to KEEP in the frame overlay)
// tolerance: color matching tolerance
// holes: photo placeholder rectangles [{ px, py, pw, ph, shape? }]
// photoCount: number of photos this frame expects
// shape: 'rect' | 'circle' | 'heart' | 'rounded' (default 'rect')

type HoleShape = 'rect' | 'circle' | 'heart' | 'rounded';
type FrameHole = { px: number; py: number; pw: number; ph: number; shape?: HoleShape };
type FrameConfig = {
    bgColors: [number, number, number][];
    tolerances: number[];
    holes: FrameHole[];
    photoCount: number;
};

const FRAME_CONFIGS: Record<string, FrameConfig> = {
    'frame-pink': {
        bgColors: [[255, 87, 87], [136, 162, 1]],
        tolerances: [20, 15],
        photoCount: 3,
        holes: [
            { px: 59,  py: 60,  pw: 224, ph: 224, shape: 'circle' },
            { px: 59,  py: 385, pw: 224, ph: 224, shape: 'circle' },
            { px: 59,  py: 711, pw: 224, ph: 224, shape: 'circle' },
        ],
    },
    'frame-gray': {
        bgColors: [[166, 166, 166], [43, 43, 43], [136, 162, 1]],
        tolerances: [20, 20, 15],
        photoCount: 3,
        holes: [
            { px: 50, py: 100, pw: 242, ph: 241, shape: 'rounded' },
            { px: 50, py: 392, pw: 242, ph: 240, shape: 'rounded' },
            { px: 50, py: 700, pw: 242, ph: 241, shape: 'rounded' },
        ],
    },
    'frame-blue': {
        bgColors: [[56, 182, 255], [136, 162, 1]],
        tolerances: [20, 15],
        photoCount: 3,
        holes: [
            { px: 68, py: 91,  pw: 206, ph: 206, shape: 'rect' },
            { px: 68, py: 398, pw: 206, ph: 206, shape: 'rect' },
            { px: 68, py: 705, pw: 206, ph: 206, shape: 'rect' },
        ],
    },
    'frame-yellow': {
        bgColors: [[255, 189, 89], [136, 162, 1]],
        tolerances: [20, 15],
        photoCount: 3,
        holes: [
            { px: 50, py: 62,  pw: 242, ph: 212, shape: 'heart' },
            { px: 50, py: 383, pw: 242, ph: 212, shape: 'heart' },
            { px: 50, py: 705, pw: 242, ph: 211, shape: 'heart' },
        ],
    },
    'frame-film': {
        bgColors: [[166, 166, 166], [3, 3, 5], [43, 43, 43], [255, 87, 87]],
        tolerances: [20, 10, 20, 20],
        photoCount: 2,
        holes: [
            { px: 34, py: 67,  pw: 281, ph: 306, shape: 'rect' },
            { px: 34, py: 512, pw: 281, ph: 305, shape: 'rect' },
        ],
    },
    'desain1': {
        // desain1 (509x831): 1 large left + 2 small right
        // Border: papaya whip (253,240,213) at x=0-16, x=289-297, x=486-506
        // Row separators: y=5-25 (top), y=702-742 (bottom/text area)
        // Right column horizontal separator: y=359-368
        bgColors: [[253, 240, 213], [196, 64, 48]],
        tolerances: [12, 20],
        photoCount: 3,
        holes: [
            { px: 17,  py: 26,  pw: 271, ph: 675, shape: 'rect' }, // Large left photo (x:17-287, y:26-700)
            { px: 298, py: 26,  pw: 187, ph: 332, shape: 'rect' }, // Small right top (x:298-484, y:26-357)
            { px: 298, py: 369, pw: 187, ph: 332, shape: 'rect' }, // Small right bottom (x:298-484, y:369-700)
        ],
    },
    'desain2': {
        // desain2 (433x598): 1 landscape top + 2 portrait bottom side-by-side
        // Border: x=3-18 (left), x=417-432 (right), y=0-14 (top), y=239-250 (mid divider), y=508-595 (bottom)
        // Bottom vertical divider: x=212-223
        bgColors: [[253, 240, 213], [196, 64, 48]],
        tolerances: [12, 20],
        photoCount: 3,
        holes: [
            { px: 19,  py: 15,  pw: 397, ph: 223, shape: 'rect' }, // Wide top photo (x:19-415, y:15-237)
            { px: 19,  py: 251, pw: 192, ph: 256, shape: 'rect' }, // Bottom left (x:19-210, y:251-506)
            { px: 224, py: 251, pw: 192, ph: 256, shape: 'rect' }, // Bottom right (x:224-415, y:251-506)
        ],
    },
    'desain3': {
        // desain3 (252x643): 3 landscape photos stacked vertically
        // Border: x=6-16 (left), x=239-250 (right)
        // Row separators: y=3-14 (top), y=182-199 (div1), y=367-383 (div2), y=552-588 (bottom+text)
        bgColors: [[253, 240, 213], [196, 64, 48]],
        tolerances: [12, 20],
        photoCount: 3,
        holes: [
            { px: 17, py: 15,  pw: 221, ph: 166, shape: 'rect' }, // Top photo (y:15-180)
            { px: 17, py: 200, pw: 221, ph: 166, shape: 'rect' }, // Middle photo (y:200-365)
            { px: 17, py: 384, pw: 221, ph: 167, shape: 'rect' }, // Bottom photo (y:384-550)
        ],
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colorMatch(r: number, g: number, b: number, target: [number, number, number], tol: number): boolean {
    return Math.abs(r - target[0]) <= tol && Math.abs(g - target[1]) <= tol && Math.abs(b - target[2]) <= tol;
}

/** Load an image from a URL and return an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Build a transparent version of the frame.
 * Only pixels that are INSIDE a hole bounding box AND do NOT match
 * any frame background color are erased (made transparent).
 * Pixels OUTSIDE the hole bounds (e.g. text like "A-Snap") are never touched.
 */
function buildTransparentFrame(
    sourceImg: HTMLImageElement,
    bgColors: [number, number, number][],
    tolerances: number[],
    holes: FrameHole[]
): HTMLCanvasElement {
    const offscreen = document.createElement('canvas');
    offscreen.width = sourceImg.width;
    offscreen.height = sourceImg.height;
    const ctx = offscreen.getContext('2d')!;
    ctx.drawImage(sourceImg, 0, 0);

    const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
    const data = imageData.data;
    const W = offscreen.width;

    // Build a fast lookup: which pixels are inside at least one hole bounding box?
    // We expand each hole bbox by a few pixels to ensure clean edge removal.
    const EXPAND = 4;
    for (const hole of holes) {
        const x0 = Math.max(0, hole.px - EXPAND);
        const y0 = Math.max(0, hole.py - EXPAND);
        const x1 = Math.min(offscreen.width - 1,  hole.px + hole.pw + EXPAND);
        const y1 = Math.min(offscreen.height - 1, hole.py + hole.ph + EXPAND);

        for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
                const i = (y * W + x) * 4;
                const r = data[i], g = data[i + 1], b = data[i + 2];

                // Only erase if it does NOT match any frame structure color
                let isFrame = false;
                for (let ci = 0; ci < bgColors.length; ci++) {
                    if (colorMatch(r, g, b, bgColors[ci], tolerances[ci])) {
                        isFrame = true;
                        break;
                    }
                }
                if (!isFrame) {
                    data[i + 3] = 0; // transparent
                }
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return offscreen;
}

/** Draw a photo into a hole with object-cover cropping and optional clipping shape */
function drawPhotoInHole(
    ctx: CanvasRenderingContext2D,
    photoImg: HTMLImageElement,
    hole: FrameHole
) {
    const { px, py, pw, ph, shape = 'rect' } = hole;
    
    ctx.save();
    ctx.beginPath();
    
    if (shape === 'circle') {
        const cx = px + pw / 2;
        const cy = py + ph / 2;
        const radius = Math.min(pw, ph) / 2;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    } else if (shape === 'rounded') {
        const radius = Math.min(pw, ph) * 0.06;
        ctx.roundRect(px, py, pw, ph, radius);
    } else if (shape === 'heart') {
        // Draw heart path scaled to fit hole
        const cx = px + pw / 2;
        const cy = py;
        const scaleX = pw / 200;
        const scaleY = ph / 190;
        ctx.translate(cx, cy);
        ctx.scale(scaleX, scaleY);
        ctx.moveTo(0, 50);
        ctx.bezierCurveTo(0, 20, -50, 0, -80, 30);
        ctx.bezierCurveTo(-120, 65, -80, 120, 0, 160);
        ctx.bezierCurveTo(80, 120, 120, 65, 80, 30);
        ctx.bezierCurveTo(50, 0, 0, 20, 0, 50);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    } else {
        ctx.rect(px, py, pw, ph);
    }
    
    ctx.clip();
    
    // Object-cover: fill hole completely, crop center
    const imgRatio = photoImg.width / photoImg.height;
    const holeRatio = pw / ph;
    
    let sx = 0, sy = 0, sw = photoImg.width, sh = photoImg.height;
    
    if (imgRatio > holeRatio) {
        // Image wider than hole → crop sides
        sw = photoImg.height * holeRatio;
        sx = (photoImg.width - sw) / 2;
    } else {
        // Image taller than hole → crop top/bottom
        sh = photoImg.width / holeRatio;
        sy = (photoImg.height - sh) / 2;
    }
    
    ctx.filter = 'contrast(105%) saturate(110%)';
    ctx.drawImage(photoImg, sx, sy, sw, sh, px, py, pw, ph);
    ctx.filter = 'none';
    ctx.restore();
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

            // Get frame config (use frame-pink as fallback for unknown templates)
            const config = FRAME_CONFIGS[templateId] ?? FRAME_CONFIGS['frame-pink'];

            // Load template image
            const templateImg = await loadImage(`/frames/${templateId}.png`);

            // Set canvas size to match template
            canvas.width = templateImg.width;
            canvas.height = templateImg.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Build transparent frame (only erases pixels inside hole bounding boxes)
            const transparentFrame = buildTransparentFrame(
                templateImg,
                config.bgColors,
                config.tolerances,
                config.holes
            );

            // Step 1: Draw photos into their holes FIRST
            const photoCount = Math.min(photos.length, config.holes.length);
            
            for (let i = 0; i < photoCount; i++) {
                const photoImg = await loadImage(photos[i]);
                drawPhotoInHole(ctx, photoImg, config.holes[i]);
            }

            // Step 2: Draw transparent frame ON TOP — frame structure covers edges, holes stay transparent
            ctx.drawImage(transparentFrame, 0, 0);

            // Set final image
            setStripDataUrl(canvas.toDataURL('image/png'));
            setIsLoading(false);
        };

        renderStrip().catch(err => {
            console.error('Error rendering strip:', err);
            setIsLoading(false);
        });
    }, []);

    const handleSaveToGallery = () => {
        if (!stripDataUrl) return;
        try {
            const existingGallery = sessionStorage.getItem('photobooth-gallery');
            let gallery: string[] = existingGallery ? JSON.parse(existingGallery) : [];
            
            gallery.unshift(stripDataUrl);
            
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
