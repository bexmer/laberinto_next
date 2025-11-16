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

    context.fillStyle = '#111827';
    context.fillRect(0, 0, canvas_width, canvas_height);

    context.strokeStyle = 'white';
    context.lineWidth = 2;
    context.lineCap = 'round';

    walls.forEach((segment) => {
      context.beginPath();
      context.moveTo(segment.start.x, segment.start.y);
      context.lineTo(segment.end.x, segment.end.y);
      context.stroke();
    });
  }, [mazeData]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

export default MazeCanvas;
