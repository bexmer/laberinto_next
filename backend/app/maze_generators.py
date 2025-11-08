import math
import random
from typing import Dict, List, Tuple, Set, Literal

import numpy as np
from .schemas import Point, WallShape

# --- Tipos para claridad ---
WallStyle = Literal["grid", "curved", "angled", "organic mix"]
WallCell = Tuple[float, float, float, float]  # (x, y, w, h)
Path = List[Point]


# --- LÓGICA DE ESTILIZACIÓN DE PAREDES ---

def _get_rect_path(rect: WallCell) -> Path:
    """Devuelve los vértices de un rectángulo simple."""
    x, y, w, h = rect
    return [
        Point(x=x, y=y),
        Point(x=x + w, y=y),
        Point(x=x + w, y=y + h),
        Point(x=x, y=y + h),
    ]


def _approximate_curve(
    x1: float,
    y1: float,
    cx: float,
    cy: float,
    x2: float,
    y2: float,
    segments: int = 4,
) -> List[Point]:
    """Aproxima una curva de Bézier cuadrática con segmentos de línea."""
    points: List[Point] = []
    for i in range(1, segments + 1):
        t = i / segments
        inv_t = 1 - t
        xt = inv_t**2 * x1 + 2 * inv_t * t * cx + t**2 * x2
        yt = inv_t**2 * y1 + 2 * inv_t * t * cy + t**2 * y2
        points.append(Point(x=xt, y=yt))
    return points


def _get_curved_path(rect: WallCell, variance: float) -> Path:
    """Crea un path cerrado con esquinas redondeadas aleatoriamente."""
    x, y, w, h = rect
    max_radius = min(w, h) * 0.5 * variance
    if max_radius <= 0:
        return _get_rect_path(rect)

    r = {
        "tl": max(0, random.uniform(0, max_radius)),
        "tr": max(0, random.uniform(0, max_radius)),
        "br": max(0, random.uniform(0, max_radius)),
        "bl": max(0, random.uniform(0, max_radius)),
    }

    path: Path = []
    # Borde superior
    path.append(Point(x=x + r["tl"], y=y))
    path.append(Point(x=x + w - r["tr"], y=y))
    path.extend(
        _approximate_curve(
            x + w - r["tr"],
            y,
            x + w,
            y,
            x + w,
            y + r["tr"],
        )
    )
    # Borde derecho
    path.append(Point(x=x + w, y=y + h - r["br"]))
    path.extend(
        _approximate_curve(
            x + w,
            y + h - r["br"],
            x + w,
            y + h,
            x + w - r["br"],
            y + h,
        )
    )
    # Borde inferior
    path.append(Point(x=x + r["bl"], y=y + h))
    path.extend(
        _approximate_curve(
            x + r["bl"],
            y + h,
            x,
            y + h,
            x,
            y + h - r["bl"],
        )
    )
    # Borde izquierdo
    path.append(Point(x=x, y=y + r["tl"]))
    path.extend(
        _approximate_curve(
            x,
            y + r["tl"],
            x,
            y,
            x + r["tl"],
            y,
        )
    )

    return path


def _get_angled_path(rect: WallCell, variance: float) -> Path:
    """Crea un path cerrado con esquinas biseladas aleatoriamente."""
    x, y, w, h = rect
    h_limit = min(w / 2, w * 0.5 * variance)
    v_limit = min(h / 2, h * 0.5 * variance)
    if h_limit <= 0 and v_limit <= 0:
        return _get_rect_path(rect)

    off = lambda limit: random.uniform(0, limit) if limit > 0 else 0

    tl = (off(h_limit), off(v_limit))
    tr = (off(h_limit), off(v_limit))
    br = (off(h_limit), off(v_limit))
    bl = (off(h_limit), off(v_limit))

    return [
        Point(x=x + tl[0], y=y),
        Point(x=x + w - tr[0], y=y),
        Point(x=x + w, y=y + tr[1]),
        Point(x=x + w, y=y + h - br[1]),
        Point(x=x + w - br[0], y=y + h),
        Point(x=x + bl[0], y=y + h),
        Point(x=x, y=y + h - bl[1]),
        Point(x=x, y=y + tl[1]),
    ]


def _generate_wall_path(rect: WallCell, style: WallStyle, variance: float) -> Path:
    """Selecciona el estilo de pared correspondiente."""

    if style == "organic mix":
        style = random.choice(["curved", "angled"])

    if style == "curved":
        return _get_curved_path(rect, variance)
    if style == "angled":
        return _get_angled_path(rect, variance)

    return _get_rect_path(rect)


# --- LÓGICA DEL GENERADOR DE CUADRÍCULA ---

