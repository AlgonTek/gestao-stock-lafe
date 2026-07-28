import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const CATEGORIAS = [
  "Armações",
  "Lentes Oftálmicas",
  "Lentes de Contacto",
  "Soluções",
  "Acessórios",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export interface Produto {
  id: string;
  nome: string;
  marca: string;
  categoria: Categoria;
  precoCusto: number;
  precoVenda: number;
  codigo: string;
  stockMinimo: number;
  quantidadeStock: number;
  quantidadeMontra: number;
  createdAt: string;
}

export type TipoMovimento = "entrada" | "stock_montra" | "montra_stock" | "venda";

export interface Movimentacao {
  id: string;
  produtoId: string;
  produtoNome: string;
  tipo: TipoMovimento;
  quantidade: number;
  descricao: string;
  createdAt: string;
}

export interface ItemVenda {
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  numero: string;
  itens: ItemVenda[];
  total: number;
  desconto: number;
  metodoPagamento: string;
  observacao: string;
  createdAt: string;
}

interface State {
  produtos: Produto[];
  movimentacoes: Movimentacao[];
  vendas: Venda[];
}

const STORAGE_KEY = "lafe-stock-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

function diasAtras(d: number) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

function seed(): State {
  const base: Array<Partial<Produto> & { nome: string; categoria: Categoria }> = [
    {
      nome: "Óculos Aviador Clássico",
      marca: "Ray-Ban",
      categoria: "Armações",
      precoCusto: 8000,
      precoVenda: 15000,
      codigo: "ARM-001",
      quantidadeStock: 12,
      quantidadeMontra: 4,
    },
    {
      nome: "Armação Acetato Redonda",
      marca: "Vogue",
      categoria: "Armações",
      precoCusto: 4500,
      precoVenda: 9500,
      codigo: "ARM-002",
      quantidadeStock: 3,
      quantidadeMontra: 2,
      stockMinimo: 5,
    },
    {
      nome: "Lente Progressiva Anti-reflexo",
      marca: "Essilor",
      categoria: "Lentes Oftálmicas",
      precoCusto: 6000,
      precoVenda: 12500,
      codigo: "LEN-001",
      quantidadeStock: 20,
      quantidadeMontra: 5,
    },
    {
      nome: "Lentes Diárias (30 un.)",
      marca: "Acuvue",
      categoria: "Lentes de Contacto",
      precoCusto: 1800,
      precoVenda: 3500,
      codigo: "LCT-001",
      quantidadeStock: 40,
      quantidadeMontra: 10,
    },
    {
      nome: "Solução Multiusos 360ml",
      marca: "Renu",
      categoria: "Soluções",
      precoCusto: 600,
      precoVenda: 1250,
      codigo: "SOL-001",
      quantidadeStock: 2,
      quantidadeMontra: 6,
      stockMinimo: 8,
    },
    {
      nome: "Estojo Rígido + Pano",
      marca: "La Fé",
      categoria: "Acessórios",
      precoCusto: 200,
      precoVenda: 650,
      codigo: "ACE-001",
      quantidadeStock: 35,
      quantidadeMontra: 12,
    },
  ];

  const produtos: Produto[] = base.map((p, i) => ({
    id: `p${i + 1}`,
    marca: "",
    precoCusto: 0,
    precoVenda: 0,
    codigo: "",
    stockMinimo: 5,
    quantidadeStock: 0,
    quantidadeMontra: 0,
    createdAt: diasAtras(30 - i),
    ...p,
  })) as Produto[];

  const movimentacoes: Movimentacao[] = produtos.map((p, i) => ({
    id: uid(),
    produtoId: p.id,
    produtoNome: p.nome,
    tipo: "entrada",
    quantidade: p.quantidadeStock + p.quantidadeMontra,
    descricao: "Entrada inicial de inventário",
    createdAt: diasAtras(10 - i),
  }));

  const vendas: Venda[] = [
    { dias: 0, idx: 0, qtd: 1 },
    { dias: 1, idx: 3, qtd: 2 },
    { dias: 2, idx: 5, qtd: 3 },
    { dias: 4, idx: 2, qtd: 1 },
    { dias: 5, idx: 4, qtd: 2 },
    { dias: 6, idx: 0, qtd: 1 },
  ].map((v, i) => {
    const p = produtos[v.idx];
    const subtotal = p.precoVenda * v.qtd;
    return {
      id: uid(),
      numero: `V${String(1001 + i)}`,
      itens: [
        {
          produtoId: p.id,
          produtoNome: p.nome,
          quantidade: v.qtd,
          precoUnitario: p.precoVenda,
          subtotal,
        },
      ],
      total: subtotal,
      desconto: 0,
      metodoPagamento: "dinheiro",
      observacao: "",
      createdAt: diasAtras(v.dias),
    };
  });

  for (const venda of vendas) {
    for (const item of venda.itens) {
      movimentacoes.push({
        id: uid(),
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        tipo: "venda",
        quantidade: item.quantidade,
        descricao: `Venda ${venda.numero}`,
        createdAt: venda.createdAt,
      });
    }
  }

  return { produtos, movimentacoes, vendas };
}

interface StoreValue extends State {
  criarProduto: (p: Omit<Produto, "id" | "createdAt" | "quantidadeStock" | "quantidadeMontra">) => void;
  actualizarProduto: (id: string, p: Partial<Produto>) => void;
  removerProduto: (id: string) => { ok: boolean; erro?: string };
  darEntrada: (produtoId: string, quantidade: number, descricao?: string) => { ok: boolean; erro?: string };
  transferir: (produtoId: string, quantidade: number) => { ok: boolean; erro?: string };
  retornar: (produtoId: string, quantidade: number) => { ok: boolean; erro?: string };
  registarVenda: (input: {
    itens: Array<{ produtoId: string; quantidade: number; precoUnitario: number }>;
    desconto: number;
    metodoPagamento: string;
    observacao: string;
  }) => { ok: boolean; erro?: string; venda?: Venda };
  anularVenda: (id: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => seed());

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setState(JSON.parse(raw) as State);
      } catch {
        /* ignora dados corrompidos */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const registarMov = useCallback(
    (s: State, produto: Produto, tipo: TipoMovimento, quantidade: number, descricao = "") => [
      {
        id: uid(),
        produtoId: produto.id,
        produtoNome: produto.nome,
        tipo,
        quantidade,
        descricao,
        createdAt: new Date().toISOString(),
      },
      ...s.movimentacoes,
    ],
    [],
  );

  const value = useMemo<StoreValue>(() => {
    const findProduto = (id: string) => state.produtos.find((p) => p.id === id);

    return {
      ...state,
      criarProduto: (p) =>
        setState((s) => ({
          ...s,
          produtos: [
            ...s.produtos,
            {
              ...p,
              id: uid(),
              quantidadeStock: 0,
              quantidadeMontra: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      actualizarProduto: (id, patch) =>
        setState((s) => ({
          ...s,
          produtos: s.produtos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removerProduto: (id) => {
        const p = findProduto(id);
        if (!p) return { ok: false, erro: "Produto não encontrado." };
        if (p.quantidadeStock > 0 || p.quantidadeMontra > 0)
          return { ok: false, erro: "Só pode remover produtos com inventário a zero." };
        setState((s) => ({ ...s, produtos: s.produtos.filter((x) => x.id !== id) }));
        return { ok: true };
      },
      darEntrada: (produtoId, quantidade, descricao = "") => {
        if (quantidade <= 0) return { ok: false, erro: "Quantidade deve ser positiva." };
        const p = findProduto(produtoId);
        if (!p) return { ok: false, erro: "Produto não encontrado." };
        setState((s) => ({
          ...s,
          produtos: s.produtos.map((x) =>
            x.id === produtoId ? { ...x, quantidadeStock: x.quantidadeStock + quantidade } : x,
          ),
          movimentacoes: registarMov(s, p, "entrada", quantidade, descricao || "Entrada de stock"),
        }));
        return { ok: true };
      },
      transferir: (produtoId, quantidade) => {
        const p = findProduto(produtoId);
        if (!p) return { ok: false, erro: "Produto não encontrado." };
        if (quantidade <= 0) return { ok: false, erro: "Quantidade deve ser positiva." };
        if (quantidade > p.quantidadeStock)
          return { ok: false, erro: `Apenas ${p.quantidadeStock} unidades disponíveis em stock.` };
        setState((s) => ({
          ...s,
          produtos: s.produtos.map((x) =>
            x.id === produtoId
              ? {
                  ...x,
                  quantidadeStock: x.quantidadeStock - quantidade,
                  quantidadeMontra: x.quantidadeMontra + quantidade,
                }
              : x,
          ),
          movimentacoes: registarMov(s, p, "stock_montra", quantidade, "Transferência para a montra"),
        }));
        return { ok: true };
      },
      retornar: (produtoId, quantidade) => {
        const p = findProduto(produtoId);
        if (!p) return { ok: false, erro: "Produto não encontrado." };
        if (quantidade <= 0) return { ok: false, erro: "Quantidade deve ser positiva." };
        if (quantidade > p.quantidadeMontra)
          return { ok: false, erro: `Apenas ${p.quantidadeMontra} unidades expostas na montra.` };
        setState((s) => ({
          ...s,
          produtos: s.produtos.map((x) =>
            x.id === produtoId
              ? {
                  ...x,
                  quantidadeMontra: x.quantidadeMontra - quantidade,
                  quantidadeStock: x.quantidadeStock + quantidade,
                }
              : x,
          ),
          movimentacoes: registarMov(s, p, "montra_stock", quantidade, "Retorno da montra ao armazém"),
        }));
        return { ok: true };
      },
      registarVenda: ({ itens, desconto, metodoPagamento, observacao }) => {
        if (itens.length === 0) return { ok: false, erro: "A venda não tem itens." };
        for (const item of itens) {
          const p = findProduto(item.produtoId);
          if (!p) return { ok: false, erro: "Produto não encontrado." };
          if (item.quantidade > p.quantidadeMontra)
            return { ok: false, erro: `${p.nome}: apenas ${p.quantidadeMontra} unidades na montra.` };
        }
        const itensVenda: ItemVenda[] = itens.map((i) => {
          const p = findProduto(i.produtoId)!;
          return {
            produtoId: i.produtoId,
            produtoNome: p.nome,
            quantidade: i.quantidade,
            precoUnitario: i.precoUnitario,
            subtotal: i.precoUnitario * i.quantidade,
          };
        });
        const bruto = itensVenda.reduce((acc, i) => acc + i.subtotal, 0);
        const venda: Venda = {
          id: uid(),
          numero: `V${1001 + state.vendas.length}`,
          itens: itensVenda,
          total: Math.max(0, bruto - desconto),
          desconto,
          metodoPagamento,
          observacao,
          createdAt: new Date().toISOString(),
        };
        setState((s) => ({
          ...s,
          vendas: [venda, ...s.vendas],
          produtos: s.produtos.map((p) => {
            const item = itensVenda.find((i) => i.produtoId === p.id);
            return item ? { ...p, quantidadeMontra: p.quantidadeMontra - item.quantidade } : p;
          }),
          movimentacoes: [
            ...itensVenda.map((i) => ({
              id: uid(),
              produtoId: i.produtoId,
              produtoNome: i.produtoNome,
              tipo: "venda" as const,
              quantidade: i.quantidade,
              descricao: `Venda ${venda.numero}`,
              createdAt: venda.createdAt,
            })),
            ...s.movimentacoes,
          ],
        }));
        return { ok: true, venda };
      },
      anularVenda: (id) =>
        setState((s) => {
          const venda = s.vendas.find((v) => v.id === id);
          if (!venda) return s;
          return {
            ...s,
            vendas: s.vendas.filter((v) => v.id !== id),
            produtos: s.produtos.map((p) => {
              const item = venda.itens.find((i) => i.produtoId === p.id);
              return item ? { ...p, quantidadeMontra: p.quantidadeMontra + item.quantidade } : p;
            }),
            movimentacoes: s.movimentacoes.filter((m) => m.descricao !== `Venda ${venda.numero}`),
          };
        }),
    };
  }, [state, registarMov]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore deve ser usado dentro de StoreProvider");
  return ctx;
}
