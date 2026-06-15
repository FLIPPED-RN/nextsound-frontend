import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Heart, Share2, Repeat2, Plus, ChevronLeft,
  MoreHorizontal, MessageCircle, Pencil, Trash2, X, Download, Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { tracksApi } from '../api/tracks.api';
import { commentsApi } from '../api/comments.api';
import { playlistsApi } from '../api/playlists.api';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { Waveform } from '../components/Waveform';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { TrackCard } from '../components/TrackCard';
import { resolveAssetUrl, formatCount, formatTime, formatDate, timeAgo, getImageAccent, buildWaveGradient } from '@/lib/utils';
import type { Comment, Track } from '@/types';

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-[#8a8a8a]">
    {icon}
    <span className="text-white font-medium">{value}</span>
    <span className="hidden sm:inline">{label}</span>
  </span>
);

const CommentRow = ({ c, replies, canReply, onLike, onReply, onSeekTo }: {
  c: Comment;
  replies?: Comment[];
  canReply?: boolean;
  onLike: (id: number) => void;
  onReply: (parentId: number, text: string) => Promise<void>;
  onSeekTo?: (t: number) => void;
}) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const name = c.user?.nickname || c.user?.firstName || 'User';
  const avatar = resolveAssetUrl(c.user?.avatar);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try { await onReply(c.id, replyText.trim()); setReplyText(''); setShowReply(false); }
    finally { setSending(false); }
  };

  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold">{name}</span>
          <VerifiedBadge verified={c.user?.isArtistVerified} size={13} />
          <span className="text-xs text-[#666] ml-1">{timeAgo(c.created_at)}</span>
          {c.timestamp != null && (
            <button
              onClick={() => onSeekTo?.(c.timestamp || 0)}
              className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition"
            >
              <Play size={9} className="fill-violet-300" /> {formatTime(c.timestamp)}
            </button>
          )}
        </div>
        <p className="text-sm text-[#c9c9c9] mt-1 break-words">{c.text}</p>

        <div className="flex items-center gap-4 mt-1.5 text-xs">
          <button onClick={() => onLike(c.id)} className={`inline-flex items-center gap-1 transition ${c.likedByMe ? 'text-red-400' : 'text-[#777] hover:text-white'}`}>
            <Heart size={13} className={c.likedByMe ? 'fill-red-500 text-red-500' : ''} /> {c.likesCount || 0}
          </button>
          {canReply && (
            <button onClick={() => setShowReply((s) => !s)} className="text-[#777] hover:text-white transition">Ответить</button>
          )}
        </div>

        {showReply && (
          <form onSubmit={submit} className="flex items-center gap-2 mt-2">
            <input
              autoFocus
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Ваш ответ..."
              className="flex-1 bg-[#151515] rounded-full px-3 py-1.5 text-sm outline-none"
            />
            <button type="submit" disabled={sending} className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-semibold disabled:opacity-60">Отправить</button>
          </form>
        )}

        {!!replies?.length && (
          <div className="mt-3 space-y-3 border-l border-[#1f1f1f] pl-3">
            {replies.map((r) => (
              <CommentRow key={r.id} c={r} onLike={onLike} onReply={onReply} canReply={false} />
            ))}
          </div>
        )}
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
  const { data: similar } = useQuery({
    queryKey: ['similar', trackId],
    queryFn: () => tracksApi.getSimilar(trackId).then((r) => r.data),
  });

  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { currentTrack, isPlaying, progress, duration, setTrack, togglePlay, seekTo, queue } = usePlayerStore();

  const [commentText, setCommentText] = useState('');
  const [attachTime, setAttachTime] = useState(false);
  const [waveGradient, setWaveGradient] = useState<string[] | undefined>(undefined);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [repostCount, setRepostCount] = useState(0);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setLikeCount(likeData?.count ?? 0); setLiked(likeData?.liked ?? false); }, [likeData]);

  useEffect(() => {
    const url = resolveAssetUrl(track?.cover_path);
    if (!url) { setWaveGradient(undefined); return; }
    let alive = true;
    getImageAccent(url).then((rgb) => { if (alive && rgb) setWaveGradient(buildWaveGradient(rgb)); });
    return () => { alive = false; };
  }, [track?.cover_path]);

  const { data: repostData } = useQuery({
    queryKey: ['track-repost', trackId],
    queryFn: () => tracksApi.getRepostInfo(trackId).then((r) => r.data),
  });
  useEffect(() => { if (repostData) { setReposted(repostData.reposted); setRepostCount(repostData.count); } }, [repostData]);

  const handleRepost = async () => {
    if (!user) { toast.error('Войдите, чтобы делать репост'); return; }
    const was = reposted;
    setReposted(!was);
    setRepostCount((c) => c + (was ? -1 : 1));
    try { await tracksApi.toggleRepost(trackId); }
    catch { setReposted(was); setRepostCount((c) => c + (was ? 1 : -1)); }
  };

  const likeComment = async (commentId: number) => {
    if (!user) { toast.error('Войдите, чтобы лайкать'); return; }
    try { await commentsApi.like(trackId, commentId); refetchComments(); }
    catch { toast.error('Не удалось'); }
  };

  const replyComment = async (parentId: number, text: string) => {
    if (!user) { toast.error('Войдите, чтобы отвечать'); return; }
    await commentsApi.create(trackId, text, parentId);
    refetchComments();
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowPlaylists(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) setShowMenu(false);
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
  const downloadUrl = `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/tracks/${track.id}/download`;
  const artistName = track.user?.nickname || track.user?.firstName || 'Unknown';
  const year = new Date(track.release_date || track.created_at).getFullYear();
  const trackDuration = isActive && duration ? duration : 0;
  const isOwner = !!user && user.id === track.userId;

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

  const handleDelete = async () => {
    try {
      await tracksApi.delete(track.id);
      toast.success('Трек удалён');
      qc.invalidateQueries({ queryKey: ['tracks'] });
      qc.invalidateQueries({ queryKey: ['artistTracks', track.userId] });
      navigate(`/artist/${track.userId}`);
    } catch {
      toast.error('Не удалось удалить трек');
    }
  };

  const handleSaved = (updated: Track) => {
    qc.setQueryData(['track', trackId], updated);
    qc.invalidateQueries({ queryKey: ['tracks'] });
    setEditing(false);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) { toast.error('Войдите, чтобы комментировать'); return; }
    const at = currentTrack?.id === track?.id ? progress : 0;
    await commentsApi.create(trackId, commentText.trim(), undefined, attachTime ? Math.floor(at) : undefined);
    setCommentText('');
    setAttachTime(false);
    refetchComments();
  };

  const tags = (track.genre || '').split(/[\s,/]+/).filter(Boolean).slice(0, 4);
  const commentsCount = comments?.length ?? 0;
  const topLevel = (comments || []).filter((c) => !c.parentId).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  const repliesOf = (id: number) => (comments || []).filter((c) => c.parentId === id).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const visibleTop = showAll ? topLevel : topLevel.slice(0, 5);

  return (
    <div className="px-4 md:px-8 py-4 md:py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full border border-[#242424] flex items-center justify-center hover:border-white/50 transition shrink-0">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[#8a8a8a] truncate ml-2">{track.genre || 'Музыка'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleShare} className="px-4 py-1.5 rounded-full border border-[#242424] text-sm flex items-center gap-2 hover:border-white/50 transition">
            <Share2 size={14} /> <span className="hidden sm:inline">Поделиться</span>
          </button>
          <div className="relative" ref={actionsRef}>
            <button onClick={() => setShowMenu((s) => !s)} className="w-9 h-9 rounded-full border border-[#242424] flex items-center justify-center hover:border-white/50 transition">
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl bg-[#1a1a1a] border border-[#242424] shadow-2xl p-1">
                <button onClick={handleShare} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition flex items-center gap-2">
                  <Share2 size={15} /> Поделиться
                </button>
                {isOwner ? (
                  <>
                    <button onClick={() => { setShowMenu(false); setEditing(true); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition flex items-center gap-2">
                      <Pencil size={15} /> Редактировать
                    </button>
                    <button onClick={() => { setShowMenu(false); setConfirmDelete(true); }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition flex items-center gap-2">
                      <Trash2 size={15} /> Удалить
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setShowMenu(false); if (!user) { toast.error('Войдите, чтобы пожаловаться'); return; } setReportOpen(true); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                  >
                    <Flag size={15} /> Пожаловаться
                  </button>
                )}
              </div>
            )}
          </div>
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
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[11px] font-bold overflow-hidden shrink-0">
              {track.user?.avatar
                ? <img src={resolveAssetUrl(track.user.avatar)} alt="" className="w-full h-full object-cover" />
                : artistName[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium group-hover:underline">{artistName}</span>
            <VerifiedBadge verified={track.user?.isArtistVerified} />
            {track.featuring && <span className="text-sm text-[#888]">feat. {track.featuring}</span>}
            <span className="text-sm text-[#666]">·</span>
            <span className="text-sm text-[#666]">{year}</span>
          </button>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">
            <Stat icon={<Play size={14} />} value={formatCount(track.plays_count)} label="прослушиваний" />
            <Stat icon={<Heart size={14} />} value={formatCount(likeCount)} label="лайков" />
            <Stat icon={<MessageCircle size={14} />} value={formatCount(commentsCount)} label="комментария" />
            <Stat icon={<Repeat2 size={14} />} value={formatCount(repostCount)} label="репостов" />
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
            <button onClick={handleRepost} className={`px-5 py-2.5 rounded-full border text-sm font-medium flex items-center gap-2 transition ${reposted ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-[#242424] hover:border-white/50'}`}>
              <Repeat2 size={16} /> {reposted ? 'Репостнуто' : 'Репост'}
            </button>
            <a href={downloadUrl} className="px-5 py-2.5 rounded-full border border-[#242424] text-sm font-medium flex items-center gap-2 hover:border-white/50 transition">
              <Download size={16} /> Скачать
            </a>
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
            progressGradient={waveGradient}
            comments={comments}
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

        <form onSubmit={handleComment} className="flex items-start gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
            {(user?.firstName?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-[#151515] rounded-full pr-2 focus-within:ring-1 ring-white/20">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={attachTime ? `Комментарий к ${formatTime(currentTrack?.id === track.id ? progress : 0)}...` : 'Напишите комментарий...'}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
              />
              <button type="submit" className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:opacity-90 transition">
                Отправить
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAttachTime((s) => !s)}
              className={`mt-2 inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition ${attachTime ? 'border-violet-500/60 bg-violet-500/10 text-violet-300' : 'border-[#242424] text-[#888] hover:border-white/40'}`}
            >
              <MessageCircle size={12} />
              {attachTime ? `Привязано к ${formatTime(currentTrack?.id === track.id ? progress : 0)}` : 'Привязать к моменту трека'}
            </button>
          </div>
        </form>

        <div className="space-y-5">
          {visibleTop.map((c) => (
            <CommentRow
              key={c.id}
              c={c}
              replies={repliesOf(c.id)}
              canReply
              onLike={likeComment}
              onReply={replyComment}
              onSeekTo={(t) => { if (!isActive) setTrack(track, queue.length ? queue : [track]); seekTo(t); }}
            />
          ))}
          {!topLevel.length && <p className="text-sm text-[#666]">Пока нет комментариев. Будьте первым!</p>}
        </div>

        {topLevel.length > 5 && !showAll && (
          <div className="flex justify-center mt-6">
            <button onClick={() => setShowAll(true)} className="px-5 py-2 rounded-full bg-[#151515] text-sm text-[#aaa] hover:bg-[#1f1f1f] transition">
              Показать ещё
            </button>
          </div>
        )}
      </div>

      {!!similar?.length && (
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-5">Похожие треки</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similar.slice(0, 10).map((t) => (
              <TrackCard key={t.id} track={t} />
            ))}
          </div>
        </div>
      )}

      {reportOpen && <ReportModal trackId={track.id} onClose={() => setReportOpen(false)} />}
      {editing && <EditTrackModal track={track} onClose={() => setEditing(false)} onSaved={handleSaved} />}
      {confirmDelete && (
        <ConfirmModal
          title="Удалить трек?"
          text={`«${track.title}» будет удалён безвозвратно вместе с лайками и комментариями.`}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { setConfirmDelete(false); handleDelete(); }}
        />
      )}
    </div>
  );
};

const EditTrackModal = ({ track, onClose, onSaved }: { track: Track; onClose: () => void; onSaved: (t: Track) => void }) => {
  const [form, setForm] = useState({
    title: track.title || '',
    description: track.description || '',
    genre: track.genre || '',
    featuring: track.featuring || '',
    bpm: track.bpm ? String(track.bpm) : '',
    visibility: track.visibility || 'public',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Введите название'); return; }
    setSaving(true);
    try {
      const res = await tracksApi.update(track.id, {
        title: form.title.trim(),
        description: form.description,
        genre: form.genre,
        featuring: form.featuring.trim(),
        bpm: form.bpm ? Number(form.bpm) : 0,
        visibility: form.visibility as Track['visibility'],
      });
      toast.success('Трек обновлён');
      onSaved(res.data);
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save} className="w-full max-w-md bg-[#111] border border-[#242424] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Редактировать трек</h3>
          <button type="button" onClick={onClose} className="text-[#666] hover:text-white transition"><X size={18} /></button>
        </div>
        <label className="block">
          <span className="block text-xs tracking-widest text-[#666] uppercase mb-2">Название</span>
          <input className="ns-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="block">
          <span className="block text-xs tracking-widest text-[#666] uppercase mb-2">Совместно с (фит)</span>
          <input className="ns-input" value={form.featuring} onChange={(e) => setForm({ ...form, featuring: e.target.value })} placeholder="Например, Markul" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs tracking-widest text-[#666] uppercase mb-2">Жанр</span>
            <input className="ns-input" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
          </label>
          <label className="block">
            <span className="block text-xs tracking-widest text-[#666] uppercase mb-2">Темп</span>
            <input className="ns-input" value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value.replace(/\D/g, '') })} />
          </label>
        </div>
        <label className="block">
          <span className="block text-xs tracking-widest text-[#666] uppercase mb-2">Доступ</span>
          <select className="ns-input" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as Track['visibility'] })}>
            <option value="public">Публичный</option>
            <option value="private">Приватный</option>
            <option value="link">По ссылке</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs tracking-widest text-[#666] uppercase mb-2">Описание</span>
          <textarea className="ns-input resize-none h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm text-[#aaa] hover:text-white transition">Отмена</button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-black hover:opacity-90 transition disabled:opacity-60">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

const REPORT_REASONS = ['Нарушение авторских прав', 'Оскорбления / разжигание ненависти', 'Спам или мошенничество', 'Контент для взрослых', 'Другое'];

const ReportModal = ({ trackId, onClose }: { trackId: number; onClose: () => void }) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const text = details.trim() ? `${reason}: ${details.trim()}` : reason;
      await tracksApi.report(trackId, text);
      toast.success('Жалоба отправлена. Спасибо!');
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Не удалось отправить');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-[#111] border border-[#242424] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2"><Flag size={18} className="text-red-400" /> Пожаловаться на трек</h3>
          <button type="button" onClick={onClose} className="text-[#666] hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-violet-500" />
              {r}
            </label>
          ))}
        </div>
        <textarea className="ns-input resize-none h-20" placeholder="Подробности (необязательно)" value={details} onChange={(e) => setDetails(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm text-[#aaa] hover:text-white transition">Отмена</button>
          <button type="submit" disabled={sending} className="px-5 py-2 rounded-full text-sm font-semibold bg-red-500 hover:bg-red-400 transition disabled:opacity-60">
            {sending ? 'Отправка...' : 'Отправить жалобу'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ConfirmModal = ({ title, text, onCancel, onConfirm }: { title: string; text: string; onCancel: () => void; onConfirm: () => void }) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[#111] border border-[#242424] rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-[#aaa]">{text}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-full text-sm text-[#aaa] hover:text-white transition">Отмена</button>
        <button onClick={onConfirm} className="px-5 py-2 rounded-full text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition">Удалить</button>
      </div>
    </div>
  </div>
);

const InfoRow = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="text-[#777]">{k}</dt>
    <dd className="text-white text-right">{v}</dd>
  </div>
);
