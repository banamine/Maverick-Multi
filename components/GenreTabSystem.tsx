import React, { useState, useEffect } from 'react';
import { ChannelManager } from '../services/ChannelManager';

interface Props {
  channelManager: ChannelManager;
  onGenreSelect: (genre: string) => void;
  selectedGenre: string | null;
}

export function GenreTabSystem({ channelManager, onGenreSelect, selectedGenre }: Props) {
  const [genres, setGenres] = useState<string[]>([]);

  // ✅ Update genres dynamically when channels change
  const refreshGenres = () => {
    const allGenres = channelManager.getAllGenresTabs();
    setGenres(allGenres);

    // Auto-select first genre if none selected
    if (!selectedGenre && allGenres.length > 0) {
      onGenreSelect(allGenres[0]);
    }
  };

  useEffect(() => {
    refreshGenres();

    // Listen for channel updates
    const handler = () => refreshGenres();
    window.addEventListener('channels-updated', handler);
    return () => window.removeEventListener('channels-updated', handler);
  }, []);

  return (
    <div className="genre-tabs-container">
      {genres.length === 0 ? (
        <p className="no-genres text-slate-400">No genres available. Import a channel file to get started.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => onGenreSelect(genre)}
              className={`px-3 py-1 rounded text-sm font-medium ${selectedGenre === genre ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
