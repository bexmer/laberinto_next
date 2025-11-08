from pydantic import BaseModel
from typing import List


class Point(BaseModel):
    x: float
    y: float


class WallShape(BaseModel):
    path: List[Point]


class MazeData(BaseModel):
    canvas_width: float
    canvas_height: float
    walls: List[WallShape]
