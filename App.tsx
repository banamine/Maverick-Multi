import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MediaItem } from './types';
import { MEDIA_PLAYLIST, GENRES } from './constants';
import VideoPlayer from './components/VideoPlayer';
import PlayerControls from './components/PlayerControls';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
    const [originalPlaylist] = useState<MediaItem[]>(MEDIA_PLAYLIST);
    const [playlist, setPlaylist] = useState<MediaItem[]>(originalPlaylist);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isShuffled, setIsShuffled] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [activeGenre, setActiveGenre] = useState<string>('All Media');
    const [status, setStatus] = useState<string>('READY');
    
    const currentMediaItem = useMemo(() => playlist[currentIndex], [playlist, currentIndex]);

    const filterAndSortPlaylist = useCallback(() => {
        let newPlaylist = [...originalPlaylist];

        if (isShuffled) {
            // Create a stable shuffled order that only changes when shuffle is toggled
            const shuffled = [...originalPlaylist];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            newPlaylist = shuffled;
        }

        if (searchTerm) {
            newPlaylist = newPlaylist.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        setPlaylist(newPlaylist);
        // Reset to first item in new playlist if current is out of bounds
        if (currentIndex >= newPlaylist.length) {
            setCurrentIndex(0);
        }

    }, [isShuffled, searchTerm, originalPlaylist, currentIndex]);
    
    useEffect(() => {
        filterAndSortPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isShuffled, searchTerm]);

    const handlePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev);
    }, []);
    
    const selectTrack = useCallback((index: number) => {
        setCurrentIndex(index);
        setIsPlaying(true);
    }, []);
    
    const playNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % playlist.length);
        setIsPlaying(true);
    }, [playlist.length]);
    
    const playPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + playlist.length) % playlist.length);
        setIsPlaying(true);
    }, [playlist.length]);

    const toggleShuffle = useCallback(() => {
        setIsShuffled(prev => !prev);
    }, []);

    const handleSearch = useCallback((term: string) => {
        setSearchTerm(term);
    }, []);
    
    const jumpToTrack = useCallback((trackNumber: number) => {
        const index = trackNumber - 1;
        if (index >= 0 && index < originalPlaylist.length) {
            const itemToFind = originalPlaylist[index];
            const newPlaylistIndex = playlist.findIndex(p => p.id === itemToFind.id);

            if(newPlaylistIndex !== -1) {
              setCurrentIndex(newPlaylistIndex);
              setIsPlaying(true);
            } else {
              // Item not in current filtered list, so reset search/filter to find it
              setSearchTerm('');
              // Find the item in the original list to determine its genre
              const originalItem = originalPlaylist.find(p => p.id === itemToFind.id);
              setActiveGenre(originalItem?.genre || 'All Media');
              // The playlist will refilter, so we need to find the index again
              // This is complex, so let's just find it in the original list and switch
              setCurrentIndex(originalPlaylist.findIndex(p => p.id === itemToFind.id));
              setIsPlaying(true);
            }
        }
    }, [originalPlaylist, playlist]);

    const filteredPlaylistByGenre = useMemo(() => {
        if (activeGenre === 'All Media') {
            return playlist;
        }
        if (activeGenre === 'Up Next') {
            const upNext = [];
            for (let i = 1; i <= 4; i++) {
                if (playlist.length > 0) {
                    upNext.push(playlist[(currentIndex + i) % playlist.length]);
                }
            }
            return upNext;
        }
        return playlist.filter(item => item.genre === activeGenre);
    }, [playlist, activeGenre, currentIndex]);
    
    const displayGenres = useMemo(() => {
        const baseGenres = GENRES.filter(g => g !== 'All Media');
        return ['All Media', 'Up Next', ...baseGenres];
    }, []);
    
    return (
        <div className="max-w-7xl mx-auto bg-surface-1 border-x border-border shadow-2xl shadow-black/50 min-h-screen lg:h-screen flex flex-col lg:overflow-hidden">
            
            <section className="p-4 sm:p-6 flex-grow flex flex-col lg:overflow-hidden min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 flex-grow lg:overflow-hidden min-h-0">
                    <div className="flex flex-col gap-4 lg:overflow-y-auto pr-0 lg:pr-2 scrollbar-thin scrollbar-thumb-surface-3 scrollbar-track-bg min-h-0">
                        <VideoPlayer 
                            mediaItem={currentMediaItem}
                            isPlaying={isPlaying}
                            onPlayPause={setIsPlaying}
                            onEnded={playNext}
                            onStatusChange={setStatus}
                        />
                         <div className="bg-surface-2 p-3 border border-border rounded-lg shadow-soft shrink-0">
                           <div id="now-playing" className="font-bold text-text-1 text-lg truncate">
                               {currentMediaItem ? <span className="text-accent">{originalPlaylist.findIndex(p => p.id === currentMediaItem.id) + 1}.</span> : ''} {currentMediaItem ? currentMediaItem.title : 'Loading media...'}
                           </div>
                         </div>
                        <div className="shrink-0">
                            <PlayerControls
                                onPlayPause={handlePlayPause}
                                onPrev={playPrev}
                                onNext={playNext}
                                onShuffle={toggleShuffle}
                                isPlaying={isPlaying}
                                isShuffled={isShuffled}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col lg:h-full lg:overflow-hidden min-h-0">
                        <Sidebar 
                            playlist={filteredPlaylistByGenre}
                            originalPlaylist={originalPlaylist}
                            genres={displayGenres}
                            activeGenre={activeGenre}
                            onGenreChange={setActiveGenre}
                            currentItemId={currentMediaItem?.id}
                            onSelectTrack={(id) => { 
                                 const newIndex = playlist.findIndex(p => p.id === id);
                                 if(newIndex !== -1) selectTrack(newIndex);
                            }}
                            onSearch={handleSearch}
                            onJumpToTrack={jumpToTrack}
                            isShuffled={isShuffled}
                            onShuffle={toggleShuffle}
                        />
                    </div>
                </div>
            </section>
            <div className="bg-surface-2 border-t border-border p-2 text-center text-text-2 font-mono text-xs tracking-widest uppercase">
                STATUS: <span className="text-accent font-bold">{status}</span>
            </div>
        </div>
    );
};

export default App;
