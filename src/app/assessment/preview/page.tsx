'use client';

// Redirect a la ruta canónica del runner Elevare en modo preview.
// El runner real está en /assessment/ht/[token] y maneja token === 'preview'.
import { useEffect } from 'react';

export default function PreviewRedirect() {
  useEffect(() => {
    window.location.replace('/assessment/ht/preview');
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
      Redireccionando a la prueba…
    </div>
  );
}
