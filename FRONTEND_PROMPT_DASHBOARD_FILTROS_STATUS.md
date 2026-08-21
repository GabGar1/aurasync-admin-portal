# Frontend Prompt — Mudanças: Filtro de Data, Campanhas, fulfillment_status e Receita

> Prompt para a equipe de frontend: o que mudou no backend e como o frontend deve consumir/ajustar.
> Escopo desta rodada: dashboard (filtro de data, campanhas, receita) e página de Pedidos (filtro de status).

## Resumo das mudanças

| Área | Mudança |
|------|---------|
| Filtro de data (dashboard) | Seleção de **dia único** (1º clique) que estende para intervalo (2º clique). Botão **Limpar** volta ao padrão de 30 dias. |
| Campanhas (by_campaign) | Pedidos com `utm_campaign = null` agora são agrupados por `utm_source`/`utm_medium`. Grupo sem UTM vira **"Orgânico/Direto"**. |
| Receita do dashboard | Receita/AOV/top produtos **excluem** pedidos com sinais negativos: `payment_status` em `voided/refunded/cancelled`, `fulfillment_status` em `cancelled/CANCELED`, `status` em `CANCELED/cancelled` (antes só excluía `status = CANCELED`). |
| Página de Pedidos | Filtro por **`fulfillment_status`** (substitui `status`). Filtro case-insensitive; `pending` casa pedidos com `fulfillment_status` null. |

---

## 1. Endpoints de dashboard — datas

Os 3 endpoints aceitam os mesmos params (mantidos, mas o comportamento mudou):

| Param | Tipo | Descrição |
|-------|------|-----------|
| `days` | `number` | Janela deslizante. Default `30`. |
| `start_date` | `string` `YYYY-MM-DD` | Início do range. Pode ser enviado **sozinho** = aquele dia inteiro. |
| `end_date` | `string` `YYYY-MM-DD` | Fim do range. Pode ser enviado **sozinho** = aquele dia inteiro. |

Comportamento novo:

- `start_date` **ou** `end_date` sozinho = janela de um único dia (antes caía silenciosamente na janela de 30 dias).
- Se `end_date < start_date` → erro `400 { error: "end_date cannot be before start_date" }`.
- Formato deve ser `YYYY-MM-DD` (rejeitado se for outro).
- `start_date` + `end_date` juntos = intervalo normal. `start_date == end_date` = dia único.

**Frontend:** ao enviar dia único, mandar `start_date` e `end_date` iguais (ou só um deles). Recomendado enviar os dois iguais — o DateRangePicker já faz isso.

Endpoints:
- `GET /api/dashboard/orders`
- `GET /api/dashboard/marketing`
- `GET /api/dashboard/stock`

---

## 2. `by_campaign` — novo formato das linhas

**Endpoint:** `GET /api/dashboard/marketing`
**Response path:** `.by_campaign`

Cada item agora traz `source` e `medium`:

```ts
type CampaignStats = {
  campaign: string | null;  // utm_campaign do Nuvemshop (ID numérico, ex: "120222198954390582")
  source: string | null;    // utm_source — preenchido SOMENTE quando campaign é null
  medium: string | null;    // utm_medium — preenchido SOMENTE quando campaign é null
  orders: number;
  revenue: number;
  aov: number;
};
```

Como interpretar:

| `campaign` | `source`/`medium` | Significado |
|-----------|-------------------|-------------|
| valor (ID) | null | Campanha real do Nuvemshop — exibir o ID |
| null | preenchido | Pedidos sem `utm_campaign` mas com origem — exibir `utmSourceLabel(source) / utmMediumLabel(medium)` |
| null | null | Pedidos sem nenhum UTM — exibir **"Orgânico/Direto"** |

**Frontend:** a coluna "Campanha" da tabela deve renderizar na ordem: `campaign` → `source / medium` → `Orgânico/Direto`. **Não renderizar mais "N/A".**

---

## 3. Filtro de status da página de Pedidos

**Endpoint:** `GET /api/orders`
**Querystring:** `fulfillment_status` (substitui `status`), `search`, `page`, `limit`.

Valores aceitos (case-insensitive no backend):

| Param | Casa no banco |
|-------|---------------|
| `pending` | `fulfillment_status` null OU `'pending'` |
| `unpacked` | `UNPACKED`/`unpacked` |
| `dispatched` | `DISPATCHED`/`dispatched` |
| `delivered` | `DELIVERED`/`delivered` |
| `marked_as_fulfilled` | `MARKED_AS_FULFILLED`/`marked_as_fulfilled` |
| `cancelled` | `cancelled`/`CANCELED` |

> O param `status` não é mais aceito nesta rota. Se o frontend enviar, será ignorado (não filtra).

**Frontend (já aplicado):** o dropdown da página de Pedidos usa:
`Pendente / Empacotando / Despachado / Entregue / Marcado como Concluído / Cancelado` + "Todos os Status".

Os campos `status`, `payment_status` e `fulfillment_status` continuam existindo no response e no detalhe do pedido — nada muda no desenho do drawer.

---

## 4. Receita do dashboard — sem mudança de contrato

Sem alteração de schema/response. Apenas comportamento: pedidos com qualquer sinal negativo ficam **fora** de:

- `revenue_trend`, `average_order_value`, `by_hour`, `by_status`, `repeat_customers` (endpoint `orders`)
- `by_storefront`, `by_province`, `by_campaign`, `by_source`, `by_payment_method` (endpoint `marketing`)
- `top_products` (pedidos destes também não entram)
- Estoque: `no_sales_30d`, `turnover_rate`, `dead_stock` (pedidos negativos não contam como venda)

O `by_status` do dashboard já agrupava por `fulfillment_status` — a única mudança é que o slice `cancelled` não aparece mais (esses pedidos são excluídos da base).

---

## 5. Verificação manual

1. Abrir o dashboard e selecionar **um dia** no calendário → o filtro aplica naquele dia (não cai para 30 dias).
2. Selecionar um range com 2 cliques → intervalo normal.
3. Clicar "Limpar" → volta ao padrão (últimos 30 dias).
4. Card "Campanhas": o antigo "N/A" não existe mais — agora aparecem linhas tipo "Instagram / social" e "Orgânico/Direto".
5. Página de Pedidos: filtrar por "Entregue", "Cancelado" etc. → lista reflete `fulfillment_status`.
6. Conferir que receita/AOV não mudam quando existe pedido "Estornado" (payment_status voided) no período.
