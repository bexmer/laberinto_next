from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .maze_generators import generate_grid_maze, generate_hex_maze
from .schemas import MazeData

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite tu frontend en localhost:3000
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
    algorithm: str = "grid",
    # --- Parámetros actualizados ---
    passage_size: int = 10,
    wall_thickness: int = 10,
    wall_style: str = "organic mix",
    shape_variance: float = 0.55,
):
    if algorithm == "hex":
        # El generador hexagonal usará el 'passage_size' como 'cell_size'
        maze_dict = generate_hex_maze(width, height, passage_size)
    else:
        # El generador de cuadrícula ahora usa todas las nuevas opciones
        maze_dict = generate_grid_maze(
            width=width,
            height=height,
            passage_size=passage_size,
            wall_thickness=wall_thickness,
            wall_style=wall_style,
            shape_variance=shape_variance,
        )
    return MazeData(**maze_dict)
