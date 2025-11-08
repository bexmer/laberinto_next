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
        throw new Error(`Error al generar el laberinto: ${response.statusText}`);
      }

      const data: MazeData = await response.json();
      setMazeData(data);
    } catch (error) {
      console.error(error);
      alert('No se pudo generar el laberinto. Revisa la consola para más detalles.');
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
