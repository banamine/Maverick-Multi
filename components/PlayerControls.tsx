
import React from 'react';

interface PlayerControlsProps {
    onPlayPause: () => void;
    onPrev: () => void;
    onNext: () => void;
    onShuffle: () => void;
    isPlaying: boolean;
    isShuffled: boolean;
}

const ControlButton: React.FC<{ onClick: () => void; children: React.ReactNode; isActive?: boolean; className?: string }> = ({ onClick, children, isActive = false, className = '' }) => (
    <button
        onClick={onClick}
        className={`
            control-btn flex-grow text-sm font-bold uppercase py-2.5 px-4 border border-accent rounded 
            transition-all duration-200 ease-in-out
            ${isActive ? 'bg-accent text-bg' : 'bg-surface-1 text-accent hover:bg-accent hover:text-bg'}
            ${className}
        `}
    >
        {children}
    </button>
);

const PlayerControls: React.FC<PlayerControlsProps> = ({ onPlayPause, onPrev, onNext, onShuffle, isPlaying, isShuffled }) => {
    return (
        <div className="player-controls flex flex-wrap gap-2.5">
            <ControlButton onClick={onPlayPause}>{isPlaying ? '⏸ PAUSE' : '▶ PLAY'}</ControlButton>
            <ControlButton onClick={onPrev}>⏮ PREV</ControlButton>
            <ControlButton onClick={onNext}>NEXT ⏭</ControlButton>
            <ControlButton onClick={onShuffle} isActive={isShuffled}>🔀 SHUFFLE</ControlButton>
        </div>
    );
};

export default PlayerControls;
