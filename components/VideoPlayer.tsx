import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MediaItem } from '../types';

declare var Hls: any;

interface VideoPlayerProps {
    mediaItem: MediaItem;
    isPlaying: boolean;
    onPlayPause: (playing: boolean) => void;
    onEnded: () => void;
    onStatusChange: (status: string) => void;
}

const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

function srtToVtt(srt: string): string {
    return 'WEBVTT\n\n' + srt.replace(/\r+/g, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
}

async function attachSubtitleTrack(video: HTMLVideoElement, subtitleUrl: string) {
    try {
        const res = await fetch(subtitleUrl);
        const raw = await res.text();
        const vtt = subtitleUrl.endsWith('.srt') ? srtToVtt(raw) : raw; // .sub needs a real MicroDVD parser — flag for follow-up
        const blob = new Blob([vtt], { type: 'text/vtt' });
        const track = document.createElement('track');
        track.kind = 'subtitles';
        track.label = 'English';
        track.srclang = 'en';
        track.src = URL.createObjectURL(blob);
        track.default = true;
        video.appendChild(track);
    } catch (e) {
        console.error("Failed to load subtitles:", e);
    }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ mediaItem, isPlaying, onPlayPause, onEnded, onStatusChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isMediaReady, setIsMediaReady] = useState(false);
    const [volume, setVolume] = useState(() => {
        const savedVolume = localStorage.getItem('maverickPlayerVolume');
        return savedVolume ? parseFloat(savedVolume) : 0.7;
    });
    const [isMuted, setIsMuted] = useState(false);

    const hideControls = useCallback(() => {
        if (isPlaying) setIsControlsVisible(false);
    }, [isPlaying]);

    const resetControlsTimer = useCallback(() => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        setIsControlsVisible(true);
        if (isPlaying) {
            controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
        }
    }, [hideControls, isPlaying]);

    // Effect for setting video volume and mute properties
    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            videoElement.volume = volume;
            videoElement.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Effect for saving volume to local storage
    useEffect(() => {
        localStorage.setItem('maverickPlayerVolume', volume.toString());
    }, [volume]);


    // Effect for attaching and cleaning up passive event listeners
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
        const handleLoadedMetadata = () => setDuration(videoElement.duration);
        const handlePlaying = () => { onPlayPause(true); onStatusChange('PLAYING'); };
        const handlePause = () => onPlayPause(false);
        const handleWaiting = () => onStatusChange('BUFFERING');
        const handleError = () => {
            const error = videoElement.error;
            let errorMessage = 'An unknown error occurred.';
            if (error) {
                switch (error.code) {
                    case error.MEDIA_ERR_ABORTED:
                        errorMessage = 'Playback aborted by user.';
                        break;
                    case error.MEDIA_ERR_NETWORK:
                        errorMessage = 'A network error caused the download to fail.';
                        break;
                    case error.MEDIA_ERR_DECODE:
                        errorMessage = 'The media could not be decoded.';
                        break;
                    case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = 'The media source is not supported.';
                        break;
                    default:
                        errorMessage = `An unexpected error occurred. Code: ${error.code}`;
                }
            }
            onStatusChange(`ERROR: ${errorMessage}`);
        };


        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('playing', handlePlaying);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('ended', onEnded);
        videoElement.addEventListener('waiting', handleWaiting);
        videoElement.addEventListener('error', handleError);

        return () => {
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoElement.removeEventListener('playing', handlePlaying);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('ended', onEnded);
            videoElement.removeEventListener('waiting', handleWaiting);
            videoElement.removeEventListener('error', handleError);
        };
    }, [onEnded, onPlayPause, onStatusChange]);
    
    // Effect for loading new media source
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!mediaItem || !videoElement) return;

        onStatusChange('LOADING');
        setIsMediaReady(false);
        setCurrentTime(0);
        setDuration(0);

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // Clear existing tracks
        Array.from(videoElement.querySelectorAll('track')).forEach(t => t.remove());

        if (mediaItem.subtitles) {
            attachSubtitleTrack(videoElement, mediaItem.subtitles);
        }

        const isHlsSource = mediaItem.type === 'hls' || mediaItem.src.includes('.m3u8');
        
        if (isHlsSource && Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(mediaItem.src);
            hls.attachMedia(videoElement);
            
            hls.once(Hls.Events.MANIFEST_PARSED, () => {
                onStatusChange('READY');
                setIsMediaReady(true);
            });

            hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
                if (data.fatal) {
                   const { type, details } = data;
                   console.error(`HLS Fatal Error: ${type} - ${details}`, data);
                   onStatusChange(`HLS ERROR: ${details.replace(/_/g, ' ')}`);
                   setIsMediaReady(false);
                }
            });
        } else {
            videoElement.src = mediaItem.src;
            const onCanPlay = () => {
                onStatusChange('READY');
                setIsMediaReady(true);
            };
            videoElement.addEventListener('canplay', onCanPlay, { once: true });
            videoElement.load();
        }
        
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
            if (videoElement) {
                videoElement.removeAttribute('src');
                videoElement.load();
            }
        };
    }, [mediaItem, onStatusChange]);

    // Effect for controlling play/pause state
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !isMediaReady) return;

        if (isPlaying) {
            videoElement.play().catch(e => {
                console.error("Playback failed:", e);
                onStatusChange(`PLAYBACK FAILED`);
                onPlayPause(false); 
            });
        } else {
            videoElement.pause();
        }
    }, [isPlaying, isMediaReady, onPlayPause, onStatusChange]);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!videoRef.current || !isFinite(duration) || duration === 0) return;
        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = percent * duration;
        resetControlsTimer();
    };
    
    const handleVolumeChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const slider = e.currentTarget;
        const rect = slider.getBoundingClientRect();
        const newVolume = (e.clientX - rect.left) / rect.width;
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);
        if (isMuted && clampedVolume > 0) setIsMuted(false);
    }, [isMuted]);

    const onVolumeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const slider = e.currentTarget;
        handleVolumeChange(e);

        const onMouseMove = (moveEvent: MouseEvent) => {
            const rect = slider.getBoundingClientRect();
            const newVolume = (moveEvent.clientX - rect.left) / rect.width;
            setVolume(Math.max(0, Math.min(1, newVolume)));
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }, [handleVolumeChange]);


    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };
    
    const toggleMute = () => setIsMuted(prev => !prev);
    
    const getVolumeIcon = () => {
        if (isMuted || volume === 0) return '🔇';
        if (volume < 0.5) return '🔈';
        return '🔊';
    };
    
    return (
        <div ref={containerRef} onMouseMove={resetControlsTimer} onMouseLeave={hideControls} className="relative bg-black w-full aspect-video border border-border overflow-hidden">
            <video ref={videoRef} className="w-full h-full" playsInline poster={mediaItem.poster} />
            <div className={`custom-controls-overlay absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-all duration-300 ${isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}>
                <div className="custom-progress-container w-full flex items-center gap-2 mb-2 group">
                    <div className="custom-time-display font-mono text-xs">{formatTime(currentTime)}</div>
                    <div onClick={handleSeek} className="custom-progress-bar relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer group-hover:h-2.5 transition-all duration-200">
                        <div className="custom-progress-fill h-full bg-accent rounded-full" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}></div>
                        <div 
                            className="absolute top-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md -translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                        ></div>
                    </div>
                    <div className="custom-time-display font-mono text-xs">{formatTime(duration)}</div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => onPlayPause(!isPlaying)} className="text-accent text-2xl hover:text-accent-2 transition-colors">{isPlaying ? '⏸' : '▶'}</button>
                    
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className="text-accent text-xl hover:text-accent-2 transition-colors">
                            {getVolumeIcon()}
                        </button>
                        <div onMouseDown={onVolumeMouseDown} className="volume-slider-container relative w-24 h-5 flex items-center cursor-pointer group">
                             <div className="relative w-full h-1.5 bg-white/30 rounded-full group-hover:h-2.5 transition-all duration-200">
                                 <div className="volume-level h-full bg-accent rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%` }}></div>
                                 <div 
                                     className="absolute top-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md -translate-y-1/2 -translate-x-1/2 pointer-events-none group-hover:scale-110 transition-transform"
                                     style={{ left: `${isMuted ? 0 : volume * 100}%` }}
                                 ></div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex-grow"></div>
                    <button onClick={toggleFullscreen} className="text-accent text-xl hover:text-accent-2 transition-colors">⛶</button>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;