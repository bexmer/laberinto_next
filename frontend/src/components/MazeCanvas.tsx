'use client';

import { useEffect, useRef } from 'react';
import type { MazeData, GenerationSettings, MazeCell, Point } from '../utils/types';

type MazeCanvasProps = {
  mazeData: MazeData | null;
  settings: GenerationSettings | null;
};

// --- INICIO DE LA LÓGICA DE DIBUJO (PORTADA DE MAZE.JS) ---

type Layout = {
  colStarts: number[];
  colWidths: number[];
  rowStarts: number[];
  rowHeights: number[];
  colCenters: number[];
  rowCenters: number[];
};

/**
 * Función auxiliar para obtener un número aleatorio en un rango
 */
const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

/**
 * Calcula las posiciones X, Y, anchos y altos de las filas y columnas
 * de la cuadrícula de renderizado (pasillos y muros).
 */
const getRenderLayout = (
  gridWidth: number,
  gridHeight: number,
  passageSize: number,
  wallThickness: number,
): Layout => {
  const colWidths: number[] = [];
  const colStarts: number[] = [];
  let colOffset = 0;
  const cols = gridWidth * 2 + 1; // Muro, Pasillo, Muro, ...

  for (let i = 0; i < cols; i++) {
    colStarts.push(colOffset);
    const width = i % 2 === 0 ? wallThickness : passageSize;
    colWidths.push(width);
    colOffset += width;
  }

  const rowHeights: number[] = [];
  const rowStarts: number[] = [];
  let rowOffset = 0;
  const rows = gridHeight * 2 + 1; // Muro, Pasillo, Muro, ...

  for (let i = 0; i < rows; i++) {
    rowStarts.push(rowOffset);
    const height = i % 2 === 0 ? wallThickness : passageSize;
    rowHeights.push(height);
    rowOffset += height;
  }

  // Calcular centros de pasillos (nodos)
  const colCenters: number[] = [];
  for (let i = 0; i < gridWidth; i++) {
    const colIndex = i * 2 + 1;
    colCenters.push(colStarts[colIndex] + colWidths[colIndex] / 2);
  }
  const rowCenters: number[] = [];
  for (let i = 0; i < gridHeight; i++) {
    const rowIndex = i * 2 + 1;
    rowCenters.push(rowStarts[rowIndex] + rowHeights[rowIndex] / 2);
  }

  return { colWidths, colStarts, rowHeights, rowStarts, colCenters, rowCenters };
};

/**
 * Calcula la geometría de una esquina con ángulos.
 * (Portado de computeCornerGeometry de maze.js)
 */
const computeCornerGeometry = (
  centerX: number,
  centerY: number,
  passageSize: number,
  variance: number,
  dirA: 'east' | 'west' | 'south' | 'north',
  dirB: 'east' | 'west' | 'south' | 'north',
): { pointA: Point; pointB: Point } | null => {
  const halfPassage = passageSize / 2;

  // Lógica de ángulos
  const angle = randomInRange(30, 60); // Ángulo más conservador
  const angleRad = (angle * Math.PI) / 180;
  const tangent = Math.tan(angleRad);
  if (!Number.isFinite(tangent) || tangent <= 0) return null;

  let along = Math.min(halfPassage, halfPassage / tangent);
  let perp = along * tangent;

  const scale = 0.4 + variance * (0.4 + Math.random() * 0.2);
  along *= scale;
  perp *= scale;

  if (perp > halfPassage) {
    const ratio = halfPassage / perp;
    perp = halfPassage;
    along *= ratio;
  }
  if (along > halfPassage) {
    const ratio = halfPassage / along;
    along = halfPassage;
    perp *= ratio;
  }

  const minUseful = halfPassage * 0.15;
  if (along <= minUseful || perp <= minUseful) {
    return null;
  }

  // Mapeo de direcciones a vectores
  const dirMap = {
    east: { axis: 'x', sign: 1 },
    west: { axis: 'x', sign: -1 },
    south: { axis: 'y', sign: 1 },
    north: { axis: 'y', sign: -1 },
  } as const;

  const infoA = dirMap[dirA];
  const infoB = dirMap[dirB];

  const pointA = {
    x: centerX + (infoA.axis === 'x' ? infoA.sign * along : 0),
    y: centerY + (infoA.axis === 'y' ? infoA.sign * along : 0),
  };

  const pointB = {
    x: centerX + (infoB.axis === 'x' ? infoB.sign * perp : 0),
    y: centerY + (infoB.axis === 'y' ? infoB.sign * perp : 0),
  };

  return { pointA, pointB };
};

/**
 * Dibuja el laberinto de cuadrícula estilizado en el canvas.
 * (Portado de drawStylizedMaze de maze.js)
 */
