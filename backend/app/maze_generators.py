import math
import random
from typing import Dict, List, Set, Tuple

import numpy as np

from .schemas import Point, WallSegment

GridWalls = Dict[Tuple[int, int], Set[str]]


def _initialize_grid_walls(width: int, height: int) -> GridWalls:
    walls: GridWalls = {}
    for y in range(height):
        for x in range(width):
            walls[(x, y)] = {"N", "S", "E", "W"}
    return walls


def _remove_grid_wall(
    walls: GridWalls, current: Tuple[int, int], neighbor: Tuple[int, int]
) -> None:
    x, y = current
    nx, ny = neighbor
    dx = nx - x
    dy = ny - y
    if dx == 1:
        walls[(x, y)].discard("E")
        walls[(nx, ny)].discard("W")
    elif dx == -1:
        walls[(x, y)].discard("W")
        walls[(nx, ny)].discard("E")
    elif dy == 1:
        walls[(x, y)].discard("S")
        walls[(nx, ny)].discard("N")
    elif dy == -1:
        walls[(x, y)].discard("N")
        walls[(nx, ny)].discard("S")


def _generate_grid_structure(width: int, height: int) -> GridWalls:
    grid = np.zeros((height, width), dtype=int)
    walls = _initialize_grid_walls(width, height)
    visited = np.zeros_like(grid, dtype=bool)

    stack: List[Tuple[int, int]] = [(0, 0)]
    visited[0, 0] = True

    while stack:
        x, y = stack[-1]
        neighbors: List[Tuple[int, int]] = []
        for dx, dy in [(0, -1), (1, 0), (0, 1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[ny, nx]:
                neighbors.append((nx, ny))

        if neighbors:
            nx, ny = random.choice(neighbors)
            _remove_grid_wall(walls, (x, y), (nx, ny))
            visited[ny, nx] = True
            stack.append((nx, ny))
        else:
            stack.pop()

    return walls


def _grid_wall_rectangles(
    walls: GridWalls,
    width: int,
    height: int,
    passage_size: int,
    wall_thickness: int,
) -> List[Tuple[float, float, float, float]]:
    spacing = passage_size + wall_thickness
    rects: Set[Tuple[float, float, float, float]] = set()

    for y in range(height):
        for x in range(width):
            cell_walls = walls[(x, y)]
            base_x = wall_thickness + x * spacing
            base_y = wall_thickness + y * spacing

            if "N" in cell_walls:
                rects.add(
                    (
                        float(base_x),
                        float(base_y - wall_thickness),
                        float(passage_size),
                        float(wall_thickness),
                    )
                )
            if "S" in cell_walls:
                rects.add(
                    (
                        float(base_x),
                        float(base_y + passage_size),
                        float(passage_size),
                        float(wall_thickness),
                    )
                )
            if "W" in cell_walls:
                rects.add(
                    (
                        float(base_x - wall_thickness),
                        float(base_y),
                        float(wall_thickness),
                        float(passage_size),
                    )
                )
            if "E" in cell_walls:
                rects.add(
                    (
                        float(base_x + passage_size),
                        float(base_y),
                        float(wall_thickness),
                        float(passage_size),
                    )
                )

    return list(rects)


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _seed_from_rect(rect: Tuple[float, float, float, float], style: str) -> int:
    x, y, w, h = rect
    key = (round(x, 3), round(y, 3), round(w, 3), round(h, 3), style)
    return hash(key) & 0xFFFFFFFF


def _points_to_segments(points: List[Tuple[float, float]]) -> List[WallSegment]:
    segments: List[WallSegment] = []
    for start, end in zip(points, points[1:]):
        start_point = Point(x=float(start[0]), y=float(start[1]))
        end_point = Point(x=float(end[0]), y=float(end[1]))
        segments.append(WallSegment(start=start_point, end=end_point))
    return segments


def _create_grid_wall_segments(
    rect: Tuple[float, float, float, float], wall_thickness: int
) -> List[WallSegment]:
    x, y, w, h = rect
    orientation = "horizontal" if w >= h else "vertical"
    step = max(1.0, float(wall_thickness))
    segments: List[WallSegment] = []

    if orientation == "horizontal":
        bands = max(1, int(math.ceil(h / step)))
        positions = np.linspace(y, y + h, bands + 1)
        for pos in positions:
            start = Point(x=float(x), y=float(pos))
            end = Point(x=float(x + w), y=float(pos))
            segments.append(WallSegment(start=start, end=end))
        left = Point(x=float(x), y=float(y))
        right = Point(x=float(x), y=float(y + h))
        segments.append(WallSegment(start=left, end=right))
        left = Point(x=float(x + w), y=float(y))
        right = Point(x=float(x + w), y=float(y + h))
        segments.append(WallSegment(start=left, end=right))
    else:
        bands = max(1, int(math.ceil(w / step)))
        positions = np.linspace(x, x + w, bands + 1)
        for pos in positions:
            start = Point(x=float(pos), y=float(y))
            end = Point(x=float(pos), y=float(y + h))
            segments.append(WallSegment(start=start, end=end))
        top = Point(x=float(x), y=float(y))
        bottom = Point(x=float(x + w), y=float(y))
        segments.append(WallSegment(start=top, end=bottom))
        top = Point(x=float(x), y=float(y + h))
        bottom = Point(x=float(x + w), y=float(y + h))
        segments.append(WallSegment(start=top, end=bottom))

    return segments


def _create_curved_wall_shape(
    rect: Tuple[float, float, float, float],
    wall_thickness: int,
    shape_variance: float,
    style_name: str,
) -> List[WallSegment]:
    x, y, w, h = rect
    orientation = "horizontal" if w >= h else "vertical"
    variance = _clamp(shape_variance, 0.0, 1.0)
    base_thickness = h if orientation == "horizontal" else w
    if base_thickness <= 0:
        return []

    step = max(1.0, float(wall_thickness))
    bands = max(1, int(round(base_thickness / step)))
    length = w if orientation == "horizontal" else h
    segment_count = max(8, int(length / max(4.0, step)))
    amplitude = (base_thickness / 2.0) * variance

    rng = random.Random(_seed_from_rect(rect, style_name))
    segments: List[WallSegment] = []

    for band in range(bands):
        band_spacing = base_thickness / bands
        center_offset = (band + 0.5) * band_spacing
        if bands == 1:
            center_offset = base_thickness / 2.0
        start_coord = y if orientation == "horizontal" else x
        center_line = start_coord + center_offset
        points: List[Tuple[float, float]] = []
        for i in range(segment_count + 1):
            t = i / segment_count
            along = (x + t * w) if orientation == "horizontal" else (y + t * h)
            smooth = math.sin(t * math.pi)
            secondary = math.sin(t * math.pi * 2.0 + rng.uniform(-math.pi, math.pi))
            offset = (smooth + 0.25 * secondary) * amplitude
            offset = _clamp(offset, -band_spacing / 2.0, band_spacing / 2.0)
            if orientation == "horizontal":
                px = along
                py = _clamp(center_line + offset, y, y + h)
            else:
                px = _clamp(center_line + offset, x, x + w)
                py = along
            points.append((px, py))
        segments.extend(_points_to_segments(points))

    return segments


def _create_angled_wall_shape(
    rect: Tuple[float, float, float, float],
    wall_thickness: int,
    shape_variance: float,
    style_name: str,
) -> List[WallSegment]:
    x, y, w, h = rect
    orientation = "horizontal" if w >= h else "vertical"
    variance = _clamp(shape_variance, 0.0, 1.0)
    base_thickness = h if orientation == "horizontal" else w
    if base_thickness <= 0:
        return []

    step = max(1.0, float(wall_thickness))
    bands = max(1, int(round(base_thickness / step)))
    length = w if orientation == "horizontal" else h
    segment_count = max(4, int(length / max(6.0, step)))
    amplitude = (base_thickness / 2.0) * variance

    rng = random.Random(_seed_from_rect(rect, style_name))
    segments: List[WallSegment] = []

    for band in range(bands):
        band_spacing = base_thickness / bands
        center_offset = (band + 0.5) * band_spacing
        if bands == 1:
            center_offset = base_thickness / 2.0
        start_coord = y if orientation == "horizontal" else x
        center_line = start_coord + center_offset
        points: List[Tuple[float, float]] = []
        previous_angle = rng.uniform(-1.0, 1.0)
        for i in range(segment_count + 1):
            t = i / segment_count
            along = (x + t * w) if orientation == "horizontal" else (y + t * h)
            angle_direction = -previous_angle if i % 2 else previous_angle
            jitter = rng.uniform(-1.0, 1.0) * 0.3
            offset = (angle_direction + jitter) * amplitude
            offset = _clamp(offset, -band_spacing / 2.0, band_spacing / 2.0)
            if orientation == "horizontal":
                px = along
                py = _clamp(center_line + offset, y, y + h)
            else:
                px = _clamp(center_line + offset, x, x + w)
                py = along
            points.append((px, py))
        segments.extend(_points_to_segments(points))

    return segments


def _create_organic_wall_shape(
    rect: Tuple[float, float, float, float],
    wall_thickness: int,
    shape_variance: float,
    style_name: str,
) -> List[WallSegment]:
    x, y, w, h = rect
    orientation = "horizontal" if w >= h else "vertical"
    variance = _clamp(shape_variance, 0.0, 1.0)
    base_thickness = h if orientation == "horizontal" else w
    if base_thickness <= 0:
        return []

    step = max(1.0, float(wall_thickness))
    bands = max(1, int(round(base_thickness / step)))
    length = w if orientation == "horizontal" else h
    segment_count = max(10, int(length / max(4.0, step / 2.0)))
    amplitude = (base_thickness / 2.0) * (0.6 + 0.4 * variance)

    rng = random.Random(_seed_from_rect(rect, style_name))
    segments: List[WallSegment] = []

    for band in range(bands):
        band_spacing = base_thickness / bands
        center_offset = (band + 0.5) * band_spacing
        if bands == 1:
            center_offset = base_thickness / 2.0
        start_coord = y if orientation == "horizontal" else x
        center_line = start_coord + center_offset
        points: List[Tuple[float, float]] = []
        cumulative = rng.uniform(0.0, math.pi)
        for i in range(segment_count + 1):
            t = i / segment_count
            along = (x + t * w) if orientation == "horizontal" else (y + t * h)
            noise = rng.uniform(-1.0, 1.0)
            cumulative += variance * 0.8 * noise
            offset = math.sin(t * math.pi * (1.0 + variance)) * amplitude
            offset += math.sin(cumulative) * amplitude * 0.35
            offset += noise * amplitude * 0.15
            offset = _clamp(offset, -band_spacing / 2.0, band_spacing / 2.0)
            if orientation == "horizontal":
                px = along
                py = _clamp(center_line + offset, y, y + h)
            else:
                px = _clamp(center_line + offset, x, x + w)
                py = along
            points.append((px, py))
        segments.extend(_points_to_segments(points))

    return segments


def _render_wall_rectangles(
    rects: List[Tuple[float, float, float, float]],
    wall_style: str,
    wall_thickness: int,
    shape_variance: float,
) -> List[WallSegment]:
    style = wall_style.lower()
    segments: List[WallSegment] = []
    seen: Set[Tuple[float, float, float, float]] = set()

    for rect in rects:
        if rect[2] <= 0 or rect[3] <= 0:
            continue
        if style == "curved":
            rect_segments = _create_curved_wall_shape(rect, wall_thickness, shape_variance, style)
        elif style == "angled":
            rect_segments = _create_angled_wall_shape(rect, wall_thickness, shape_variance, style)
        elif style == "organic":
            rect_segments = _create_organic_wall_shape(rect, wall_thickness, shape_variance, style)
        else:
            rect_segments = _create_grid_wall_segments(rect, wall_thickness)

        for segment in rect_segments:
            key = (
                round(segment.start.x, 4),
                round(segment.start.y, 4),
                round(segment.end.x, 4),
                round(segment.end.y, 4),
            )
            if key not in seen:
                seen.add(key)
                segments.append(segment)

    return segments


def generate_grid_maze(
    width: int,
    height: int,
    passage_size: int,
    wall_thickness: int,
    wall_style: str,
    shape_variance: float,
) -> dict:
    if width <= 0 or height <= 0:
        raise ValueError("Width and height must be positive integers")
    if passage_size <= 0:
        raise ValueError("Passage size must be a positive integer")
    if wall_thickness <= 0:
        raise ValueError("Wall thickness must be a positive integer")

    walls = _generate_grid_structure(width, height)
    rects = _grid_wall_rectangles(walls, width, height, passage_size, wall_thickness)
    segments = _render_wall_rectangles(rects, wall_style, wall_thickness, shape_variance)

    total_width = float(wall_thickness + width * (passage_size + wall_thickness))
    total_height = float(wall_thickness + height * (passage_size + wall_thickness))

    return {
        "canvas_width": total_width,
        "canvas_height": total_height,
        "walls": segments,
    }


HexWalls = Dict[Tuple[int, int], Set[int]]


def _initialize_hex_walls(width: int, height: int) -> HexWalls:
    walls: HexWalls = {}
    for r in range(height):
        for c in range(width):
            walls[(c, r)] = set(range(6))
    return walls


def _hex_neighbors(c: int, r: int) -> Tuple[Tuple[int, int], ...]:
    if r % 2 == 0:
        return (
            (c, r - 1),
            (c + 1, r - 1),
            (c + 1, r),
            (c, r + 1),
            (c - 1, r),
            (c - 1, r - 1),
        )
    return (
        (c, r - 1),
        (c + 1, r),
        (c + 1, r + 1),
        (c, r + 1),
        (c - 1, r + 1),
        (c - 1, r),
    )


def _remove_hex_wall(
    walls: HexWalls, current: Tuple[int, int], neighbor: Tuple[int, int]
) -> None:
    c, r = current
    nc, nr = neighbor
    neighbors = _hex_neighbors(c, r)
    if neighbor not in neighbors:
        return
    direction = neighbors.index(neighbor)
    opposite = {0: 3, 1: 4, 2: 5, 3: 0, 4: 1, 5: 2}[direction]
    walls[(c, r)].discard(direction)
    if (nc, nr) in walls:
        walls[(nc, nr)].discard(opposite)


def _hex_center(c: int, r: int, size: int) -> Tuple[float, float]:
    x = size * math.sqrt(3) * (c + 0.5 * (r % 2))
    y = size * 1.5 * r
    return float(x), float(y)


def _hex_vertices(cx: float, cy: float, size: int) -> List[Tuple[float, float]]:
    vertices: List[Tuple[float, float]] = []
    for i in range(6):
        angle = math.radians(60 * i)
        vx = cx + size * math.cos(angle)
        vy = cy - size * math.sin(angle)
        vertices.append((vx, vy))
    return vertices


_HEX_EDGE_VERTICES = {
    0: (1, 2),  # N
    1: (0, 1),  # NE
    2: (5, 0),  # SE
    3: (4, 5),  # S
    4: (3, 4),  # SW
    5: (2, 3),  # NW
}


def generate_hex_maze(
    width: int,
    height: int,
    passage_size: int,
    wall_thickness: int,
    wall_style: str,
    shape_variance: float,
) -> dict:
    if width <= 0 or height <= 0:
        raise ValueError("Width and height must be positive integers")

    cell_size = passage_size
    walls = _initialize_hex_walls(width, height)
    visited = set()
    stack: List[Tuple[int, int]] = [(0, 0)]
    visited.add((0, 0))

    while stack:
        c, r = stack[-1]
        neighbors = []
        parity_neighbors = _hex_neighbors(c, r)
        for direction, (nc, nr) in enumerate(parity_neighbors):
            if 0 <= nc < width and 0 <= nr < height and (nc, nr) not in visited:
                neighbors.append((nc, nr))

        if neighbors:
            nc, nr = random.choice(neighbors)
            _remove_hex_wall(walls, (c, r), (nc, nr))
            visited.add((nc, nr))
            stack.append((nc, nr))
        else:
            stack.pop()

    raw_segments: List[Tuple[Tuple[float, float], Tuple[float, float]]] = []
    min_x = float("inf")
    max_x = float("-inf")
    min_y = float("inf")
    max_y = float("-inf")

    for r in range(height):
        for c in range(width):
            cx, cy = _hex_center(c, r, cell_size)
            vertices = _hex_vertices(cx, cy, cell_size)
            neighbors = _hex_neighbors(c, r)
            for direction in walls[(c, r)]:
                nc, nr = neighbors[direction]
                if 0 <= nc < width and 0 <= nr < height:
                    if (c, r) > (nc, nr):
                        continue
                start_idx, end_idx = _HEX_EDGE_VERTICES[direction]
                start = vertices[start_idx]
                end = vertices[end_idx]
                min_x = min(min_x, start[0], end[0])
                max_x = max(max_x, start[0], end[0])
                min_y = min(min_y, start[1], end[1])
                max_y = max(max_y, start[1], end[1])
                raw_segments.append((start, end))

    if not raw_segments:
        return {"canvas_width": 0.0, "canvas_height": 0.0, "walls": []}

    shift_x = -min_x if min_x < 0 else 0.0
    shift_y = -min_y if min_y < 0 else 0.0

    wall_segments: List[WallSegment] = []
    seen: Set[Tuple[float, float, float, float]] = set()
    for start, end in raw_segments:
        start_point = Point(x=start[0] + shift_x, y=start[1] + shift_y)
        end_point = Point(x=end[0] + shift_x, y=end[1] + shift_y)
        key = (
            round(start_point.x, 4),
            round(start_point.y, 4),
            round(end_point.x, 4),
            round(end_point.y, 4),
        )
        if key not in seen:
            seen.add(key)
            wall_segments.append(WallSegment(start=start_point, end=end_point))

    canvas_width = max_x + shift_x
    canvas_height = max_y + shift_y

    return {
        "canvas_width": float(canvas_width),
        "canvas_height": float(canvas_height),
        "walls": wall_segments,
    }
