export interface Point {
  x: number;
  y: number;
}

export interface MazeCell {
  x: number;
  y: number;
  open_walls: number; // Bitmask 1:N, 2:E, 4:S, 8:W
}

export interface MazeData {
  canvas_width: number;
  canvas_height: number;
  cells: MazeCell[];
  grid_width: number;
  grid_height: number;
  passage_size: number;
  wall_thickness: number;
}

export interface GenerationSettings {
  width: number;
  height: number;
  algorithm: 'grid' | 'hex';
  passage_size: number;
  wall_thickness: number;
  wall_style: 'grid' | 'curved' | 'angled' | 'organic mix';
  shape_variance: number; // 0.0 (0%) a 1.0 (100%)
  render_style: 'corridors' | 'wire' | 'delta';
}
