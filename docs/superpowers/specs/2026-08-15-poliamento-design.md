# Design — Polimento final: tradução PT-BR, UI fixes e revisão de padrões

> Data: 2026-08-15
> Status: aprovado pelo usuário
> Execute: 6 tarefas, cada uma em uma sessão nova e sequencial (task N → sessão N → commit → handoff → task N+1).

---

## 1. Contexto

O AuraSync Admin Portal foi auditado (código + backend em `../aurasync-backend`). Quase todo o sistema já está em PT-BR. Restam:

1. Strings hardcoded em inglês em 4 arquivos.
2. Erros da API em inglês exibidos verbatim nos toasts.
3. Um bug no filtro de status de pedidos (valores incorretos enviados ao backend).
4. Tabela de clientes desconfigurada (`display:block` em `<td>`).
5. Gráfico de pizza "Métodos de Pagamento" estourando o container.
6. Botão de criação de produto que deve ser removido + coluna "Estoque Local" ordenável.
7. Auditoria de conformidade com AGENTS.md (padrões) com correção de violações.

Decisões do usuário:
- Erros da API em inglês → mapear para PT-BR no frontend (helper de tradução).
- Revisão de padrões → auditar E corrigir violações encontradas.
- Cada sessão termina com commit isolado da sua task.
- Gráfico de pizza → legenda lateral customizada.

---

## 2. Sessão 1 — Tradução completa PT-BR

Objetivo: nada renderizado em tela (hardcoded ou vindo da API) deve estar em inglês.

### 2.1 Strings hardcoded

| Arquivo | Ação |
|---|---|
| `src/pages/NotFound.tsx` | "Oops! Page not found" → "Ops! Página não encontrada"; "Return to Home" → "Voltar ao início" |
| `src/pages/Inventory.tsx` | "Variant ID" (cabeçalho e label) → "ID da Variação"; "Order ID (opcional)" → "ID do Pedido (opcional)"; enums crus SALE/RESTOCK/ADJUSTMENT nos badges, toasts, options do select e helper text → usar novo `inventoryTypeLabel` |
| `src/pages/Users.tsx` | Cabeçalho "Role" → "Função"; filtro e badges de role → usar `roleLabel()` |
| `src/components/ui/sidebar.tsx` | "Toggle Sidebar" (aria-label linha 252 e title linha 255) → "Alternar barra lateral" |

### 2.2 Novo helper de erro — `src/services/api.ts`

Adicionar `getFriendlyError(err: unknown): string` (normalização de erro pertence a services, AGENTS.md §8):

- Lê `err.response.data.error` quando disponível, senão `err.message`.
- Traduz mensagens conhecidas do backend inglês → PT:

| Original | Tradução |
|---|---|
| `Invalid email or password` | `Email ou senha inválidos` |
| `User not found` | `Usuário não encontrado` |
| `Product not found` | `Produto não encontrado` |
| `Email already registered` | `Email já cadastrado` |
| `A product with this slug already exists` / `A product with this new slug already exists` | `Já existe um produto com este slug` |
| `Failed to change password` | `Falha ao alterar a senha` |
| `Unauthorized` | `Não autorizado` |
| `Session cookie not found. Use cookie-based auth.` | `Sessão expirada. Faça login novamente.` |

- Fallback: mensagem original; se vazia, `Erro desconhecido`.

### 2.3 Aplicação do helper

Trocar **todos** os call-sites que renderizam erro da API para `getFriendlyError(err)`:

- `src/pages/Orders.tsx` (3 mutations: update, delete, sync)
- `src/pages/Products.tsx` (sync)
- `src/pages/Inventory.tsx` (create)
- `src/pages/Users.tsx` (create, update, delete)
- `src/pages/Login.tsx` (linha 44, exibe `error.response.data.error`)
- `src/components/CreateProductModal.tsx` (create — será removido na Sessão 4, mas traduzir já)
- `src/components/sales/CreateCustomerDialog.tsx`
- `src/components/costs/*` (todos os dialogs/tabs com onError)
- `src/pages/Sales.tsx`

Nota: `commercial_status`, `payment_status_label` e `fulfillment_status_label` já chegam traduzidos do backend — sem ação. `gateway` é nome próprio (ex.: Mercado Pago) — manter.

### 2.4 Verificação

- `npm run lint`, `npm run typecheck` (ou `tsc --noEmit`), `npm run build`, `npm run test`.
- Busca manual: `grep` por strings inglesas remanescentes nos arquivos de UI.
- Commit: `fix(i18n): PT-BR sweep — strings hardcoded, enums e erros da API`.

