/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Settings,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FlipHorizontal,
  Shuffle,
  Star,
  Award,
} from 'lucide-react';
import {
  HangulProblem,
  BASIC_CONSONANTS,
  BASIC_VOWELS,
  formatPromptText,
} from './data/hangulData';
import { SettingsModal, AppSettings } from './components/SettingsModal';
import { PhotoGalleryModal, CapturedPhoto } from './components/PhotoGalleryModal';

const STORAGE_PROBLEMS_KEY = 'body_hangul_problems_v1';
const STORAGE_SETTINGS_KEY = 'body_hangul_settings_v1';

const DEFAULT_PROBLEMS: HangulProblem[] = [...BASIC_CONSONANTS, ...BASIC_VOWELS];

const DEFAULT_SETTINGS: AppSettings = {
  promptTemplate: '{글자}을(를) 만드세요!',
  autoPhotoOnSuccess: false,
  addPhotoFrame: true,
  classNameLabel: '열매6반 몸으로 만들어요 한글',
};

export default function App() {
  // 1. Problems & Current Index State
  const [problems, setProblems] = useState<HangulProblem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROBLEMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PROBLEMS;
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);

  // 2. Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.classNameLabel === '해바라기반 · 몸으로 만들어요 한글') {
          parsed.classNameLabel = '열매6반 몸으로 만들어요 한글';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // 3. Camera & Video State (Always mounted and automatically connected)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraStatus, setCameraStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [cameraErrorMsg, setCameraErrorMsg] = useState<string>('');
  const [hideCameraPrompt, setHideCameraPrompt] = useState<boolean>(false);

  // 4. Photo Capture & Gallery State
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [photoToast, setPhotoToast] = useState<string | null>(null);

  // 5. Celebration & Modals State
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [celebrationChar, setCelebrationChar] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);

  // Ensure currentIndex stays in bounds when problems array changes
  const safeIndex = problems.length > 0 ? currentIndex % problems.length : 0;
  const currentProblem: HangulProblem = problems[safeIndex] || DEFAULT_PROBLEMS[0];
  const promptHeadline =
    currentProblem.customPrompt && currentProblem.customPrompt.trim().length > 0
      ? currentProblem.customPrompt.trim()
      : formatPromptText(currentProblem.char, settings.promptTemplate);

  // Save problems to localStorage
  const handleUpdateProblems = (newProblems: HangulProblem[]) => {
    setProblems(newProblems);
    setCurrentIndex(0);
    try {
      localStorage.setItem(STORAGE_PROBLEMS_KEY, JSON.stringify(newProblems));
    } catch {
      // ignore
    }
  };

  // Save settings to localStorage
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  // Connect camera stream reliably for USB webcams, built-in cameras, and tablets
  const connectCamera = useCallback(async (deviceIdToUse?: string) => {
    if (isConnectingRef.current) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus('error');
      setCameraErrorMsg('이 브라우저에서는 카메라(getUserMedia)를 지원하지 않아요.');
      return;
    }

    isConnectingRef.current = true;
    setCameraStatus('connecting');
    setCameraErrorMsg('');

    // Stop any previous tracks cleanly and wait briefly so USB webcams release hardware lock
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      await new Promise((r) => setTimeout(r, 150));
    }

    let stream: MediaStream | null = null;
    let lastError: unknown = null;

    // Step 1: Try requested deviceId or default video: true
    try {
      if (deviceIdToUse) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { ideal: deviceIdToUse } },
          audio: false,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
    } catch (err) {
      lastError = err;
    }

    // Step 2: If default device failed (common on PCs with multiple/virtual cameras + USB webcam),
    // enumerate all videoinput devices and try each one sequentially!
    if (!stream) {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cams = allDevices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);

        for (const cam of cams) {
          if (!cam.deviceId) continue;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: cam.deviceId } },
              audio: false,
            });
            if (stream) break;
          } catch (camErr) {
            lastError = camErr;
          }
        }
      } catch {
        // ignore enumerate error
      }
    }

    // Step 3: Final low-bandwidth USB 2.0 webcam fallback (640x480 @ 15fps)
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
          audio: false,
        });
      } catch (lowResErr) {
        lastError = lowResErr;
      }
    }

    isConnectingRef.current = false;

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // play() will also be triggered by onLoadedMetadata
        }
      }
      setCameraStatus('connected');
      setCameraErrorMsg('');

      // Refresh device list now that permission is active
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
        const currentTrack = stream.getVideoTracks()[0];
        const currentId = currentTrack?.getSettings()?.deviceId;
        if (currentId) {
          setSelectedDeviceId(currentId);
        }
      } catch {
        // ignore
      }
    } else {
      setCameraStatus('error');
      const errName = lastError instanceof Error ? lastError.name : '';
      const errDetail = lastError instanceof Error ? lastError.message : '';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraErrorMsg(
          `브라우저 또는 미리보기 창(iframe)에서 카메라 권한이 차단되어 있어요 (${errName}). 전체 웹페이지를 새로고침(F5) 하거나 우측 상단의 [새 탭에서 열기]로 실행하면 웹캠이 바로 연결됩니다!`
        );
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraErrorMsg(
          `웹캠이 다른 프로그램(Zoom, 카메라 앱, 다른 브라우저 탭 등)에서 사용 중이거나 USB 대역폭이 부족해요 (${errName}). 다른 프로그램을 닫고 [카메라 다시 연결하기]를 눌러주세요.`
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setCameraErrorMsg(
          `컴퓨터에서 연결된 웹캠을 찾지 못했어요 (${errName}). USB 웹캠 선이 잘 꽂혀 있는지 확인 후 다시 연결해 주세요.`
        );
      } else {
        setCameraErrorMsg(
          `웹캠 연결 오류 (${errName || '알 수 없음'}: ${errDetail || '권한 확인 필요'}). 페이지를 새로고침(F5) 하거나 아래 버튼을 눌러 다시 연결해 주세요.`
        );
      }
    }
  }, []);

  // Automatically connect on mount and when USB webcam is plugged in
  useEffect(() => {
    connectCamera();

    const onDeviceChange = () => {
      if (!streamRef.current || !streamRef.current.active) {
        connectCamera();
      }
    };
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange);

    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [connectCamera]);

  // Capture photo from live <video>
  const capturePhoto = useCallback(() => {
    const vid = videoRef.current;
    if (!vid || vid.videoWidth <= 0 || vid.readyState < 2) {
      setPhotoToast('카메라 화면이 아직 준비되지 않았어요. 연결 후 다시 찍어 주세요!');
      setTimeout(() => setPhotoToast(null), 2400);
      return;
    }

    const outCanvas = document.createElement('canvas');
    const targetW = 1280;
    const targetH = 720;
    outCanvas.width = targetW;
    outCanvas.height = targetH;

    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw live camera frame (center-crop to 16:9)
    const vw = vid.videoWidth;
    const vh = vid.videoHeight;
    const videoAspect = vw / vh;
    const canvasAspect = targetW / targetH;

    let sx = 0,
      sy = 0,
      sw = vw,
      sh = vh;

    if (videoAspect > canvasAspect) {
      sw = vh * canvasAspect;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / canvasAspect;
      sy = (vh - sh) / 2;
    }

    ctx.save();
    if (isMirrored) {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(vid, sx, sy, sw, sh, 0, 0, targetW, targetH);
    ctx.restore();


    // 2. Optional Cute Kindergarten Photo Frame & Single-Line Bottom Banner
    if (settings.addPhotoFrame) {
      // Warm yellow rounded frame border
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 24;
      ctx.strokeRect(12, 12, targetW - 24, targetH - 24);

      // Single-line bottom banner inside the photo: "열매6반 몸으로 만들어요 한글 ㄱ 완성!"
      const rawClass = (settings.classNameLabel || '열매6반 몸으로 만들어요 한글').trim();
      const classTitle = rawClass.includes('몸으로 만들어요 한글')
        ? rawClass
        : `${rawClass} 몸으로 만들어요 한글`;
      const singleLineBanner = `${classTitle}  ${currentProblem.char} 완성!`;

      ctx.font = '700 32px "SchoolSafeOuting", sans-serif';
      const textWidth = ctx.measureText(singleLineBanner).width;
      const boxW = Math.min(targetW - 80, textWidth + 68);
      const boxH = 62;
      const boxX = (targetW - boxW) / 2;
      const boxY = targetH - boxH - 28;

      ctx.fillStyle = 'rgba(255, 253, 247, 0.94)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#451A03';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(singleLineBanner, targetW / 2, boxY + boxH / 2 + 2);
    }

    const dataUrl = outCanvas.toDataURL('image/png');
    const timeLabel = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newPhoto: CapturedPhoto = {
      id: `photo-${Date.now()}`,
      char: currentProblem.char,
      name: currentProblem.name,
      dataUrl,
      timestamp: timeLabel,
    };

    setPhotos((prev) => [newPhoto, ...prev]);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 180);

    setPhotoToast(`찰칵! '${currentProblem.char}' 사진이 사진첩에 저장되었어요!`);
    setTimeout(() => setPhotoToast(null), 2400);
  }, [
    isMirrored,
    currentProblem.char,
    currentProblem.name,
    settings.addPhotoFrame,
    settings.classNameLabel,
  ]);

  // Handle "성공!" Button Click (Bottom Right) -> Advance to Next Problem
  const handleSuccessNext = useCallback(() => {
    if (settings.autoPhotoOnSuccess) {
      capturePhoto();
    }

    setCompletedCount((prev) => prev + 1);
    setCelebrationChar(currentProblem.char);
    setShowCelebration(true);

    setTimeout(() => {
      setShowCelebration(false);
      setCurrentIndex((prev) => (prev + 1) % problems.length);
    }, 850);
  }, [settings.autoPhotoOnSuccess, capturePhoto, currentProblem.char, problems.length]);

  const handlePrevProblem = () => {
    setCurrentIndex((prev) => (prev - 1 + problems.length) % problems.length);
  };

  const handleSkipNextProblem = () => {
    setCurrentIndex((prev) => (prev + 1) % problems.length);
  };

  const handleQuickShuffle = () => {
    const shuffled = [...problems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    handleUpdateProblems(shuffled);
    setPhotoToast('문제 순서를 재미있게 섞었어요!');
    setTimeout(() => setPhotoToast(null), 1800);
  };

  // Keyboard shortcuts for convenience in classroom
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSettingsOpen || isGalleryOpen) return;
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % problems.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + problems.length) % problems.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSettingsOpen, isGalleryOpen, problems.length]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-stone-900 select-none">
      {/* =====================================================================
          1. MAXIMIZED FULL-SCREEN LIVE CAMERA VIEWPORT (Always rendered)
          ===================================================================== */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            if (videoRef.current) {
              videoRef.current.play().catch(() => {});
            }
            setCameraStatus('connected');
          }}
          onPlaying={() => setCameraStatus('connected')}
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />

        {/* If camera is waiting for browser permission or blocked, show clear 1-click activator */}
        {cameraStatus !== 'connected' && !hideCameraPrompt && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-stone-900/85">
            <div className="bg-[#FFFDF7] border-4 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm">
                <Camera className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
                {cameraStatus === 'connecting'
                  ? '웹캠을 자동으로 연결하고 있어요...'
                  : '웹캠 연결을 확인해 주세요'}
              </h2>
              <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
                {cameraErrorMsg ||
                  '브라우저 상단에 나타난 [카메라 권한 허용] 창에서 "허용"을 눌러주세요.'}
              </p>

              {videoDevices.length > 0 && (
                <div className="text-left space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    연결할 웹캠 장치 선택 ({videoDevices.length}개 감지됨)
                  </label>
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDeviceId(id);
                      connectCamera(id);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-amber-300 text-sm font-bold text-stone-900"
                  >
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `USB 웹캠 / 카메라 #${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3.5 text-left text-sm text-amber-950 space-y-1.5">
                <p className="font-bold">허용을 눌렀는데도 안 켜질 때 해결 방법:</p>
                <p>
                  1. AI Studio 미리보기 화면에서는 권한 허용 후 <strong>브라우저 전체 새로고침(F5)</strong>을 한 번 누르거나, 우측 상단의 <strong>새 탭(전체 창)에서 열기</strong> 아이콘을 누르면 웹캠이 즉시 켜집니다.
                </p>
                <p>
                  2. 윈도우 기본 [카메라] 앱이나 Zoom 등 다른 프로그램에 웹캠이 켜져 있다면 닫아주세요 (USB 웹캠은 한 번에 한 프로그램만 사용할 수 있어요).
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => connectCamera(selectedDeviceId || undefined)}
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  웹캠 다시 연결하기
                </button>
                <button
                  type="button"
                  onClick={() => setHideCameraPrompt(true)}
                  className="py-3.5 px-4 rounded-2xl bg-stone-200 hover:bg-stone-300 text-stone-700 text-base font-bold cursor-pointer whitespace-nowrap"
                >
                  창 닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cute soft frame border around the maximized camera screen */}
        <div className="pointer-events-none absolute inset-0 border-[10px] sm:border-[14px] border-amber-300/85 rounded-none" />
      </div>

      {/* =====================================================================
          2. TOP QUESTION BANNER ("ㄱ을 만드세요!" positioned high at the top so the camera center is completely open)
          ===================================================================== */}
      <header className="absolute top-2 left-3 right-3 sm:top-3 sm:left-5 sm:right-5 z-30 flex flex-col items-center gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Left: App Brand & Problem Navigation */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#FFFDF7]/95 backdrop-blur-xs border-3 border-amber-400 rounded-2xl px-3 py-1.5 shadow-lg shrink-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg shadow-2xs">
              한
            </div>
            <div className="hidden xl:block pr-1">
              <div className="text-sm font-bold text-amber-950 leading-tight whitespace-nowrap">
                몸으로 만들어요 한글
              </div>
              <div className="text-[11px] text-stone-600 tabular-nums whitespace-nowrap">
                성공 별: {completedCount}개 · {safeIndex + 1}/{problems.length}번 문제
              </div>
            </div>

            <div className="flex items-center gap-1 pl-1 border-l border-amber-200">
              <button
                type="button"
                onClick={handlePrevProblem}
                className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 transition-colors cursor-pointer"
                title="이전 문제"
                aria-label="이전 문제"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-2 text-sm font-bold text-amber-950 tabular-nums whitespace-nowrap">
                {safeIndex + 1} / {problems.length}
              </span>
              <button
                type="button"
                onClick={handleSkipNextProblem}
                className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 transition-colors cursor-pointer"
                title="다음 문제 미리보기"
                aria-label="다음 문제"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleQuickShuffle}
                className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 transition-colors cursor-pointer"
                title="문제 순서 섞기"
                aria-label="문제 순서 섞기"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CENTER-TOP FOCAL ANCHOR: Big Hangul Character & Question Prompt ("ㄱ을 만드세요!") at the very top */}
          <div className="pointer-events-auto flex items-center gap-3 sm:gap-5 bg-[#FFFDF7]/95 backdrop-blur-xs border-4 border-amber-400 rounded-3xl px-5 sm:px-8 py-2 sm:py-3 shadow-2xl">
            {/* Prominent Target Hangul Letter elevated to the top */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-400 border-3 border-amber-500 text-amber-950 flex items-center justify-center text-5xl sm:text-6xl font-bold shadow-sm shrink-0">
              {currentProblem.char}
            </div>

            {/* Prompt Text & Body Tip */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight leading-none whitespace-nowrap">
                  {promptHeadline}
                </h1>
              </div>
              <p className="text-xs sm:text-base text-amber-900/90 mt-1.5 truncate">
                <span className="font-bold">{currentProblem.name}</span>
                <span aria-hidden="true"> · </span>
                <span>{currentProblem.bodyTip}</span>
              </p>
            </div>
          </div>

          {/* Right: Classroom Utility Controls (Gallery, Settings) */}
          <div className="pointer-events-auto flex items-center gap-2 bg-[#FFFDF7]/95 backdrop-blur-xs border-3 border-amber-400 rounded-2xl px-3 py-1.5 shadow-lg shrink-0">
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
              <span>사진첩 ({photos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span>문제 설정</span>
            </button>
          </div>
        </div>

        {/* Non-blocking status toast for photo capture */}
        {photoToast && (
          <div className="self-center pointer-events-auto bg-emerald-600 text-white px-5 py-2 rounded-2xl text-base font-bold shadow-lg border-2 border-white animate-pop-scale">
            {photoToast}
          </div>
        )}
      </header>

      {/* =====================================================================
          4. SUCCESS CELEBRATION OVERLAY ("참 잘했어요! 대성공!")
          ===================================================================== */}
      {showCelebration && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-emerald-950/25 backdrop-blur-[2px]">
          <div className="bg-[#FFFDF7] border-6 border-amber-400 rounded-3xl px-10 py-8 shadow-2xl flex flex-col items-center text-center animate-pop-scale">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Star className="w-10 h-10 fill-amber-400" />
              <Award className="w-14 h-14 text-emerald-500" />
              <Star className="w-10 h-10 fill-amber-400" />
            </div>
            <div className="text-4xl sm:text-5xl font-bold text-stone-900">
              와아! &lsquo;{celebrationChar}&rsquo; 만들기 대성공!
            </div>
            <p className="text-xl text-emerald-700 font-bold mt-2">
              참 잘했어요! 다음 한글 문제로 출발해요!
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. CAMERA SHUTTER FLASH OVERLAY
          ===================================================================== */}
      {isFlashing && (
        <div className="pointer-events-none absolute inset-0 z-50 bg-white opacity-90 transition-opacity duration-150" />
      )}

      {/* =====================================================================
          6. BOTTOM CONTROLS BAR
             - Left: "찰칵! 사진 찍기" + Recent Photo Thumbnail + Mirror Controls
             - Bottom-Right (오른쪽 하단): Large "성공!" Button to advance to next problem
          ===================================================================== */}
      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-30 flex items-end justify-between gap-4 pointer-events-none">
        {/* Bottom-Left: Photo Capture & Mirror Controls */}
        <div className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Primary Photo Capture Button */}
          <button
            type="button"
            onClick={capturePhoto}
            className="flex items-center gap-2.5 px-5 sm:px-6 py-3.5 sm:py-4 rounded-3xl bg-amber-400 hover:bg-amber-300 text-amber-950 border-4 border-white shadow-xl font-bold text-xl sm:text-2xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Camera className="w-7 h-7 stroke-[2.5]" />
            <span>찰칵! 사진 찍기</span>
          </button>

          {/* Camera Mirror Controls */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#FFFDF7]/90 backdrop-blur-xs border-2 border-amber-300 rounded-2xl px-2.5 py-1.5 shadow-md">
            <button
              type="button"
              onClick={() => setIsMirrored((prev) => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              title="거울 모드 (좌우 반전)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>{isMirrored ? '거울모드' : '일반모드'}</span>
            </button>

            {videoDevices.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const currentIdx = videoDevices.findIndex(
                    (d) => d.deviceId === selectedDeviceId
                  );
                  const nextDevice =
                    videoDevices[(currentIdx + 1) % videoDevices.length];
                  if (nextDevice) {
                    setSelectedDeviceId(nextDevice.deviceId);
                    connectCamera(nextDevice.deviceId);
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                title="다른 카메라로 전환"
              >
                카메라 전환
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM-RIGHT (오른쪽 하단): Prominent "성공!" Button to advance to the next Hangul problem */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleSuccessNext}
            className="group flex items-center gap-3 px-7 sm:px-10 py-4 sm:py-5 rounded-3xl bg-emerald-500 hover:bg-emerald-400 text-white border-4 border-white shadow-2xl transition-all duration-150 hover:scale-[1.03] active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5] text-amber-200 group-hover:rotate-12 transition-transform" />
            <div className="text-left">
              <div className="text-2xl sm:text-4xl font-bold leading-none tracking-tight">
                성공! 다음 문제
              </div>
              <div className="text-xs sm:text-sm font-normal text-emerald-50 mt-1">
                누르면 다음 한글이 나와요 ▶
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* =====================================================================
          7. MODALS: PROBLEM SETTINGS & PHOTO GALLERY
          ===================================================================== */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        problems={problems}
        onUpdateProblems={handleUpdateProblems}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <PhotoGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        photos={photos}
        onDeletePhoto={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
        onClearAll={() => setPhotos([])}
        classNameLabel={settings.classNameLabel}
      />
    </main>
  );
}
