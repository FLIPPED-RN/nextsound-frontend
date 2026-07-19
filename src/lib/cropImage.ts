export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

export async function getCroppedBlob(
    src: string,
    crop: PixelCrop,
    outW = 1920,
): Promise<Blob> {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image(); i.crossOrigin = 'anonymous';
        i.onload = () => res(i); i.onerror = rej; i.src = src;
    });
    const scale = outW / crop.width;
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = Math.round(crop.height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
    return new Promise((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.9));
}