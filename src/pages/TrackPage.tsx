// src/pages/TrackPage.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tracksApi } from '../api/tracks.api';
import { commentsApi } from '../api/comments.api';
import { usePlayerStore } from '../store/player.store';
import { useAuthStore } from '../store/auth.store';
import { Play, Heart, Share2 } from 'lucide-react';
import { useState } from 'react';

export const TrackPage = () => {
  const { id } = useParams<{ id: string }>();
  const trackId = Number(id);
  const { data: track } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => tracksApi.getOne(trackId).then((r) => r.data),
  });
  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['comments', trackId],
    queryFn: () => commentsApi.getByTrack(trackId).then((r) => r.data),
  });
  const [commentText, setCommentText] = useState('');
  const { user } = useAuthStore();
  const { setTrack, queue } = usePlayerStore();
  const [liked, setLiked] = useState(false);

  const handlePlay = () => track && setTrack(track, queue);
  const handleLike = async () => {
    if (!track || !user) return;
    await tracksApi.toggleLike(track.id);
    setLiked(!liked);
  };
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await commentsApi.create(trackId, commentText);
    setCommentText('');
    refetchComments();
  };

  if (!track) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <img
          src={track.cover_path || '/default-cover.png'}
          alt={track.title}
          className="w-64 h-64 rounded-2xl object-cover shadow-2xl"
        />
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">{track.title}</h1>
          <p className="text-lg text-[#888888]">
            {track.user?.nickname || track.user?.firstName}
          </p>
          <p className="text-sm text-[#888888]">{track.plays_count} plays</p>
          <div className="flex gap-3">
            <button onClick={handlePlay} className="bg-white text-black px-6 py-2.5 rounded-full font-semibold flex items-center gap-2">
              <Play size={18} /> Play
            </button>
            <button onClick={handleLike} className="p-2.5 border border-[#242424] rounded-full">
              <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : ''} />
            </button>
            <button className="p-2.5 border border-[#242424] rounded-full">
              <Share2 size={18} />
            </button>
          </div>
          {track.description && <p className="text-sm text-[#888888]">{track.description}</p>}
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Comments</h3>
        {user && (
          <form onSubmit={handleComment} className="flex gap-3">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2 bg-[#151515] rounded-xl text-white outline-none"
            />
            <button type="submit" className="bg-white text-black px-4 py-2 rounded-full font-semibold">
              Post
            </button>
          </form>
        )}
        <div className="space-y-3">
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                {c.user?.firstName?.[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{c.user?.nickname || c.user?.firstName}</p>
                <p className="text-sm text-[#888888]">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};