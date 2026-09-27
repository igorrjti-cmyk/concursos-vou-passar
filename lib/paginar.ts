export type PageResult<T> = {
  data: T[] | null;
  error: unknown;
  count?: number | null;
};

/**
 * Busca todas as páginas de uma consulta do Supabase/PostgREST.
 * O count, quando fornecido pela primeira página, vira a referência de término.
 * Isso evita confundir o limite padrão de 1.000 linhas com o total real do banco.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let expectedTotal: number | null = null;

  for (let from = 0; ; from += pageSize) {
    const { data, error, count } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;

    if (typeof count === "number") expectedTotal = count;

    const page = data ?? [];
    all.push(...page);

    if (expectedTotal !== null && all.length >= expectedTotal) break;
    if (page.length === 0) break;
    if (page.length < pageSize && expectedTotal === null) break;
  }

  return expectedTotal === null ? all : all.slice(0, expectedTotal);
}
