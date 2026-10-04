import { create } from 'zustand';

export type AuthMode = 'login' | 'register';
export type TimeOfDay = 'day' | 'golden' | 'sunset' | 'night';
export type QualityTier = 'high' | 'medium' | 'low';
export type CameraFocusTarget = 'default' | 'email' | 'password' | 'name' | 'success' | 'painter';

interface AppState {
  // Auth state
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  isSubmitting: boolean;
  setIsSubmitting: (val: boolean) => void;
  isSuccess: boolean;
  setIsSuccess: (val: boolean) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  userName: string;
  setUserName: (name: string) => void;

  // Scene state
  timeOfDay: TimeOfDay;
  setTimeOfDay: (time: TimeOfDay) => void;
  qualityTier: QualityTier;
  setQualityTier: (tier: QualityTier) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  
  // Camera & Interaction
  cameraFocusTarget: CameraFocusTarget;
  setCameraFocusTarget: (target: CameraFocusTarget) => void;
  mousePos: { x: number; y: number };
  setMousePos: (pos: { x: number; y: number }) => void;

  // Painter Live Sync State
  activePainterColor: string;
  setActivePainterColor: (color: string) => void;
  painterProgress: number; // 0 to 1
  setPainterProgress: (progress: number) => void;
  brushPosition: { x: number; y: number; isDrawing: boolean };
  setBrushPosition: (pos: { x: number; y: number; isDrawing: boolean }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  authMode: 'login',
  setAuthMode: (authMode) => set({ authMode }),
  isSubmitting: false,
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  isSuccess: false,
  setIsSuccess: (isSuccess) => set({ isSuccess }),
  userEmail: '',
  setUserEmail: (userEmail) => set({ userEmail }),
  userName: '',
  setUserName: (userName) => set({ userName }),

  timeOfDay: 'golden',
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  qualityTier: 'high',
  setQualityTier: (qualityTier) => set({ qualityTier }),
  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  cameraFocusTarget: 'default',
  setCameraFocusTarget: (cameraFocusTarget) => set({ cameraFocusTarget }),
  mousePos: { x: 0, y: 0 },
  setMousePos: (mousePos) => set({ mousePos }),

  activePainterColor: '#D9765B',
  setActivePainterColor: (activePainterColor) => set({ activePainterColor }),
  painterProgress: 0,
  setPainterProgress: (painterProgress) => set({ painterProgress }),
  brushPosition: { x: 0.5, y: 0.5, isDrawing: false },
  setBrushPosition: (brushPosition) => set({ brushPosition }),
}));
