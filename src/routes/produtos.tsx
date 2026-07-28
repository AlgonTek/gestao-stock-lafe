import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { CATEGORIAS, useStore, type Categoria, type Produto } from "@/lib/store";
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

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos | La Fé Stock" },
      {
        name: "description",
        content:
          "Cadastro e edição de armações, lentes, soluções e acessórios da clínica de oftalmologia La Fé.",
      },
      { property: "og:title", content: "Produtos | La Fé Stock" },
      {
        property: "og:description",
        content: "Gestão do catálogo de produtos oftalmológicos com preços e stock mínimo.",
      },
    ],
  }),
  component: ProdutosPage,
});

const vazio = {
  nome: "",
  marca: "",
  categoria: CATEGORIAS[0] as Categoria,
  precoCusto: 0,
  precoVenda: 0,
  codigo: "",
  stockMinimo: 5,
};

function ProdutosPage() {
  const { produtos, criarProduto, actualizarProduto, removerProduto } = useStore();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [form, setForm] = useState(vazio);

  const lista = useMemo(
    () =>
      produtos.filter(
        (p) =>
          (categoria === "todas" || p.categoria === categoria) &&
          (p.nome + p.marca + p.codigo).toLowerCase().includes(busca.toLowerCase()),
      ),
    [produtos, busca, categoria],
  );

  function abrirNovo() {
    setEditando(null);
    setForm(vazio);
    setAberto(true);
  }

  function abrirEdicao(p: Produto) {
    setEditando(p);
    setForm({
      nome: p.nome,
      marca: p.marca,
      categoria: p.categoria,
      precoCusto: p.precoCusto,
      precoVenda: p.precoVenda,
      codigo: p.codigo,
      stockMinimo: p.stockMinimo,
    });
    setAberto(true);
  }

  function guardar() {
    if (!form.nome.trim()) return toast.error("O nome do produto é obrigatório.");
    if (form.precoCusto < 0 || form.precoVenda < 0)
      return toast.error("Os preços devem ser positivos.");
    if (
      produtos.some(
        (p) => p.codigo && p.codigo === form.codigo.trim() && p.id !== editando?.id,
      )
    )
      return toast.error("Já existe um produto com esse código.");

    if (editando) {
      actualizarProduto(editando.id, form);
      toast.success("Produto actualizado.");
    } else {
      criarProduto(form);
      toast.success("Produto cadastrado.");
    }
    setAberto(false);
  }

  function apagar(p: Produto) {
    const r = removerProduto(p.id);
    if (!r.ok) toast.error(r.erro!);
    else toast.success("Produto removido.");
  }

  return (
    <AppLayout
      title="Produtos"
      description="Catálogo de produtos da clínica, preços e nível mínimo de stock."
      actions={
        <Button onClick={abrirNovo}>
          <Plus className="size-4" /> Novo produto
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar por nome, marca ou código"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["todas", ...CATEGORIAS].map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                categoria === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {c === "todas" ? "Todas" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3 text-right">Venda</th>
              <th className="px-4 py-3 text-right">Stock / Montra</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lista.map((p) => (
              <tr key={p.id} className="hover:bg-muted/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">{p.marca || "Sem marca"}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                    {p.categoria}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.codigo || "—"}</td>
                <td className="px-4 py-3 text-right">{formatMZN(p.precoCusto)}</td>
                <td className="px-4 py-3 text-right font-medium">{formatMZN(p.precoVenda)}</td>
                <td className="px-4 py-3 text-right">
                  {p.quantidadeStock} / {p.quantidadeMontra}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => abrirEdicao(p)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => apagar(p)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
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

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value as Categoria })}
                className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="custo">Preço de custo (MZN)</Label>
              <Input
                id="custo"
                type="number"
                min={0}
                value={form.precoCusto}
                onChange={(e) => setForm({ ...form, precoCusto: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="venda">Preço de venda (MZN)</Label>
              <Input
                id="venda"
                type="number"
                min={0}
                value={form.precoVenda}
                onChange={(e) => setForm({ ...form, precoVenda: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="minimo">Stock mínimo</Label>
              <Input
                id="minimo"
                type="number"
                min={0}
                value={form.stockMinimo}
                onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={guardar}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
