/** Lê CSV com separador ; ou , e campos entre aspas. */
export function lerCsvEstoque(texto: string): Array<{ sku: string; quantidade: number }> {
  const fonte = texto.replace(/^\uFEFF/, '');
  const separador = fonte.split(/\r?\n/, 1)[0]?.includes(';') ? ';' : ',';
  const linhas: string[][] = [];
  let linha: string[] = [],
    campo = '',
    aspas = false;
  for (let i = 0; i < fonte.length; i++) {
    const c = fonte[i]!;
    if (c === '"') {
      if (aspas && fonte[i + 1] === '"') {
        campo += '"';
        i++;
      } else aspas = !aspas;
    } else if (!aspas && c === separador) {
      linha.push(campo.trim());
      campo = '';
    } else if (!aspas && (c === '\n' || c === '\r')) {
      if (c === '\r' && fonte[i + 1] === '\n') i++;
      linha.push(campo.trim());
      campo = '';
      if (linha.some(Boolean)) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  if (aspas) throw new Error('O arquivo contém aspas não fechadas.');
  linha.push(campo.trim());
  if (linha.some(Boolean)) linhas.push(linha);
  const cabecalho = linhas.shift()?.map((c) => c.toLowerCase());
  const sku = cabecalho?.indexOf('sku') ?? -1;
  const quantidade = cabecalho?.indexOf('quantidade') ?? -1;
  if (sku < 0 || quantidade < 0) throw new Error('O CSV precisa das colunas sku e quantidade.');
  if (!linhas.length) throw new Error('O arquivo não contém produtos.');
  const vistos = new Set<string>();
  return linhas.map((campos, i) => {
    const codigo = campos[sku]?.trim() ?? '';
    const valor = campos[quantidade]?.trim() ?? '';
    if (!codigo || !/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)))
      throw new Error(`Linha ${i + 2}: informe SKU e quantidade inteira não negativa.`);
    if (vistos.has(codigo.toUpperCase())) throw new Error(`Linha ${i + 2}: SKU ${codigo} repetido.`);
    vistos.add(codigo.toUpperCase());
    return { sku: codigo, quantidade: Number(valor) };
  });
}
