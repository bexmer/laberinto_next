export interface Point {
  x: number;
  y: number;
}

export interface WallShape {
  path: Point[];
}

export interface MazeData {
  canvas_width: number;
  canvas_height: number;
  walls: WallShape[];
}

export interface GenerationSettings {
  width: number;
  height: number;
  algorithm: 'grid' | 'hex';
  passage_size: number;
  wall_thickness: number;
  wall_style: 'grid' | 'curved' | 'angled' | 'organic mix';
  shape_variance: number; // 0.0 a 1.0
}
