export interface Point {
  x: number;
  y: number;
}

export interface WallSegment {
  start: Point;
  end: Point;
}

export interface MazeData {
  canvas_width: number;
  canvas_height: number;
  walls: WallSegment[];
}

// --- INTERFAZ ACTUALIZADA ---
export interface GenerationSettings {
  width: number;
  height: number;
  algorithm: 'grid' | 'hex';
  // 'cellSize' se reemplaza por estos dos:
  passage_size: number;
  wall_thickness: number;
  // Nuevas opciones de estilo:
  wall_style: 'grid' | 'curved' | 'angled' | 'organic mix';
  shape_variance: number; // 0.0 a 1.0
}
