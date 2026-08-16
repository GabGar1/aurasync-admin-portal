# Polimento Final (PT-BR, UI fixes, Padrões) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan. Cada Task equivale a UMA SESSÃO nova e independente. Execute exclusivamente a Task da sua sessão, verifique, commite e faça handoff — NUNCA execute a Task seguinte (ela rodará em outra sessão). Steps usam checkbox (`- [ ]`) para tracking.

**Goal:** Eliminar inglês renderizado, corrigir 4 bugs de UI (gráfico pizza, ordenação/remoção em Products, filtro de status de Orders, tabela de Customers) e auditar/corrigir padrões do sistema — em 6 sessões sequenciais, uma por task, com commit no fim de cada uma.

**Architecture:** Frontend React + TS + Vite (shadcn/ui, TanStack Query, recharts). Padrão obrigatório: Pages → Components → Hooks → Services (AGENTS.md). Nenhuma página faz HTTP direto. Erros de API são normalizados via `getFriendlyError` no service. Ordenação client-side da página atual (backend sem sort). Filtro de status corrigido com os valores Nuvemshop que o backend realmente armazena.

**Tech Stack:** React 18, TypeScript, Vite, React Router, Tailwind, shadcn/ui, TanStack Query, Axios, sonner, recharts, vitest.

## Global Constraints

- **Sessões:** Task 1 = Sessão 1 → Task 6 = Sessão 6. Ordem obrigatória 1→6, uma por sessão, sessão termina após commit + handoff.
- **Verificação obrigatória no fim de TODA task:** `npm run lint && npx tsc --noEmit && npm run build && npm run test` (não existe script `typecheck`; use `tsc --noEmit`).
- **Git:** o working tree já contém alterações WIP não commitadas (inclusive em `src/pages/Orders.tsx`, `src/pages/Products.tsx`, `src/pages/Customers.tsx`). Commite SOMENTE os arquivos tocados pela sua task (paths explícitos), nunca `git add -A`/`git add .`. Se o arquivo já tinha WIP anterior, ele entra no commit — avise no handoff.
- **Idioma:** todo texto renderizado em tela (hardcoded ou vindo da API) em PT-BR. `SKU`, `slug`, `Pix`, `gateway` (nome próprio) não são traduzidos.
- **Patterns:** reutilize componentes/hooks/services existentes; não introduza padrão novo se existe equivalente.
- **Spec de referência:** `docs/superpowers/specs/2026-08-15-poliamento-design.md`.
- **Suporte do projeto:** backend em `../aurasync-backend` (para consulta/validação, NÃO alterar nesta plan).

---

## Task 1 (Sessão 1) — Tradução completa PT-BR

**Files:**
- Modify: `src/pages/NotFound.tsx:15,17`
- Modify: `src/lib/formatters.ts` (novo `inventoryTypeLabel` + testes)
- Modify: `src/lib/formatters.test.ts`
- Modify: `src/pages/Inventory.tsx:21-25,50-52,99,102,123,188-192,207,223-225,241,246`
- Modify: `src/pages/Users.tsx:24-32,166-168,203`
- Modify: `src/components/ui/sidebar.tsx:252,255`
- Modify: `src/services/api.ts` (novo `getFriendlyError` + testes)
- Create: `src/services/api.test.ts`
- Modify: call-sites de erro da API (trocar para `getFriendlyError`): `src/pages/Orders.tsx:97-99,108-110,119-121`, `src/pages/Products.tsx:115`, `src/pages/Inventory.tsx:50-52`, `src/pages/Users.tsx:79-81,93-95,106-108`, `src/pages/Sales.tsx:112`, `src/pages/Login.tsx:44`, `src/components/CreateProductModal.tsx:78`, `src/components/sales/CreateCustomerDialog.tsx:49-51`, `src/components/costs/CreditFeeTab.tsx:57`, `src/components/costs/CostClosingTab.tsx:33`, `src/components/costs/ComponentsTab.tsx:67,77,87`, `src/components/costs/SubgroupsTab.tsx:68,78,88`, `src/components/costs/SubgroupComponentsDialog.tsx:63,76`, `src/components/costs/SubgroupProductsDialog.tsx:64,76`, `src/components/costs/ProductAssociationsDialog.tsx:89,98`, `src/components/costs/SimulateCostDialog.tsx:33`

**Interfaces:**
- Produces: `inventoryTypeLabel(type: string): string` em `@/lib/formatters` — mapa `SALE→'Venda'`, `RESTOCK→'Reabastecimento'`, `ADJUSTMENT→'Ajuste manual'`, fallback valor original.
- Produces: `getFriendlyError(err: unknown): string` em `@/services/api` — lê `err.response.data.error`, depois `err.message`; traduz mensagens conhecidas do backend; fallback `'Erro desconhecido'`.
- Consumes: nada de tasks anteriores.

### Steps

- [ ] **Step 1: Confirmar estado do repositório**

Run: `git status --short && git log --oneline -3`
Expected: branch `develop`, último commit `733f633 docs: design do polimento final...`, WIP presente.

- [ ] **Step 2: Escrever os testes que falham (inventoryTypeLabel + getFriendlyError)**

