export type FilaFiltros = {
  materia: string;
  fila: string;
  status: string;
  busca: string;
  prioridade?: string;
};

export function normalizarFilaFiltros(filtros: FilaFiltros): FilaFiltros {
  return {
    materia: filtros.materia || "todas",
    fila: filtros.fila || "todas",
    status: filtros.status || "todas",
    busca: filtros.busca.trim(),
    prioridade: filtros.prioridade || "todas",
  };
}

/** Chave estável: a posição é independente da ordenação visual da fila. */
export function chaveFila(filtros: FilaFiltros): string {
  const f = normalizarFilaFiltros(filtros);
  return JSON.stringify([f.materia, f.fila, f.status, f.prioridade, f.busca]);
}

export function filaQuery(filtros: FilaFiltros, modo?: "inicio" | "retomar") {
  const f = normalizarFilaFiltros(filtros);
  const params = new URLSearchParams();
  if (f.materia !== "todas") params.set("materia", f.materia);
  if (f.fila !== "todas") params.set("fila", f.fila);
  if (f.status !== "todas") params.set("status", f.status);
  if (f.prioridade !== "todas") params.set("prioridade", f.prioridade || "todas");
  if (f.busca) params.set("busca", f.busca);
  if (modo) params.set("modo", modo);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function filtrosDaUrl(searchParams: URLSearchParams): FilaFiltros {
  return normalizarFilaFiltros({
    materia: searchParams.get("materia") || "todas",
    fila: searchParams.get("fila") || "todas",
    status: searchParams.get("status") || "todas",
    busca: searchParams.get("busca") || "",
    prioridade: searchParams.get("prioridade") || "todas",
  });
}
