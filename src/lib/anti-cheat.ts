// Anti-cheat system for the secure test page
// Runs on mount and cannot be disabled by participants

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

export function initAntiCheat(onViolation: ViolationCallback): () => void {
  const cleanupFns: (() => void)[] = [];

  // Block right click
  const handleContextMenu = (e: Event) => {
    e.preventDefault();
  };
  document.addEventListener('contextmenu', handleContextMenu);
  cleanupFns.push(() => document.removeEventListener('contextmenu', handleContextMenu));

  // Block keyboard shortcuts
  const handleKeydown = (e: KeyboardEvent) => {
    const blockedShortcuts = [
      e.ctrlKey && ['c', 'v', 'x', 's', 'p', 'u', 'a'].includes(e.key.toLowerCase()),
      e.key === 'F12',
      e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()),
      e.altKey && e.key === 'Tab',
      e.key === 'PrintScreen',
      e.metaKey && ['c', 'v', 'x'].includes(e.key.toLowerCase()),
    ];

    if (blockedShortcuts.some(Boolean)) {
      e.preventDefault();
      e.stopPropagation();
      onViolation('keyboard_shortcut');
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
      onViolation('tab_switch');
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  cleanupFns.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));

  // Window blur
  const handleBlur = () => {
    onViolation('window_blur');
  };
  window.addEventListener('blur', handleBlur);
  cleanupFns.push(() => window.removeEventListener('blur', handleBlur));

  // Fullscreen exit
  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      onViolation('fullscreen_exit');
    }
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  cleanupFns.push(() => document.removeEventListener('fullscreenchange', handleFullscreenChange));

  // Enter fullscreen
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      onViolation('fullscreen_denied');
    }
  };
  enterFullscreen();

  // DevTools detection (best effort)
  const threshold = 160;
  const detectDevTools = () => {
    if (
      window.outerWidth - window.innerWidth > threshold ||
      window.outerHeight - window.innerHeight > threshold
    ) {
      onViolation('devtools_detected');
    }
  };
  const devToolsInterval = setInterval(detectDevTools, 1000);
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
    // Exit fullscreen on cleanup
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };
}

// Request fullscreen explicitly
export async function requestFullscreen(): Promise<boolean> {
  try {
    await document.documentElement.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}