Em `src/lib/formatters.test.ts`, adicionar dentro do describe `'rótulos novos'`:

```ts
  it('traduz tipos de transação de inventário', () => {
    expect(inventoryTypeLabel('SALE')).toBe('Venda');
    expect(inventoryTypeLabel('RESTOCK')).toBe('Reabastecimento');
    expect(inventoryTypeLabel('ADJUSTMENT')).toBe('Ajuste manual');
    expect(inventoryTypeLabel('TIPO_DESCONHECIDO')).toBe('TIPO_DESCONHECIDO');
  });
```

E adicionar `inventoryTypeLabel` ao import do TOPO do arquivo (linha 2-7):

```ts
import {
  typeLabel, categoryLabel, calculationBaseLabel, storefrontLabel,
  sourceLabel, paymentMethodLabel, statusLabel, preferLabel, marginPercent,
  roleLabel, utmSourceLabel, utmMediumLabel, capitalizeWords, effectiveOrderStatus,
  allocationBasisLabel, formatDateOnly, inventoryTypeLabel,
} from './formatters';
```

Criar `src/services/api.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getFriendlyError } from './api';

describe('getFriendlyError', () => {
  it('traduz erros conhecidos vindo de response.data.error', () => {
    expect(getFriendlyError({ response: { data: { error: 'Invalid email or password' } } })).toBe('Email ou senha inválidos');
    expect(getFriendlyError({ response: { data: { error: 'User not found' } } })).toBe('Usuário não encontrado');
    expect(getFriendlyError({ response: { data: { error: 'Product not found' } } })).toBe('Produto não encontrado');
    expect(getFriendlyError({ response: { data: { error: 'Email already registered' } } })).toBe('Email já cadastrado');
    expect(getFriendlyError({ response: { data: { error: 'A product with this slug already exists' } } })).toBe('Já existe um produto com este slug');
    expect(getFriendlyError({ response: { data: { error: 'A product with this new slug already exists' } } })).toBe('Já existe um produto com este slug');
    expect(getFriendlyError({ response: { data: { error: 'Failed to change password' } } })).toBe('Falha ao alterar a senha');
    expect(getFriendlyError({ response: { data: { error: 'Unauthorized' } } })).toBe('Não autorizado');
    expect(getFriendlyError({ response: { data: { error: 'Session cookie not found. Use cookie-based auth.' } } })).toBe('Sessão expirada. Faça login novamente.');
  });

  it('usa err.message quando não há response', () => {
    expect(getFriendlyError({ message: 'Invalid email or password' })).toBe('Email ou senha inválidos');
    expect(getFriendlyError({ message: 'Coisa estranha aconteceu' })).toBe('Coisa estranha aconteceu');
  });

  it('retorna Erro desconhecido quando não há mensagem', () => {
    expect(getFriendlyError({})).toBe('Erro desconhecido');
    expect(getFriendlyError(undefined)).toBe('Erro desconhecido');
    expect(getFriendlyError('')).toBe('Erro desconhecido');
  });
});
```

- [ ] **Step 3: Rodar os testes para ver falhar**

Run: `npx vitest run src/lib/formatters.test.ts src/services/api.test.ts`
Expected: FAIL — `inventoryTypeLabel is not a function` / `getFriendlyError is not defined`.

- [ ] **Step 4: Implementar `inventoryTypeLabel` em `src/lib/formatters.ts`**

Adicionar após `roleLabel` (final do arquivo):

```ts
const inventoryTypeLabels: Record<string, string> = {
  SALE: 'Venda',
  RESTOCK: 'Reabastecimento',
  ADJUSTMENT: 'Ajuste manual',
};

export function inventoryTypeLabel(type: string): string {
  return inventoryTypeLabels[type] ?? type;
}
```

- [ ] **Step 5: Implementar `getFriendlyError` em `src/services/api.ts`**

Adicionar no fim de `src/services/api.ts` (antes de `export default api;`):

```ts
const errorTranslations: Record<string, string> = {
  'Invalid email or password': 'Email ou senha inválidos',
  'User not found': 'Usuário não encontrado',
  'Product not found': 'Produto não encontrado',
  'Email already registered': 'Email já cadastrado',
  'A product with this slug already exists': 'Já existe um produto com este slug',
  'A product with this new slug already exists': 'Já existe um produto com este slug',
  'Failed to change password': 'Falha ao alterar a senha',
  'Unauthorized': 'Não autorizado',
  'Session cookie not found. Use cookie-based auth.': 'Sessão expirada. Faça login novamente.',
};

interface ErrorShape {
  response?: { data?: { error?: unknown } };
  message?: unknown;
}

function readErrorMessage(err: unknown): string | undefined {
  if (typeof err === 'string') return err || undefined;
  if (!err || typeof err !== 'object') return undefined;
  const candidate = err as ErrorShape;
  const fromResponse = candidate.response?.data?.error;
  if (typeof fromResponse === 'string' && fromResponse) return fromResponse;
  if (typeof candidate.message === 'string' && candidate.message) return candidate.message;
  return undefined;
}

export function getFriendlyError(err: unknown): string {
  const raw = readErrorMessage(err);
  if (!raw) return 'Erro desconhecido';
  return errorTranslations[raw] ?? raw;
}
```

