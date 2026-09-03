# Design: Custos — Drawers laterais, Fechamento Mensal e Venda Externa

**Data:** 2026-09-02
**Repositórios:** `aurasync-admin-portal` (frontend) + `aurasync-backend` (backend)

## Contexto

Quatro melhorias solicitadas:

1. Subgrupos: drawer lateral ao clicar na linha (padrão da tela de Pedidos) substituindo os dialogs de produtos/componentes/edição.
2. Componentes: mesmo padrão de drawer (edição + associações).
3. Fechamento Mensal: hoje não mostra nada (resultado só em `useState` local, sem GET) — criar resumo financeiro mensal (receitas x custos) com endpoint novo no backend.
4. Venda Externa: garantir estoque disponível nos produtos do seletor e melhorar a UI das opções (1 linha).

## Decisões (aprovadas pelo usuário)

| Ponto | Decisão |
|---|---|
| Dados do fechamento | Backend ganha `GET /api/cost-closing/summary?month=YYYY-MM`, cálculo on-read (sem persistência nova) |
| Drawer subgrupos | Substitui completamente os dialogs (form, produtos, componentes) — abas Informações / Produtos / Componentes |
| Drawer componentes | Abas Informações (edição inline) / Associações |
| Variantes sem estoque | Escondidas da lista (filtro server-side `in_stock` + guard client-side) |
| CSRF | Verificado: `csrf.middleware.ts` ignora GET/HEAD/OPTIONS — hook router-level permanece |

## 1. Backend — `GET /api/cost-closing/summary`

- Query: `month` obrigatório (`/^\d{4}-\d{2}$/`) → `resolvePeriod` existente.
- Guards: `fastify.authenticate` + `requireRole(['ADMIN','SUPER_ADMIN'])` (rota `/costs` já é admin-only no frontend).
- Agregação on-read (pedidos não-cancelados, `deleted_at IS NULL`, janela por `created_at`):
  - `revenue` = `SUM(total_amount)` · `sale_costs` = `SUM(total_cost)` · `orders` = COUNT · `units_sold` = `SUM(order_items.quantity)` · `average_order_value`
  - `monthly_costs` = `SUM(order_monthly_allocations.amount)` + breakdown por componente (`id, name, type, allocation_basis, total_amount`)
  - `total_costs`, `profit`, `margin_percent` derivados · `revenue_by_status` (status, count, revenue)
- Resposta validada com schema Zod (padrão `dashboard.schema.ts`).
- Teste de integração no padrão de `cost-closing.service.integration.test.ts`.

## 2. Backend — `in_stock` no `GET /api/products`

- `product.router.ts`: querystring `in_stock` opcional (`'true'`).
- `product.repository.ts findAll`: `whereExists` de variante com `stock_quantity > 0` na query base (paginação/total corretos) + filtro no attach das variantes.

## 3. Frontend — Fechamento Mensal

- `CostClosingSummary` em `types/index.ts`; `costClosingApi.getSummary({ month })` em `services/api.ts`.
- `CostClosingTab` reescrito: seletor de mês (default mês corrente), KPI cards (Receita Bruta, Custos por Venda, Custos Mensais, Custo Total, Lucro, Margem %, Pedidos, Ticket Médio), breakdown por componente, receita por status, banner "mês ainda não fechado" quando `monthly_costs === 0`, botão "Fechar mês" (POST + invalidação da query do summary), skeleton/erro/empty.

## 4. Frontend — Drawer de Subgrupos

- Seções reutilizáveis extraídas dos dialogs (query keys/invalidações preservadas):
  - `SubgroupProductsSection` — keys `['subgroup-products', subgroup?.id, page, search]`, `['subgroup-assign-products', assignSearch]`; invalida `['subgroup-products', subgroup?.id]` + `['products']`.
  - `SubgroupComponentsSection` — key `['subgroup-components', subgroup?.id]`.
  - `SubgroupForm` — RHF + `productSubgroupSchema`; mutações de update permanecem em `SubgroupsTab` (invalidam `['product-subgroups']` + `['products']`).
- `SubgroupDetailDrawer`: `Sheet side="right"`, `w-[640px] sm:max-w-[640px]`, corpo `overflow-y-auto`, abas Informações | Produtos | Componentes, dados com `enabled: open && !!subgroup`.
- `SubgroupsTab`: row click abre drawer (`cursor-pointer`, `stopPropagation` na célula Ações); dropdown reduz a Excluir; dialogs antigos removidos.

## 5. Frontend — Drawer de Componentes

- `CostComponentForm` (de `CostComponentFormDialog`, schema `costComponentSchema`) e `ComponentAssociationsSection` (de `ProductAssociationsDialog`, key `['cost-associations', productId]`).
- `ComponentDetailDrawer`: mesmo padrão, abas Informações | Associações.
- `ComponentsTab`: row click abre drawer; dropdown mantém Simular custo e Excluir; `SimulateCostDialog` ganha `max-h` + scroll interno.

## 6. Frontend — VariantPicker (Venda Externa)

- Prop `hideOutOfStock?: boolean` (default `false` — SimulateCostDialog inalterado); `Sales.tsx` passa `true`.
- `productsApi.getAll` com `in_stock: true`; guard client-side `stock_quantity > 0` contra dado defasado; corrida residual coberta pela validação do backend (`external-sale.repository.ts` rejeita venda sem estoque).
- Opção em 1 linha: nome + variante truncados à esquerda; SKU, preço e badge `Estoque: N` à direita. Trigger mostra estoque. `limit` 10 → 25.

## Verificação

- Backend: `npm test` (inclui novo teste de integração do summary).
- Frontend: `npm test`, `npm run lint`, `npm run build` (typecheck).