---

## 3. Sessão 2 — Revisão de padrões (auditar + corrigir)

Auditoria de conformidade com AGENTS.md e correção das violações encontradas.

### 3.1 Pontos já identificados

- **Paginação duplicada**: `Products.tsx` e `Orders.tsx` têm paginação inline copiada (buttons Anterior/Próximo + Select de limite + "Página X de Y"). Existe `DataTablePagination` + `useTableFilters` compartilhados (Customers já usa). Migrar Products e Orders para `useTableFilters` + `DataTablePagination` preservando comportamento (incl. `changeFilter` para status/categoria).

### 3.2 Auditoria a executar

- Nenhuma página faz HTTP direto (todas passam por services) — confirmar com grep.
- Estados loading / error / empty em toda operação assíncrona (§11 do AGENTS.md) — verificar e corrigir lacunas.
- Lógica duplicada extraível em hook — extrair (ex.: se Inventory/Users tiverem filter/pagination inline, migrar também).
- Convenções de nomenclatura e consistência de componentes — corrigir.

### 3.3 Limites

- NÃO mudar comportamento de features; só estrutura/consistência.
- NÃO deletar arquivos que serão tratados nas Sessões 3–6 (ex.: `CreateProductModal.tsx` é removida na Sessão 4).
- Sessão termina com lint + typecheck + build + testes e commit: `refactor: padrões AGENTS.md — useTableFilters/DataTablePagination e consistência`.

---

## 4. Sessão 3 — Dashboard: gráfico "Métodos de Pagamento"

Arquivo: `src/components/dashboard/MarketingSection.tsx` (Card "Métodos de Pagamento", linhas 42-59).

### Solução escolhida: legenda lateral customizada

- Remover `label={({ method }) => paymentMethodLabel(method)}` do `<Pie>` (é o que estoura o container de 200px).
- Layout do CardContent em `flex`:
  - À esquerda: `<ResponsiveContainer>` com a pizza (sem labels), altura ~220px, `outerRadius` ajustado (~80) mantendo `innerRadius` 50.
  - À direita: lista de legenda (banda flex-1, `flex flex-col justify-center gap-2`, scroll se necessário) com: bolinha `h-2.5 w-2.5 rounded-full` na cor `hsl(i*60, 60%, 60%)` (mesma fórmula das fatias) + `paymentMethodLabel(method)` + contagem de pedidos (+ % de participação sobre o total, com 1 casa, se houver mais de 1 método).
- Tooltip customizado: `método: N pedidos (X%)`.
- Estados loading/vazio mantidos.

Verificação: lint/typecheck/build e revisão visual no browser (zoom, 2 e 8+ métodos).

Commit: `fix(dashboard): legenda lateral no gráfico de métodos de pagamento`.

---

## 5. Sessão 4 — Products: coluna ordenável + remover criação

Arquivo: `src/pages/Products.tsx`.

### 5.1 Ordenação da coluna "Estoque Local"

- Estado `stockSort: 'asc' | 'desc' | null` (null = sem ordenação).
- Cabeçalho "Estoque Local" vira botão (sem borda, texto padrão, `cursor-pointer`, `select-none`), alternando null → asc → desc → null.
- Ícone indicador: `ChevronUp` (asc) / `ChevronDown` (desc) pequeno ao lado do texto; nenhum quando null.
- Valor de ordenação: soma do `stock_quantity` das variantes (mesmo cálculo do `StockIndicator` — extrair helper `totalStock(variants)` para não duplicar a lógica, usado pelo sort e pelo render).
- Ordenação client-side sobre a página atual em `sortedProducts`:
  - Sem sort ativo → comportamento atual (is_active primeiro).
  - Com sort ativo → por estoque (asc/desc), com tie-break por `is_active` e depois nome.

### 5.2 Remover criação de produto

- Remover botão "Novo Produto" (header, linhas 190-195), CTA do empty state (linhas 219-224), estado `modalOpen`, import de `CreateProductModal` e o JSX do modal (linhas 397-401).
- Remover imports órfãos: `Plus`, `useAuth`/`isAdmin` se ficarem sem uso (verificar).
- Deletar `src/components/CreateProductModal.tsx` (único uso confirmado por grep).
- Manter `productsApi.create` no service? Não é usado por mais ninguém — remover do service e do type `CreateProductPayload`? Não: o backend tem criação via Nuvemshop; manter o endpoint no service é decisão de escopo. Remover USO na UI; manter service e types intactos (menor mudança; `productsApi.create` continua disponível para uso futuro). Justificativa no commit.

