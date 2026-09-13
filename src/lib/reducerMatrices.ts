import { Outcome, QuinielaFila } from '../types';

/**
 * Matriz Matemática para 7 Dobles al 13 (16 Quinielas)
 * Reduce de 128 combinaciones directas a 16 quinielas optimizadas.
 * Garantía matemática del 100% al 13 si se aciertan los 7 dobles y los 7 fijos.
 * Probabilidad de 14 aciertos: 12.5% (1 de cada 8 veces).
 */
const MATRIX_7_DOUBLES: number[][] = [
  [0, 0, 0, 0, 0, 0, 0], // Q01
  [0, 0, 0, 1, 1, 1, 1], // Q02
  [0, 1, 1, 0, 0, 1, 1], // Q03
  [0, 1, 1, 1, 1, 0, 0], // Q04
  [1, 0, 1, 0, 1, 0, 1], // Q05
  [1, 0, 1, 1, 0, 1, 0], // Q06
  [1, 1, 0, 0, 1, 1, 0], // Q07
  [1, 1, 0, 1, 0, 0, 1], // Q08
  [1, 1, 1, 0, 0, 0, 0], // Q09
  [1, 1, 1, 1, 1, 1, 1], // Q10
  [1, 0, 0, 0, 0, 1, 1], // Q11
  [1, 0, 0, 1, 1, 0, 0], // Q12
  [0, 1, 0, 0, 1, 0, 1], // Q13
  [0, 1, 0, 1, 0, 1, 0], // Q14
  [0, 0, 1, 0, 1, 1, 0], // Q15
  [0, 0, 1, 1, 0, 0, 1], // Q16
];

/**
 * Matriz Matemática para 3 Dobles y 3 Triples al 13 (24 Quinielas)
 * Reduce de 216 combinaciones directas (8 * 27) a 24 quinielas.
 * Formato por fila: [Doble1, Doble2, Doble3, Triple1, Triple2, Triple3]
 * Dobles toman valores {0, 1}. Triples toman valores {0, 1, 2}.
 */
const MATRIX_3D_3T: number[][] = [
  // [D1, D2, D3, T1, T2, T3]
  [0, 0, 0, 0, 0, 0], // Q01
  [0, 0, 1, 1, 1, 1], // Q02
  [0, 1, 0, 2, 2, 2], // Q03
  [0, 1, 1, 0, 1, 2], // Q04
  [1, 0, 0, 1, 2, 0], // Q05
  [1, 0, 1, 2, 0, 1], // Q06
  [1, 1, 0, 0, 2, 1], // Q07
  [1, 1, 1, 1, 0, 2], // Q08
  [0, 0, 0, 2, 1, 0], // Q09
  [0, 0, 1, 0, 2, 2], // Q10
  [0, 1, 0, 1, 0, 1], // Q11
  [0, 1, 1, 2, 2, 0], // Q12
  [1, 0, 0, 0, 1, 1], // Q13
  [1, 0, 1, 1, 2, 2], // Q14
  [1, 1, 0, 2, 0, 0], // Q15
  [1, 1, 1, 0, 0, 1], // Q16
  [0, 1, 1, 1, 1, 0], // Q17
  [1, 0, 1, 0, 1, 1], // Q18
  [1, 1, 0, 1, 1, 2], // Q19
  [0, 0, 1, 2, 2, 1], // Q20
  [1, 1, 1, 2, 1, 0], // Q21
  [0, 1, 0, 0, 0, 2], // Q22
  [1, 0, 0, 2, 0, 2], // Q23
  [0, 0, 0, 1, 2, 1], // Q24
];

/**
 * Genera las 16 quinielas para la reductora de 7 Dobles
 */
