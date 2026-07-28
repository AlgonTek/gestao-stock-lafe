import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { useStore, type TipoMovimento } from "@/lib/store";
import { formatMZN, formatDataHora } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios | La Fé Stock" },
      {
        name: "description",
        content:
          "Relatórios da clínica La Fé: vendas por período, produtos mais vendidos e histórico de movimentações de inventário.",
      },
      { property: "og:title", content: "Relatórios | La Fé Stock" },
      {
        property: "og:description",
        content: "Análise de vendas, top produtos e movimentações do inventário oftalmológico.",
      },
    ],
  }),
  component: RelatoriosPage,
});

const MOV_LABEL: Record<TipoMovimento, string> = {
  entrada: "Entrada",
  stock_montra: "Stock → Montra",
  montra_stock: "Montra → Stock",
  venda: "Venda",
};

function isoDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

function RelatoriosPage() {
  const { vendas, movimentacoes } = useStore();
  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 29);

  const [de, setDe] = useState(isoDia(inicio));
  const [ate, setAte] = useState(isoDia(hoje));
  const [tipo, setTipo] = useState<string>("todos");

  const vendasFiltradas = useMemo(
    () =>
      vendas.filter((v) => {
        const d = v.createdAt.slice(0, 10);
        return d >= de && d <= ate;
      }),
    [vendas, de, ate],
  );

  const porDia = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const v of vendasFiltradas) {
      const d = v.createdAt.slice(0, 10);
      mapa.set(d, (mapa.get(d) ?? 0) + v.total);
    }
    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dia, total]) => ({ dia: dia.slice(5), total }));
  }, [vendasFiltradas]);

  const topProdutos = useMemo(() => {
    const mapa = new Map<string, { nome: string; qtd: number; receita: number }>();
    for (const v of vendasFiltradas) {
      for (const i of v.itens) {
        const atual = mapa.get(i.produtoId) ?? { nome: i.produtoNome, qtd: 0, receita: 0 };
        atual.qtd += i.quantidade;
        atual.receita += i.subtotal;
        mapa.set(i.produtoId, atual);
      }
    }
    return [...mapa.values()].sort((a, b) => b.qtd - a.qtd).slice(0, 5);
  }, [vendasFiltradas]);

  const movs = movimentacoes.filter((m) => {
    const d = m.createdAt.slice(0, 10);
    return d >= de && d <= ate && (tipo === "todos" || m.tipo === tipo);
  });

  const receita = vendasFiltradas.reduce((a, v) => a + v.total, 0);

  function exportarCSV() {
    const linhas = [
      ["numero", "data", "produto", "quantidade", "preco_unitario", "subtotal", "pagamento"],
      ...vendasFiltradas.flatMap((v) =>
        v.itens.map((i) => [
          v.numero,
          v.createdAt,
          i.produtoNome,
          String(i.quantidade),
          String(i.precoUnitario),
          String(i.subtotal),
          v.metodoPagamento,
        ]),
      ),
    ];
    const csv = linhas.map((l) => l.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendas-lafe-${de}-a-${ate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout
      title="Relatórios"
      description="Análise de vendas, produtos mais vendidos e movimentações do inventário."
      actions={
        <Button variant="outline" onClick={exportarCSV}>
          <Download className="size-4" /> Exportar CSV
        </Button>
      }
    >
      <div className="surface-card mb-6 flex flex-wrap items-end gap-4 p-4">
        <div>
          <Label htmlFor="de">De</Label>
          <Input id="de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="ate">Até</Label>
          <Input id="ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Receita no período</p>
          <p className="text-xl font-semibold">{formatMZN(receita)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Vendas por dia</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porDia} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={70} />
                <Tooltip
                  formatter={(v: number) => formatMZN(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                  }}
                />
                <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <h2 className="text-base font-semibold">Produtos mais vendidos</h2>
          <ul className="mt-4 space-y-3">
            {topProdutos.length === 0 && (
              <li className="text-sm text-muted-foreground">Sem vendas no período.</li>
            )}
            {topProdutos.map((p, i) => (
              <li key={p.nome} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.qtd} unidades</p>
                </div>
                <span className="text-sm font-semibold">{formatMZN(p.receita)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="surface-card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Movimentações</h2>
          <div className="flex flex-wrap gap-2">
            {["todos", "entrada", "stock_montra", "montra_stock", "venda"].map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  tipo === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {t === "todos" ? "Todos" : MOV_LABEL[t as TipoMovimento]}
              </button>
            ))}
          </div>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {movs.slice(0, 20).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{m.produtoNome}</p>
                <p className="text-xs text-muted-foreground">
                  {MOV_LABEL[m.tipo]} · {m.descricao}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">×{m.quantidade}</p>
                <p className="text-xs text-muted-foreground">{formatDataHora(m.createdAt)}</p>
              </div>
            </li>
          ))}
          {movs.length === 0 && (
            <li className="py-8 text-center text-sm text-muted-foreground">
              Sem movimentações no período.
            </li>
          )}
        </ul>
      </section>
    </AppLayout>
  );
}
