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
  colCenters: number[]; // Centros de pasillos (columnas)
  rowCenters: number[]; // Centros de pasillos (filas)
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
  // Columnas: Muro, Pasillo, Muro, Pasillo, ..., Muro
  const cols = gridWidth * 2 + 1;

  for (let i = 0; i < cols; i++) {
    colStarts.push(colOffset);
    const width = i % 2 === 0 ? wallThickness : passageSize;
    colWidths.push(width);
    colOffset += width;
  }

  const rowHeights: number[] = [];
  const rowStarts: number[] = [];
  let rowOffset = 0;
  // Filas: Muro, Pasillo, Muro, Pasillo, ..., Muro
  const rows = gridHeight * 2 + 1;

  for (let i = 0; i < rows; i++) {
    rowStarts.push(rowOffset);
    const height = i % 2 === 0 ? wallThickness : passageSize;
    rowHeights.push(height);
    rowOffset += height;
  }

  // Calcular centros de pasillos (nodos)
  const colCenters: number[] = [];
  for (let i = 0; i < gridWidth; i++) {
    const colIndex = i * 2 + 1; // 1, 3, 5...
    colCenters.push(colStarts[colIndex] + colWidths[colIndex] / 2);
  }
  const rowCenters: number[] = [];
  for (let i = 0; i < gridHeight; i++) {
    const rowIndex = i * 2 + 1; // 1, 3, 5...
    rowCenters.push(rowStarts[rowIndex] + rowHeights[rowIndex] / 2);
  }

  return { colWidths, colStarts, rowHeights, rowStarts, colCenters, rowCenters };
};

