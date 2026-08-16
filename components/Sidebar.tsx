import React, { useState } from 'react';
import { MediaItem } from '../types';
import Keypad from './Keypad';
import MediaLibrary from './MediaLibrary';
import { deployDirectToGitHub } from '../utils/exportTvTemplate';

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
    const [githubToken, setGithubToken] = useState(localStorage.getItem('gh_pat') || '');

    const handleSearch = () => {
        props.onSearch(searchTerm);
    };

    const handleDeploy = () => {
        if (!githubToken) {
            alert("Please enter your GitHub Personal Access Token.");
            return;
        }
        localStorage.setItem('gh_pat', githubToken); 
        deployDirectToGitHub(props.playlist, githubToken);
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
            
            <div className="flex flex-col gap-2 shrink-0 border border-border p-3 rounded-lg bg-surface-1 shadow-soft">
                <div className="text-xs font-bold text-text-2 uppercase">GitHub Export</div>
                <input 
                    type="password" 
                    placeholder="GitHub PAT..."
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-surface-2 text-sm px-2.5 py-2 rounded border border-border text-text-1 focus:outline-none focus:border-accent"
                />
                <button 
                    onClick={handleDeploy}
                    className="w-full bg-accent border border-accent text-bg py-2 font-bold uppercase transition hover:bg-accent-2 hover:border-accent-2 rounded flex items-center justify-center gap-2"
                >
                    🚀 Deploy Channel
                </button>
            </div>
            
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
