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
    passage_size: 10,
    wall_thickness: 10,
    wall_style: 'organic mix',
    shape_variance: 0.55, // 0.0 a 1.0
    render_style: 'wire',
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;

    let processedValue: string | number = value;

    if (name === 'algorithm') {
      processedValue = value as GenerationSettings['algorithm'];
    } else if (name === 'render_style') {
      processedValue = value as GenerationSettings['render_style'];
    } else if (type === 'number') {
      processedValue = Number(value);
    } else if (type === 'range' && name === 'shape_variance') {
      processedValue = Number(value) / 100; // Convertir 0-100 a 0.0-1.0
    } else if (type === 'range') {
      processedValue = Number(value);
    }

    setSettings((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onGenerate(settings);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold text-gray-300">Ancho (Columnas)</span>
          <input
            type="number" name="width" value={settings.width} onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            min={3}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold text-gray-300">Alto (Filas)</span>
          <input
            type="number" name="height" value={settings.height} onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            min={3}
          />
        </label>
      </div>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold text-gray-300">Algoritmo</span>
        <select
          name="algorithm" value={settings.algorithm} onChange={handleChange}
          className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="grid">Cuadrícula (Estilizado)</option>
          <option value="hex" disabled>Hexagonal (Próximamente)</option>
        </select>
      </label>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold text-gray-300">Modo de Renderizado</span>
        <select
          name="render_style"
          value={settings.render_style}
          onChange={handleChange}
          className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="wire">Pasillos finos (Wire)</option>
          <option value="corridors">Pasillos con grosor</option>
        </select>
      </label>

      <div className="space-y-4 border-t border-gray-700 pt-4">
        <label className="flex flex-col text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-300">Grosor de Pared</span>
            <span className="text-gray-400">{settings.wall_thickness} px</span>
          </div>
          <input
            type="range" name="wall_thickness" value={settings.wall_thickness} onChange={handleChange}
            min={1} max={40} className="w-full"
          />
        </label>

        <label className="flex flex-col text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-300">Ancho de Pasillo</span>
            <span className="text-gray-400">{settings.passage_size} px</span>
          </div>
          <input
            type="range" name="passage_size" value={settings.passage_size} onChange={handleChange}
            min={1} max={60} className="w-full"
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold text-gray-300">Estilo de Pared</span>
          <select
            name="wall_style" value={settings.wall_style} onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="grid">Recto</option>
            <option value="curved">Curvo</option>
            <option value="angled">Angulado</option>
            <option value="organic mix">Mixto Orgánico</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-300">Variación de Forma</span>
            <span className="text-gray-400">{Math.round(settings.shape_variance * 100)}%</span>
          </div>
          <input
            type="range" name="shape_variance"
            value={settings.shape_variance * 100}
            onChange={handleChange}
            min={0} max={100} className="w-full"
          />
        </label>
      </div>

      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900"
        disabled={isLoading}
      >
        {isLoading ? 'Generando...' : 'Generar Laberinto'}
      </button>
    </form>
  );
};

export default SettingsForm;
