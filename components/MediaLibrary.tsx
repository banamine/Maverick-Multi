import React, { useRef, useState, useEffect, useMemo } from 'react';
import { MediaItem, MediaType } from '../types';

interface MediaLibraryProps {
    playlist: MediaItem[];
    originalPlaylist: MediaItem[];
    genres: string[];
    activeGenre: string;
    onGenreChange: (genre: string) => void;
    currentItemId: string | undefined;
    onSelectTrack: (id: string) => void;
    isShuffled: boolean;
    onShuffle: () => void;
}

const ITEM_HEIGHT = 36; // px
const BUFFER_ITEMS = 5;

const getBadge = (type: MediaType) => {
    const baseClasses = "ml-2 text-xs font-bold px-1.5 py-0.5 rounded text-bg";
    switch (type) {
        case 'hls': return <span className={`${baseClasses} bg-accent-2`}>HLS</span>;
        case 'video': return <span className={`${baseClasses} bg-purple-400`}>VID</span>;
        case 'audio': return <span className={`${baseClasses} bg-accent`}>AUD</span>;
        case 'radio': return <span className={`${baseClasses} bg-yellow-400`}>RAD</span>;
        default: return null;
    }
};

const MediaLibrary: React.FC<MediaLibraryProps> = ({ playlist, originalPlaylist, genres, activeGenre, onGenreChange, currentItemId, onSelectTrack, isShuffled, onShuffle }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(300);

    useEffect(() => {
        if (scrollContainerRef.current) {
            setContainerHeight(scrollContainerRef.current.clientHeight);
        }
    }, []);
    
    // Scroll the active item into view when it changes
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !currentItemId) return;

        const index = playlist.findIndex(item => item.id === currentItemId);
        if (index === -1) return;

        const itemTop = index * ITEM_HEIGHT;
        const itemBottom = itemTop + ITEM_HEIGHT;
        const viewTop = container.scrollTop;
        const viewBottom = viewTop + container.clientHeight;

        if (itemTop < viewTop || itemBottom > viewBottom) {
            container.scrollTop = itemTop - (container.clientHeight / 2) + (ITEM_HEIGHT / 2);
        }

    }, [currentItemId, playlist, activeGenre]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const { visibleItems } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
        const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT);
        const end = Math.min(playlist.length, start + visibleCount + (BUFFER_ITEMS * 2));
        
        const items = playlist.slice(start, end).map((item, index) => ({
            ...item,
            originalIndex: originalPlaylist.findIndex(p => p.id === item.id),
            style: {
                position: 'absolute' as const,
                top: `${(start + index) * ITEM_HEIGHT}px`,
                height: `${ITEM_HEIGHT}px`,
                left: 0,
                right: 0,
            }
        }));
        return { visibleItems: items };
    }, [scrollTop, containerHeight, playlist, originalPlaylist]);


    return (
        <div className="genre-tabs-container bg-surface-2 border border-accent-2 rounded-lg flex flex-col flex-1 min-h-0 shadow-lg shadow-black/20 overflow-hidden">
            <div className="genre-tabs-header p-3 bg-surface-1 border-b border-accent-2 flex justify-between items-center shrink-0">
                <div className="genre-tabs-title font-bold text-accent-2">MEDIA LIBRARY</div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onShuffle} 
                        className={`text-xs px-2.5 py-1 rounded font-bold uppercase transition ${isShuffled ? 'bg-accent text-bg border border-accent' : 'bg-surface-2 text-text-2 border border-border hover:text-accent hover:border-accent'}`}
                    >
                        {isShuffled ? '🔀 UNSHUFFLE' : '🔀 SHUFFLE'}
                    </button>
                    <div className="genre-tabs-count bg-accent/10 text-text-2 text-xs px-2 py-1 rounded-full">{playlist.length} items</div>
                </div>
            </div>
            <div className="genre-tabs flex overflow-x-auto border-b border-accent-2 scrollbar-thin scrollbar-thumb-accent-2 scrollbar-track-bg shrink-0">
                {genres.map(genre => (
                    <button
                        key={genre}
                        onClick={() => onGenreChange(genre)}
                        className={`genre-tab py-2 px-3 text-sm font-bold whitespace-nowrap transition ${activeGenre === genre ? 'bg-accent/20 text-accent-2' : 'text-text-2 hover:bg-accent/10 hover:text-accent-2'}`}
                    >
                        {genre}
                    </button>
                ))}
            </div>
            <div ref={scrollContainerRef} onScroll={handleScroll} className="genre-content flex-1 relative overflow-y-auto min-h-0 max-h-64 overscroll-contain">
                <div className="virtual-scroll-content" style={{ height: `${playlist.length * ITEM_HEIGHT}px` }}>
                    {visibleItems.map(item => (
                        <div
                            key={item.id}
                            style={item.style}
                            onClick={() => onSelectTrack(item.id)}
                            className={`channel-item flex items-center px-2.5 border-b border-white/5 cursor-pointer transition ${item.id === currentItemId ? 'bg-accent/10 border-l-4 border-accent-2 pl-1.5' : 'hover:bg-surface-3'}`}
                        >
                            <span className="truncate text-sm text-text-1">
                                {item.originalIndex + 1}. {item.title}
                            </span>
                            {getBadge(item.type)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MediaLibrary;