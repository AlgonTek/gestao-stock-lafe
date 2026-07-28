import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Receipt, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useStore, type Venda } from "@/lib/store";
import { formatMZN, formatDataHora } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas | La Fé Stock" },
      {
        name: "description",
        content:
          "Registo de vendas a partir da montra da clínica La Fé: carrinho, descontos, método de pagamento e recibos.",
      },
      { property: "og:title", content: "Vendas | La Fé Stock" },
      {
        property: "og:description",
        content: "Nova venda, histórico e emissão de recibos da clínica de oftalmologia La Fé.",
      },
    ],
  }),
  component: VendasPage,
});

const METODOS = ["dinheiro", "multibanco", "transferência", "m-pesa"];

interface LinhaCarrinho {
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
}

function VendasPage() {
  const { produtos, vendas, registarVenda, anularVenda } = useStore();
  const [carrinho, setCarrinho] = useState<LinhaCarrinho[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [metodo, setMetodo] = useState(METODOS[0]);
  const [observacao, setObservacao] = useState("");
  const [recibo, setRecibo] = useState<Venda | null>(null);

  const montra = produtos.filter((p) => p.quantidadeMontra > 0);
  const bruto = carrinho.reduce((a, l) => a + l.precoUnitario * l.quantidade, 0);
  const total = Math.max(0, bruto - desconto);

  function adicionar(produtoId: string) {
    const p = produtos.find((x) => x.id === produtoId)!;
    setCarrinho((c) => {
      const existe = c.find((l) => l.produtoId === produtoId);
      if (existe) {
        if (existe.quantidade >= p.quantidadeMontra) {
          toast.error(`Apenas ${p.quantidadeMontra} un. na montra.`);
          return c;
        }
        return c.map((l) =>
          l.produtoId === produtoId ? { ...l, quantidade: l.quantidade + 1 } : l,
        );
      }
      return [...c, { produtoId, quantidade: 1, precoUnitario: p.precoVenda }];
    });
  }

  function alterarQtd(produtoId: string, delta: number) {
    setCarrinho((c) =>
      c
        .map((l) => (l.produtoId === produtoId ? { ...l, quantidade: l.quantidade + delta } : l))
        .filter((l) => l.quantidade > 0),
    );
  }

  function finalizar() {
    const r = registarVenda({ itens: carrinho, desconto, metodoPagamento: metodo, observacao });
    if (!r.ok) return toast.error(r.erro!);
    toast.success(`Venda ${r.venda!.numero} registada.`);
    setRecibo(r.venda!);
    setCarrinho([]);
    setDesconto(0);
    setObservacao("");
  }

  return (
    <AppLayout title="Vendas" description="Registe vendas a partir dos produtos expostos na montra.">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Produtos na montra
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {montra.map((p) => (
              <button
                key={p.id}
                onClick={() => adicionar(p.id)}
                className="surface-card flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.categoria} · {p.quantidadeMontra} disponíveis
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{formatMZN(p.precoVenda)}</span>
              </button>
            ))}
            {montra.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Não há produtos na montra. Transfira produtos a partir do stock.
              </p>
            )}
          </div>
        </section>

        <aside className="surface-card h-fit p-5">
          <h2 className="text-base font-semibold">Carrinho</h2>
          <ul className="mt-4 space-y-3">
            {carrinho.length === 0 && (
              <li className="text-sm text-muted-foreground">Carrinho vazio.</li>
            )}
            {carrinho.map((l) => {
              const p = produtos.find((x) => x.id === l.produtoId)!;
              return (
                <li key={l.produtoId} className="rounded-lg bg-muted p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{p.nome}</p>
                    <button onClick={() => alterarQtd(l.produtoId, -l.quantidade)}>
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => alterarQtd(l.produtoId, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{l.quantidade}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-7"
                        onClick={() => adicionar(l.produtoId)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatMZN(l.precoUnitario * l.quantidade)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <Label className="text-xs">Preço unitário (ajustável)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={l.precoUnitario}
                      onChange={(e) =>
                        setCarrinho((c) =>
                          c.map((x) =>
                            x.produtoId === l.produtoId
                              ? { ...x, precoUnitario: Number(e.target.value) }
                              : x,
                          ),
                        )
                      }
                      className="mt-1 h-8"
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div>
              <Label htmlFor="desconto">Desconto (MZN)</Label>
              <Input
                id="desconto"
                type="number"
                min={0}
                value={desconto}
                onChange={(e) => setDesconto(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="metodo">Método de pagamento</Label>
              <select
                id="metodo"
                value={metodo}
                onChange={(e) => setMetodo(e.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm capitalize"
              >
                {METODOS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="obs">Observação</Label>
              <Input
                id="obs"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: Cliente José"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMZN(bruto)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatMZN(total)}</span>
            </div>
            <Button className="w-full" disabled={carrinho.length === 0} onClick={finalizar}>
              <Receipt className="size-4" /> Finalizar venda
            </Button>
          </div>
        </aside>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico de vendas
        </h2>
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nº</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Itens</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendas.map((v) => (
                <tr key={v.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{v.numero}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDataHora(v.createdAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {v.itens.reduce((a, i) => a + i.quantidade, 0)} un.
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {v.metodoPagamento}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMZN(v.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setRecibo(v)}>
                        Recibo
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          anularVenda(v.id);
                          toast.success("Venda anulada, itens devolvidos à montra.");
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {vendas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Ainda não há vendas registadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={!!recibo} onOpenChange={(o) => !o && setRecibo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recibo {recibo?.numero}</DialogTitle>
          </DialogHeader>
          {recibo && (
            <div className="space-y-4 text-sm">
              <div className="text-muted-foreground">
                <p>Clínica de Oftalmologia La Fé</p>
                <p>{formatDataHora(recibo.createdAt)}</p>
              </div>
              <ul className="divide-y divide-border border-y border-border">
                {recibo.itens.map((i) => (
                  <li key={i.produtoId} className="flex justify-between gap-3 py-2">
                    <span>
                      {i.produtoNome} <span className="text-muted-foreground">×{i.quantidade}</span>
                    </span>
                    <span>{formatMZN(i.subtotal)}</span>
                  </li>
                ))}
              </ul>
              {recibo.desconto > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Desconto</span>
                  <span>-{formatMZN(recibo.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatMZN(recibo.total)}</span>
              </div>
              <p className="capitalize text-muted-foreground">
                Pagamento: {recibo.metodoPagamento}
                {recibo.observacao ? ` · ${recibo.observacao}` : ""}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
