'use client';

import { useState } from 'react';
import MazeCanvas from '../components/MazeCanvas';
import SettingsForm from '../components/SettingsForm';
import type { GenerationSettings, MazeData } from '../utils/types';

const HomePage = () => {
  const [mazeData, setMazeData] = useState<MazeData | null>(null);
  const [lastSettings, setLastSettings] = useState<GenerationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (settings: GenerationSettings) => {
    setIsLoading(true);

    const params = new URLSearchParams({
      width: settings.width.toString(),
      height: settings.height.toString(),
      algorithm: settings.algorithm,
      passage_size: settings.passage_size.toString(),
      wall_thickness: settings.wall_thickness.toString(),
      wall_style: settings.wall_style,
      shape_variance: settings.shape_variance.toString(),
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
      setLastSettings(settings);
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

  const hasMaze = Boolean(mazeData);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-900 px-4 py-12 text-slate-100 sm:px-6 lg:px-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 lg:flex-row">
        <section className="w-full max-w-xl space-y-8 lg:sticky lg:top-12 lg:self-start">
          <header className="space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur">
            <p className="text-sm uppercase tracking-[0.35em] text-blue-300/90">Genera y exporta</p>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Diseña laberintos de alta precisión
            </h1>
            <p className="text-base text-slate-200">
              Ajusta las dimensiones y estilos con controles intuitivos. El resultado se dibuja a máxima nitidez para que puedas imprimirlo o integrarlo a tus proyectos creativos.
            </p>
          </header>
          <SettingsForm onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        <section className="flex flex-1 flex-col gap-8">
          <div className="relative w-full max-w-4xl">
            <div className="aspect-square w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur">
              <MazeCanvas mazeData={mazeData} />
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-white/5" />
          </div>

          <div className="grid gap-5 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-base text-slate-200 shadow-xl backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">Detalle de la última generación</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Algoritmo</p>
                <p className="text-lg font-medium text-white">
                  {lastSettings ? formatAlgorithmLabel(lastSettings) : 'Listo para generar'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Dimensiones renderizadas</p>
                <p className="text-lg font-medium text-white">
                  {hasMaze
                    ? `${Math.round(mazeData!.canvas_width)} × ${Math.round(mazeData!.canvas_height)} px`
                    : 'Pendiente de generación'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Segmentos de pared</p>
                <p className="text-lg font-medium text-white">
                  {hasMaze ? mazeData!.walls.length.toLocaleString('es-ES') : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Configuración aplicada</p>
                <p className="text-base text-slate-300">
                  {lastSettings
                    ? describeSettings(lastSettings)
                    : 'Selecciona un preset o ajusta los parámetros para comenzar.'}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Consejo</p>
                <p className="text-base text-slate-300">
                  Combina pasillos amplios con variaciones suaves para resultados orgánicos, o usa paredes finas y variación baja para un laberinto técnico listo para fabricación.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

const formatAlgorithmLabel = (settings: GenerationSettings) =>
  settings.algorithm === 'hex'
    ? 'Hexagonal orgánico'
    : `Cuadrícula (${formatWallStyle(settings.wall_style)})`;

const describeSettings = (settings: GenerationSettings) => {
  if (settings.algorithm === 'hex') {
    return `${settings.width} × ${settings.height} celdas con pasillos de ${settings.passage_size}px.`;
  }

  const shape = `${Math.round(settings.shape_variance * 100)}% de variación`;
  return `${settings.width} × ${settings.height} celdas, pasillos de ${settings.passage_size}px, paredes de ${settings.wall_thickness}px, estilo ${formatWallStyle(settings.wall_style)} con ${shape}.`;
};

const formatWallStyle = (style: GenerationSettings['wall_style']) => {
  switch (style) {
    case 'grid':
      return 'cuadrado';
    case 'curved':
      return 'curvo';
    case 'angled':
      return 'angulado';
    case 'organic mix':
      return 'mixto orgánico';
    default:
      return style;
  }
};

export default HomePage;
