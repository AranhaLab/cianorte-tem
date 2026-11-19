/**
 * Dados estruturados (schema.org). Textos vêm do lojista, então escapamos "<"
 * para que um nome como "</script><script>…" não quebre o HTML (XSS).
 */
export function JsonLd({ dados }: { dados: Record<string, unknown> }) {
  const seguro = JSON.stringify(dados).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: seguro }} />;
}
