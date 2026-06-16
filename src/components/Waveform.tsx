import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { resolveAssetUrl } from '@/lib/utils';

interface TimedComment {
    id: number;
    timestamp?: number | null;
    text: string;
    user?: { avatar?: string; nickname?: string; firstName?: string };
}

interface WaveformProps {
    audioUrl: string;
    isPlaying: boolean;
    currentTime: number;
    onPlay: () => void;
    onPause: () => void;
    onReady: (duration: number) => void;
    onTimeUpdate: (time: number) => void;
    onSeek: (time: number) => void;
    progressGradient?: string[];
    comments?: TimedComment[];
}

const DEFAULT_PROGRESS = ['#22d3ee', '#8b5cf6', '#a855f7', '#ec4899'];

export const Waveform = ({
    audioUrl,
    isPlaying,
    currentTime,
    onPlay,
    onPause,
    onReady,
    onTimeUpdate,
    onSeek,
    progressGradient,
    comments,
}: WaveformProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const isSeeking = useRef(false);
    const [dur, setDur] = useState(0);
    const [hovered, setHovered] = useState<number | null>(null);

    const cb = useRef({ onPlay, onPause, onReady, onTimeUpdate, onSeek });
    cb.current = { onPlay, onPause, onReady, onTimeUpdate, onSeek };

    const progressKey = (progressGradient || DEFAULT_PROGRESS).join(',');

    useEffect(() => {
        if (!containerRef.current) return;

        const HEIGHT = 80;
        const stops = progressGradient && progressGradient.length >= 2 ? progressGradient : DEFAULT_PROGRESS;
        const gradient = (colors: string[]) => {
            const ctx = document.createElement('canvas').getContext('2d')!;
            const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
            colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
            return g;
        };

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: gradient(['#3a3a46', '#26262f', '#3a3a46']),
            progressColor: gradient(stops),
            cursorColor: 'rgba(255,255,255,0.65)',
            cursorWidth: 2,
            barWidth: 3,
            barRadius: 4,
            height: HEIGHT,
            barGap: 2,
            normalize: true,
            dragToSeek: true,
        });

        ws.load(audioUrl);
        ws.setMuted(true);

        ws.on('ready', () => {
            setDur(ws.getDuration());
            cb.current.onReady(ws.getDuration());
        });

        ws.on('timeupdate', (time) => {
            if (!isSeeking.current) cb.current.onTimeUpdate(time);
        });

        ws.on('interaction', (time) => {
            isSeeking.current = true;
            cb.current.onSeek(time);
            setTimeout(() => { isSeeking.current = false; }, 100);
        });

        ws.on('play', () => cb.current.onPlay());
        ws.on('pause', () => cb.current.onPause());

        wavesurferRef.current = ws;

        return () => { ws.destroy(); };
    }, [audioUrl, progressKey]);

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws) return;
        if (isPlaying && !ws.isPlaying()) ws.play();
        else if (!isPlaying && ws.isPlaying()) ws.pause();
    }, [isPlaying]);

    useEffect(() => {
        const ws = wavesurferRef.current;
        if (!ws || isSeeking.current) return;
        if (Math.abs(ws.getCurrentTime() - currentTime) > 0.5) ws.setTime(currentTime);
    }, [currentTime]);

    const markers = (comments || []).filter((c) => c.timestamp != null && dur > 0);

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="w-full overflow-hidden cursor-pointer transition-[filter] duration-500"
                style={{ filter: isPlaying ? 'drop-shadow(0 0 8px rgba(139,92,246,0.35))' : 'none' }}
            />
            {markers.length > 0 && (
                <div className="absolute inset-x-0 -bottom-1 h-0 pointer-events-none">
                    {markers.map((c) => {
                        const left = Math.min(99, ((c.timestamp || 0) / dur) * 100);
                        const name = c.user?.nickname || c.user?.firstName || '?';
                        const avatar = resolveAssetUrl(c.user?.avatar);
                        return (
                            <div
                                key={c.id}
                                className="absolute pointer-events-auto -translate-x-1/2"
                                style={{ left: `${left}%`, bottom: 0 }}
                                onMouseEnter={() => setHovered(c.id)}
                                onMouseLeave={() => setHovered((h) => (h === c.id ? null : h))}
                                onClick={() => onSeek(c.timestamp || 0)}
                            >
                                <div className="w-5 h-5 rounded-full ring-2 ring-violet-400/80 overflow-hidden bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[9px] font-bold cursor-pointer hover:scale-125 transition">
                                    {avatar
                                        ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                                        : name[0]?.toUpperCase()}
                                </div>
                                {hovered === c.id && (
                                    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 w-max max-w-[220px] px-3 py-2 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] shadow-2xl">
                                        <p className="text-[11px] font-semibold text-violet-300">{name}</p>
                                        <p className="text-xs text-white/90 leading-snug whitespace-normal break-words">{c.text}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
