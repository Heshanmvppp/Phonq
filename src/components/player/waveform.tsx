"use client";

import * as React from "react";

import { usePlayer } from "@/components/player/player-context";
import { cn } from "@/lib/utils";

const BAR_COUNT = 48;

/**
 * Live frequency visualizer driven by the shared Web Audio analyser node.
 * When CORS blocks the analyser (or it isn't available) it gracefully
 * falls back to deterministic decorative bars — playback is never affected.
 */
export function Waveform({ className }: { className?: string }) {
  const { analyserRef, vizEnabled, isPlaying } = usePlayer();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let running = true;
    const frequency = new Uint8Array(64);

    const draw = () => {
      if (!running) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      let values: number[];
      const analyser = analyserRef.current;
      if (analyser && vizEnabled) {
        analyser.getByteFrequencyData(frequency);
        values = Array.from(frequency);
      } else {
        const t = Date.now() / 300;
        values = Array.from({ length: BAR_COUNT }, (_, i) => {
          const v = Math.sin(t + i * 0.55) * 0.5 + 0.5;
          return (Math.pow(v, 4) * 0.5 + 0.12) * 255;
        });
      }

      const barWidth = width / BAR_COUNT;
      const gap = Math.max(1, barWidth * 0.3);
      const rootStyles = getComputedStyle(document.documentElement);
      const primary = rootStyles.getPropertyValue("--primary").trim() || "oklch(0.62 0.19 300)";
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, `color-mix(in oklab, ${primary} 55%, white)`);
      gradient.addColorStop(0.55, primary);
      gradient.addColorStop(1, `color-mix(in oklab, ${primary} 72%, black)`);
      ctx.fillStyle = gradient;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const value = values[Math.floor((i / BAR_COUNT) * values.length)] ?? 0;
        const norm = value / 255;
        const barHeight = Math.max(2, norm * height * (isPlaying ? 1 : 0.3));
        const x = i * barWidth + gap / 2;
        ctx.globalAlpha = 0.25 + norm * 0.75;
        ctx.fillRect(x, height - barHeight, barWidth - gap, barHeight);
      }
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [analyserRef, vizEnabled, isPlaying]);

  return <canvas ref={canvasRef} className={cn("pointer-events-none block h-10 w-full", className)} aria-hidden="true" />;
}
