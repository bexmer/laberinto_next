from pydantic import BaseModel
from typing import List

# Cada celda tendrá un número (bitmask) que indica
# qué paredes están "abiertas" (PASILLOS)
# 1: Norte, 2: Este, 4: Sur, 8: Oeste
class MazeCell(BaseModel):
    x: int
    y: int
    open_walls: int  # Bitmask


class MazeGenerationResponse(BaseModel):
    # La matriz de celdas lógicas
    cells: List[MazeCell]
    # La configuración usada, para que el frontend pueda dibujar
    grid_width: int
    grid_height: int
    passage_size: int
    wall_thickness: int
    canvas_width: float
    canvas_height: float