- [ ] **Step 6: Rodar os testes para ver passar**

Run: `npx vitest run src/lib/formatters.test.ts src/services/api.test.ts`
Expected: ALL PASS.

- [ ] **Step 7: Traduzir `src/pages/NotFound.tsx`**

Trocar linhas 15 e 17:

```tsx
        <p className="mb-4 text-xl text-muted-foreground">Ops! Página não encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Voltar ao início
        </a>
```

- [ ] **Step 8: Traduzir `src/components/ui/sidebar.tsx`**

Linhas 252 e 255: `aria-label="Toggle Sidebar"` → `aria-label="Alternar barra lateral"` e `title="Toggle Sidebar"` → `title="Alternar barra lateral"`.

- [ ] **Step 9: Traduzir `src/pages/Users.tsx`**

No `RoleBadge` (linhas 24-32) — trocar os literais nos três `Badge` (linhas 26, 29, 31) de `{role}` para `{roleLabel(role)}` e importar `roleLabel` (linha 9): `import { formatDate, roleLabel } from '@/lib/formatters';`. Filtrar opções (linhas 166-168) trocando labels:

```tsx
<SelectItem value="ADMIN">Admin</SelectItem>
<SelectItem value="EMPLOYEE">Funcionário</SelectItem>
<SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
```

Cabeçalho (linha 203): `<TableHead>Role</TableHead>` → `<TableHead>Função</TableHead>`.

- [ ] **Step 10: Traduzir `src/pages/Inventory.tsx`**

- Import (linha 8): `import { formatDate, inventoryTypeLabel } from '@/lib/formatters';`
- Cabeçalho linha 99: `Variant ID` → `ID da Variação`
- Cabeçalho linha 102: `Pedido ID` → `ID do Pedido`
- Badge linha 123: `{t.type}` → `{inventoryTypeLabel(t.type)}`
- Toasts linhas 188 e 192:
  - `'SALE deve ter quantidade negativa'` → `'Venda deve ter quantidade negativa'`
  - `'RESTOCK deve ter quantidade positiva'` → `'Reabastecimento deve ter quantidade positiva'`
- Options linhas 223-225:
  - `"SALE (Venda — negativo)"` → `"Venda (negativo)"`
  - `"RESTOCK (Reabastecimento — positivo)"` → `"Reabastecimento (positivo)"`
  - `"ADJUSTMENT (Ajuste manual)"` → `"Ajuste manual"`
- Helper text linha 241: `'Use valor negativo para SALE'` → `'Use valor negativo para venda'`; `'Use valor positivo para RESTOCK'` → `'Use valor positivo para reabastecimento'`
- Label linha 207: `Variant ID` → `ID da Variação`
- Label linha 246: `Order ID (opcional)` → `ID do Pedido (opcional)`

- [ ] **Step 11: Aplicar `getFriendlyError` em todos os call-sites**

Padrão — substituir o sufixo `${...}` pela chamada (mantendo o prefixo PT existente). Exemplos:

`src/pages/Orders.tsx:98,109,120` (3x):
```ts
    onError: (err) => toast.error(`Falha ao atualizar: ${getFriendlyError(err)}`),
    onError: (err) => toast.error(`Falha ao cancelar: ${getFriendlyError(err)}`),
    onError: (err) => toast.error(`Falha ao sincronizar: ${getFriendlyError(err)}`),
```
(import: adicionar `getFriendlyError` ao import existente de `@/services/api` — remover o tipo `ApiError` do import de `@/types` onde ele deixar de ser usado; remover `ApiError` do import de tipos se não for mais referenciado.)

`src/pages/Products.tsx:115`: `onError: (error: Error) => toast.error(`Falha ao sincronizar: ${getFriendlyError(error)}`)` — import `getFriendlyError` de `@/services/api` (linha 3 vira `import { productsApi, getFriendlyError } from "@/services/api";`)

`src/pages/Inventory.tsx:50-52`: `onError: (err) => toast.error(`Falha ao registrar: ${getFriendlyError(err)}`)` (import linha 4: remover `ApiError` do tipo se não usado; import linha 3: `import { inventoryApi, getFriendlyError } from '@/services/api';`)

`src/pages/Users.tsx:79-81,93-95,106-108`: 3x → `Falha ao criar: ${getFriendlyError(err)}`, `Falha ao atualizar: ${getFriendlyError(err)}`, `Falha ao remover: ${getFriendlyError(err)}`

`src/pages/Sales.tsx:112`: `onError: (err) => toast.error(`Falha ao registrar venda: ${getFriendlyError(err)}`)`

`src/pages/Login.tsx:42-45` — trocar a leitura bruta pela função:
```ts
        if (error.response?.status === 401) {
          form.setError("root", { message: getFriendlyError(error) });
```

`src/components/CreateProductModal.tsx:78`: `toast.error(getFriendlyError(error) ?? "Erro ao criar produto")` → apenas `toast.error(getFriendlyError(error));`

