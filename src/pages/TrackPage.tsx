import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Heart, Share2, Repeat2, Plus, ChevronLeft, ChevronRight,
  MoreHorizontal, MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tracksApi } from '../api/tracks.api';
import { commentsApi } from '../api/comments.api';
import { playlistsApi } from '../api/playlists.api';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { Waveform } from '../components/Waveform';
import { resolveAssetUrl, formatCount, formatTime, formatDate, timeAgo } from '@/lib/utils';
import type { Comment } from '@/types';

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-[#8a8a8a]">
    {icon}
    <span className="text-white font-medium">{value}</span>
    <span className="hidden sm:inline">{label}</span>
  </span>
);

const CommentRow = ({ c, nested }: { c: Comment; nested?: boolean }) => {
  const name = c.user?.nickname || c.user?.firstName || 'User';
  const isArtist = c.user?.role === 'artist';
  return (
    <div className={`flex gap-3 ${nested ? 'ml-11 mt-3' : ''}`}>
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
        {name[0]?.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">{name}</span>
          {isArtist && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-medium">
              Артист
            </span>
          )}
          <span className="text-xs text-[#666]">{timeAgo(c.created_at)}</span>
        </div>
        <p className="text-sm text-[#c9c9c9] mt-1 break-words">{c.text}</p>
      </div>
    </div>
  );
};