Verificação: lint/typecheck/build; UI manual (clicar cabeçalho 3x, conferir setas, conferir ausência do botão).

Commit: `feat(products): ordenação por Estoque Local e remoção da criação de produto`.

---

## 6. Sessão 5 — Orders: filtro por status

### Causa-raiz (confirmada)

- Backend (`order.repository.ts:531`): `where('status', filters.status)` — match exato.
- Backend armazena status Nuvemshop maiúsculos (`PENDING | PAID | SHIPPED | DELIVERED | CANCELED`) via `mapNuvemshopStatus` (`nuvemshop.service.ts:29`).
- Frontend (`Orders.tsx:55,171-175`) envia legados minúsculos `open/paid/shipped/closed/cancelled` → zero resultados.

### Fix

Em `src/pages/Orders.tsx`:

- `orderStatuses` (linha 55) → `['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED']`.
- Opções do Select de filtro (linhas 170-175) → mesmos valores com labels via `statusLabel()`: Pendente / Pago / Enviado / Entregue / Cancelado.
- Dropdown da linha "Marcar como Pago"/"Marcar como Enviado" (linhas 268-279) → enviar `'PAID'`/`'SHIPPED'` e ajustar os `disabled` (`order.status === 'PAID'` / `'SHIPPED'`).
- Select de status no drawer (linhas 459-475) já usa `orderStatuses` + `statusLabel` — atualizar valores automaticamente junto.
- Confirmação: `updateMutation` envia `status: value` — valores maiúsculos são aceitos pelo `OrderStatusEnum` do backend (schema `order.schema.ts:48` inclui ambos).
- Validar manualmente contra o backend rodando (filtro por cada status traz resultados).

Commit: `fix(orders): filtro de status com valores Nuvemshop (PENDING/PAID/...)`.

---

## 7. Sessão 6 — Clients: tabela + filtro

### 7.1 Tabela desconfigurada

Causa-raiz: `Customers.tsx:95-96` aplica `block` (e `truncate`) **diretamente no `<TableCell>`** → `display:block` no `<td>` quebra o layout da tabela.

Fix:
- `<TableCell className="font-medium truncate block">` → `<TableCell className="font-medium"><div className="truncate">{customer.name}</div></TableCell>`.
- `<TableCell className="truncate block text-sm text-muted-foreground">` → `<TableCell className="text-sm text-muted-foreground"><div className="truncate">{customer.email ?? '-'}</div></TableCell>`.
- Normalizar o mesmo padrão em `Orders.tsx:244-246` (`<span className="truncate block max-w-full">` → div truncate, ou remover `block` do span e manter wrapper conforme melhor render).
- Conferir que `table-fixed` + colunas com width continuam alinhadas.

### 7.2 Input de filtro no padrão do sistema

`Customers.tsx:47-55` hoje: `relative max-w-md shrink-0` solto.
→ Padrão Products/Orders: `flex flex-col sm:flex-row gap-4 shrink-0` com `relative flex-1` (mantendo o uso de `useTableFilters`/`changeSearch`).

Verificação: lint/typecheck/build; UI manual (linhas alinhadas às colunas).

Commit: `fix(customers): tabela alinhada e filtro no padrão do sistema`.

---

## 8. Protocolo de sessões (execução)

1. Cada tarefa é executada em uma sessão nova e independente.
2. Sessão N inicia lendo este doc (seção N) + confirmando estado do repo (`git status`, `git log --oneline -5`).
3. Executar a tarefa; no fim rodar: `npm run lint` && `npm run typecheck` && `npm run build` && `npm run test`.
4. Commit com a mensagem definida na seção.
5. Handoff: resumo curto no chat da sessão (O que mudou / Como validar / próximos passos). Depois inicia-se a sessão N+1.
6. Ordem obrigatória: Sessão 1 → 2 → 3 → 4 → 5 → 6.

---

## 9. Definição de pronto (por sessão)

- TypeScript sem erros, ESLint limpo, build ok, testes passando.
- Sem inglês renderizado em tela (hardcoded ou API) em qualquer tela tocada.
- Nenhuma lógica duplicada introduzida; componentes/hooks/services reaproveitados conforme AGENTS.md.
- Commit isolado com a mensagem da seção.