`src/components/sales/CreateCustomerDialog.tsx:49-51`: `` `Falha ao criar cliente: ${getFriendlyError(err)}` ``

Components under `src/components/costs/` (mantendo prefixos): `CreditFeeTab.tsx:57` `Falha ao atualizar`, `CostClosingTab.tsx:33` `Falha no fechamento`, `ComponentsTab.tsx:67/77/87` `Falha ao criar/atualizar/excluir`, `SubgroupsTab.tsx:68/78/88` idem, `SubgroupComponentsDialog.tsx:63/76` `Falha ao vincular/remover`, `SubgroupProductsDialog.tsx:64/76` `Falha ao desvincular/atribuir`, `ProductAssociationsDialog.tsx:89/98` `Falha ao associar/remover`, `SimulateCostDialog.tsx:33` `Falha ao simular`.

Todos: adicionar `getFriendlyError` ao import de `@/services/api` (ou criar import novo `import { getFriendlyError } from '@/services/api';`), remover import de `ApiError` de `@/types` quando passar a não ser usado. Rodar `npx tsc --noEmit` no fim do Step 13 para pegar imports órfãos — o eslint também acusa `no-unused-vars`.

- [ ] **Step 12: Verificação final**

Run: `npm run lint && npx tsc --noEmit && npm run build && npm run test`
Expected: ALL PASS, sem avisos.

Auditoria textual (nada em inglês renderizado por estes arquivos):
Run: `rg -n 'Page not found|Return to Home|Variant ID|Order ID|Toggle Sidebar|\bSALE\b|\bRESTOCK\b|\bADJUSTMENT\b|>Role<' src/pages/NotFound.tsx src/pages/Inventory.tsx src/pages/Users.tsx src/components/ui/sidebar.tsx`
Expected: nenhuma ocorrência.

- [ ] **Step 13: Commit (somente arquivos desta task)**

```bash
git add src/pages/NotFound.tsx src/pages/Inventory.tsx src/pages/Users.tsx src/components/ui/sidebar.tsx src/lib/formatters.ts src/lib/formatters.test.ts src/services/api.ts src/services/api.test.ts src/pages/Orders.tsx src/pages/Products.tsx src/pages/Sales.tsx src/pages/Login.tsx src/components/CreateProductModal.tsx src/components/sales/CreateCustomerDialog.tsx src/components/costs/CreditFeeTab.tsx src/components/costs/CostClosingTab.tsx src/components/costs/ComponentsTab.tsx src/components/costs/SubgroupsTab.tsx src/components/costs/SubgroupComponentsDialog.tsx src/components/costs/SubgroupProductsDialog.tsx src/components/costs/ProductAssociationsDialog.tsx src/components/costs/SimulateCostDialog.tsx
git commit -m "fix(i18n): PT-BR sweep — strings hardcoded, enums de inventário, erros da API"
```

**HANGOFF (fim da Sessão 1):** resuma no chat: o que mudou, comandos de verificação rodados, e que a Sessão 2 pode começar.

---

## Task 2 (Sessão 2) — Revisão de padrões: migração para useTableFilters/DataTablePagination + auditoria

**Files:**
- Modify: `src/pages/Products.tsx` (paginação inline → hook + componente)
- Modify: `src/pages/Orders.tsx` (idem)
- Audit (sem commit obrigatório de mudança se nada for achado): todas as pages/services/hooks

**Interfaces:**
- Consumes: `useTableFilters<TFilter>({ defaultLimit })` de `@/hooks/useTableFilters` → `{ page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter }`; `<DataTablePagination page limit total onPageChange onLimitChange />` de `@/components/DataTablePagination`; `getFriendlyError` (Task 1).
- Produces: nada novo; comportamento igual ao anterior.

### Steps

- [ ] **Step 1: Confirmar estado**

Run: `git status --short && git log --oneline -3`
Expected: último commit da Sessão 1 (`fix(i18n): PT-BR sweep...`).

- [ ] **Step 2: Migrar `src/pages/Products.tsx` para `useTableFilters` + `DataTablePagination`**

Import (adicionar):
```ts
import { useTableFilters } from '@/hooks/useTableFilters';
import DataTablePagination from '@/components/DataTablePagination';
```

Substituir as três linhas de estado (83-87 — `page`, `limit`, `search`, `category`, `modalOpen`):
```ts
  const { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter } = useTableFilters<{ category: string }>();
  const category = filter?.category ?? 'all';
  const [modalOpen, setModalOpen] = useState(false);
```

Onde os handlers usavam `setSearch(...); setPage(1)` (linha 162) → `changeSearch(e.target.value)`. No Select de categoria (linha 167):
```ts
          onValueChange={(value) => { changeFilter(value === 'all' ? undefined : { category: value }); }}
```
(remover o `setPage(1)` — `changeFilter` já reseta a página; adicionar o `changeFilter` ao objeto desestruturado acima.)

`onValueChange` do Select de limite (linha 362): `setLimit(Number(value)); setPage(1)` → `changeLimit(Number(value))`.

