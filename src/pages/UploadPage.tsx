import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Music } from 'lucide-react';
import toast from 'react-hot-toast';
import { tracksApi } from '../api/tracks.api';

export const UploadPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const onDropAudio = useCallback((files: File[]) => {
    setAudioFile(files[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropAudio,
    accept: { 'audio/*': ['.mp3', '.wav', '.flac'] },
    maxFiles: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !title) return;
    setUploading(true);
    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('genre', genre);
    form.append('file', audioFile);
    if (coverFile) form.append('cover', coverFile);
    try {
      const res = await tracksApi.create(form);
      toast.success('Track uploaded!');
      navigate(`/track/${res.data.id}`);
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold">Upload Track</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
            isDragActive ? 'border-white bg-[#1a1a1a]' : 'border-[#242424] hover:border-[#444]'
          }`}
        >
          <input {...getInputProps()} />
          {audioFile ? (
            <div className="flex items-center gap-3 justify-center">
              <Music size={24} />
              <span>{audioFile.name}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={32} className="mx-auto" />
              <p>Drag & drop audio file or click to select</p>
              <p className="text-xs text-[#888888]">MP3, WAV, FLAC up to 100MB</p>
            </div>
          )}
        </div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-[#151515] rounded-xl text-white outline-none"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 bg-[#151515] rounded-xl text-white outline-none resize-none h-24"
        />
        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full px-4 py-3 bg-[#151515] rounded-xl text-white outline-none"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          className="text-sm text-[#888888]"
        />
        <button
          type="submit"
          disabled={uploading || !audioFile || !title}
          className="w-full py-3 bg-white text-black rounded-full font-semibold disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Publish Track'}
        </button>
      </form>
    </div>
  );
};