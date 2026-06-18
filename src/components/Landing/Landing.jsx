import React from "react";
import "./Landing.css"; // ¡Importante importar el CSS que vamos a crear!

export default function Landing({ onLaunch }) {
  return (
    <div className="landing-container">

      {/* CABECERA */}
      {/* CABECERA CORREGIDA EN YOUR LANDING.JSX */}
      <header className="landing-header">
        <div className="logo-group">
          {/* Cargamos directamente tu archivo original para que sea idéntico */}
          <img
            src="/favicon.svg"
            alt="VISION3D Logo"
            className="logo-icon"
            style={{ width: "24px", height: "24px", display: "block" }}
          />

          <span className="logo-text">VISION3D</span>
          <span className="version-badge">Portfolio</span>
        </div>
        <nav className="landing-nav">
          <a href="https://github.com/tu-usuario/vision3d" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      {/* HERO SECTION */}
      <main className="hero-section">
        <h1 className="hero-title">
          Visualiza e inspecciona modelos <span>3D Gratis</span>
        </h1>
        <p className="hero-subtitle">
          Convierte cualquier archivo (GLB, GLTF, STL, OBJ) en una experiencia interactiva al instante. Accede a tus proyectos desde cualquier dispositivo, en cualquier momento.
        </p>

        {/* BOTÓN MÁGICO QUE ABRE EL DASHBOARD */}
        <div className="cta-container">
          <button className="cta-button" onClick={onLaunch}>
            Probar ahora / Empezar gratis.
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </button>
        </div>
      </main>

      {/* FOOTER / CARACTERÍSTICAS */}
      <footer className="landing-footer">
        <div className="features-grid">
          <div className="feature-card">
            <h3>React Three Fiber</h3>
            <p>Renderizado optimizado de escenas y gestión de memoria GPU.</p>
          </div>
          <div className="feature-card">
            <h3>Algoritmo de Explosión</h3>
            <p>Descomposición jerárquica de mallas en tiempo real mediante cálculos vectoriales.</p>
          </div>
          <div className="feature-card">
            <h3>CSS Nativo</h3>
            <p>Interfaz moderna, responsiva y orientada a la experiencia de usuario (UX).</p>
          </div>
        </div>
      </footer>
    </div>
  );
}