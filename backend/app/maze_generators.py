import math
import random
from typing import Dict, List, Tuple

import numpy as np

from .schemas import Point, WallSegment


GridWalls = Dict[Tuple[int, int], set]


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


def _collect_grid_walls(
    walls: GridWalls, width: int, height: int, cell_size: int
) -> List[WallSegment]:
    wall_segments: List[WallSegment] = []
    for y in range(height):
        for x in range(width):
            cell_walls = walls[(x, y)]
            left = x * cell_size
            right = (x + 1) * cell_size
            top = y * cell_size
            bottom = (y + 1) * cell_size

            if "N" in cell_walls:
                wall_segments.append(
                    WallSegment(
                        start=Point(x=left, y=top),
                        end=Point(x=right, y=top),
                    )
                )
            if "W" in cell_walls:
                wall_segments.append(
                    WallSegment(
                        start=Point(x=left, y=top),
                        end=Point(x=left, y=bottom),
                    )
                )
            if "S" in cell_walls and y == height - 1:
                wall_segments.append(
                    WallSegment(
                        start=Point(x=left, y=bottom),
                        end=Point(x=right, y=bottom),
                    )
                )
            if "E" in cell_walls and x == width - 1:
                wall_segments.append(
                    WallSegment(
                        start=Point(x=right, y=top),
                        end=Point(x=right, y=bottom),
                    )
                )
    return wall_segments


def generate_grid_maze(width: int, height: int, cell_size: int) -> dict:
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

    wall_segments = _collect_grid_walls(walls, width, height, cell_size)

    return {
        "canvas_width": float(width * cell_size),
        "canvas_height": float(height * cell_size),
        "walls": wall_segments,
    }


HexWalls = Dict[Tuple[int, int], set]


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


def generate_hex_maze(width: int, height: int, cell_size: int) -> dict:
    if width <= 0 or height <= 0:
        raise ValueError("Width and height must be positive integers")

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
    for start, end in raw_segments:
        start_point = Point(x=start[0] + shift_x, y=start[1] + shift_y)
        end_point = Point(x=end[0] + shift_x, y=end[1] + shift_y)
        wall_segments.append(WallSegment(start=start_point, end=end_point))

    canvas_width = max_x + shift_x
    canvas_height = max_y + shift_y

    return {
        "canvas_width": float(canvas_width),
        "canvas_height": float(canvas_height),
        "walls": wall_segments,
    }
