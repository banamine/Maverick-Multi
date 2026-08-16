
import React, { useState } from 'react';

interface KeypadProps {
    onJumpToTrack: (trackNumber: number) => void;
}

const Keypad: React.FC<KeypadProps> = ({ onJumpToTrack }) => {
    const [display, setDisplay] = useState('');

    const handleKeyPress = (key: string) => {
        if (display.length < 4) {
            setDisplay(prev => prev + key);
        }
    };

    const handleClear = () => {
        setDisplay('');
    };

    const handleGo = () => {
        const trackNum = parseInt(display, 10);
        if (!isNaN(trackNum) && trackNum > 0) {
            onJumpToTrack(trackNum);
            setDisplay('');
        }
    };
    
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    return (
        <div className="keypad-container bg-surface-2 border border-accent rounded-lg p-3 flex flex-col shadow-lg shadow-black/20 shrink-0">
            <div className="keypad-header text-center font-bold text-accent mb-2">JUMP TO TRACK</div>
            <div className="keypad-display bg-surface-1 border border-accent text-text-1 h-9 flex items-center justify-center text-lg font-mono mb-2 rounded">
                {display || '#'}
            </div>
            <div className="keypad-buttons grid grid-cols-3 gap-1.5 flex-grow">
                {keys.map(key => (
                    <button key={key} onClick={() => handleKeyPress(key)} className="keypad-btn bg-surface-1 border border-accent text-accent font-bold rounded transition hover:bg-accent hover:text-bg text-lg">
                        {key}
                    </button>
                ))}
                <button onClick={handleClear} className="keypad-action col-span-2 bg-surface-1 border border-accent text-accent font-bold rounded transition hover:bg-accent hover:text-bg uppercase text-xs">
                    Clear
                </button>
                <button onClick={handleGo} className="keypad-action bg-accent border border-accent text-bg font-bold rounded transition hover:bg-accent-2 uppercase text-xs">
                    Go
                </button>
            </div>
        </div>
    );
};

export default Keypad;
