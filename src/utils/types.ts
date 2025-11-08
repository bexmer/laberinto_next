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

export interface GenerationSettings {
  width: number;
  height: number;
  algorithm: 'grid' | 'hex';
  cellSize: number;
}
