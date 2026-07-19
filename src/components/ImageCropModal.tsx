import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { ZoomIn, X } from 'lucide-react';
import { getCroppedBlob, type PixelCrop } from '@/lib/cropImage';

interface Props {
  /** object URL исходной картинки (из URL.createObjectURL) */
  src: string;
  /** соотношение сторон области кропа */
  aspect: number;
  /** круглая рамка (для аватара) */
  round?: boolean;
  /** ширина итогового изображения в px */
  outputWidth?: number;
  title?: string;
  onCancel: () => void;
  onDone: (file: File) => Promise<void> | void;
}

export const ImageCropModal = ({
  src, aspect, round = false, outputWidth = 1600, title = 'Кадрирование', onCancel, onDone,
}: Props) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: unknown, pixels: PixelCrop) => setArea(pixels), []);

  // освобождаем object URL при размонтировании
  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  const save = async () => {
    if (!area) return;
    setSaving(true);
    try {
      const blob = await getCroppedBlob(src, area, outputWidth);
      await onDone(new File([blob], 'image.jpg', { type: 'image/jpeg' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/85 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button onClick={onCancel} className="text-[#888] hover:text-white transition"><X size={18} /></button>
      </div>

      <div className="relative flex-1">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          minZoom={1}
          maxZoom={4}
          cropShape={round ? 'round' : 'rect'}
          showGrid={!round}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="px-4 py-4 flex items-center gap-4 max-w-2xl mx-auto w-full">
        <ZoomIn size={18} className="text-[#888] shrink-0" />
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-white"
        />
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-full text-sm text-[#aaa] hover:text-white transition shrink-0"
        >
          Отмена
        </button>
        <button
          onClick={save}
          disabled={saving || !area}
          className="px-5 py-2 rounded-full text-sm font-semibold bg-white text-black hover:opacity-90 transition disabled:opacity-60 shrink-0"
        >
          {saving ? 'Сохранение…' : 'Готово'}
        </button>
      </div>
    </div>
  );
};
