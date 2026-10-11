import { useEffect, useRef, useState } from 'react';

// Pháo giấy chào mừng, chỉ chạy một lần khi mở thiệp.
export default function WelcomeConfetti() {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) { setVisible(false); return; }
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) { setVisible(false); return; }

    const colors = ['#d898a0', '#edbd75', '#8ca98e', '#f4d7b6', '#c6a5cf', '#f7eee3'];
    const particles = [];
    let width = 0;
    let height = 0;
    let frame;
    let previous;
    let elapsed = 0;
    let burst = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
    }
    function fire() {
      const count = width < 600 ? 28 : 45;
      for (const side of [-1, 1]) {
        for (let i = 0; i < count; i++) {
          particles.push({
            x: side === -1 ? width * 0.08 : width * 0.92,
            y: height * 0.78,
            vx: -side * (70 + Math.random() * Math.min(width * 0.6, 480)),
            vy: -(height * 0.65 + Math.random() * height * 0.4),
            size: 5 + Math.random() * 6,
            angle: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 12,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    }
    function draw(time) {
      const dt = previous === undefined ? 0 : Math.min((time - previous) / 1000, 0.04);
      previous = time;
      elapsed += dt;
      if (burst < 3 && elapsed >= burst * 0.45) { fire(); burst++; }
      context.clearRect(0, 0, width, height);
      context.globalAlpha = Math.min(1, Math.max(0, (5 - elapsed) / 0.8));
      for (const particle of particles) {
        particle.vx *= Math.exp(-0.5 * dt);
        particle.vy += height * 0.5 * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.angle += particle.spin * dt;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.angle);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
        context.restore();
      }
      if (elapsed < 5) frame = window.requestAnimationFrame(draw);
      else setVisible(false);
    }
    function stopForReducedMotion() {
      if (preference.matches) {
        window.cancelAnimationFrame(frame);
        setVisible(false);
      }
    }
    resize();
    frame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    preference.addEventListener('change', stopForReducedMotion);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      preference.removeEventListener('change', stopForReducedMotion);
    };
  }, []);

  return visible ? <canvas ref={canvasRef} className="welcome-confetti" aria-hidden="true" /> : null;
}
