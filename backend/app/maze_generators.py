import random
from typing import List, Tuple

import numpy as np
from .schemas import MazeCell


def generate_grid_maze(
    width: int,
    height: int,
    passage_size: int,
    wall_thickness: int,
) -> dict:
    # Matriz para rastrear celdas visitadas
    visited = np.zeros((height, width), dtype=bool)
    # Matriz para almacenar los pasillos (bitmask)
    # 1:N, 2:E, 4:S, 8:W
    cells_data = np.zeros((height, width), dtype=int)

    stack: List[Tuple[int, int]] = [
        (random.randint(0, height - 1), random.randint(0, width - 1))
    ]  # (y, x)
    visited[stack[0][0], stack[0][1]] = True

    while stack:
        y, x = stack[-1]
        neighbors: List[Tuple[int, int, int, int]] = []  # (ny, nx, dir_actual, dir_opuesta)

        # Norte
        if y > 0 and not visited[y - 1, x]:
            neighbors.append((y - 1, x, 1, 4))
        # Este
        if x < width - 1 and not visited[y, x + 1]:
            neighbors.append((y, x + 1, 2, 8))
        # Sur
        if y < height - 1 and not visited[y + 1, x]:
            neighbors.append((y + 1, x, 4, 1))
        # Oeste
        if x > 0 and not visited[y, x - 1]:
            neighbors.append((y, x - 1, 8, 2))

        if neighbors:
            ny, nx, dir_current, dir_neighbor = random.choice(neighbors)

            cells_data[y, x] |= dir_current
            cells_data[ny, nx] |= dir_neighbor

            visited[ny, nx] = True
            stack.append((ny, nx))
        else:
            stack.pop()

    final_cells: List[MazeCell] = []
    for r in range(height):
        for c in range(width):
            final_cells.append(MazeCell(x=c, y=r, open_walls=int(cells_data[r, c])))

    # Calcular el tamaño del canvas (esta es la única lógica "visual")
    canvas_w = width * passage_size + (width + 1) * wall_thickness
    canvas_h = height * passage_size + (height + 1) * wall_thickness

    return {
        "cells": final_cells,
        "grid_width": width,
        "grid_height": height,
        "passage_size": passage_size,
        "wall_thickness": wall_thickness,
        "canvas_width": float(canvas_w),
        "canvas_height": float(canvas_h),
    }


# (Omitimos el generador hexagonal por ahora para centrarnos en la lógica correcta)
