import { useEffect, useState } from "react";

export default function CuentaAtrasFichas({ ultimaRecompensa, onFinish}) {
  const CUATRO_HORAS = 4 * 60 * 60 * 1000; // 4 horas en milisegundos

  const calcularTiempoRestante = () => {
    const ahora = Date.now();
    let ultima = 0;

    if (typeof ultimaRecompensa === "number") {
      ultima = ultimaRecompensa;
    } else if (ultimaRecompensa?.seconds != null && ultimaRecompensa?.nanoseconds != null) {
      ultima = ultimaRecompensa.seconds * 1000 + Math.floor(ultimaRecompensa.nanoseconds / 1e6);
    }

    const diferencia = CUATRO_HORAS - (ahora - ultima);
    return Math.max(diferencia, 0);
  };

  const [tiempoRestante, setTiempoRestante] = useState(calcularTiempoRestante());

  useEffect(() => {
    // Cada vez que cambia ultimaRecompensa, recalculamos y reiniciamos el contador
    setTiempoRestante(calcularTiempoRestante());

    const intervalo = setInterval(() => {
      setTiempoRestante(prev => {
        if (prev <= 1000) {
          clearInterval(intervalo);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimaRecompensa]);

  useEffect(() => {
    if (tiempoRestante === 0 && typeof onFinish === "function") {
      onFinish();
    }
  }, [tiempoRestante, onFinish]);

  const formatTiempo = (ms) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      {tiempoRestante > 0 && (
        <p>Fichas gratis en: {formatTiempo(tiempoRestante)}</p>
      )}
    </div>
  );
}
