import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ShoppingCart, Store } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/lib/store";
import { formatMZN } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/montra")({
  head: () => ({
    meta: [
      { title: "Montra | La Fé Stock" },
      {
        name: "description",
        content:
          "Produtos em exposição na montra da clínica La Fé, prontos para venda ou retorno ao armazém.",
      },
      { property: "og:title", content: "Montra | La Fé Stock" },
      {
        property: "og:description",
        content: "Vitrine da clínica: quantidades expostas, retorno ao stock e início de venda.",
      },
    ],
  }),
  component: MontraPage,
});

function MontraPage() {
  const { produtos, retornar } = useStore();
  const [alvo, setAlvo] = useState<string | null>(null);
  const [qtd, setQtd] = useState(1);

  const montra = produtos.filter((p) => p.quantidadeMontra > 0);
  const produto = produtos.find((p) => p.id === alvo);

  function confirmar() {
    if (!alvo) return;
    const r = retornar(alvo, qtd);
    if (!r.ok) return toast.error(r.erro!);
    toast.success("Produto devolvido ao armazém.");
    setAlvo(null);
  }

  return (
    <AppLayout
      title="Montra"
      description="Produtos em exposição. Todas as vendas são feitas a partir daqui."
      actions={
        <Link
          to="/vendas"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <ShoppingCart className="size-4" /> Iniciar venda
        </Link>
      }
    >
      {montra.length === 0 ? (
        <div className="surface-card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Store className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            A montra está vazia. Transfira produtos a partir do stock.
          </p>
          <Link to="/stock">
            <Button variant="outline">Ir para o stock</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {montra.map((p) => (
            <article key={p.id} className="surface-card flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">{p.nome}</h2>
                  <p className="text-xs text-muted-foreground">
                    {p.marca || "Sem marca"} · {p.categoria}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
                  {p.quantidadeMontra} expostos
                </span>
              </div>
              <p className="text-xl font-semibold">{formatMZN(p.precoVenda)}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setQtd(1);
                    setAlvo(p.id);
                  }}
                >
                  <ArrowLeft className="size-4" /> Devolver ao stock
                </Button>
                <Link to="/vendas" className="flex-1">
                  <Button className="w-full">
                    <ShoppingCart className="size-4" /> Vender
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!alvo} onOpenChange={(o) => !o && setAlvo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retornar ao armazém</DialogTitle>
          </DialogHeader>
          {produto && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                <p className="font-medium">{produto.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Na montra: {produto.quantidadeMontra} un.
                </p>
              </div>
              <div>
                <Label htmlFor="qtd">Quantidade</Label>
                <Input
                  id="qtd"
                  type="number"
                  min={1}
                  max={produto.quantidadeMontra}
                  value={qtd}
                  onChange={(e) => setQtd(Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlvo(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmar}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