const buildGridFromCells = (
  cells: MazeData['cells'],
  width: number,
  height: number,
): MazeCell[][] => {
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ x: 0, y: 0, open_walls: 0 })),
  );

  cells.forEach((cell) => {
    grid[cell.y][cell.x] = cell;
  });

  return grid;
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
): { pointA: Point; pointB: Point; trimA: number; trimB: number } | null => {
  const halfPassageA = passageSize / 2;
  const halfPassageB = passageSize / 2;

  // Lógica de ángulos
  const angle = randomInRange(30, 75); // Ángulos variados
  const angleRad = (angle * Math.PI) / 180;
  const tangent = Math.tan(angleRad);
  if (!Number.isFinite(tangent) || tangent <= 0) return null;

  let along = Math.min(halfPassageA, halfPassageB / tangent);
  let perp = along * tangent;

  // Aplicar varianza
  const scale = 0.4 + variance * (0.4 + Math.random() * 0.2);
  along *= scale;
  perp *= scale;

  // Recalcular si se pasa de los límites
  if (perp > halfPassageB) {
    const ratio = halfPassageB / perp;
    perp = halfPassageB;
    along *= ratio;
  }
  if (along > halfPassageA) {
    const ratio = halfPassageA / along;
    along = halfPassageA;
    perp *= ratio;
  }

  const minUseful = halfPassageA * 0.15;
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

  // Punto en la dirección A
  const pointA = {
    x: centerX + (infoA.axis === 'x' ? infoA.sign * along : 0),
    y: centerY + (infoA.axis === 'y' ? infoA.sign * along : 0),
  };

  // Punto en la dirección B
  const pointB = {
    x: centerX + (infoB.axis === 'x' ? infoB.sign * perp : 0),
    y: centerY + (infoB.axis === 'y' ? infoB.sign * perp : 0),
  };

  // Cuánto "recortar" de las líneas rectas
  const trimA = infoA.axis === 'x' ? Math.abs(pointA.x - centerX) : Math.abs(pointA.y - centerY);
  const trimB = infoB.axis === 'x' ? Math.abs(pointB.x - centerX) : Math.abs(pointB.y - centerY);

  return { pointA, pointB, trimA, trimB };
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

  // 1. Convertir celdas a una matriz 2D para fácil acceso
  const grid = buildGridFromCells(cells, grid_width, grid_height);

  // 2. Calcular el layout
  const layout = getRenderLayout(grid_width, grid_height, passage_size, wall_thickness);
  const { colCenters, rowCenters } = layout;

  // 3. Preparar el canvas para dibujar
  ctx.strokeStyle = 'white';
  ctx.lineWidth = wall_thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const useStyle = wall_style !== 'grid' && shape_variance > 0;

  // Almacenes para la geometría de las esquinas
  const nodeConnections: Record<string, string[]> = {};
  const nodeTrims: Record<string, Record<string, number>> = {};

  // 4. Calcular la geometría de las esquinas PRIMERO
  if (useStyle) {
    for (let y = 0; y < grid_height; y++) {
      for (let x = 0; x < grid_width; x++) {
        const cell = grid[y][x];
        const key = `${x},${y}`;
        nodeConnections[key] = [];
        nodeTrims[key] = {};

        const cx = colCenters[x];
        const cy = rowCenters[y];

        const connections: string[] = [];
        if (cell.open_walls & E) connections.push('east');
        if (cell.open_walls & S) connections.push('south');
        if (cell.open_walls & W) connections.push('west');
        if (cell.open_walls & N) connections.push('north');
        nodeConnections[key] = connections;

        if (connections.length < 2) continue;

        // Definir pares de esquinas de 90 grados
        const pairs: [
          ('east' | 'west' | 'south' | 'north'),
          ('east' | 'west' | 'south' | 'north'),
        ][] = [
          ['east', 'south'],
          ['south', 'west'],
          ['west', 'north'],
          ['north', 'east'],
        ];

        for (const [dirA, dirB] of pairs) {
          if (connections.includes(dirA) && connections.includes(dirB)) {
            // Esta celda tiene una esquina (ej. Este y Sur)
            const corner = computeCornerGeometry(
              cx,
              cy,
              passage_size,
              shape_variance,
              dirA,
              dirB,
            );
            if (corner) {
              // Guardar cuánto debemos "recortar" la línea recta
              nodeTrims[key][dirA] = Math.max(nodeTrims[key][dirA] ?? 0, corner.trimA);
              nodeTrims[key][dirB] = Math.max(nodeTrims[key][dirB] ?? 0, corner.trimB);
            }
          }
        }
      }
    }
  }

  // 5. Dibujar los pasillos (líneas rectas recortadas)
  for (let y = 0; y < grid_height; y++) {
    for (let x = 0; x < grid_width; x++) {
      const cell = grid[y][x];
      const cx = colCenters[x];
      const cy = rowCenters[y];
      const key = `${x},${y}`;

      // Dibujar pasillo al ESTE
      if (cell.open_walls & E && x < grid_width - 1) {
        const trimStart = nodeTrims[key]?.['east'] ?? 0;
        const trimEnd = nodeTrims[`${x + 1},${y}`]?.['west'] ?? 0;
        ctx.beginPath();
        ctx.moveTo(cx + trimStart, cy);
        ctx.lineTo(colCenters[x + 1] - trimEnd, cy);
        ctx.stroke();
      }

      // Dibujar pasillo al SUR
      if (cell.open_walls & S && y < grid_height - 1) {
        const trimStart = nodeTrims[key]?.['south'] ?? 0;
        const trimEnd = nodeTrims[`${x},${y + 1}`]?.['north'] ?? 0;
        ctx.beginPath();
        ctx.moveTo(cx, cy + trimStart);
        ctx.lineTo(cx, rowCenters[y + 1] - trimEnd);
        ctx.stroke();
      }

      // (Los pasillos Norte y Oeste son dibujados por las celdas anteriores)
    }
  }

  // 6. Dibujar las esquinas estilizadas (curvas o ángulos)
  if (useStyle) {
    for (let y = 0; y < grid_height; y++) {
      for (let x = 0; x < grid_width; x++) {
        const key = `${x},${y}`;
        const connections = nodeConnections[key];
        if (connections.length < 2) continue; // No es una esquina

        const cx = colCenters[x];
        const cy = rowCenters[y];

        let style = wall_style;
        if (style === 'organic mix') {
          style = Math.random() < 0.5 ? 'curved' : 'angled';
        }

        const pairs: [
          ('east' | 'west' | 'south' | 'north'),
          ('east' | 'west' | 'south' | 'north'),
        ][] = [
          ['east', 'south'],
          ['south', 'west'],
          ['west', 'north'],
          ['north', 'east'],
        ];

        for (const [dirA, dirB] of pairs) {
          if (connections.includes(dirA) && connections.includes(dirB)) {
            // Volvemos a calcular la geometría para obtener los puntos A y B
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
                // Conexión recta para 'angled'
                ctx.lineTo(corner.pointB.x, corner.pointB.y);
              } else {
                // Conexión curva para 'curved'
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

const drawWireMaze = (ctx: CanvasRenderingContext2D, mazeData: MazeData) => {
  const { cells, grid_width, grid_height, passage_size, wall_thickness } = mazeData;

  const E = 2;
  const S = 4;

  const { colCenters, rowCenters } = getRenderLayout(
    grid_width,
    grid_height,
    passage_size,
    wall_thickness,
  );

  ctx.strokeStyle = '#b3b3b3';
  ctx.lineWidth = Math.max(1, Math.round(passage_size * 0.08));
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  const grid = buildGridFromCells(cells, grid_width, grid_height);

  for (let y = 0; y < grid_height; y++) {
    for (let x = 0; x < grid_width; x++) {
      const cell = grid[y][x];
      const cx = colCenters[x];
      const cy = rowCenters[y];

      if (cell.open_walls & E && x < grid_width - 1) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(colCenters[x + 1], cy);
        ctx.stroke();
      }

      if (cell.open_walls & S && y < grid_height - 1) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, rowCenters[y + 1]);
        ctx.stroke();
      }
    }
  }
};

const drawDeltaMaze = (ctx: CanvasRenderingContext2D, mazeData: MazeData) => {
  const { cells, grid_width, grid_height, passage_size, wall_thickness } = mazeData;

  const grid = buildGridFromCells(cells, grid_width, grid_height);
  const layout = getRenderLayout(grid_width, grid_height, passage_size, wall_thickness);
  const { colCenters, rowCenters } = layout;

  const stroke = Math.max(1, Math.round(passage_size * 0.18));
  const amplitude = (passage_size + wall_thickness) * 0.45;
  const trimRatio = 0.55;

  ctx.strokeStyle = '#111111';
  ctx.lineWidth = stroke;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  const drawRoundedPeak = (start: Point, apex: Point, end: Point) => {
    const vecToStart = { x: apex.x - start.x, y: apex.y - start.y };
    const vecToEnd = { x: apex.x - end.x, y: apex.y - end.y };
    const lenToStart = Math.hypot(vecToStart.x, vecToStart.y);
    const lenToEnd = Math.hypot(vecToEnd.x, vecToEnd.y);

    if (lenToStart === 0 || lenToEnd === 0) {
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      return;
    }

    const trimStart = lenToStart * trimRatio;
    const trimEnd = lenToEnd * trimRatio;

    const beforeApex: Point = {
      x: apex.x - (vecToStart.x / lenToStart) * trimStart,
      y: apex.y - (vecToStart.y / lenToStart) * trimStart,
    };
    const afterApex: Point = {
      x: apex.x - (vecToEnd.x / lenToEnd) * trimEnd,
      y: apex.y - (vecToEnd.y / lenToEnd) * trimEnd,
    };

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(beforeApex.x, beforeApex.y);
    ctx.quadraticCurveTo(apex.x, apex.y, afterApex.x, afterApex.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  for (let y = 0; y < grid_height; y++) {
    for (let x = 0; x < grid_width; x++) {
      const cell = grid[y][x];
      const cx = colCenters[x];
      const cy = rowCenters[y];
      const parity = (x + y) % 2 === 0 ? 1 : -1;

      if (cell.open_walls & 2 && x < grid_width - 1) {
        const nx = colCenters[x + 1];
        const apex: Point = {
          x: (cx + nx) / 2,
          y: cy + parity * amplitude,
        };
        drawRoundedPeak({ x: cx, y: cy }, apex, { x: nx, y: cy });
      }

      if (cell.open_walls & 4 && y < grid_height - 1) {
        const ny = rowCenters[y + 1];
        const apex: Point = {
          x: cx + parity * amplitude,
          y: (cy + ny) / 2,
        };
        drawRoundedPeak({ x: cx, y: cy }, apex, { x: cx, y: ny });
      }
    }
  }

  // Añadir contorno exterior para asemejar la referencia
  ctx.lineWidth = stroke;
  ctx.beginPath();
  ctx.rect(
    stroke,
    stroke,
    mazeData.canvas_width - stroke * 2,
    mazeData.canvas_height - stroke * 2,
  );
  ctx.stroke();
};

// --- EL COMPONENTE CANVAS PRINCIPAL ---

const MazeCanvas = ({ mazeData, settings }: MazeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Si no hay datos, no dibujar nada
    if (!mazeData || !settings) {
      const fallbackBg = settings?.render_style === 'delta'
        ? '#ffffff'
        : settings?.render_style === 'wire'
          ? '#f8fafc'
          : '#111827';
      context.fillStyle = fallbackBg;
      context.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const { canvas_width, canvas_height } = mazeData;
    const backgroundColor = settings.render_style === 'wire'
      ? '#f8fafc'
      : settings.render_style === 'delta'
        ? '#ffffff'
        : '#111827';

    // Ajustar el tamaño del canvas
    canvas.width = canvas_width;
    canvas.height = canvas_height;

    // Volver a limpiar con el tamaño y color correctos
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // --- Decidir qué lógica de dibujo usar ---
    if (settings.algorithm === 'grid') {
      if (settings.render_style === 'wire') {
        drawWireMaze(context, mazeData);
      } else if (settings.render_style === 'delta') {
        drawDeltaMaze(context, mazeData);
      } else {
        drawStylizedGridMaze(context, mazeData, settings);
      }
    } else {
      // (Aquí iría la lógica de dibujo para 'hex', que por ahora está pendiente)
      context.font = '16px Arial';
      context.fillStyle =
        settings.render_style === 'wire'
          ? '#1f2937'
          : settings.render_style === 'delta'
            ? '#111827'
            : 'white';
      context.textAlign = 'center';
      context.fillText(
        'El generador Hexagonal aún no está implementado para el dibujado.',
        canvas_width / 2,
        canvas_height / 2,
      );
    }
  }, [mazeData, settings]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto bg-gray-900 rounded-lg"
      // Quitamos 'image-rendering: pixelated' para que las curvas se vean suaves
    />
  );
};

export default MazeCanvas;
