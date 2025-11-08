'use client';

import { useState } from 'react';
import type { GenerationSettings } from '../utils/types';

type SettingsFormProps = {
  onGenerate: (settings: GenerationSettings) => void;
  isLoading: boolean;
};

const SettingsForm = ({ onGenerate, isLoading }: SettingsFormProps) => {
  const [settings, setSettings] = useState<GenerationSettings>({
    width: 20,
    height: 20,
    algorithm: 'grid',
    cellSize: 15,
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]:
        name === 'algorithm' ? (value as GenerationSettings['algorithm']) : Number(value),
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onGenerate(settings);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-4 rounded-lg shadow-md space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">Ancho</span>
          <input
            type="number"
            name="width"
            value={settings.width}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            min={1}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">Alto</span>
          <input
            type="number"
            name="height"
            value={settings.height}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            min={1}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">Tamaño de celda</span>
          <input
            type="number"
            name="cellSize"
            value={settings.cellSize}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            min={1}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">Algoritmo</span>
          <select
            name="algorithm"
            value={settings.algorithm}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="grid">Cuadrícula</option>
            <option value="hex">Hexagonal</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900"
        disabled={isLoading}
      >
        {isLoading ? 'Generando...' : 'Generar Laberinto'}
      </button>
    </form>
  );
};

export default SettingsForm;
