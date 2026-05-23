import { Sidebar } from '@/components/Sidebar';
import { usePlayerStore } from '../store/player.store';
import { Outlet } from 'react-router';
import { Player } from '@/components/Player';
import { MobileNavbar } from '@/components/MobileNavbar';

export const MainLayout = () => {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex w-64 flex-col fixed inset-y-0 z-30 ${
          currentTrack ? 'pb-20' : 'pb-0'
        }`}
      >
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className={`flex-1 md:pl-64 overflow-y-auto ${currentTrack ? 'pb-32' : 'pb-0'}`}>
        <Outlet />
      </main>

      {/* Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-40 h-24 md:h-20 bg-[#111111] border-t border-[#242424]">
          <Player />
        </div>
      )}

      {/* Mobile Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-[#111111] border-t border-[#242424]">
        <MobileNavbar />
      </nav>
    </div>
  );
};