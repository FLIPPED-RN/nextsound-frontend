import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Music, ImageIcon, X, Check, Lock, Globe, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { tracksApi } from '../api/tracks.api';
import { useAuthStore } from '../store/auth.store';

type Visibility = 'public' | 'private' | 'link';

const GENRES = ['Хип-хоп', 'Рэп', 'Поп', 'Рок', 'Электроника', 'Хаус', 'Техно', 'R&B', 'Джаз', 'Фонк', 'Лоу-фай', 'Инди', 'Метал', 'Классика', 'Транс', 'Дрилл'];

export const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [publishNow, setPublishNow] = useState(true);
  const [releaseDate, setReleaseDate] = useState('');

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDropAudio = useCallback((files: File[]) => {
    if (files[0]) setAudioFile(files[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAudio,
    accept: { 'audio/*': ['.mp3', '.wav', '.flac'] },
    maxFiles: 1,
  });

  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) { toast.error('Добавьте аудиофайл'); return; }
    if (!title.trim()) { toast.error('Введите название трека'); return; }
    setUploading(true);
    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description);
    form.append('genre', genre);
    if (bpm) form.append('bpm', bpm);
    form.append('visibility', visibility);
    if (!publishNow && releaseDate) form.append('release_date', releaseDate);
    form.append('file', audioFile);
    if (coverFile) form.append('cover', coverFile);
    try {
      const res = await tracksApi.create(form);
      toast.success('Трек загружен!');
      navigate(`/track/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const visOptions: { v: Visibility; label: string; desc: string; icon: React.ReactNode }[] = [
    { v: 'public', label: 'Публичный', desc: 'Виден всем', icon: <Globe size={16} /> },
    { v: 'private', label: 'Приватный', desc: 'Только вы', icon: <Lock size={16} /> },
    { v: 'link', label: 'Ссылка', desc: 'По прямой ссылке', icon: <Link2 size={16} /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-widest text-[#666] uppercase mb-1">Панель артиста</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">ЗАГРУЗИТЬ ТРЕК</h1>
        </div>
        <span className="text-xs text-[#888] bg-[#151515] px-3 py-1.5 rounded-full">Поддерживаются: MP3, WAV, FLAC</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-5">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 md:p-14 text-center cursor-pointer transition ${isDragActive ? 'border-white bg-white/5' : 'border-[#2a2a2a] hover:border-[#444] bg-[#0e0e0e]'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={40} className="mx-auto text-[#888]" />
            <p className="mt-3 font-medium">Перетащите файл сюда</p>
            <p className="text-sm text-[#888]">или <span className="text-white underline">загрузите</span> с вашего компьютера</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-xs text-[#666]">
              <span className="bg-[#151515] px-2.5 py-1 rounded-full">MP3</span>
              <span className="bg-[#151515] px-2.5 py-1 rounded-full">WAV</span>
              <span className="bg-[#151515] px-2.5 py-1 rounded-full">FLAC</span>
              <span className="bg-[#151515] px-2.5 py-1 rounded-full">Макс. 100 МБ</span>
            </div>
          </div>

          {audioFile && (
            <div className="flex items-center gap-3 bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-3">
              <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <Music size={18} className="text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{audioFile.name}</p>
                <div className="h-1.5 bg-[#222] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full w-full" />
                </div>
              </div>
              <span className="text-xs text-[#888] shrink-0">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</span>
              <span className="inline-flex items-center gap-1 text-xs text-green-400 shrink-0"><Check size={14} /> Готово</span>
              <button type="button" onClick={() => setAudioFile(null)} className="text-[#666] hover:text-white shrink-0"><X size={16} /></button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Название трека">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Полночь" className="ns-input" />
            </Field>
            <Field label="Артист">
              <input value={user?.nickname || user?.firstName || ''} readOnly className="ns-input opacity-70 cursor-not-allowed" />
            </Field>
            <Field label="Жанр">
              <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Например, хип-хоп" className="ns-input" />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className={`text-xs px-2.5 py-1 rounded-full transition ${genre === g ? 'bg-white text-black' : 'bg-[#151515] text-[#aaa] hover:bg-[#222]'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Темп">
              <input value={bpm} onChange={(e) => setBpm(e.target.value.replace(/\D/g, ''))} placeholder="напр. 128" className="ns-input" />
            </Field>
          </div>
          <Field label="Описание">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Расскажите о треке..." className="ns-input resize-none h-24" />
          </Field>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-widest text-[#666] uppercase mb-3">Обложка</p>
            <label className="relative block aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-[#2a2a2a] hover:border-[#444] cursor-pointer group bg-[#0e0e0e]">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-sm font-medium">
                    <ImageIcon size={16} className="mr-2" /> Изменить обложку
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#888]">
                  <ImageIcon size={28} />
                  <span className="text-sm mt-2">Изменить обложку</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
            <p className="text-xs text-[#666] mt-2">JPG, PNG или WEBP. Мин. 800×800</p>
          </div>

          <div>
            <p className="text-xs tracking-widest text-[#666] uppercase mb-3">Доступ</p>
            <div className="space-y-2">
              {visOptions.map((o) => (
                <button
                  type="button"
                  key={o.v}
                  onClick={() => setVisibility(o.v)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${visibility === o.v ? 'border-white bg-white/5' : 'border-[#1f1f1f] hover:border-[#333]'}`}
                >
                  <span className="text-[#aaa]">{o.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">{o.label}</span>
                    <span className="block text-xs text-[#666]">{o.desc}</span>
                  </span>
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${visibility === o.v ? 'border-white' : 'border-[#444]'}`}>
                    {visibility === o.v && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-widest text-[#666] uppercase mb-3">Дата релиза</p>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#1f1f1f]">
              <span className="text-sm">Опубликовать сейчас</span>
              <button type="button" onClick={() => setPublishNow((p) => !p)} className={`w-11 h-6 rounded-full p-0.5 transition ${publishNow ? 'bg-white' : 'bg-[#333]'}`}>
                <span className={`block w-5 h-5 rounded-full transition ${publishNow ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`} />
              </button>
            </div>
            {!publishNow && (
              <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="ns-input mt-2" />
            )}
          </div>

          <button type="submit" disabled={uploading} className="w-full py-3 rounded-full bg-white text-black font-semibold disabled:opacity-50 hover:opacity-90 transition">
            {uploading ? 'Загрузка...' : 'Опубликовать трек'}
          </button>
        </div>
      </div>
    </form>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block text-xs tracking-widest text-[#666] uppercase mb-2">{label}</span>
    {children}
  </label>
);
