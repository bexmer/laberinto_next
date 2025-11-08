from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .maze_generators import generate_grid_maze, generate_hex_maze
from .schemas import MazeData

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Maze Generator API is running"}


@app.get("/generate-maze", response_model=MazeData)
def generate_maze(
    width: int = 20,
    height: int = 20,
    cell_size: int = 15,
    algorithm: str = "grid",
):
    if algorithm == "hex":
        maze_dict = generate_hex_maze(width, height, cell_size)
    else:
        maze_dict = generate_grid_maze(width, height, cell_size)
    return MazeData(**maze_dict)
