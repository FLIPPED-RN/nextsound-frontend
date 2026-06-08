import { BadgeCheck } from 'lucide-react';

export const VerifiedBadge = ({ verified, size = 14, className = '' }: { verified?: boolean; size?: number; className?: string }) => {
  if (!verified) return null;
  return <BadgeCheck size={size} className={`text-blue-400 inline-block shrink-0 ${className}`} aria-label="Подтверждённый артист" />;
};
