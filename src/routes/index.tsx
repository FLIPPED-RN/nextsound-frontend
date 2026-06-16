import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { DiscoverPage } from '../pages/DiscoverPage';
import { TrackPage } from '../pages/TrackPage';
import { UploadPage } from '../pages/UploadPage';
import { ArtistPage } from '../pages/ArtistPage';
import { SearchPage } from '../pages/SearchPage';
import { LikedPage } from '../pages/LikedPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { TermsPage } from '../pages/TermsPage';
import { RecommendationsPage } from '../pages/RecommendationsPage';
import { useAuthStore } from '../store/auth.store';
import { PlaylistPage } from '@/pages/PlaylistPage';
import { AdminPage } from '../pages/AdminPage';
import { AlbumPage } from '../pages/AlbumPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/privacy" element={<PrivacyPage />} />
    <Route path="/terms" element={<TermsPage />} />
    <Route path="/recommendations" element={<RecommendationsPage />} />
    <Route path="/" element={<MainLayout />}>
      <Route index element={<DiscoverPage />} />
      <Route path="discover" element={<DiscoverPage />} />
      <Route path="track/:id" element={<TrackPage />} />
      <Route path="album/:id" element={<AlbumPage />} />
      <Route path="artist/:id" element={<ArtistPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="liked" element={<ProtectedRoute><LikedPage /></ProtectedRoute>} />
      <Route path="playlists" element={<PlaylistPage />} />
      <Route path="playlists/:id" element={<PlaylistPage />} />
      <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
    </Route>
  </Routes>
);