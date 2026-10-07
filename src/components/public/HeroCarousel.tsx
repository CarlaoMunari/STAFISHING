import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CarouselImage } from '@/types';

export function HeroCarousel() {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const { data, error } = await supabase
                .from('carousel_images')
                .select('*')
                .order('order', { ascending: true });

            if (error) throw error;

            const loadedImages = data.map((item: any) => ({
                ...item,
                createdAt: new Date(item.created_at),
            })) as CarouselImage[];
            setImages(loadedImages);
        } catch (error) {
            console.error('Erro ao carregar imagens do carrossel:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (images.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [images.length]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    if (loading) {
        return (
            <div className="relative h-96 bg-gradient-to-r from-ocean-600 to-fishing-600 flex items-center justify-center">
                <div className="text-white text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Circuitos de Pesca Esportiva</h1>
                    <p className="text-xl md:text-2xl">Carregando...</p>
                </div>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="relative h-96 bg-gradient-to-r from-ocean-600 to-fishing-600 flex items-center justify-center">
                <div className="text-white text-center px-4">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Circuitos de Pesca Esportiva</h1>
                    <p className="text-xl md:text-2xl">Bem-vindo ao sistema de gestão de circuitos</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full overflow-hidden group bg-slate-950 flex items-center justify-center min-h-[140px]">
            {/* Images */}
            {images.map((image, index) => (
                <div
                    key={image.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30" />
                </div>
            ))}

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dots */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-8'
                                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
