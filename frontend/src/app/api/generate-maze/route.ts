import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://127.0.0.1:8000';

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const targetUrl = `${BACKEND_API_URL}/generate-maze${search}`;

  try {
    const backendResponse = await fetch(targetUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();

      return NextResponse.json(
        {
          message: 'Error al comunicarse con el servicio de generación de laberintos.',
          details: errorText,
        },
        { status: backendResponse.status },
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch maze data from backend:', error);

    return NextResponse.json(
      {
        message: 'No se pudo conectar con el servicio de generación de laberintos.',
      },
      { status: 502 },
    );
  }
}