const drawStylizedGridMaze = (
  ctx: CanvasRenderingContext2D,
  mazeData: MazeData,
  settings: GenerationSettings,
) => {
  const { cells, grid_width, grid_height, passage_size, wall_thickness } = mazeData;
  const { wall_style, shape_variance } = settings;

  const N = 1;
  const E = 2;
  const S = 4;
  const W = 8; // Bitmasks

  // Convertir celdas a una matriz 2D para fácil acceso
  const grid: MazeCell[][] = Array.from({ length: grid_height }, () =>
    Array.from({ length: grid_width }, () => ({ x: 0, y: 0, open_walls: 0 })),
  );
  cells.forEach((cell) => {
    grid[cell.y][cell.x] = cell;
  });

  const layout = getRenderLayout(grid_width, grid_height, passage_size, wall_thickness);
  const { colCenters, rowCenters } = layout;

  ctx.strokeStyle = 'white';
  ctx.lineWidth = wall_thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const useStyle = wall_style !== 'grid' && shape_variance > 0;

  const nodeConnections: Record<string, string[]> = {};
  const nodeTrims: Record<string, Record<string, number>> = {};

  // 1. Calcular la geometría de las esquinas primero
  for (let y = 0; y < grid_height; y++) {
    for (let x = 0; x < grid_width; x++) {
      const cell = grid[y][x];
      const key = `${x},${y}`;
      if (!nodeConnections[key]) nodeConnections[key] = [];
      if (!nodeTrims[key]) nodeTrims[key] = {};

      const cx = colCenters[x];
      const cy = rowCenters[y];

      const connections: string[] = [];
      if (cell.open_walls & E) connections.push('east');
      if (cell.open_walls & S) connections.push('south');
      if (cell.open_walls & W) connections.push('west');
      if (cell.open_walls & N) connections.push('north');
      nodeConnections[key] = connections;

      if (!useStyle || connections.length !== 2) continue;

      // Solo estilizar esquinas de 90 grados
      const pairs: Array<['east' | 'west' | 'south' | 'north', 'east' | 'west' | 'south' | 'north']> = [
        ['east', 'south'],
        ['south', 'west'],
        ['west', 'north'],
        ['north', 'east'],
      ];

      for (const [dirA, dirB] of pairs) {
        if (connections.includes(dirA) && connections.includes(dirB)) {
          const corner = computeCornerGeometry(
            cx,
            cy,
            passage_size,
            shape_variance,
            dirA,
            dirB,
          );
          if (corner) {
            const trimA =
              dirA === 'east' || dirA === 'west'
                ? Math.abs(corner.pointA.x - cx)
                : Math.abs(corner.pointA.y - cy);
            const trimB =
              dirB === 'east' || dirB === 'west'
                ? Math.abs(corner.pointB.x - cx)
                : Math.abs(corner.pointB.y - cy);
            nodeTrims[key][dirA] = (nodeTrims[key][dirA] ?? 0) + trimA;
            nodeTrims[key][dirB] = (nodeTrims[key][dirB] ?? 0) + trimB;
          }
        }
      }
    }
  }

  // 2. Dibujar los pasillos (líneas rectas)
  for (let y = 0; y < grid_height; y++) {
    for (let x = 0; x < grid_width; x++) {
      const cell = grid[y][x];
      const cx = colCenters[x];
      const cy = rowCenters[y];
      const key = `${x},${y}`;

      if (cell.open_walls & E && x < grid_width - 1) {
        const trimStart = nodeTrims[key]['east'] ?? 0;
        const trimEnd = nodeTrims[`${x + 1},${y}`]?.['west'] ?? 0;
        ctx.beginPath();
        ctx.moveTo(cx + trimStart, cy);
        ctx.lineTo(colCenters[x + 1] - trimEnd, cy);
        ctx.stroke();
      }
      if (cell.open_walls & S && y < grid_height - 1) {
        const trimStart = nodeTrims[key]['south'] ?? 0;
        const trimEnd = nodeTrims[`${x},${y + 1}`]?.['north'] ?? 0;
        ctx.beginPath();
        ctx.moveTo(cx, cy + trimStart);
        ctx.lineTo(cx, rowCenters[y + 1] - trimEnd);
        ctx.stroke();
      }
    }
  }

  // 3. Dibujar las esquinas estilizadas
  if (useStyle) {
    for (let y = 0; y < grid_height; y++) {
      for (let x = 0; x < grid_width; x++) {
        const key = `${x},${y}`;
        const connections = nodeConnections[key];
        if (connections.length !== 2) continue;

        const cx = colCenters[x];
        const cy = rowCenters[y];

        let style = wall_style;
        if (style === 'organic mix') style = Math.random() < 0.5 ? 'curved' : 'angled';

        const pairs: Array<['east' | 'west' | 'south' | 'north', 'east' | 'west' | 'south' | 'north']> = [
          ['east', 'south'],
          ['south', 'west'],
          ['west', 'north'],
          ['north', 'east'],
        ];

        for (const [dirA, dirB] of pairs) {
          if (connections.includes(dirA) && connections.includes(dirB)) {
            const corner = computeCornerGeometry(
              cx,
              cy,
              passage_size,
              shape_variance,
              dirA,
              dirB,
            );
            if (corner) {
              ctx.beginPath();
              ctx.moveTo(corner.pointA.x, corner.pointA.y);
              if (style === 'angled') {
                ctx.lineTo(corner.pointB.x, corner.pointB.y);
              } else {
                ctx.quadraticCurveTo(cx, cy, corner.pointB.x, corner.pointB.y);
              }
              ctx.stroke();
            }
          }
        }
      }
    }
  }
};

// --- EL COMPONENTE CANVAS PRINCIPAL ---

const MazeCanvas = ({ mazeData, settings }: MazeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Limpiar canvas con el color de fondo
    context.fillStyle = '#111827'; // bg-gray-900
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (!mazeData || !settings) {
      return; // No hay nada que dibujar
    }

    const { canvas_width, canvas_height } = mazeData;

    // Ajustar el tamaño del canvas
    canvas.width = canvas_width;
    canvas.height = canvas_height;

    // Volver a limpiar con el tamaño y color correctos
    context.fillStyle = '#111827';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // --- Decidir qué lógica de dibujo usar ---
    if (settings.algorithm === 'grid') {
      drawStylizedGridMaze(context, mazeData, settings);
    } else {
      // (Aquí iría la lógica de dibujo para 'hex', que por ahora está pendiente)
    }
  }, [mazeData, settings]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto bg-gray-900 rounded-lg"
    />
  );
};

export default MazeCanvas;
