'use client';

import { useEffect, useRef } from 'react';
import type { MazeData } from '../utils/types';

type MazeCanvasProps = {
  mazeData: MazeData | null;
};

const MazeCanvas = ({ mazeData }: MazeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mazeData) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const { canvas_width, canvas_height, walls } = mazeData;
    canvas.width = canvas_width;
    canvas.height = canvas_height;

    context.fillStyle = '#0f172a';
    context.fillRect(0, 0, canvas_width, canvas_height);

    context.strokeStyle = '#f8fafc';
    context.lineWidth = 2.5;
    context.lineCap = 'round';

    walls.forEach((segment) => {
      context.beginPath();
      context.moveTo(segment.start.x, segment.start.y);
      context.lineTo(segment.end.x, segment.end.y);
      context.stroke();
    });
  }, [mazeData]);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!mazeData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/20 bg-slate-900/30 text-center">
          <div className="max-w-xs space-y-3 px-6">
            <h3 className="text-lg font-semibold text-slate-100">
              Tu laberinto aparecerá aquí
            </h3>
            <p className="text-sm text-slate-300">
              Ajusta la configuración y presiona &quot;Generar laberinto&quot; para visualizarlo.
            </p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full rounded-3xl bg-slate-900/70 shadow-inner"
        style={{ maxHeight: '70vh' }}
      />
    </div>
  );
};

export default MazeCanvas;
