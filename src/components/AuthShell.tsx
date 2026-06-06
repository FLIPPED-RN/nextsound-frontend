import { motion } from 'framer-motion';
import poster from '@/assets/nextsound-form.png';
import logo from '/NextSoundLogo.png';

const features = [
  'Загружай треки и собирай аудиторию',
  'Создавай плейлисты под любое настроение',
  'Лайкай, комментируй и делись музыкой',
];

/** Animated equalizer bars for visual flavor. */
const Equalizer = () => (
  <div className="flex items-end gap-1 h-10">
    {Array.from({ length: 28 }).map((_, i) => (
      <motion.span
        key={i}
        className="w-1 rounded-full bg-white/70"
        initial={{ height: 6 }}
        animate={{ height: [6, 10 + ((i * 7) % 32), 6] }}
        transition={{ duration: 1 + (i % 5) * 0.18, repeat: Infinity, ease: 'easeInOut', delay: (i % 7) * 0.1 }}
      />
    ))}
  </div>
);

export const AuthShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen w-full bg-[#050505] text-white flex">
    {/* Visual side */}
    <div className="hidden lg:flex relative w-[45%] xl:w-1/2 overflow-hidden">
      <img src={poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/70 to-violet-900/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        <div className="flex items-center gap-2">
          <img src={logo} alt="NextSound" className="w-10 h-10" />
          <span className="text-xl font-bold">NextSound</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight">
            Слушай.<br />Создавай.<br /><span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">Делись.</span>
          </h2>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> {f}
              </li>
            ))}
          </ul>
          <Equalizer />
        </motion.div>
      </div>
    </div>

    {/* Form side */}
    <div className="flex-1 flex items-center justify-center p-6 relative">
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 70% 20%, rgba(124,58,237,0.12), transparent 40%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.1), transparent 40%)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
          <img src={logo} alt="NextSound" className="w-10 h-10" />
          <span className="text-xl font-bold">NextSound</span>
        </div>
        {children}
      </motion.div>
    </div>
  </div>
);

export const AuthInput = ({
  icon, rightSlot, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode; rightSlot?: React.ReactNode }) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]">{icon}</span>
    <input
      {...props}
      className="w-full pl-11 pr-11 py-3 bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl text-sm text-white outline-none transition focus:border-violet-500/60 placeholder:text-[#555]"
    />
    {rightSlot && <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</span>}
  </div>
);
