import React, { useState } from 'react';
import { MediaItem } from '../types';
import Keypad from './Keypad';
import MediaLibrary from './MediaLibrary';

interface SidebarProps {
    playlist: MediaItem[];
    originalPlaylist: MediaItem[];
    genres: string[];
    activeGenre: string;
    onGenreChange: (genre: string) => void;
    currentItemId: string | undefined;
    onSelectTrack: (id: string) => void;
    onSearch: (term: string) => void;
    onJumpToTrack: (trackNumber: number) => void;
    isShuffled: boolean;
    onShuffle: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        props.onSearch(searchTerm);
    };

    return (
        <div className="sidebar flex flex-col gap-4 h-full overflow-hidden min-h-0">
            <div className="search-container flex gap-2.5 shrink-0">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search media..."
                    className="flex-1 p-2.5 bg-surface-2 border border-border text-text-1 placeholder-text-3 text-base rounded focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                <button 
                    onClick={handleSearch}
                    className="bg-surface-1 border border-accent text-accent py-2.5 px-4 font-bold uppercase transition hover:bg-accent hover:text-bg rounded"
                >
                    Search
                </button>
            </div>
            
            <Keypad onJumpToTrack={props.onJumpToTrack} />
            
            <MediaLibrary 
                playlist={props.playlist}
                originalPlaylist={props.originalPlaylist}
                genres={props.genres}
                activeGenre={props.activeGenre}
                onGenreChange={props.onGenreChange}
                currentItemId={props.currentItemId}
                onSelectTrack={props.onSelectTrack}
                isShuffled={props.isShuffled}
                onShuffle={props.onShuffle}
            />
        </div>
    );
};

export default Sidebar;
