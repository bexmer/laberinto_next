from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .maze_generators import generate_grid_maze
from .schemas import MazeGenerationResponse

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


@app.get("/generate-maze", response_model=MazeGenerationResponse)
def generate_maze(
    width: int = 20,
    height: int = 20,
    algorithm: str = "grid",
    passage_size: int = 10,
    wall_thickness: int = 10,
    wall_style: str = "organic mix",
    shape_variance: float = 0.55,
):
    # (Por ahora, 'algorithm' y 'wall_style' se ignoran en el backend
    # ya que la lógica de estilo estará en el frontend)

    maze_dict = generate_grid_maze(
        width=width,
        height=height,
        passage_size=passage_size,
        wall_thickness=wall_thickness,
    )
    return MazeGenerationResponse(**maze_dict)
