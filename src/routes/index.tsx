import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Warehouse,
  Store,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ArrowLeftRight,
  PackagePlus,
  Receipt,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { useStore, type TipoMovimento } from "@/lib/store";
import { formatMZN, formatDataHora, mesmoDia, mesmoMes } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | La Fé Stock — Gestão de Inventário Oftalmológico" },
      {
        name: "description",
        content:
          "Painel de gestão de stock da clínica La Fé: inventário em armazém, produtos na montra, vendas do dia e alertas de stock baixo.",
      },
      { property: "og:title", content: "Dashboard | La Fé Stock" },
      {
        property: "og:description",
        content: "KPIs de stock, montra e vendas da clínica de oftalmologia La Fé.",
      },
    ],
  }),
  component: Dashboard,
});

const MOV_LABEL: Record<TipoMovimento, string> = {
  entrada: "Entrada em stock",
  stock_montra: "Stock → Montra",
  montra_stock: "Montra → Stock",
  venda: "Venda",
};

const MOV_ICON: Record<TipoMovimento, typeof PackagePlus> = {
  entrada: PackagePlus,
  stock_montra: ArrowRight,
  montra_stock: ArrowLeftRight,
  venda: Receipt,
};

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Warehouse;
  tone?: "primary" | "success" | "warning";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
  } as const;
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { produtos, movimentacoes, vendas } = useStore();

  const totalStock = produtos.reduce((a, p) => a + p.quantidadeStock, 0);
  const totalMontra = produtos.reduce((a, p) => a + p.quantidadeMontra, 0);
  const vendasHoje = vendas.filter((v) => mesmoDia(v.createdAt));
  const vendasMes = vendas.filter((v) => mesmoMes(v.createdAt));
  const alertas = produtos.filter((p) => p.quantidadeStock <= p.stockMinimo);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const total = vendas
      .filter((v) => mesmoDia(v.createdAt, d))
      .reduce((a, v) => a + v.total, 0);
    return { dia: d.toLocaleDateString("pt-PT", { weekday: "short" }), total };
  });

  return (
    <AppLayout
      title="Dashboard"
      description="Visão geral do inventário, exposição e vendas da clínica."
      actions={
        <Link
          to="/vendas"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <ShoppingCart className="size-4" /> Nova venda
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Unidades em stock"
          value={String(totalStock)}
          hint={`${produtos.length} produtos cadastrados`}
          icon={Warehouse}
        />
        <Kpi
          label="Unidades na montra"
          value={String(totalMontra)}
          hint="Disponíveis para venda"
          icon={Store}
          tone="success"
        />
        <Kpi
          label="Vendas hoje"
          value={formatMZN(vendasHoje.reduce((a, v) => a + v.total, 0))}
          hint={`${vendasHoje.length} transacções`}
          icon={ShoppingCart}
        />
        <Kpi
          label="Vendas do mês"
          value={formatMZN(vendasMes.reduce((a, v) => a + v.total, 0))}
          hint={`${vendasMes.length} transacções`}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="surface-card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold">Vendas dos últimos 7 dias</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dias} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="vendasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#vendasGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            <h2 className="text-base font-semibold">Alertas de stock baixo</h2>
          </div>
          <ul className="mt-4 space-y-3">
            {alertas.length === 0 && (
              <li className="text-sm text-muted-foreground">Sem alertas — stock saudável.</li>
            )}
            {alertas.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-warning-soft px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">Mínimo: {p.stockMinimo} un.</p>
                </div>
                <span className="shrink-0 rounded-md bg-warning px-2 py-1 text-xs font-semibold text-warning-foreground">
                  {p.quantidadeStock} un.
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="surface-card mt-6 p-5">
        <h2 className="text-base font-semibold">Movimentações recentes</h2>
        <ul className="mt-4 divide-y divide-border">
          {movimentacoes.slice(0, 8).map((m) => {
            const Icon = MOV_ICON[m.tipo];
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.produtoNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {MOV_LABEL[m.tipo]} · {m.descricao}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">×{m.quantidade}</p>
                  <p className="text-xs text-muted-foreground">{formatDataHora(m.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AppLayout>
  );
}
