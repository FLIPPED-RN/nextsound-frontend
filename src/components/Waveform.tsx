import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
    audioUrl: string;
    isPlaying: boolean;
    currentTime: number;
    onPlay: () => void;
    onPause: () => void;
    onReady: (duration: number) => void;
    onTimeUpdate: (time: number) => void;
    onSeek: (time: number) => void;
}

export const Waveform = ({
    audioUrl,
    isPlaying,
    currentTime,
    onPlay,
    onPause,
    onReady,
    onTimeUpdate,
    onSeek,
}: WaveformProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const isSeeking = useRef(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const HEIGHT = 80;
        const gradient = (stops: [number, string][]) => {
            const ctx = document.createElement('canvas').getContext('2d')!;
            const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
            stops.forEach(([offset, color]) => g.addColorStop(offset, color));
            return g;
        };

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: gradient([[0, '#3a3a46'], [0.5, '#26262f'], [1, '#3a3a46']]),
            progressColor: gradient([
                [0, '#22d3ee'],
                [0.4, '#8b5cf6'],
                [0.7, '#a855f7'],
                [1, '#ec4899'],
            ]),
            cursorColor: 'rgba(255,255,255,0.65)',
            cursorWidth: 2,
            barWidth: 3,
            barRadius: 4,
            height: HEIGHT,
            barGap: 2,
            normalize: true,
        });

        ws.load(audioUrl);
        ws.setMuted(true);

        ws.on('ready', () => {
            onReady(ws.getDuration());
        });

        ws.on('timeupdate', (time) => {
            if (!isSeeking.current) {
                onTimeUpdate(time);
            }
        });

        ws.on('interaction', (time) => {
            isSeeking.current = true;
            onSeek(time);
            setTimeout(() => { isSeeking.current = false; }, 100);
        });

        ws.on('play', onPlay);
        ws.on('pause', onPause);

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, [audioUrl]);

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws) return;
        if (isPlaying && !ws.isPlaying()) {
            ws.play();
        } else if (!isPlaying && ws.isPlaying()) {
            ws.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || isSeeking.current) return;
        const diff = Math.abs(ws.getCurrentTime() - currentTime);
        if (diff > 0.5) {
            ws.setTime(currentTime);
        }
    }, [currentTime]);

    return (
        <div
            ref={containerRef}
            className="w-full overflow-hidden cursor-pointer transition-[filter] duration-500"
            style={{ filter: isPlaying ? 'drop-shadow(0 0 8px rgba(139,92,246,0.35))' : 'none' }}
        />
    );
};