'use client';

import { useState } from 'react';
import MazeCanvas from '../components/MazeCanvas';
import SettingsForm from '../components/SettingsForm';
import type { GenerationSettings, MazeData } from '../utils/types';

const HomePage = () => {
  const [mazeData, setMazeData] = useState<MazeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (settings: GenerationSettings) => {
    setIsLoading(true);

    const params = new URLSearchParams({
      width: settings.width.toString(),
      height: settings.height.toString(),
      algorithm: settings.algorithm,
      cellSize: settings.cellSize.toString(),
    });

    const url = `/api/generate-maze?${params.toString()}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Error al generar el laberinto (${response.status})`;

        if (contentType?.includes('application/json')) {
          try {
            const errorBody = (await response.json()) as {
              message?: string;
              details?: string;
            };

            if (errorBody.message) {
              errorMessage = errorBody.message;
            }

            if (errorBody.details) {
              errorMessage = `${errorMessage}. Detalles: ${errorBody.details}`;
            }
          } catch (jsonError) {
            console.error('No se pudo leer la respuesta de error como JSON:', jsonError);
          }
        } else {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `${errorMessage}. Detalles: ${errorText}`;
            }
          } catch (textError) {
            console.error('No se pudo leer la respuesta de error como texto:', textError);
          }
        }

        throw new Error(errorMessage);
      }

      const data: MazeData = await response.json();
      setMazeData(data);
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo generar el laberinto. Revisa la consola para más detalles.';

      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col gap-8 p-8 md:flex-row">
      <div className="w-full md:w-1/3">
        <h1 className="mb-6 text-3xl font-bold">Generador de Laberintos Diversos</h1>
        <SettingsForm onGenerate={handleGenerate} isLoading={isLoading} />
        {isLoading && <p className="mt-4 text-sm text-gray-400">Generando...</p>}
      </div>
      <div className="flex-1">
        <MazeCanvas mazeData={mazeData} />
      </div>
    </main>
  );
};

export default HomePage;
