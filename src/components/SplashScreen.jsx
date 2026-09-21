import { useEffect, useRef, useState } from "react";

const basePath = import.meta.env.BASE_URL || "/";
const LOGO_SRC = `${basePath}Logo_BM_Anime_01.png`;
const FALLBACK_LOGO_SRC = `${basePath}logo-instituicao.png`;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');

  .splash-root {
    font-family: 'Nunito', sans-serif;
    min-height: 100vh;
    width: 100%;
    padding: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e8f4fd 0%, #c8e6f7 42%, #d9effd 100%);
    position: relative;
    overflow: hidden;
  }

  .splash-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top left, rgba(255,255,255,0.32), transparent 24%),
                radial-gradient(circle at bottom right, rgba(20,100,180,0.14), transparent 18%);
    pointer-events: none;
  }

  .splash-logo-wrapper {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    text-align: center;
  }

  .splash-logo-container {\n    position: relative;\n    width: 320px;\n    height: 320px;\n    margin-bottom: 16px;\n  }

  .splash-pulse-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    border: 2px solid rgba(30, 100, 180, 0.25);
    transform: translate(-50%, -50%) scale(0.85);
    animation: splashPulseExpand 2.8s ease-out infinite;
    z-index: 0;
    pointer-events: none;
  }

  .splash-pulse-ring:nth-of-type(1) { animation-delay: 0s; }
  .splash-pulse-ring:nth-of-type(2) { animation-delay: 0.9s; }
  .splash-pulse-ring:nth-of-type(3) { animation-delay: 1.8s; }

  @keyframes splashPulseExpand {
    0%   { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
    100% { transform: translate(-50%, -50%) scale(1.95); opacity: 0; }
  }

  .splash-spin-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 2.5px dashed rgba(56, 138, 220, 0.45);
    transform: translate(-50%, -50%);
    animation: splashSpinRing 12s linear infinite;
    z-index: 1;
    pointer-events: none;
  }

  @keyframes splashSpinRing {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to   { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .splash-logo-img {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 168px;
    height: 168px;
    border-radius: 50%;
    object-fit: cover;
    transform: translate(-50%, -50%);
    z-index: 3;
    box-shadow: 0 16px 40px rgba(20, 90, 160, 0.26);
    animation:
      splashLogoEntrance 0.9s ease-out both,
      splashLogoFloat 4s ease-in-out 0.9s infinite;
  }

  @keyframes splashLogoEntrance {
    from { transform: translate(-50%, -50%) scale(0.4) rotate(-15deg); opacity: 0; }
    to   { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
  }

  @keyframes splashLogoFloat {
    0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
    25%      { transform: translate(-50%, -50%) translateY(-11px) rotate(1.5deg); }
    75%      { transform: translate(-50%, -50%) translateY(5px) rotate(-1deg); }
  }

  .splash-title {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    color: #0f4f87;
    letter-spacing: -0.5px;
  }

  .splash-subtitle {
    margin: 0 0 26px;
    color: #3f74ad;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .splash-cta-btn {
    position: relative;
    overflow: hidden;
    background: #1464b4;
    background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.24) 44%, rgba(0, 0, 0, 0.05) 45%, rgba(0, 0, 0, 0.18) 100%);
    background-blend-mode: soft-light;
    color: #ffffff;
    border: 1px solid rgba(7, 48, 96, 0.55);
    border-radius: 12px;
    padding: 14px 40px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.78),
      inset 0 -1px 0 rgba(0, 0, 0, 0.18),
      0 10px 28px rgba(20, 100, 180, 0.28),
      0 0 0 1px rgba(255, 255, 255, 0.28);
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.28);
    transition: transform 0.12s ease, box-shadow 0.18s ease, filter 0.18s ease, background-image 0.18s ease;
  }

  .splash-cta-btn::before {
    content: '';
    position: absolute;
    inset: 1px 1px 50%;
    border-radius: 11px 11px 4px 4px;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.74), rgba(255, 255, 255, 0.08));
    pointer-events: none;
  }

  .splash-cta-btn:hover {
    filter: brightness(1.08) saturate(1.08);
    transform: translateY(-1px);
    background-image: linear-gradient(to bottom, rgba(255, 255, 255, 0.68) 0%, rgba(255, 255, 255, 0.3) 44%, rgba(0, 0, 0, 0.03) 45%, rgba(0, 0, 0, 0.12) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.88),
      inset 0 -1px 0 rgba(0, 0, 0, 0.14),
      0 14px 36px rgba(20, 100, 180, 0.36),
      0 0 0 1px rgba(255, 255, 255, 0.34);
  }

  .splash-cta-btn:active {
    transform: translateY(1px) scale(0.99);
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.16), rgba(255, 255, 255, 0.2));
    box-shadow:
      inset 0 2px 5px rgba(0, 0, 0, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.24),
      0 2px 8px rgba(20, 100, 180, 0.22);
  }

  .splash-tagline {
    margin-top: 18px;
    font-size: 13px;
    color: #547bad;
  }

  .splash-particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(24, 102, 181, 0.22);
    pointer-events: none;
    animation: splashParticleFloat linear infinite;
  }

  @keyframes splashParticleFloat {
    0%   { opacity: 0; transform: translateY(30px) scale(0.8); }
    20%  { opacity: 1; }
    80%  { opacity: 0.45; }
    100% { opacity: 0; transform: translateY(-120px) scale(1.1); }
  }
`;

export default function SplashScreen({ onEnter }) {
  const particlesRef = useRef(null);
  const [logoSrc, setLogoSrc] = useState(LOGO_SRC);

  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    const created = [];
    for (let i = 0; i < 18; i += 1) {
      const el = document.createElement('div');
      el.className = 'splash-particle';
      const size = 6 + Math.random() * 12;
      Object.assign(el.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${8 + Math.random() * 84}%`,
        bottom: `${-20 + Math.random() * 140}%`,
        animationDuration: `${5 + Math.random() * 4}s`,
        animationDelay: `${Math.random() * 5}s`,
      });
      container.appendChild(el);
      created.push(el);
    }

    return () => created.forEach((element) => element.remove());
  }, []);

  return (
    <>
      <style>{css}</style>

      <div className="splash-root">
        <div ref={particlesRef} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />

        <div className="splash-logo-wrapper">
          <div className="splash-logo-container">
            <div className="splash-pulse-ring" />
            <div className="splash-pulse-ring" />
            <div className="splash-pulse-ring" />
            <div className="splash-spin-ring" />
            <img
              className="splash-logo-img"
              src={logoSrc}
              alt="Logo do sistema"
              onError={() => setLogoSrc(FALLBACK_LOGO_SRC)}
            />
          </div>

          <div className="splash-text-block">
            <h1 className="splash-title">Bem-vindo ao Sistema de Doações</h1>
            <p className="splash-subtitle">Consulte, registre e gerencie doações com facilidade</p>
            <button className="splash-cta-btn" type="button" onClick={() => onEnter?.()}>
              Acessar Sistema
            </button>
            <p className="splash-tagline">Clique para prosseguir ao sistema.</p>
          </div>
        </div>
      </div>
    </>
  );
}
