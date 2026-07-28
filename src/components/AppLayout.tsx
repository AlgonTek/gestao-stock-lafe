import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Store,
  ShoppingCart,
  BarChart3,
  Eye,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const NAV: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/stock", label: "Stock", icon: Warehouse },
  { to: "/montra", label: "Montra", icon: Store },
  { to: "/vendas", label: "Vendas", icon: ShoppingCart },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function AppLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Eye className="size-5" />
            </span>
            <span className="leading-tight">
              <span className="block text-base font-semibold">La Fé Stock</span>
              <span className="block text-xs text-muted-foreground">Clínica de Oftalmologia</span>
            </span>
          </Link>
          <nav className="-mx-1 flex items-center gap-1 overflow-x-auto pb-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