Substituir TODO o bloco de paginação inline (linhas 354-395) por:
```tsx
      {data && (
        <DataTablePagination
          page={data.page}
          limit={data.limit}
          total={data.total}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      )}
```

Remover imports agora órfãos: `ChevronLeft, ChevronRight` do import de lucide (linha 20) e `Plus` se ainda não usado; conferir com `npx tsc --noEmit` + eslint. `useState` continua usado (`modalOpen`, `expandedRows`, `page`/`limit` não mais).

- [ ] **Step 3: Migrar `src/pages/Orders.tsx` para `useTableFilters` + `DataTablePagination`**

Idem Task 2 Step 2 no `src/pages/Orders.tsx`:
```ts
import { useTableFilters } from '@/hooks/useTableFilters';
import DataTablePagination from '@/components/DataTablePagination';
```
```ts
  const { page, limit, search, debouncedSearch, filter, setPage, changeSearch, changeLimit, changeFilter } = useTableFilters<{ status: string }>();
  const statusFilter = filter?.status ?? 'all';
```
(remover as linhas 63-67 dos estados `page`, `limit`, `statusFilter`, `search`; manter `useDebounce`? — não: `useDebounce` era usado para `debouncedSearch`, que agora vem do hook. Remover o import `useDebounce` se órfão.)

- Input (linha 159): `onChange={(e) => { setSearch(e.target.value); setPage(1); }}` → `onChange={(e) => changeSearch(e.target.value)}`
- Select de status (linha 164): `onValueChange={(value) => { setStatusFilter(value); setPage(1); }}` → `onValueChange={(value) => { changeFilter(value === 'all' ? undefined : { status: value }); }}`
- Select de limite (linha 309): → `onLimitChange={changeLimit}` via DataTablePagination.
- Substituir bloco de paginação inline (linhas 301-342) pelo `<DataTablePagination ... onPageChange={setPage} onLimitChange={changeLimit} />`.
- Remover a constante `const totalPages = data ? Math.ceil(data.total / limit) : 1;` (linha 142) — o `DataTablePagination` calcula internamente; revisar usos restantes.
- Remover imports órfãos (`ChevronLeft, ChevronRight`, `useDebounce`) se não usados.

- [ ] **Step 4: Rodar verificação**

Run: `npm run lint && npx tsc --noEmit && npm run build && npm run test`
Expected: ALL PASS.

Run: `npm run dev` e validar manualmente (opcional se backend disponível): paginação e filtros de Products/Orders se comportam igual.

- [ ] **Step 5: Auditoria AGENTS.md (correção apenas de violações claras)**

Rodar e anotar resultados no handoff (corrigir somente o que for violação clara e barata):

1. Run: `rg -n "axios|fetch\(" src/pages src/components --glob '!**/ui/**'` → nenhuma page/component faz HTTP direto (services é o único).
2. Review de estados loading/error/empty nas páginas que ainda não conferem em conjunto com o código (percorrer `src/pages/*.tsx`): qualquer operação assíncrona sem feedback → adicionar o padrão existente (Alert destrutivo + "Tentar novamente" para error; Skeleton para loading; estado vazio com ícone Lucide).
3. Duplicação de lógica extraível → extrair para hook apenas se o mesmo trecho aparecer em 2+ páginas (ex.: repetições de empty state podem virar componente se aparecerem 3+ vezes; não criar abstrações prematuras).
4. Nomenclatura/estilo inconsistente flagrante (ex.: aspas simples vs duplas no mesmo arquivo não é priority; classes tailwind fora do design system sim).