def generate_grid_maze(
    width: int,
    height: int,
    passage_size: int,
    wall_thickness: int,
    wall_style: WallStyle,
    shape_variance: float,
) -> dict:

    visited = np.zeros((height, width), dtype=bool)
    passages: Set[Tuple[int, int, str]] = set()
    stack: List[Tuple[int, int]] = [(0, 0)]
    visited[0, 0] = True

    while stack:
        y, x = stack[-1]
        neighbors: List[Tuple[int, int, Tuple[int, int, str], Tuple[int, int, str]]] = []

        if y > 0 and not visited[y - 1, x]:
            neighbors.append((y - 1, x, (y, x, "H"), (y - 1, x, "H")))  # Norte
        if y < height - 1 and not visited[y + 1, x]:
            neighbors.append((y + 1, x, (y + 1, x, "H"), (y + 1, x, "H")))  # Sur
        if x > 0 and not visited[y, x - 1]:
            neighbors.append((y, x - 1, (y, x, "V"), (y, x - 1, "V")))  # Oeste
        if x < width - 1 and not visited[y, x + 1]:
            neighbors.append((y, x + 1, (y, x + 1, "V"), (y, x + 1, "V")))  # Este

        if neighbors:
            ny, nx, wall_current, wall_neighbor = random.choice(neighbors)
            passages.add(wall_current)
            passages.add(wall_neighbor)
            visited[ny, nx] = True
            stack.append((ny, nx))
        else:
            stack.pop()

    wall_cells: List[WallCell] = []

    for r in range(height + 1):
        for c in range(width):
            if (r, c, "H") not in passages:
                x = c * (passage_size + wall_thickness)
                y = r * (passage_size + wall_thickness) - wall_thickness
                w = passage_size + (2 * wall_thickness)
                h = wall_thickness
                wall_cells.append((x, y, w, h))

    for r in range(height):
        for c in range(width + 1):
            if (r, c, "V") not in passages:
                x = c * (passage_size + wall_thickness) - wall_thickness
                y = r * (passage_size + wall_thickness)
                w = wall_thickness
                h = passage_size + (2 * wall_thickness)
                wall_cells.append((x, y, w, h))

    final_wall_shapes: List[WallShape] = []
    for rect in wall_cells:
        path = _generate_wall_path(rect, wall_style, shape_variance)
        final_wall_shapes.append(WallShape(path=path))

    canvas_w = width * passage_size + (width + 1) * wall_thickness
    canvas_h = height * passage_size + (height + 1) * wall_thickness

    return {
        "canvas_width": float(canvas_w),
        "canvas_height": float(canvas_h),
        "walls": final_wall_shapes,
    }


# --- LÓGICA DEL GENERADOR HEXAGONAL ---

HexWalls = Dict[Tuple[int, int], set]


def _initialize_hex_walls(width: int, height: int) -> HexWalls:
    walls: HexWalls = {}
    for r in range(height):
        for c in range(width):
            walls[(c, r)] = set(range(6))
    return walls


def _hex_neighbors(c: int, r: int) -> Tuple[Tuple[int, int], ...]:
    if r % 2 == 1:  # Fila impar
        return (
            (c + 1, r),  # E
            (c, r - 1),  # NE
            (c - 1, r - 1),  # NW
            (c - 1, r),  # W
            (c - 1, r + 1),  # SW
            (c, r + 1),  # SE
        )
    else:  # Fila par
        return (
            (c + 1, r),  # E
            (c + 1, r - 1),  # NE
            (c, r - 1),  # NW
            (c - 1, r),  # W
            (c, r + 1),  # SW
            (c + 1, r + 1),  # SE
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
    w = math.sqrt(3) * size
    h = 2 * size
    x = (c * w) + (w / 2 if r % 2 == 1 else 0)
    y = r * h * 0.75
    return float(x), float(y)


def _hex_vertices(cx: float, cy: float, size: int) -> List[Tuple[float, float]]:
    vertices: List[Tuple[float, float]] = []
    for i in range(6):
        angle = math.radians(60 * i)
        vx = cx + size * math.cos(angle)
        vy = cy + size * math.sin(angle)
        vertices.append((vx, vy))
    return vertices


_HEX_EDGE_VERTICES = {
    0: (0, 1),
    1: (1, 2),
    2: (2, 3),
    3: (3, 4),
    4: (4, 5),
    5: (5, 0),
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

    raw_paths: List[Path] = []
    min_x = float("inf")
    max_x = float("-inf")
    min_y = float("inf")
    max_y = float("-inf")

    padding = cell_size

    for r in range(height):
        for c in range(width):
            cx, cy = _hex_center(c, r, cell_size)
            vertices = _hex_vertices(cx, cy, cell_size)

            for direction in walls[(c, r)]:
                start_idx, end_idx = _HEX_EDGE_VERTICES[direction]
                start = vertices[start_idx]
                end = vertices[end_idx]

                start_point = Point(x=start[0], y=start[1])
                end_point = Point(x=end[0], y=end[1])
                raw_paths.append([start_point, end_point])

                min_x = min(min_x, start_point.x, end_point.x)
                max_x = max(max_x, start_point.x, end_point.x)
                min_y = min(min_y, start_point.y, end_point.y)
                max_y = max(max_y, start_point.y, end_point.y)

    if not raw_paths:
        return {"canvas_width": 0.0, "canvas_height": 0.0, "walls": []}

    shift_x = -min_x + padding
    shift_y = -min_y + padding

    final_wall_shapes: List[WallShape] = []
    for path in raw_paths:
        shifted_path = [
            Point(x=point.x + shift_x, y=point.y + shift_y) for point in path
        ]
        final_wall_shapes.append(WallShape(path=shifted_path))

    canvas_width = (max_x - min_x) + (2 * padding)
    canvas_height = (max_y - min_y) + (2 * padding)

    return {
        "canvas_width": float(canvas_width),
        "canvas_height": float(canvas_height),
        "walls": final_wall_shapes,
    }
