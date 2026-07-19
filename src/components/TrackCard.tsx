
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { usePlayerStore } from '../store/player.store';
import { resolveAssetUrl } from '@/lib/utils';
import { ScrollingText } from './ScrollingText';
import { VerifiedBadge } from './VerifiedBadge';
import { ArtistLink } from './ArtistLink';
import type { Track } from '@/types';

export const TrackCard = ({ track }: { track: Track }) => {
  const navigate = useNavigate();
  const { setTrack, queue } = usePlayerStore();

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrack(track, queue);
  };

  return (
    <div
      onClick={() => navigate(`/track/${track.id}`)}
      className="group bg-[#151515] rounded-2xl p-3 hover:bg-[#1f1f1f] transition cursor-pointer space-y-3"
    >
      <div className="relative">
        <img
          src={resolveAssetUrl(track.cover_path) || '/default-cover.png'}
          alt={track.title}
          onError={(e) => { (e.target as HTMLImageElement).src = '/default-cover.png'; }}
          className="w-full aspect-square object-cover rounded-xl bg-[#151515]"
        />
        <button
          onClick={handlePlay}
          className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl cursor-pointer"
        >
          <Play size={18} className="ml-0.5 cursor-pointer" />
        </button>
      </div>
      <div>
        <ScrollingText text={track.title} className="font-semibold" />
        <p className="text-sm text-[#888888] truncate flex items-center gap-1">
          <ArtistLink user={track.user} id={track.userId} className="truncate" />{track.featuring ? ` feat. ${track.featuring}` : ''}
          <VerifiedBadge verified={track.user?.isArtistVerified} size={13} />
        </p>
        <p className="text-xs text-[#888888] mt-1">{track.plays_count} прослушиваний</p>
      </div>
    </div>
  );
};