export const TrackPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const trackId = Number(id);

  const { data: track } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => tracksApi.getOne(trackId).then((r) => r.data),
  });
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['comments', trackId],
    queryFn: () => commentsApi.getByTrack(trackId).then((r) => r.data),
  });
  const { data: likeData } = useQuery({
    queryKey: ['track-likes', trackId],
    queryFn: () => tracksApi.getLikes(trackId).then((r) => r.data),
  });

  const { user } = useAuthStore();
  const { currentTrack, isPlaying, progress, duration, setTrack, togglePlay, seekTo, queue } = usePlayerStore();

  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLikeCount(likeData?.count ?? 0); setLiked((likeData?.count ?? 0) > 0); }, [likeData]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowPlaylists(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const { data: myPlaylists } = useQuery({
    queryKey: ['my-playlists'],
    queryFn: () => playlistsApi.getMy().then((r) => r.data),
    enabled: !!user && showPlaylists,
  });

  if (!track) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="flex gap-6">
          <div className="w-52 h-52 rounded-2xl bg-[#151515]" />
          <div className="flex-1 space-y-4 pt-4">
            <div className="h-10 w-2/3 bg-[#151515] rounded" />
            <div className="h-4 w-1/3 bg-[#151515] rounded" />
          </div>
        </div>
        <div className="h-24 bg-[#151515] rounded-2xl" />
      </div>
    );
  }

  const isActive = currentTrack?.id === track.id;
  const isThisPlaying = isActive && isPlaying;
  const audioUrl = resolveAssetUrl(track.file_path);
  const cover = resolveAssetUrl(track.cover_path);
  const artistName = track.user?.nickname || track.user?.firstName || 'Unknown';
  const year = new Date(track.release_date || track.created_at).getFullYear();
  const trackDuration = isActive && duration ? duration : 0;

  const handlePlay = () => {
    if (isThisPlaying) togglePlay();
    else setTrack(track, queue.length ? queue : [track]);
  };

  const handleLike = async () => {
    if (!user) { toast.error('Войдите, чтобы лайкать'); return; }
    setLiked((p) => !p);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try { await tracksApi.toggleLike(track.id); }
    catch { setLiked((p) => !p); setLikeCount((c) => c + (liked ? 1 : -1)); }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      await playlistsApi.addTrack(playlistId, track.id);
      toast.success('Добавлено в плейлист');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Не удалось добавить');
    }
    setShowPlaylists(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); toast.success('Ссылка скопирована'); }
    catch { toast.error('Не удалось скопировать'); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) { toast.error('Войдите, чтобы комментировать'); return; }
    await commentsApi.create(trackId, commentText.trim());
    setCommentText('');
    refetchComments();
  };

  const tags = (track.genre || '').split(/[\s,/]+/).filter(Boolean).slice(0, 4);
  const commentsCount = comments?.length ?? 0;
  const visibleComments = showAll ? comments : comments?.slice(0, 5);

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full border border-[#242424] flex items-center justify-center hover:border-white/50 transition shrink-0">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => navigate(1)} className="w-8 h-8 rounded-full border border-[#242424] flex items-center justify-center hover:border-white/50 transition shrink-0">
            <ChevronRight size={16} />
          </button>
          <span className="text-sm text-[#8a8a8a] truncate ml-2">{track.genre || 'Музыка'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleShare} className="px-4 py-1.5 rounded-full border border-[#242424] text-sm flex items-center gap-2 hover:border-white/50 transition">
            <Share2 size={14} /> <span className="hidden sm:inline">Поделиться</span>
          </button>
          <button className="w-9 h-9 rounded-full border border-[#242424] flex items-center justify-center hover:border-white/50 transition">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <img
          src={cover}
          alt={track.title}
          onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }}
          className="w-full max-w-[280px] md:w-52 md:h-52 aspect-square rounded-2xl object-cover bg-[#151515] shadow-2xl shrink-0 mx-auto md:mx-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] tracking-wider px-2 py-0.5 rounded bg-white/10 text-white/80 uppercase">Сингл</span>
            {track.genre && (
              <span className="text-[10px] tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 uppercase">{track.genre.split(/[\s,/]+/)[0]}</span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight break-words">{track.title}</h1>
          <button onClick={() => navigate(`/artist/${track.userId}`)} className="flex items-center gap-2 mt-4 group">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold">
              {artistName[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium group-hover:underline">{artistName}</span>
            <span className="text-sm text-[#666]">·</span>
            <span className="text-sm text-[#666]">{year}</span>
          </button>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
            <Stat icon={<Play size={14} />} value={formatCount(track.plays_count)} label="прослушиваний" />
            <Stat icon={<Heart size={14} />} value={formatCount(likeCount)} label="лайков" />
            <Stat icon={<MessageCircle size={14} />} value={formatCount(commentsCount)} label="комментария" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button onClick={handlePlay} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shrink-0">
              {isThisPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <button onClick={handleLike} className={`px-5 py-2.5 rounded-full border text-sm font-medium flex items-center gap-2 transition ${liked ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-[#242424] hover:border-white/50'}`}>
              <Heart size={16} className={liked ? 'fill-red-500 text-red-500' : ''} /> Лайк
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => { if (!user) { toast.error('Войдите в аккаунт'); return; } setShowPlaylists((s) => !s); }}
                className="px-5 py-2.5 rounded-full border border-[#242424] text-sm font-medium flex items-center gap-2 hover:border-white/50 transition"
              >
                <Plus size={16} /> Добавить в плейлист
              </button>
              {showPlaylists && (
                <div className="absolute z-20 mt-2 w-56 max-h-64 overflow-y-auto rounded-xl bg-[#1a1a1a] border border-[#242424] shadow-2xl p-1">
                  {myPlaylists?.length ? myPlaylists.map((p) => (
                    <button key={p.id} onClick={() => handleAddToPlaylist(p.id)} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition truncate">
                      {p.name}
                    </button>
                  )) : <p className="px-3 py-2 text-sm text-[#666]">Нет плейлистов</p>}
                </div>
              )}
            </div>
            <button onClick={() => setReposted((r) => !r)} className={`px-5 py-2.5 rounded-full border text-sm font-medium flex items-center gap-2 transition ${reposted ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-[#242424] hover:border-white/50'}`}>
              <Repeat2 size={16} /> Репост
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 border-y border-[#1a1a1a] py-5">
        <div className="flex items-center justify-between text-xs text-[#888] mb-2">
          <span>{formatTime(isActive ? progress : 0)}</span>
          <span>{formatTime(trackDuration)}</span>
        </div>
        {audioUrl && (
          <Waveform
            audioUrl={audioUrl}
            isPlaying={isActive && isPlaying}
            currentTime={isActive ? progress : 0}
            onPlay={() => { }}
            onPause={() => { }}
            onReady={() => { }}
            onTimeUpdate={() => { }}
            onSeek={(t) => { if (!isActive) setTrack(track, queue.length ? queue : [track]); seekTo(t); }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-8">
        <div>
          <h3 className="text-xs tracking-widest text-[#666] uppercase mb-3">Описание трека</h3>
          <p className="text-sm text-[#bdbdbd] leading-relaxed whitespace-pre-line">
            {track.description || 'Описание отсутствует.'}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((t) => (
                <span key={t} className="text-xs px-3 py-1 rounded-full bg-[#151515] text-[#9a9a9a]">#{t.toLowerCase()}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xs tracking-widest text-[#666] uppercase mb-3">Информация</h3>
          <dl className="space-y-3 text-sm">
            <InfoRow k="Дата релиза" v={formatDate(track.release_date || track.created_at)} />
            <InfoRow k="Продолжительность" v={trackDuration ? formatTime(trackDuration) : '—'} />
            <InfoRow k="BPM" v={track.bpm ? String(track.bpm) : '—'} />
            <InfoRow k="Жанр" v={track.genre || '—'} />
          </dl>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Комментарии <span className="text-sm text-[#666] font-normal">{commentsCount}</span>
          </h3>
          <span className="text-xs text-[#666]">Сортировка: <span className="text-white">Новые</span></span>
        </div>

        <form onSubmit={handleComment} className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.firstName?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1 flex items-center gap-2 bg-[#151515] rounded-full pr-2 focus-within:ring-1 ring-white/20">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Напишите комментарий..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
            />
            <button type="submit" className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:opacity-90 transition">
              Отправить
            </button>
          </div>
        </form>

        <div className="space-y-5">
          {visibleComments?.map((c) => <CommentRow key={c.id} c={c} />)}
          {!comments?.length && <p className="text-sm text-[#666]">Пока нет комментариев. Будьте первым!</p>}
        </div>

        {comments && comments.length > 5 && !showAll && (
          <div className="flex justify-center mt-6">
            <button onClick={() => setShowAll(true)} className="px-5 py-2 rounded-full bg-[#151515] text-sm text-[#aaa] hover:bg-[#1f1f1f] transition">
              Показать ещё
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-[#777]">{k}</dt>
    <dd className="text-white text-right">{v}</dd>
  </div>
);
