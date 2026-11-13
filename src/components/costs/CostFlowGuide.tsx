import { ArrowRight, Boxes, CalendarCheck, Layers, ShoppingBag } from 'lucide-react';

const steps = [
  { icon: Layers, title: 'Componentes', text: 'O que custa: embalagem, etiqueta, taxa, frete, custos fixos do mês.' },
  { icon: Boxes, title: 'Subgrupos e produtos', text: 'Onde cada custo se aplica: a um grupo de produtos ou a um produto.' },
  { icon: ShoppingBag, title: 'Cada venda', text: 'O custo é calculado e congelado no pedido, com lucro e margem.' },
  { icon: CalendarCheck, title: 'Fechamento do mês', text: 'Os custos fixos do mês são divididos entre os pedidos daquele mês.' },
];

/** How the cost model fits together, shown above the tabs. */
export function CostFlowGuide() {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Como os custos são calculados">
      {steps.map((step, i) => (
        <li key={step.title} className="relative flex gap-3 rounded-lg border bg-card p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <step.icon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              <span className="mr-1 text-muted-foreground">{i + 1}.</span>
              {step.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{step.text}</p>
          </div>
          {i < steps.length - 1 ? (
            <ArrowRight aria-hidden className="absolute -right-2.5 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground xl:block" />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