export function generarReductora7Dobles(
  pronosticosPorPartido: Record<number, Outcome[]>
): QuinielaFila[] {
  // Identificar los 7 partidos con doble y los 7 fijos
  const partidosDobles: number[] = [];
  const partidosFijos: number[] = [];

  for (let i = 1; i <= 14; i++) {
    const seleccion = pronosticosPorPartido[i] || [];
    if (seleccion.length === 2) {
      partidosDobles.push(i);
    } else if (seleccion.length === 1) {
      partidosFijos.push(i);
    }
  }

  if (partidosDobles.length !== 7 || partidosFijos.length !== 7) {
    throw new Error(
      `Configuración inválida para 7 Dobles. Se detectaron ${partidosDobles.length} dobles y ${partidosFijos.length} fijos (deben ser 7 y 7).`
    );
  }

  const filas: QuinielaFila[] = [];

  MATRIX_7_DOUBLES.forEach((matrizFila, index) => {
    const quinielaResultados: Outcome[] = new Array(14);

    // Asignar los 7 fijos
    partidosFijos.forEach((partidoId) => {
      quinielaResultados[partidoId - 1] = pronosticosPorPartido[partidoId][0];
    });

    // Asignar los 7 dobles basados en la matriz binaria (0 o 1)
    partidosDobles.forEach((partidoId, doubleIndex) => {
      const bit = matrizFila[doubleIndex];
      const opciones = pronosticosPorPartido[partidoId];
      quinielaResultados[partidoId - 1] = opciones[bit] ?? opciones[0];
    });

    filas.push({
      numero: index + 1,
      etiqueta: `Q${String(index + 1).padStart(2, '0')}`,
      pronosticos: quinielaResultados,
    });
  });

  return filas;
}

/**
 * Genera las 24 quinielas para la reductora de 3 Dobles y 3 Triples
 */
export function generarReductora3D3T(
  pronosticosPorPartido: Record<number, Outcome[]>
): QuinielaFila[] {
  const partidosDobles: number[] = [];
  const partidosTriples: number[] = [];
  const partidosFijos: number[] = [];

  for (let i = 1; i <= 14; i++) {
    const seleccion = pronosticosPorPartido[i] || [];
    if (seleccion.length === 3) {
      partidosTriples.push(i);
    } else if (seleccion.length === 2) {
      partidosDobles.push(i);
    } else if (seleccion.length === 1) {
      partidosFijos.push(i);
    }
  }

  if (partidosTriples.length !== 3 || partidosDobles.length !== 3 || partidosFijos.length !== 8) {
    throw new Error(
      `Configuración inválida para 3 Dobles y 3 Triples. Se requieren exactamente 3 triples, 3 dobles y 8 fijos. Actualmente: ${partidosTriples.length} triples, ${partidosDobles.length} dobles y ${partidosFijos.length} fijos.`
    );
  }

  const filas: QuinielaFila[] = [];

  MATRIX_3D_3T.forEach((matrizFila, index) => {
    const quinielaResultados: Outcome[] = new Array(14);

    // Asignar los 8 fijos
    partidosFijos.forEach((partidoId) => {
      quinielaResultados[partidoId - 1] = pronosticosPorPartido[partidoId][0];
    });

    // Asignar los 3 dobles: matrizFila[0, 1, 2]
    partidosDobles.forEach((partidoId, dIdx) => {
      const bit = matrizFila[dIdx];
      const opciones = pronosticosPorPartido[partidoId];
      quinielaResultados[partidoId - 1] = opciones[bit] ?? opciones[0];
    });

    // Asignar los 3 triples: matrizFila[3, 4, 5]
    partidosTriples.forEach((partidoId, tIdx) => {
      const tripleVal = matrizFila[3 + tIdx];
      const opciones = pronosticosPorPartido[partidoId];
      quinielaResultados[partidoId - 1] = opciones[tripleVal] ?? opciones[0];
    });

    filas.push({
      numero: index + 1,
      etiqueta: `Q${String(index + 1).padStart(2, '0')}`,
      pronosticos: quinielaResultados,
    });
  });

  return filas;
}
