'use client';

import { useState } from 'react';
import type { GenerationSettings } from '../utils/types';

type SettingsFormProps = {
  onGenerate: (settings: GenerationSettings) => void;
  isLoading: boolean;
};

const SettingsForm = ({ onGenerate, isLoading }: SettingsFormProps) => {
  // --- Estado inicial actualizado ---
  const [settings, setSettings] = useState<GenerationSettings>({
    width: 20,
    height: 20,
    algorithm: 'grid',
    passage_size: 10,
    wall_thickness: 10,
    wall_style: 'organic mix',
    shape_variance: 0.55, // 55%
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? Number(value)
          : type === 'range'
            ? name === 'shape_variance'
              ? Number(value) / 100 // Convertir 0-100 a 0.0-1.0 únicamente para la variación
              : Number(value)
            : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Si el algoritmo es 'hex', los estilos de pared no aplican.
    // Ajustamos la configuración antes de enviarla.
    const finalSettings = { ...settings };
    if (finalSettings.algorithm === 'hex') {
      finalSettings.wall_style = 'grid';
      finalSettings.shape_variance = 0;
    }
    
    onGenerate(finalSettings);
  };
  
  // Deshabilitar estilos si el algoritmo es 'hex'
  const isGrid = settings.algorithm === 'grid';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-4 rounded-lg shadow-md space-y-4"
    >
      {/* Controles de Cuadrícula */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">Ancho (Columnas)</span>
          <input
            type="number"
            name="width"
            value={settings.width}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            min={2}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">Alto (Filas)</span>
          <input
            type="number"
            name="height"
            value={settings.height}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            min={2}
          />
        </label>
      </div>

      {/* Selector de Algoritmo */}
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">Algoritmo</span>
        <select
          name="algorithm"
          value={settings.algorithm}
          onChange={handleChange}
          className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
        >
          <option value="grid">Cuadrícula (Estilizado)</option>
          <option value="hex">Hexagonal (Orgánico)</option>
        </select>
      </label>
      
      {/* Controles de Estilo (Solo para Grid) */}
      <div className={`space-y-4 ${!isGrid ? 'opacity-50' : ''}`}>
        <label className="flex flex-col text-sm">
          <div className="flex justify-between">
            <span className="mb-1 font-semibold">Grosor de Pared</span>
            <span className="text-gray-400">{settings.wall_thickness} px</span>
          </div>
          <input
            type="range"
            name="wall_thickness"
            disabled={!isGrid}
            value={settings.wall_thickness}
            onChange={handleChange}
            min={1}
            max={40}
          />
        </label>

        <label className="flex flex-col text-sm">
          <div className="flex justify-between">
            <span className="mb-1 font-semibold">Ancho de Pasillo</span>
            <span className="text-gray-400">{settings.passage_size} px</span>
          </div>
          <input
            type="range"
            name="passage_size"
            disabled={!isGrid}
            value={settings.passage_size}
            onChange={handleChange}
            min={1}
            max={60}
          />
        </label>

        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">Estilo de Pared</span>
          <select
            name="wall_style"
            disabled={!isGrid}
            value={settings.wall_style}
            onChange={handleChange}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="grid">Cuadrado</option>
            <option value="curved">Curvo</option>
            <option value="angled">Angulado</option>
            <option value="organic mix">Mixto Orgánico</option>
          </select>
        </label>

        <label className="flex flex-col text-sm">
           <div className="flex justify-between">
            <span className="mb-1 font-semibold">Variación de Forma</span>
            <span className="text-gray-400">{Math.round(settings.shape_variance * 100)}%</span>
          </div>
          <input
            type="range"
            name="shape_variance"
            disabled={!isGrid}
            // El input range es de 0-100, pero el estado es 0.0-1.0
            value={settings.shape_variance * 100} 
            onChange={handleChange}
            min={0}
            max={100}
          />
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
