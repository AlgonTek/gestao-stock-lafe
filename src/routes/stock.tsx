import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, PackagePlus, Search } from "lucide-react";
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

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock | La Fé Stock" },
      {
        name: "description",
        content:
          "Inventário em armazém da clínica La Fé: entradas de mercadoria, quantidades e transferência para a montra.",
      },
      { property: "og:title", content: "Stock | La Fé Stock" },
      {
        property: "og:description",
        content: "Controlo do armazém e transferências de stock para exposição.",
      },
    ],
  }),
  component: StockPage,
});

function StockPage() {
  const { produtos, darEntrada, transferir } = useStore();
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState<{ tipo: "entrada" | "transferir"; id: string } | null>(null);
  const [qtd, setQtd] = useState(1);
  const [descricao, setDescricao] = useState("");

  const lista = produtos.filter((p) =>
    (p.nome + p.marca + p.codigo).toLowerCase().includes(busca.toLowerCase()),
  );
  const produto = produtos.find((p) => p.id === modal?.id);

  function confirmar() {
    if (!modal) return;
    const r =
      modal.tipo === "entrada"
        ? darEntrada(modal.id, qtd, descricao)
        : transferir(modal.id, qtd);
    if (!r.ok) return toast.error(r.erro!);
    toast.success(
      modal.tipo === "entrada" ? "Entrada registada no armazém." : "Produto transferido para a montra.",
    );
    setModal(null);
  }

  function abrir(tipo: "entrada" | "transferir", id: string) {
    setQtd(1);
    setDescricao("");
    setModal({ tipo, id });
  }

  return (
    <AppLayout
      title="Stock"
      description="Armazém da clínica. Os produtos só podem ser vendidos depois de passarem à montra."
    >
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Procurar produto"
          className="pl-9"
        />
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3 text-right">Em stock</th>
              <th className="px-4 py-3 text-right">Na montra</th>
              <th className="px-4 py-3 text-right">Valor em stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((p) => {
              const baixo = p.quantidadeStock <= p.stockMinimo;
              return (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{p.codigo || "sem código"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.categoria}</td>
                  <td className="px-4 py-3 text-right font-semibold">{p.quantidadeStock}</td>
                  <td className="px-4 py-3 text-right">{p.quantidadeMontra}</td>
                  <td className="px-4 py-3 text-right">
                    {formatMZN(p.quantidadeStock * p.precoCusto)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${
                        baixo
                          ? "bg-warning-soft text-warning"
                          : "bg-success-soft text-success"
                      }`}
                    >
                      {baixo ? "Stock baixo" : "OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => abrir("entrada", p.id)}>
                        <PackagePlus className="size-4" /> Entrada
                      </Button>
                      <Button size="sm" onClick={() => abrir("transferir", p.id)}>
                        <ArrowRight className="size-4" /> Montra
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modal?.tipo === "entrada" ? "Dar entrada em stock" : "Transferir para a montra"}
            </DialogTitle>
          </DialogHeader>
          {produto && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm">
                <p className="font-medium">{produto.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Stock: {produto.quantidadeStock} · Montra: {produto.quantidadeMontra}
                </p>
              </div>
              <div>
                <Label htmlFor="qtd">Quantidade</Label>
                <Input
                  id="qtd"
                  type="number"
                  min={1}
                  value={qtd}
                  onChange={(e) => setQtd(Number(e.target.value))}
                />
              </div>
              {modal?.tipo === "entrada" && (
                <div>
                  <Label htmlFor="desc">Descrição</Label>
                  <Input
                    id="desc"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex.: Compra fornecedor X"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmar}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
