import { Sidebar } from '@/components/Sidebar';
import { usePlayerStore } from '../store/player.store';
import { Outlet } from 'react-router';
import { Player } from '@/components/Player';
import { MobileNavbar } from '@/components/MobileNavbar';
import { MobileHeader } from '@/components/MobileHeader';

export const MainLayout = () => {
  const currentTrack = usePlayerStore(
    (s) => s.currentTrack
  );

  const isPlayerExpanded = usePlayerStore(
    (s) => s.isPlayerExpanded
  );

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <aside
        className={`
          hidden md:flex
          w-64 flex-col fixed inset-y-0 z-30
          ${currentTrack ? 'pb-20' : 'pb-0'}
        `}
      >
        <Sidebar />
      </aside>

      <main
        className={`
          flex-1 md:pl-64 overflow-y-auto
          ${
            currentTrack
              ? 'pb-44 md:pb-24'
              : 'pb-20'
          }
        `}
      >
        <MobileHeader />
        <Outlet />
      </main>

      {currentTrack && (
        <div
          className="
            fixed left-0 right-0
            bottom-16 md:bottom-0
            z-40
            h-20
            bg-[#111111]
            border-t border-[#242424]
          "
        >
          <Player />
        </div>
      )}

      <nav
        className={`
          md:hidden fixed bottom-0 left-0 right-0
          z-50 h-16
          bg-[#111111]
          border-t border-[#242424]
          transition-all duration-300
          ${
            isPlayerExpanded
              ? 'translate-y-full opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          }
        `}
      >
        <MobileNavbar />
      </nav>
    </div>
  );
};