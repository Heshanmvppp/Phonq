"use client";

import * as React from "react";

import { usePlayer } from "@/components/player/player-context";
import { decorativeWaveform } from "@/lib/waveform";
import { cn } from "@/lib/utils";

const BAR_COUNT = 48;

/**
 * Live frequency visualizer driven by the shared Web Audio analyser node.
 * When CORS blocks the analyser (or it isn't available) it gracefully
 * falls back to deterministic decorative bars — playback is never affected.
 */
export function Waveform({ className }: { className?: string }) {
  const { analyserRef, vizEnabled, isPlaying, seek, duration, currentTime, currentTrack } = usePlayer();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const seekRef = React.useRef(seek);
  const durationRef = React.useRef(duration);
  const trackRef = React.useRef(currentTrack);

  React.useEffect(() => {
    seekRef.current = seek;
    durationRef.current = duration;
  }, [seek, duration]);

  React.useEffect(() => {
    trackRef.current = currentTrack;
  }, [currentTrack]);

  function handleSeek(event: React.PointerEvent<HTMLCanvasElement>) {
    if (durationRef.current <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    seekRef.current(ratio * durationRef.current);
  }

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
        // No live analyser data — e.g. a YouTube track whose native stream fell
        // back to the cross-origin IFrame engine and can't be inspected. Render a
        // stable, per-track decorative profile (deterministic from the track id)
        // that looks like an analyzed waveform instead of an animated placeholder.
        values = decorativeWaveform(trackRef.current?.videoId ?? trackRef.current?.id ?? "");
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
        const hoverBoost = hoveredIndex === null ? 0 : Math.max(0, 1 - Math.abs(i - hoveredIndex) / 3);
        const intensity = Math.min(1, norm * (isPlaying ? 1 : 0.35) + hoverBoost * 0.35);
        const barHeight = Math.max(2, intensity * height * (isPlaying ? 1 : 0.3));
        const x = i * barWidth + gap / 2;
        ctx.globalAlpha = 0.2 + intensity * 0.8;
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
  }, [analyserRef, vizEnabled, isPlaying, hoveredIndex]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("block h-10 w-full cursor-pointer", className)}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration || 0)}
      aria-valuenow={Math.round(currentTime || 0)}
      onPointerDown={handleSeek}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        setHoveredIndex(Math.round(ratio * (BAR_COUNT - 1)));
      }}
      onMouseLeave={() => setHoveredIndex(null)}
    />
  );
}
