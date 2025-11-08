from pydantic import BaseModel
from typing import List


class Point(BaseModel):
    x: float
    y: float


class WallSegment(BaseModel):
    start: Point
    end: Point


class MazeData(BaseModel):
    canvas_width: float
    canvas_height: float
    walls: List[WallSegment]
