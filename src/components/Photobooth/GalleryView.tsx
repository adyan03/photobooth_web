import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GalleryView() {
    const [gallery, setGallery] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const existingGallery = sessionStorage.getItem('photobooth-gallery');
        if (existingGallery) {
            try {
                setGallery(JSON.parse(existingGallery));
            } catch (e) {
                console.error("Failed to parse gallery", e);
            }
        }
        setIsLoading(false);
    }, []);

    const handleDownload = (dataUrl: string, index: number) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `photobooth-gallery-${Date.now()}-${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDelete = (index: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus foto ini?')) return;
        
        const newGallery = [...gallery];
        newGallery.splice(index, 1);
        setGallery(newGallery);
        sessionStorage.setItem('photobooth-gallery', JSON.stringify(newGallery));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 w-full">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (gallery.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 w-full text-center">
                <div className="w-24 h-24 bg-surface-variant rounded-full flex items-center justify-center mb-6 text-outline">
                    <span className="material-symbols-outlined text-5xl">photo_library</span>
                </div>
                <h2 className="font-h2 text-h2 text-on-surface mb-2">Galeri Kosong</h2>
                <p className="font-body-lg text-on-surface-variant max-w-2xl px-4 text-balance mb-8">
                    Kamu belum menyimpan foto apapun. Ayo ambil beberapa foto dan simpan di sini!
                </p>
                <Button asChild className="bg-primary hover:bg-primary-container text-on-primary rounded-full px-8 py-6 font-label-sm shadow-md border-none">
                    <a href="/session" className="flex items-center gap-2">
                        <span className="material-symbols-outlined">add_a_photo</span>
                        Mulai Sesi Foto
                    </a>
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto py-4">
            <div className="text-center mb-12">
                <h1 className="font-h1 text-h1 text-on-surface mb-4">Galeri Sementara</h1>
                <p className="font-body-lg text-on-surface-variant">
                    Foto-foto ini hanya tersimpan selama kamu tidak menutup browser. Jangan lupa download foto favoritmu!
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {gallery.map((photoUrl, idx) => (
                    <div key={idx} className="bg-surface-container-highest rounded-xl p-3 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center group border border-outline-variant/30">
                        <div className="relative w-full aspect-[1/3] mb-3 bg-white/5 rounded-md overflow-hidden flex items-center justify-center">
                            <img src={photoUrl} alt={`Saved Strip ${idx + 1}`} className="max-w-full max-h-full object-contain drop-shadow-sm" />
                            
                            {/* Hover Actions Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                                <Button 
                                    onClick={() => handleDownload(photoUrl, idx)}
                                    className="bg-primary hover:bg-primary-container text-on-primary rounded-full font-label-sm w-[85%] h-10 shadow-md flex gap-2 items-center justify-center border-none text-xs"
                                >
                                    <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>download</span>
                                    Download
                                </Button>
                                <Button 
                                    onClick={() => handleDelete(idx)}
                                    variant="outline"
                                    className="bg-error hover:bg-error-container text-on-error rounded-full font-label-sm w-[85%] h-10 border-none shadow-md flex gap-2 items-center justify-center text-xs"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Hapus
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-16 text-center">
                <Button asChild className="bg-surface-container-high hover:bg-surface-variant text-on-surface rounded-full px-8 py-6 font-label-sm shadow-sm border border-outline-variant/20 hover:border-outline-variant/40">
                    <a href="/session" className="flex items-center gap-2">
                        <span className="material-symbols-outlined">add_a_photo</span>
                        Tambah Foto Lagi
                    </a>
                </Button>
            </div>
        </div>
    );
}
