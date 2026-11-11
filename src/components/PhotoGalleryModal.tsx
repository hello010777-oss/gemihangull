import React, { useState } from 'react';
import { X, Download, Trash2, Image as ImageIcon, Award, Sparkles } from 'lucide-react';

export interface CapturedPhoto {
  id: string;
  char: string;
  name: string;
  dataUrl: string;
  timestamp: string;
}

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: CapturedPhoto[];
  onDeletePhoto: (id: string) => void;
  onClearAll: () => void;
  classNameLabel: string;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({
  isOpen,
  onClose,
  photos,
  onDeletePhoto,
  onClearAll,
  classNameLabel,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const safeFilePart = (value: string) =>
    value
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/\.+$/g, '')
      .slice(0, 40) || 'photo';

  const handleDownloadSingle = (photo: CapturedPhoto) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    // Windows rejects trailing dots/spaces and some punctuation in filenames
    link.download = `body_hangul_${safeFilePart(photo.char)}_${photo.id.slice(-6)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generates a single printable kindergarten activity poster containing all captured Hangul poses
  const handleDownloadActivitySheet = async () => {
    if (photos.length === 0) return;

    const cols = Math.min(3, Math.max(2, Math.ceil(Math.sqrt(photos.length))));
    const rows = Math.ceil(photos.length / cols);

    const cardW = 420;
    const cardH = 340;
    const gap = 28;
    const padX = 48;
    const headerH = 140;
    const footerH = 60;

    const canvas = document.createElement('canvas');
    canvas.width = padX * 2 + cols * cardW + (cols - 1) * gap;
    canvas.height = headerH + rows * cardH + (rows - 1) * gap + footerH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Warm cream background
    ctx.fillStyle = '#FFFDF7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rawClass = (classNameLabel || '열매6반 몸으로 만들어요 한글').trim();
    const formattedClassTitle = rawClass.includes('몸으로 만들어요 한글')
      ? rawClass
      : `${rawClass} 몸으로 만들어요 한글`;

    // Top Header Banner
    ctx.fillStyle = '#FCD34D';
    ctx.fillRect(0, 0, canvas.width, 105);

    ctx.fillStyle = '#451A03';
    ctx.font = '700 38px "SchoolSafeOuting", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${formattedClassTitle} · 우리들의 한글 앨범`,
      canvas.width / 2,
      64
    );

    // Load and draw each photo
    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });

    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = padX + c * (cardW + gap);
      const y = headerH + r * (cardH + gap);

      // Polaroid card box
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(x, y, cardW, cardH, 20);
      ctx.fill();
      ctx.stroke();

      const img = await loadImg(p.dataUrl);
      if (img.width > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + 14, y + 14, cardW - 28, cardH - 28, 12);
        ctx.clip();
        ctx.drawImage(img, x + 14, y + 14, cardW - 28, cardH - 28);
        ctx.restore();
      }
    }

    const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (Windows-safe)
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `body_hangul_album_${stamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/65 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-modal-title"
    >
      <div className="bg-[#FFFDF7] border-4 border-amber-400 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-pop-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-300/90 border-b-2 border-amber-400 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-xs">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <h2 id="gallery-modal-title" className="text-2xl font-bold text-amber-950">
                몸으로 만들어요 한글 · 사진첩 ({photos.length}장)
              </h2>
              <p className="text-sm text-amber-900">
                아이들이 몸으로 만든 멋진 한글 기록이에요! 사진을 눌러 크게 보거나 저장할 수 있어요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {photos.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadActivitySheet}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>활동 기록표 한 장으로 저장</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-bold border-2 border-amber-500 shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="w-5 h-5" />
              <span>닫기</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-600 mb-4">
                <ImageIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-stone-800 mb-2">
                아직 찍은 사진이 없어요!
              </h3>
              <p className="text-base text-stone-600 max-w-md">
                카메라 앞에서 아이들이 몸으로 한글을 만들면 아래쪽의{' '}
                <strong className="text-amber-700">&lsquo;찰칵! 사진 찍기&rsquo;</strong> 버튼을 눌러 멋진 기록을 남겨보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="bg-white border-2 border-amber-300 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div
                    onClick={() => setSelectedPhoto(photo)}
                    className="relative aspect-video rounded-xl overflow-hidden bg-stone-100 cursor-pointer group"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`몸으로 만든 ${photo.char} 사진`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                    />
                  </div>

                  {/* Action buttons only (the single-line text is already rendered inside the bottom of the photo) */}
                  <div className="flex items-center justify-between pt-2.5 px-1 mt-auto">
                    <span className="text-xs text-stone-500">{photo.timestamp}</span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(photo)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                        title="사진 저장"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>저장</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePhoto(photo.id)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="사진 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {photos.length > 0 && (
          <div className="px-6 py-3.5 bg-amber-100/70 border-t border-amber-200 flex items-center justify-between">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                사진첩 전체 비우기
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-700">
                  모든 사진을 지울까요?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                >
                  네, 비울래요
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2.5 py-1 rounded-lg bg-white text-stone-700 text-xs font-bold border border-stone-300 cursor-pointer"
                >
                  취소
                </button>
              </div>
            )}

            <span className="text-xs text-stone-600">
              사진을 클릭하면 크게 볼 수 있어요!
            </span>
          </div>
        )}
      </div>

      {/* Lightbox Modal when clicking a photo */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white border-4 border-amber-400 rounded-3xl max-w-4xl w-full p-4 shadow-2xl animate-pop-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-stone-900">
              <img
                src={selectedPhoto.dataUrl}
                alt={`몸으로 만든 ${selectedPhoto.char}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-4 px-2 gap-3 flex-wrap">
              <span className="text-sm text-stone-500 font-bold">
                촬영 시각: {selectedPhoto.timestamp}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadSingle(selectedPhoto)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-5 h-5" />
                  <span>이 사진 저장하기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="px-5 py-2.5 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
