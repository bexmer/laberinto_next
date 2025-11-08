'use client';

import { useEffect, useRef } from 'react';
import type { MazeData, WallShape } from '../utils/types';

type MazeCanvasProps = {
  mazeData: MazeData | null;
};

const drawWallShape = (context: CanvasRenderingContext2D, shape: WallShape) => {
  const { path } = shape;
  if (!path || path.length < 2) {
    return;
  }

  context.beginPath();
  context.moveTo(path[0].x, path[0].y);

  for (let i = 1; i < path.length; i += 1) {
    context.lineTo(path[i].x, path[i].y);
  }

  if (path.length > 2) {
    context.closePath();
  }

  context.fill();
};

const MazeCanvas = ({ mazeData }: MazeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    if (!mazeData) {
      canvas.width = 0;
      canvas.height = 0;
      canvas.style.aspectRatio = '1 / 1';
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const { canvas_width, canvas_height, walls } = mazeData;
    const devicePixelRatio = window.devicePixelRatio ?? 1;
    const scaledWidth = canvas_width * devicePixelRatio;
    const scaledHeight = canvas_height * devicePixelRatio;

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.aspectRatio = `${canvas_width} / ${canvas_height}`;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(devicePixelRatio, devicePixelRatio);
    context.clearRect(0, 0, canvas_width, canvas_height);

    context.fillStyle = '#020617';
    context.fillRect(0, 0, canvas_width, canvas_height);

    const isHexMaze =
      walls.length > 0 && walls.every((shape) => shape.path.length === 2);

    if (isHexMaze) {
      context.strokeStyle = '#f8fafc';
      context.lineWidth = Math.max(
        1.8,
        Math.min(4.8, Math.sqrt(canvas_width * canvas_height) / 350),
      );
      context.lineCap = 'round';
      context.lineJoin = 'round';

      walls.forEach((shape) => {
        if (shape.path.length < 2) {
          return;
        }
        const [start, end] = shape.path;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
      });
    } else {
      context.fillStyle = '#f8fafc';
      walls.forEach((shape) => {
        drawWallShape(context, shape);
      });
    }
  }, [mazeData]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!mazeData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-900/40 px-8 text-center">
          <div className="max-w-sm space-y-4">
            <h3 className="text-2xl font-semibold text-slate-100">Genera tu primer laberinto</h3>
            <p className="text-base text-slate-300">
              Define las dimensiones y estilo en el panel izquierdo y pulsa <strong>Generar laberinto</strong> para verlo con nitidez máxima.
            </p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full rounded-2xl bg-slate-950/80 shadow-inner ring-1 ring-white/5"
      />
    </div>
  );
};

export default MazeCanvas;
