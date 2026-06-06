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

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: '#333',
            progressColor: '#fff',
            cursorColor: '#aaa',
            barWidth: 10,
            barRadius: 0,
            height: 80,
            barGap: 2,
            normalize: true,
            barAlign: 'bottom',
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

    return <div ref={containerRef} className="w-full overflow-hidden cursor-pointer" />;
};