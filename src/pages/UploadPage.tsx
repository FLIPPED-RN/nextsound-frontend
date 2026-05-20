import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, Image, X, Play, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import { tracksApi } from '../api/tracks.api';

export const UploadPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'link'>('public');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const onDropAudio = useCallback((files: File[]) => {
    const file = files[0];
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioPreview(url);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAudio,
    accept: { 'audio/*': ['.mp3', '.wav', '.flac'] },
    maxFiles: 1,
  });

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverFile(file);
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(null);
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(null);
    setIsPreviewPlaying(false);
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
  };

  const handlePreviewToggle = (audioEl: HTMLAudioElement | null) => {
    if (!audioEl) return;
    if (isPreviewPlaying) {
      audioEl.pause();
    } else {
      audioEl.play();
    }
    setIsPreviewPlaying(!isPreviewPlaying);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !title) return;
    setUploading(true);
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('genre', genre);
    form.append('visibility', visibility);
    form.append('file', audioFile);
    if (coverFile) form.append('cover', coverFile);
    try {
      const res = await tracksApi.create(form);
      toast.success('Трек загружен!');
      navigate(`/track/${res.data.id}`);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка загрузки :(');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Загрузить трек</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            isDragActive ? 'border-white bg-[#1a1a1a]' : 'border-[#242424] hover:border-[#444]'
          }`}
        >
          <input {...getInputProps()} />
          {audioFile ? (
            <div className="flex flex-col items-center gap-3">
              <Music size={40} className="text-green-400" />
              <span className="font-medium">{audioFile.name}</span>
              <span className="text-xs text-[#888888]">
                {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <div className="flex gap-3">
                {audioPreview && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const audio = document.getElementById('audio-preview') as HTMLAudioElement;
                      handlePreviewToggle(audio);
                    }}
                    className="px-4 py-2 bg-white text-black rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-80 transition"
                  >
                    {isPreviewPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPreviewPlaying ? 'Stop' : 'Preview'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAudio();
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-semibold flex items-center gap-2 hover:opacity-80 transition"
                >
                  <X size={16} />
                  Удалить
                </button>
              </div>
              {audioPreview && <audio id="audio-preview" src={audioPreview} className="hidden" onEnded={() => setIsPreviewPlaying(false)} />}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={32} className="mx-auto" />
              <p>Drag & drop audio file or click to select</p>
              <p className="text-xs text-[#888888]">MP3, WAV, FLAC up to 100MB</p>
            </div>
          )}
        </div>

        {/* Обложка */}
        <div>
          <p className="text-sm text-[#888888] mb-2">Обложка трека</p>
          <div className="flex items-start gap-4">
            {coverPreview ? (
              <div className="relative w-32 h-32">
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:opacity-80 transition"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="w-32 h-32 border-2 border-dashed border-[#242424] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#444] transition">
                <Image size={24} className="text-[#888888]" />
                <span className="text-xs text-[#888888] mt-1">Обложка</span>
                <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
              </label>
            )}
            {!coverPreview && (
              <label className="px-4 py-2 bg-[#151515] rounded-xl cursor-pointer hover:bg-[#242424] transition text-sm">
                Выберите изображение
                <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Поля */}
        <input
          type="text"
          placeholder="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-[#151515] rounded-xl text-white outline-none"
          required
        />
        <textarea
          placeholder="Описание"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 bg-[#151515] rounded-xl text-white outline-none resize-none h-24"
        />
        <input
          type="text"
          placeholder="Жанр"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full px-4 py-3 bg-[#151515] rounded-xl text-white outline-none"
        />

        {/* Видимость */}
        <div>
          <p className="text-sm text-[#888888] mb-2">Доступ</p>
          <div className="flex gap-2">
            {(['public', 'private', 'link'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  visibility === v ? 'bg-white text-black' : 'bg-[#151515] text-[#888888] hover:bg-[#242424]'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading || !audioFile || !title}
          className="w-full py-3 bg-white text-black rounded-full font-semibold disabled:opacity-50 transition"
        >
          {uploading ? 'Загрука...' : 'Загрузить трек'}
        </button>
      </form>
    </div>
  );
};