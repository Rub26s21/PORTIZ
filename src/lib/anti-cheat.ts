// Anti-cheat system for the secure test page
// Runs on mount and protects exam integrity without false-positive instant auto-submissions

export type ViolationType =
  | 'tab_switch'
  | 'window_blur'
  | 'fullscreen_exit'
  | 'fullscreen_denied'
  | 'devtools_detected'
  | 'copy_attempt'
  | 'paste_attempt'
  | 'keyboard_shortcut';

type ViolationCallback = (reason: ViolationType) => void;

interface AntiCheatOptions {
  isArmed?: () => boolean;
  cooldownMs?: number;
}

export function initAntiCheat(
  onViolation: ViolationCallback,
  options?: AntiCheatOptions
): () => void {
  const cleanupFns: (() => void)[] = [];
  const cooldownMs = options?.cooldownMs ?? 3500;
  let lastViolationTime = 0;

  const triggerViolation = (type: ViolationType) => {
    // If an arming function was provided, only trigger when armed
    if (options?.isArmed && !options.isArmed()) {
      return;
    }

    const now = Date.now();
    // Cooldown check: prevent multiple simultaneous events (e.g. blur + visibilitychange + resize)
    if (now - lastViolationTime < cooldownMs) {
      return;
    }
    lastViolationTime = now;
    onViolation(type);
  };

  // Block right click
  const handleContextMenu = (e: Event) => {
    e.preventDefault();
  };
  document.addEventListener('contextmenu', handleContextMenu);
  cleanupFns.push(() => document.removeEventListener('contextmenu', handleContextMenu));

  // Block keyboard shortcuts (Ctrl+C, Ctrl+V, F12, PrintScreen, Alt+Tab, etc.)
  const handleKeydown = (e: KeyboardEvent) => {
    const key = e.key ? e.key.toLowerCase() : '';
    const blockedShortcuts = [
      (e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 's', 'p', 'u', 'a'].includes(key),
      key === 'f12',
      (e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key),
      e.altKey && key === 'tab',
      key === 'printscreen',
    ];

    if (blockedShortcuts.some(Boolean)) {
      e.preventDefault();
      e.stopPropagation();
      triggerViolation('keyboard_shortcut');
    }
  };
  document.addEventListener('keydown', handleKeydown, { capture: true });
  cleanupFns.push(() => document.removeEventListener('keydown', handleKeydown, { capture: true }));

  // Block copy/paste/cut/select
  const blockEvents = ['copy', 'paste', 'cut', 'selectstart'] as const;
  blockEvents.forEach((event) => {
    const handler = (e: Event) => {
      e.preventDefault();
    };
    document.addEventListener(event, handler);
    cleanupFns.push(() => document.removeEventListener(event, handler));
  });

  // Tab switch / visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      triggerViolation('tab_switch');
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  cleanupFns.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));

  // Window blur
  const handleBlur = () => {
    // Only fire blur if the document actually lost visibility or focus
    if (!document.hasFocus()) {
      triggerViolation('window_blur');
    }
  };
  window.addEventListener('blur', handleBlur);
  cleanupFns.push(() => window.removeEventListener('blur', handleBlur));

  // Fullscreen exit
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      triggerViolation('fullscreen_exit');
    }
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  cleanupFns.push(() => document.removeEventListener('fullscreenchange', handleFullscreenChange));

  // NOTE: enterFullscreen() is NOT automatically called here because modern browsers
  // block document.documentElement.requestFullscreen() without direct user gestures.
  // Instead, the UI explicitly prompts the user to enter fullscreen with requestFullscreen().

  // DevTools detection (best effort, only when fullscreen is active to avoid DPI false positives)
  const threshold = 220;
  const detectDevTools = () => {
    if (document.fullscreenElement) {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        triggerViolation('devtools_detected');
      }
    }
  };
  const devToolsInterval = setInterval(detectDevTools, 2000);
  cleanupFns.push(() => clearInterval(devToolsInterval));

  // Disable text selection via CSS
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  cleanupFns.push(() => {
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  });

  // Return cleanup function
  return () => {
    cleanupFns.forEach((fn) => fn());
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };
}

// Request fullscreen explicitly via direct user gesture
export async function requestFullscreen(): Promise<boolean> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
    return true;
  } catch {
    return false;
  }
}
