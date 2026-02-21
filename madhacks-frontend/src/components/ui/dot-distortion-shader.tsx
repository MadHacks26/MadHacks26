// "use client";

// import * as React from "react";
// type DotDistortionShaderProps = {
//   className?: string;

//   // Visual
//   background?: string; // canvas clear color (set to transparent if you want)
//   dotColor?: string; // "rgba(...)"
//   glowColor?: string; // "rgba(...)"

//   // Grid
//   gap?: number; // px between dots
//   dotRadius?: number; // px

//   // Interaction
//   influenceRadius?: number; // px (mouse effect radius)
//   strength?: number; // how hard dots are pushed
//   returnSpeed?: number; // spring strength back to origin
//   damping?: number; // velocity damping (0..1)
//   twinkle?: boolean;
// };

// type Dot = {
//   ox: number;
//   oy: number;
//   x: number;
//   y: number;
//   vx: number;
//   vy: number;
//   glow: number;
//   tw: number;
// };

// export function DotDistortionShader({
//   className,
//   background = "rgba(0,0,0,0)",

//   // Subtle, dark-friendly defaults (2 hues max: bluish + violet)
//   dotColor = "rgba(226,232,240,0.22)", // slate-200-ish
//   glowColor = "rgba(99,102,241,0.14)", // indigo glow

//   gap = 28,
//   dotRadius = 1.35,

//   influenceRadius = 140,
//   strength = 0.85,
//   returnSpeed = 0.055,
//   damping = 0.86,

//   twinkle = true,
// }: DotDistortionShaderProps) {
//   const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
//   const rafRef = React.useRef<number | null>(null);

//   const dotsRef = React.useRef<Dot[]>([]);
//   const mouseRef = React.useRef<{ x: number; y: number; active: boolean }>({
//     x: 0,
//     y: 0,
//     active: false,
//   });

//   const dprRef = React.useRef<number>(1);

//   const rebuild = React.useCallback(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const parent = canvas.parentElement;
//     if (!parent) return;

//     const rect = parent.getBoundingClientRect();
//     const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
//     dprRef.current = dpr;

//     canvas.width = Math.floor(rect.width * dpr);
//     canvas.height = Math.floor(rect.height * dpr);
//     canvas.style.width = `${rect.width}px`;
//     canvas.style.height = `${rect.height}px`;

//     const dots: Dot[] = [];
//     const w = rect.width;
//     const h = rect.height;

//     // Center the grid nicely
//     const cols = Math.ceil(w / gap);
//     const rows = Math.ceil(h / gap);
//     const x0 = (w - (cols - 1) * gap) / 2;
//     const y0 = (h - (rows - 1) * gap) / 2;

//     for (let r = 0; r < rows; r++) {
//       for (let c = 0; c < cols; c++) {
//         const ox = x0 + c * gap;
//         const oy = y0 + r * gap;

//         dots.push({
//           ox,
//           oy,
//           x: ox,
//           y: oy,
//           vx: 0,
//           vy: 0,
//           glow: 0,
//           tw: Math.random() * Math.PI * 2,
//         });
//       }
//     }

//     dotsRef.current = dots;
//   }, [gap]);

//   const animate = React.useCallback(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     const parent = canvas.parentElement;
//     if (!parent) return;

//     const rect = parent.getBoundingClientRect();
//     const dpr = dprRef.current;

//     const w = rect.width;
//     const h = rect.height;

//     // Clear
//     ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
//     ctx.clearRect(0, 0, w, h);
//     if (background !== "rgba(0,0,0,0)") {
//       ctx.fillStyle = background;
//       ctx.fillRect(0, 0, w, h);
//     }

//     const { x: mx, y: my, active } = mouseRef.current;

//     const dots = dotsRef.current;
//     const r = influenceRadius;

//     // Draw settings
//     ctx.fillStyle = dotColor;

//     for (let i = 0; i < dots.length; i++) {
//       const d = dots[i];

//       // Mouse push (if active)
//       if (active) {
//         const dx = d.x - mx;
//         const dy = d.y - my;
//         const dist = Math.hypot(dx, dy);

//         if (dist > 0.0001 && dist < r) {
//           const t = 1 - dist / r; // 0..1
//           const nx = dx / dist;
//           const ny = dy / dist;

//           // Push away from cursor
//           const force = t * t * strength * 6.0;
//           d.vx += nx * force;
//           d.vy += ny * force;

//           // Glow when close
//           d.glow = Math.min(1, d.glow + t * 0.12);
//         }
//       }

//       // Spring back to origin
//       const sx = (d.ox - d.x) * returnSpeed;
//       const sy = (d.oy - d.y) * returnSpeed;
//       d.vx += sx;
//       d.vy += sy;

//       // Damping
//       d.vx *= damping;
//       d.vy *= damping;

//       // Integrate
//       d.x += d.vx;
//       d.y += d.vy;

//       // Twinkle (very subtle)
//       if (twinkle) {
//         d.tw += 0.02 + (i % 7) * 0.0004;
//         const pulse = (Math.sin(d.tw) + 1) * 0.5; // 0..1
//         d.glow = Math.max(d.glow * 0.96, pulse * 0.18);
//       } else {
//         d.glow *= 0.94;
//       }

//       // Draw dot + glow
//       if (d.glow > 0.02) {
//         ctx.save();
//         ctx.shadowColor = glowColor;
//         ctx.shadowBlur = 14 * d.glow;
//         ctx.beginPath();
//         ctx.arc(d.x, d.y, dotRadius + d.glow * 1.2, 0, Math.PI * 2);
//         ctx.fill();
//         ctx.restore();
//       }

//       ctx.beginPath();
//       ctx.arc(d.x, d.y, dotRadius, 0, Math.PI * 2);
//       ctx.fill();
//     }

//     rafRef.current = window.requestAnimationFrame(animate);
//   }, [
//     background,
//     dotColor,
//     glowColor,
//     dotRadius,
//     influenceRadius,
//     strength,
//     returnSpeed,
//     damping,
//     twinkle,
//   ]);

//   React.useEffect(() => {
//     rebuild();
//     rafRef.current = window.requestAnimationFrame(animate);

//     const onResize = () => rebuild();
//     window.addEventListener("resize", onResize);

//     return () => {
//       window.removeEventListener("resize", onResize);
//       if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
//     };
//   }, [rebuild, animate]);

//   return (
//     <canvas
//       ref={canvasRef}
//       className="absolute inset-0 h-full w-full"
//       onPointerMove={(e) => {
//         const rect = (e.currentTarget.parentElement ?? e.currentTarget).getBoundingClientRect();
//         mouseRef.current.x = e.clientX - rect.left;
//         mouseRef.current.y = e.clientY - rect.top;
//         mouseRef.current.active = true;
//       }}
//       onPointerLeave={() => {
//         mouseRef.current.active = false;
//       }}
//     />
//   );
// }