Se alguma correção for feita, incluir os arquivos no commit abaixo.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Products.tsx src/pages/Orders.tsx  # + arquivos do Step 5 se houver
git commit -m "refactor: padrões AGENTS.md — useTableFilters/DataTablePagination em Products e Orders"
```

**HANGOFF:** listar achados da auditoria (corrigidos ou aceitos), comandos rodados.

---

## Task 3 (Sessão 3) — Dashboard: legenda lateral no gráfico "Métodos de Pagamento"

**Files:**
- Modify: `src/components/dashboard/MarketingSection.tsx:42-59`

**Interfaces:**
- Consumes: `paymentMethodLabel` de `@/lib/formatters`; `by_payment_method: PaymentMethodStats[]` (`method: string | null; orders: number`); recharts.
- Produces: nada para tasks seguintes.

### Steps

- [ ] **Step 1: Confirmar estado**

Run: `git log --oneline -3` → último commit da Sessão 2.

- [ ] **Step 2: Reescrever o Card "Métodos de Pagamento"**

Em `src/components/dashboard/MarketingSection.tsx`, substituir o conteúdo do Card (linhas 43-59) por:

```tsx
        {/* Payment Methods */}
        <Card>
          <CardHeader><CardTitle>Métodos de Pagamento</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[220px]" /> : !data?.by_payment_method?.length ? <p className="text-muted-foreground text-center py-8">Sem dados</p> : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.by_payment_method}
                      dataKey="orders"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                    >
                      {data.by_payment_method.map((entry, i) => (
                        <Cell key={i} fill={`hsl(${i * 60}, 60%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} pedidos`, paymentMethodLabel(name)]} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex-1 w-full space-y-2 max-h-[220px] overflow-y-auto">
                  {data.by_payment_method.map((entry, i) => {
                    const total = data.by_payment_method.reduce((s, e) => s + e.orders, 0);
                    const pct = total > 0 ? (entry.orders / total) * 100 : 0;
                    return (
                      <li key={i} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: `hsl(${i * 60}, 60%, 60%)` }} />
                          <span className="truncate">{paymentMethodLabel(entry.method)}</span>
                        </span>
                        <span className="text-muted-foreground shrink-0 tabular-nums">
                          {entry.orders} ({pct.toFixed(1).replace('.', ',')}%)
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
```

Observações:
- Remover o `label={({ method }) => paymentMethodLabel(method)}` do `<Pie>` (era o causador do estouro).
- `total` é recalculado por item — manter como está (simples) OU mover para fora com `const total = ...` dentro do bloco antes do return: **preferido** mover para fora do `map` (declarar logo após o ternário do `!data?.by_payment_method?.length`, dentro da expressão): se preferir, faça
```tsx
{(() => { const total = data.by_payment_method.reduce((s, e) => s + e.orders, 0); return ( /* JSX do flex acima, sem a linha const total */ ); })()}
```
- `method` em `PaymentMethodStats` é `string | null`; `paymentMethodLabel` já aceita null.

- [ ] **Step 3: Verificação estática**

Run: `npm run lint && npx tsc --noEmit && npm run build && npm run test`
Expected: ALL PASS.

- [ ] **Step 4: Verificação visual**

Run: `npm run dev` com backend de pé (ou mockar via abas do navegador), conferir no Dashboard → Marketing → "Métodos de Pagamento": pizza centralizada sem labels estourando, legenda à direita com bolinhas/count/%, rolagem se > ~8 métodos, estados de loading/vazio intactos.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/MarketingSection.tsx
git commit -m "fix(dashboard): legenda lateral no gráfico de métodos de pagamento"
```

---

## Task 4 (Sessão 4) — Products: ordenação por "Estoque Local" + remoção da criação de produto

**Files:**
- Create: `src/lib/stock.ts` (helper `totalStock` + `sortProductsByStock`)
- Create: `src/lib/stock.test.ts`
- Modify: `src/pages/Products.tsx`
- Delete: `src/components/CreateProductModal.tsx`

**Interfaces:**
- Produces: de `@/lib/stock`:
  - `totalStock(variants: Array<{ stock_quantity: number }> | null | undefined): number` — soma de `stock_quantity`, `0` para null/undefined.
  - `sortProductsByStock(products: Array<{ is_active: boolean; name: string; variants?: Array<{ stock_quantity: number }> | null }>, direction: 'asc' | 'desc'): Array<...>` — ordenação estável: estoque (asc/desc) → `is_active` (ativos primeiro) → `name` (localeCompare 'pt-BR'). Retorna NOVO array.
- Consumes: nada de tasks anteriores (getFriendlyError continua usado no produto).

### Steps

- [ ] **Step 1: Confirmar estado**

Run: `git log --oneline -3` → último commit da Sessão 3.

- [ ] **Step 2: Testes que falham — `src/lib/stock.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { totalStock, sortProductsByStock } from './stock';
import type { Product, ProductVariant } from '@/types';

const vars = (qs: (number | null)[]): ProductVariant[] =>
  qs.map((q, i) => ({ id: `v${i}`, stock_quantity: q ?? 0 } as unknown as ProductVariant));

describe('totalStock', () => {
  it('soma as quantidades das variantes', () => {
    expect(totalStock(vars([1, 2, 3]))).toBe(6);
  });
  it('trata arrays vazios, null e undefined', () => {
    expect(totalStock([])).toBe(0);
    expect(totalStock(null)).toBe(0);
    expect(totalStock(undefined)).toBe(0);
  });
});

describe('sortProductsByStock', () => {
  const products = [
    { id: 'p1', name: 'Alfa', is_active: true, variants: vars([10]) },
    { id: 'p2', name: 'Beta', is_active: true, variants: vars([0]) },
    { id: 'p3', name: 'Gama', is_active: false, variants: vars([5]) },
    { id: 'p4', name: 'Delta', is_active: true, variants: null },
  ] as unknown as Product[];

  it('ordena crescente por estoque', () => {
    expect(sortProductsByStock(products, 'asc').map((p) => p.id)).toEqual(['p4', 'p2', 'p3', 'p1']);
  });

  it('ordena decrescente por estoque', () => {
    expect(sortProductsByStock(products, 'desc').map((p) => p.id)).toEqual(['p1', 'p3', 'p2', 'p4']);
  });

  it('não muta o array original', () => {
    const copy = [...products];
    sortProductsByStock(products, 'asc');
    expect(products).toEqual(copy);
  });
});
```

- [ ] **Step 3: Rodar para falhar**

Run: `npx vitest run src/lib/stock.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 4: Implementar `src/lib/stock.ts`**

```ts
import type { Product } from '@/types';

export function totalStock(variants: Array<{ stock_quantity: number }> | null | undefined): number {
  return variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0;
}

export function sortProductsByStock(products: Product[], direction: 'asc' | 'desc'): Product[] {
  return [...products].sort((a, b) => {
    const diff = totalStock(a.variants) - totalStock(b.variants);
    if (diff !== 0) return direction === 'asc' ? diff : -diff;
    const activeDiff = (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    if (activeDiff !== 0) return activeDiff;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}
```

- [ ] **Step 5: Rodar para passar**

Run: `npx vitest run src/lib/stock.test.ts`
Expected: PASS.

- [ ] **Step 6: Modificar `src/pages/Products.tsx` — ordenação**

- Import (linha 8): adicionar `import { totalStock, sortProductsByStock } from '@/lib/stock';`
- Import lucide (linha 20): adicionar `ChevronUp`; remover `Plus` (será removido no Step 8).
- Adicionar estado e handler (junto aos estados, após linha 87 — antes de `useDebouncedSearch`? após):

```ts
  const [stockSort, setStockSort] = useState<'asc' | 'desc' | null>(null);

  function toggleStockSort() {
    setStockSort((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null));
  }
```

- Reescrever `sortedProducts` (linhas 118-124):

```ts
  const sortedProducts = useMemo(() => {
    const productsArray = data?.products;
    if (!productsArray || !Array.isArray(productsArray)) return [];
    if (stockSort) {
      return sortProductsByStock(productsArray, stockSort);
    }
    return [...productsArray].sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));
  }, [data, stockSort]);
```

- Cabeçalho (linhas 235) — substituir `<TableHead className="w-[11%]">Estoque Local</TableHead>` por:

```tsx
                  <TableHead className="w-[11%]">
                    <button
                      type="button"
                      onClick={toggleStockSort}
                      aria-label="Ordenar por Estoque Local"
                      className="flex items-center gap-1 font-medium cursor-pointer select-none"
                    >
                      Estoque Local
                      {stockSort === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : null}
                      {stockSort === 'desc' ? <ChevronDown className="h-3.5 w-3.5" /> : null}
                    </button>
                  </TableHead>
```

- Linha 282 — usar o helper (substituir `product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) ?? 0` por `totalStock(product.variants)`).

- [ ] **Step 7: Remover criação de produto em `src/pages/Products.tsx`**

- Linhas 21: remover `import CreateProductModal from "@/components/CreateProductModal";`
- Linha 87: remover `const [modalOpen, setModalOpen] = useState(false);` (e useState continua usado por `expandedRows`).
- Linhas 80-81: remover `const { getUser } = useAuth();` / `const currentUser = getUser();` / `const admin = isAdmin(currentUser?.role);` e os imports `useAuth` (linha 6) e `isAdmin` (linha 7) se ficarem sem uso — mas `isAdmin` retorna usado por... só Products usava aqui; `useAuth` só para isso. Remover ambos os imports.
- Linhas 190-195: remover o bloco `{admin ? (...) : null}` (botão "Novo Produto").
- Linhas 219-224: remover o bloco `{admin && !hasFilters ? (...) : null}` (CTA empty state).
- Linhas 397-401: remover `<CreateProductModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ["products"] })} />`.
- Remover `Plus` do import lucide (linha 20).

- [ ] **Step 8: Deletar o componente**

Run: `rm src/components/CreateProductModal.tsx`
Esperado: sem dependências (único uso era Products — conferido na Sessão 1). Se `rg -n "CreateProductModal" src/` acusar algo além de nada, interromper e revisar.

- [ ] **Step 9: Verificação**

Run: `npm run lint && npx tsc --noEmit && npm run build && npm run test`
Expected: ALL PASS.

Manual: `npm run dev` → Products: clicar "Estoque Local" 3x (asc → desc → neutro), setas corretas; botão "Novo Produto" ausente em header/empty state; dados da página ordenam.

- [ ] **Step 10: Commit**

```bash
git add src/lib/stock.ts src/lib/stock.test.ts src/pages/Products.tsx
git rm src/components/CreateProductModal.tsx
git commit -m "feat(products): ordenação por Estoque Local e remoção da criação de produto"
```

---

## Task 5 (Sessão 5) — Orders: filtro de status com valores Nuvemshop

**Files:**
- Modify: `src/pages/Orders.tsx:55,170-177,268-279` (após migração da Sessão 2, linhas podem ter mudado — localizar pelos textos)

**Interfaces:**
- Consumes: `statusLabel` de `@/lib/formatters` (já importado); backend em `../aurasync-backend` para validação.
- Produces: nada.

### Steps

- [ ] **Step 1: Confirmar estado**

Run: `git log --oneline -3` → último commit da Sessão 4.

- [ ] **Step 2: Trocar os valores de status**

1. Linha 55: `const orderStatuses = ['open', 'paid', 'shipped', 'closed', 'cancelled'] as const;` →
```ts
const orderStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'] as const;
```

2. Opções do Select de filtro (linhas ~171-177, após a migração) — substituir:
```tsx
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="SHIPPED">Enviado</SelectItem>
            <SelectItem value="DELIVERED">Entregue</SelectItem>
            <SelectItem value="CANCELED">Cancelado</SelectItem>
```

3. Dropdown de ações da linha (linhas ~268-279): trocar `status: 'paid'` → `status: 'PAID'` e `disabled={order.status === 'paid'}` → `disabled={order.status === 'PAID'}`; `status: 'shipped'` → `status: 'SHIPPED'` e `disabled={order.status === 'shipped'}` → `disabled={order.status === 'SHIPPED'}`. Labels permanecem "Marcar como Pago"/"Marcar como Enviado".

4. Drawer (Select de status 459-475) já usa `orderStatuses` + `statusLabel` — atualiza sozinho; `selectedOrder.status` virá do backend (maiúsculo) e casa com `PENDING/...`.

- [ ] **Step 3: Verificação estática**

Run: `npm run lint && npx tsc --noEmit && npm run build && npm run test`
Expected: ALL PASS.

- [ ] **Step 4: Validação funcional**

Com o backend rodando (`cd ../aurasync-backend && npm run dev`, se disponível):
Run: `npm run dev` → Orders: selecionar cada status no filtro e confirmar resultados coerentes (ex.: "Pago" lista pedidos `PAID`). Sem backend, validar por inspeção do request `GET /orders?status=PENDING` (network tab) e comparar com a doc do backend (`order.router.ts:32`: querystring `status?: string`; repository filtra `where('status', status)`; dados gravados por `mapNuvemshopStatus` = uppercase).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Orders.tsx
git commit -m "fix(orders): filtro de status com valores Nuvemshop (PENDING/PAID/SHIPPED/DELIVERED/CANCELED)"
```

---

## Task 6 (Sessão 6) — Customers: tabela alinhada + filtro no padrão

**Files:**
- Modify: `src/pages/Customers.tsx:47-55,79-107`
- Modify: `src/pages/Orders.tsx:244-246` (normalizar mesmo padrão)

**Interfaces:**
- Consumes: `useTableFilters` já em uso em Customers; `Search`, `Input`.
- Produces: nada.

### Steps

- [ ] **Step 1: Confirmar estado**

Run: `git log --oneline -3` → último commit da Sessão 5.

- [ ] **Step 2: Corrigir as células da tabela (causa do alinhamento)**

Causa raiz: `block`/`truncate` no próprio `<TableCell>` torna o `<td>` `display:block` e quebra a tabela.

Em `src/pages/Customers.tsx`, linhas 95-96 (e conferir demais `<TableCell>` da tabela — Cidade/UF/etc. não têm classes de layout):

```tsx
                  <TableCell className="font-medium"><div className="truncate">{customer.name}</div></TableCell>
                  <TableCell className="text-sm text-muted-foreground"><div className="truncate">{customer.email ?? '-'}</div></TableCell>
```

Em `src/pages/Orders.tsx`, linha 244-246 (mesmo vício com `block` no span):

```tsx
                      <TableCell className="font-medium"><div className="truncate max-w-full">{order.customer_name}</div></TableCell>
```

Conferir requisito do ellipsis: "nome longo trunca sem quebrar a linha" (o `truncate` no div interno + `table-fixed`/larguras das `<TableHead>` garantem isso).

- [ ] **Step 3: Padronizar o filtro**

Em `src/pages/Customers.tsx`, substituir linhas 47-55:

```tsx
      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou email..."
            className="pl-9"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
          />
        </div>
      </div>
```

(igual ao padrão Products/Orders da Sessão 2; remove `max-w-md`.)

- [ ] **Step 4: Verificação**

Run: `npm run lint && npx tsc --noEmit && npm run build && npm run test`
Expected: ALL PASS.

Manual: `npm run dev` → Clientes: cada valor alinhado à sua coluna (nome | email | cidade | UF | pedidos | total | ticket | última compra), email não "cai" para a coluna do nome; filtro ocupa largura plena e busca funciona. Orders: nome do cliente trunca normal.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Customers.tsx src/pages/Orders.tsx
git commit -m "fix(customers): tabela alinhada às colunas e filtro no padrão do sistema"
```

**HANGOFF final (Sessão 6):** resumo geral do polimento + sugestão de revisão de código (superpowers:requesting-code-review) antes de merge.

---

## Self-Review (executado ao escrever)

- **Spec coverage:** Spec §2 → Task 1; §3 → Task 2; §4 → Task 3; §5 → Task 4; §6 → Task 5; §7 → Task 6; §8 (protocolo de sessões) refletido no header/Global Constraints. ✓
- **Placeholders:** nenhum "TBD"; todos os steps com código ou comando exato. ✓
- **Type consistency:** `inventoryTypeLabel`, `getFriendlyError`, `totalStock`, `sortProductsByStock` definidos antes do uso em tasks posteriores (Tasks 1 e 4 produzem; Tasks 2-6 consomem apenas o que existe). Migração da Sessão 2 remove os estados `page/limit` inline e `useDebounce` — Tasks 3/4/5/6 não dependem deles. ✓

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-15-poliamento.md`.** Execute SEMPRE via superpowers:executing-plans, uma task por sessão, na ordem 1→6 — cada task termina em commit + handoff antes de abrir a próxima sessão.