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
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-900 px-4 py-10 text-slate-100 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row">
        <section className="flex w-full flex-col gap-6 lg:w-[32rem]">
          <header className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300/80">
              Laberintos en segundos
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Generador de Laberintos Diversos
            </h1>
            <p className="text-sm text-slate-300">
              Juega con diferentes algoritmos y estilos de pared para crear laberintos únicos listos para imprimir o prototipar.
            </p>
            <ul className="grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
              <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                Estilos curvos, angulados y mixtos
              </li>
              <li className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
                Exporta el canvas desde tu navegador
              </li>
            </ul>
          </header>
          <SettingsForm onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        <section className="flex flex-1 flex-col gap-6">
          <div className="relative flex min-h-[24rem] flex-1 flex-col rounded-3xl border border-white/10 bg-slate-900/50 p-4 shadow-2xl backdrop-blur">
            <MazeCanvas mazeData={mazeData} />
          </div>

          <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-200 shadow-xl backdrop-blur">
            <h2 className="text-lg font-semibold text-white">Detalles de la generación</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Algoritmo</p>
                <p className="text-base font-medium text-white">
                  {lastSettings ? formatAlgorithmLabel(lastSettings) : 'Listo para generar'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Dimensiones de canvas</p>
                <p className="text-base font-medium text-white">
                  {hasMaze
                    ? `${Math.round(mazeData!.canvas_width)} x ${Math.round(mazeData!.canvas_height)} px`
                    : 'Pendiente de generación'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Segmentos de pared</p>
                <p className="text-base font-medium text-white">
                  {hasMaze ? mazeData!.walls.length.toLocaleString('es-ES') : '—'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Configuración base</p>
                <p className="text-sm text-slate-300">
                  {lastSettings
                    ? describeSettings(lastSettings)
                    : 'Selecciona o ajusta un preset para ver los detalles.'}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-slate-400">Consejo</p>
                <p className="text-sm text-slate-300">
                  Ajusta el grosor de pared y la variación de forma para conseguir trazos fluidos ideales para trazadores láser o ilustración.
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
