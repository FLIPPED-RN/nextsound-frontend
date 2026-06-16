import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Music, ImageIcon, X, Check, Lock, Globe, Link2, Disc3, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { tracksApi } from '../api/tracks.api';
import { albumsApi } from '../api/albums.api';
import { useAuthStore } from '../store/auth.store';

type Visibility = 'public' | 'private' | 'link';
type Mode = 'single' | 'album';

const GENRES = ['Хип-хоп', 'Рэп', 'Поп', 'Рок', 'Электроника', 'Хаус', 'Техно', 'R&B', 'Джаз', 'Фонк', 'Лоу-фай', 'Инди', 'Метал', 'Классика', 'Транс', 'Дрилл'];

const stripExt = (name: string) => name.replace(/\.[^.]+$/, '');

export const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [mode, setMode] = useState<Mode>('single');

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [featuring, setFeaturing] = useState('');
  const [bpm, setBpm] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [publishNow, setPublishNow] = useState(true);
  const [releaseDate, setReleaseDate] = useState('');

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumTracks, setAlbumTracks] = useState<{ file: File; title: string }[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');

  const onDrop = useCallback((files: File[]) => {
    if (!files.length) return;
    if (mode === 'album') {
      setAlbumTracks((prev) => [...prev, ...files.map((f) => ({ file: f, title: stripExt(f.name) }))]);
    } else {
      setAudioFile(files[0]);
    }
  }, [mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/*': ['.mp3', '.wav', '.flac'] },
    multiple: mode === 'album',
  });

  useEffect(() => () => { if (coverPreview) URL.revokeObjectURL(coverPreview); }, [coverPreview]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(file ? URL.createObjectURL(file) : null);
  };

  const setTrackTitle = (i: number, v: string) =>
    setAlbumTracks((prev) => prev.map((t, idx) => (idx === i ? { ...t, title: v } : t)));
  const removeTrack = (i: number) => setAlbumTracks((prev) => prev.filter((_, idx) => idx !== i));

  const submitSingle = async () => {
    if (!audioFile) { toast.error('Добавьте аудиофайл'); return; }
    if (!title.trim()) { toast.error('Введите название трека'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('description', description);
      form.append('genre', genre);
      if (featuring.trim()) form.append('featuring', featuring.trim());
      if (bpm) form.append('bpm', bpm);
      form.append('visibility', visibility);
      if (!publishNow && releaseDate) form.append('release_date', releaseDate);
      form.append('file', audioFile);
      if (coverFile) form.append('cover', coverFile);
      const res = await tracksApi.create(form);
      toast.success('Трек загружен!');
      navigate(`/track/${res.data.id}`);
    } catch {
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
    }
  };

  const submitAlbum = async () => {
    if (!albumTitle.trim()) { toast.error('Введите название альбома'); return; }
    if (!albumTracks.length) { toast.error('Добавьте хотя бы один трек'); return; }
    setUploading(true);
    try {
      const af = new FormData();
      af.append('title', albumTitle.trim());
      if (coverFile) af.append('cover', coverFile);
      const alb = await albumsApi.create(af);

      for (let i = 0; i < albumTracks.length; i++) {
        const t = albumTracks[i];
        setProgressLabel(`Загрузка трека ${i + 1} из ${albumTracks.length}…`);
        const form = new FormData();
        form.append('title', t.title.trim() || `Трек ${i + 1}`);
        form.append('genre', genre);
        form.append('visibility', visibility);
        form.append('albumId', String(alb.data.id));
        form.append('file', t.file);
        await tracksApi.create(form);
      }
      toast.success('Альбом опубликован!');
      navigate(`/album/${alb.data.id}`);
    } catch {
      toast.error('Ошибка загрузки альбома');
    } finally {
      setUploading(false);
      setProgressLabel('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'album') submitAlbum(); else submitSingle();
  };

  const visOptions: { v: Visibility; label: string; desc: string; icon: React.ReactNode }[] = [
    { v: 'public', label: 'Публичный', desc: 'Виден всем', icon: <Globe size={16} /> },
    { v: 'private', label: 'Приватный', desc: 'Только вы', icon: <Lock size={16} /> },
    { v: 'link', label: 'Ссылка', desc: 'По прямой ссылке', icon: <Link2 size={16} /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-xs tracking-widest text-[#666] uppercase mb-1">Панель артиста</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{mode === 'album' ? 'ЗАГРУЗИТЬ АЛЬБОМ' : 'ЗАГРУЗИТЬ ТРЕК'}</h1>
        </div>
        <span className="text-xs text-[#888] bg-[#151515] px-3 py-1.5 rounded-full">MP3, WAV, FLAC</span>
      </div>

      <div className="inline-flex p-1 bg-[#0e0e0e] border border-[#1f1f1f] rounded-full mb-6">
        {(['single', 'album'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${mode === m ? 'bg-white text-black' : 'text-[#888] hover:text-white'}`}
          >
            {m === 'album' && <Disc3 size={14} />} {m === 'single' ? 'Сингл' : 'Альбом'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-5">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 md:p-12 text-center cursor-pointer transition ${isDragActive ? 'border-white bg-white/5' : 'border-[#2a2a2a] hover:border-[#444] bg-[#0e0e0e]'}`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={40} className="mx-auto text-[#888]" />
            <p className="mt-3 font-medium">{mode === 'album' ? 'Перетащите несколько файлов' : 'Перетащите файл сюда'}</p>
            <p className="text-sm text-[#888]">или <span className="text-white underline">выберите</span> с компьютера</p>
            {mode === 'album' && <p className="text-xs text-[#666] mt-2">Можно выбрать сразу все треки альбома</p>}
          </div>

          {mode === 'single' && audioFile && (
            <div className="flex items-center gap-3 bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-3">
              <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                <Music size={18} className="text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{audioFile.name}</p>
              </div>
              <span className="text-xs text-[#888] shrink-0">{(audioFile.size / (1024 * 1024)).toFixed(1)} MB</span>
              <span className="inline-flex items-center gap-1 text-xs text-green-400 shrink-0"><Check size={14} /> Готово</span>
              <button type="button" onClick={() => setAudioFile(null)} className="text-[#666] hover:text-white shrink-0"><X size={16} /></button>
            </div>
          )}

          {mode === 'album' && (
            <>
              <input value={albumTitle} onChange={(e) => setAlbumTitle(e.target.value)} placeholder="Название альбома" className="ns-input text-lg" />
              {albumTracks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-[#666]">{albumTracks.length} {albumTracks.length === 1 ? 'трек' : 'треков'} в альбоме:</p>
                  {albumTracks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 bg-[#0e0e0e] border border-[#1f1f1f] rounded-xl p-2.5">
                      <GripVertical size={15} className="text-[#444] shrink-0" />
                      <span className="text-xs text-[#666] w-5 text-center shrink-0">{i + 1}</span>
                      <input
                        value={t.title}
                        onChange={(e) => setTrackTitle(i, e.target.value)}
                        className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-transparent focus:border-[#333] py-1"
                      />
                      <span className="text-xs text-[#888] shrink-0">{(t.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                      <button type="button" onClick={() => removeTrack(i)} className="text-[#666] hover:text-red-400 shrink-0"><X size={15} /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {mode === 'single' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Название трека">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, Полночь" className="ns-input" />
                </Field>
                <Field label="Артист">
                  <input value={user?.nickname || user?.firstName || ''} readOnly className="ns-input opacity-70 cursor-not-allowed" />
                </Field>
                <Field label="Темп">
                  <input value={bpm} onChange={(e) => setBpm(e.target.value.replace(/\D/g, ''))} placeholder="напр. 128" className="ns-input" />
                </Field>
                <Field label="Совместно с (фит)">
                  <input value={featuring} onChange={(e) => setFeaturing(e.target.value)} placeholder="Например, Markul" className="ns-input" />
                </Field>
              </div>
              <Field label="Описание">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Расскажите о треке..." className="ns-input resize-none h-24" />
              </Field>
            </>
          )}

          <Field label="Жанр">
            <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Например, хип-хоп" className="ns-input" />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {GENRES.map((g) => (
                <button key={g} type="button" onClick={() => setGenre(g)} className={`text-xs px-2.5 py-1 rounded-full transition ${genre === g ? 'bg-white text-black' : 'bg-[#151515] text-[#aaa] hover:bg-[#222]'}`}>{g}</button>
              ))}
            </div>
          </Field>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs tracking-widest text-[#666] uppercase mb-3">{mode === 'album' ? 'Обложка альбома' : 'Обложка'}</p>
            <label className="relative block aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-[#2a2a2a] hover:border-[#444] cursor-pointer group bg-[#0e0e0e]">
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-sm font-medium">
                    <ImageIcon size={16} className="mr-2" /> Изменить
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#888]">
                  <ImageIcon size={28} />
                  <span className="text-sm mt-2">Загрузить обложку</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
            </label>
            {mode === 'album' && <p className="text-xs text-[#666] mt-2">Общая обложка для всех треков альбома</p>}
          </div>

          <div>
            <p className="text-xs tracking-widest text-[#666] uppercase mb-3">Доступ</p>
            <div className="space-y-2">
              {visOptions.map((o) => (
                <button type="button" key={o.v} onClick={() => setVisibility(o.v)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition ${visibility === o.v ? 'border-white bg-white/5' : 'border-[#1f1f1f] hover:border-[#333]'}`}>
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

          {mode === 'single' && (
            <div>
              <p className="text-xs tracking-widest text-[#666] uppercase mb-3">Дата релиза</p>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#1f1f1f]">
                <span className="text-sm">Опубликовать сейчас</span>
                <button type="button" onClick={() => setPublishNow((p) => !p)} className={`w-11 h-6 rounded-full p-0.5 transition ${publishNow ? 'bg-white' : 'bg-[#333]'}`}>
                  <span className={`block w-5 h-5 rounded-full transition ${publishNow ? 'bg-black translate-x-5' : 'bg-white translate-x-0'}`} />
                </button>
              </div>
              {!publishNow && <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="ns-input mt-2" />}
            </div>
          )}

          <button type="submit" disabled={uploading} className="w-full py-3 rounded-full bg-white text-black font-semibold disabled:opacity-50 hover:opacity-90 transition">
            {uploading ? (progressLabel || 'Загрузка...') : (mode === 'album' ? `Опубликовать альбом${albumTracks.length ? ` (${albumTracks.length})` : ''}` : 'Опубликовать трек')}
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
