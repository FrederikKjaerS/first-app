import { useState, useEffect } from "react";

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  return (navigator as unknown as { standalone?: boolean }).standalone === true;
}

const DISMISSED_KEY = "aftensmad_install_dismissed";

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isIOS() && !isStandalone() && !localStorage.getItem(DISMISSED_KEY)) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="install-prompt" role="dialog" aria-label="Tilføj til hjemmeskærm">
      <button type="button" className="install-close" onClick={dismiss} aria-label="Luk">✕</button>
      <div className="install-icon">🍳</div>
      <div className="install-body">
        <strong className="install-title">Tilføj til hjemmeskærm</strong>
        <p className="install-text">
          Tryk på <span className="install-share-icon" aria-label="Del-ikon">
            <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
              <path d="M8 0L4 4h2.5v8h3V4H12L8 0z"/>
              <path d="M14 7h-2v9H4V7H2v11h12V7z"/>
            </svg>
          </span>{" "}
          og vælg <strong>"Føj til hjemmeskærm"</strong>
        </p>
      </div>
    </div>
  );
}
