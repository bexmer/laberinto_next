'use client';

import { useMemo, useState } from 'react';
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

  const presets = useMemo(
    () => [
      {
        label: 'Clásico',
        values: {
          width: 20,
          height: 20,
          algorithm: 'grid' as const,
          passage_size: 12,
          wall_thickness: 8,
          wall_style: 'grid' as const,
          shape_variance: 0.1,
        },
      },
      {
        label: 'Orgánico',
        values: {
          width: 18,
          height: 18,
          algorithm: 'grid' as const,
          passage_size: 16,
          wall_thickness: 10,
          wall_style: 'organic mix' as const,
          shape_variance: 0.75,
        },
      },
      {
        label: 'Hex Chill',
        values: {
          width: 16,
          height: 14,
          algorithm: 'hex' as const,
          passage_size: 14,
          wall_thickness: 10,
          wall_style: 'grid' as const,
          shape_variance: 0,
        },
      },
    ],
    [],
  );

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

  const handlePreset = (index: number) => {
    const preset = presets[index];
    if (!preset) return;
    setSettings(preset.values);
  };

  const gridControlsDisabledClass = isGrid
    ? ''
    : 'pointer-events-none opacity-40 grayscale';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-lg"
    >
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Configuración rápida
        </h2>
        <p className="text-base text-slate-200">
          Selecciona un preset para comenzar o ajusta cada parámetro a tu gusto.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          {presets.map((preset, index) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePreset(index)}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-blue-400 hover:bg-blue-500/20 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controles de Cuadrícula */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="flex flex-col text-sm sm:text-base">
          <span className="mb-2 text-base font-semibold text-slate-200">
            Ancho (Columnas)
          </span>
          <input
            type="number"
            name="width"
            value={settings.width}
            onChange={handleChange}
            className="rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-base text-slate-100 shadow-inner focus:border-blue-400 focus:outline-none"
            min={2}
          />
        </label>
        <label className="flex flex-col text-sm sm:text-base">
          <span className="mb-2 text-base font-semibold text-slate-200">
            Alto (Filas)
          </span>
          <input
            type="number"
            name="height"
            value={settings.height}
            onChange={handleChange}
            className="rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-base text-slate-100 shadow-inner focus:border-blue-400 focus:outline-none"
            min={2}
          />
        </label>
      </div>

      {/* Selector de Algoritmo */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Algoritmo
        </span>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Cuadrícula', value: 'grid' as const },
            { label: 'Hexagonal', value: 'hex' as const },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  algorithm: option.value,
                }))
              }
              className={`rounded-2xl border px-5 py-3 text-base font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
                settings.algorithm === option.value
                  ? 'border-blue-400/60 bg-blue-500/20 text-white shadow-lg'
                  : 'border-white/5 bg-white/5 text-slate-200 hover:border-blue-400/40'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          La opción hexagonal ignora los estilos de pared personalizados.
        </p>
      </div>

      {/* Controles de Estilo (Solo para Grid) */}
      <div className={`space-y-6 rounded-2xl border border-white/10 bg-slate-900/50 p-5 ${gridControlsDisabledClass}`}>
        <h3 className="text-lg font-semibold text-slate-200">Estética del laberinto</h3>
        <label className="flex flex-col gap-3 text-sm sm:text-base">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-200">Grosor de Pared</span>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-sm text-slate-100">
              {settings.wall_thickness} px
            </span>
          </div>
          <input
            type="range"
            name="wall_thickness"
            disabled={!isGrid}
            value={settings.wall_thickness}
            onChange={handleChange}
            min={1}
            max={40}
            className="h-3 cursor-pointer rounded-full accent-blue-400"
          />
        </label>

        <label className="flex flex-col gap-3 text-sm sm:text-base">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-200">Ancho de Pasillo</span>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-sm text-slate-100">
              {settings.passage_size} px
            </span>
          </div>
          <input
            type="range"
            name="passage_size"
            disabled={!isGrid}
            value={settings.passage_size}
            onChange={handleChange}
            min={1}
            max={60}
            className="h-3 cursor-pointer rounded-full accent-blue-400"
          />
        </label>

        <label className="flex flex-col gap-3 text-sm sm:text-base">
          <span className="font-semibold text-slate-200">Estilo de Pared</span>
          <select
            name="wall_style"
            disabled={!isGrid}
            value={settings.wall_style}
            onChange={handleChange}
            className="rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-3 text-base text-slate-100 focus:border-blue-400 focus:outline-none"
          >
            <option value="grid">Cuadrado</option>
            <option value="curved">Curvo</option>
            <option value="angled">Angulado</option>
            <option value="organic mix">Mixto Orgánico</option>
          </select>
        </label>

        <label className="flex flex-col gap-3 text-sm sm:text-base">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-200">Variación de Forma</span>
            <span className="rounded-full bg-slate-950 px-3 py-1 text-sm text-slate-100">
              {Math.round(settings.shape_variance * 100)}%
            </span>
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
            className="h-3 cursor-pointer rounded-full accent-blue-400"
          />
        </label>
      </div>

      <button
        type="submit"
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-4 text-lg font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
      >
        <span className="relative z-10">
          {isLoading ? 'Generando laberinto...' : 'Generar laberinto'}
        </span>
        <div className="absolute inset-0 -translate-x-full bg-white/20 transition group-hover:translate-x-0" />
      </button>
    </form>
  );
};

export default SettingsForm;
