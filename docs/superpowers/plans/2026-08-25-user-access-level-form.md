# Access Level Field on User Forms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow SUPER_ADMIN users to set/change a user's access level (`role`) on create/edit, and migrate both user forms to React Hook Form + Zod.

**Architecture:** Add `role` to `CreateUserPayload`/`UpdateUserPayload`, add `createUserSchema`/`updateUserSchema` to `lib/schemas.ts`, and rewrite `CreateUserForm`/`EditUserForm` inside `src/pages/Users.tsx` using the RHF + `FormField` + shadcn `Select` pattern from `CostComponentFormDialog.tsx`. Role visibility is gated by a `showRole` prop; self-edit disables the field via `disableRole`.

**Tech Stack:** React 18, TypeScript, Vite, React Hook Form, @hookform/resolvers, Zod, shadcn/ui (Select, Form), TanStack Query, Vitest, ESLint.

## Global Constraints

- Roles are exactly `'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN'`; display labels come from `roleLabel()` in `src/lib/formatters.ts`.
- UI copy and validation messages in pt-BR; API field names in snake_case (`first_name`, `last_name`).
- Do NOT add code comments. No new dependencies.
- Follow the existing `CostComponentFormDialog.tsx` pattern (useForm + zodResolver + FormField/FormControl/FormMessage).
- Schema naming convention: `<feature>Schema` + `type <Feature>FormValues = z.infer<...>` (precedent: `customerCreateSchema`).
- For ADMIN (non-SUPER_ADMIN) users the role field is hidden entirely; new users default to `EMPLOYEE`; edits never send `role`.
- A SUPER_ADMIN cannot change their own role (field visible but disabled, `role` not sent).

---

### Task 1: Add `role` to User Payload Types

**Files:**
- Modify: `src/types/index.ts:183-194`

**Interfaces:**
- Produces: `CreateUserPayload.role` (required, `'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN'`), `UpdateUserPayload.role` (optional, same union). Consumed by `usersApi.create`/`usersApi.update` (unchanged) and the forms in Tasks 3-4.

- [ ] **Step 1: Add `role` to `CreateUserPayload` and `UpdateUserPayload`**

In `src/types/index.ts`, replace lines 183-194:

```ts
export interface CreateUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  status?: boolean;
  role?: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no output, exit code 0. (If other pre-existing errors exist in unrelated files, they must be pre-existing — confirm with `git stash && npx tsc --noEmit` if unsure.)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): adiciona role aos payloads de criação e atualização de usuário"
```

---

### Task 2: Add User Form Schemas (TDD)

**Files:**
- Modify: `src/lib/schemas.test.ts` (append tests)
- Modify: `src/lib/schemas.ts` (append schemas, after `storedUserSchema` at line 85)

**Interfaces:**
- Consumes: nothing (standalone Zod).
- Produces:
  - `export const createUserSchema` → `{ email: string; password: string; first_name: string; last_name: string; role: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN' }`
  - `export type CreateUserFormValues = z.infer<typeof createUserSchema>`
  - `export const updateUserSchema` → `{ first_name: string; last_name: string; status: 'active' | 'inactive'; role: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN' }`
  - `export type UpdateUserFormValues = z.infer<typeof updateUserSchema>`
  - Consumed by forms in Tasks 3-4.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/schemas.test.ts`:

```ts
import { costComponentSchema, productSubgroupSchema, externalSaleSchema, storedUserSchema, createUserSchema, updateUserSchema } from './schemas';
```

(replace the existing import line 2), then append at the end of the file:

```ts
describe('createUserSchema', () => {
  it('aceita usuário válido', () => {
    const result = createUserSchema.safeParse({
      email: 'novo@example.com',
      password: 'senha12345',
      first_name: 'João',
      last_name: 'Silva',
      role: 'ADMIN',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita email inválido', () => {
    const result = createUserSchema.safeParse({
      email: 'invalido',
      password: 'senha12345',
      first_name: 'João',
      last_name: 'Silva',
      role: 'EMPLOYEE',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita senha curta', () => {
    const result = createUserSchema.safeParse({
      email: 'novo@example.com',
      password: '1234567',
      first_name: 'João',
      last_name: 'Silva',
      role: 'EMPLOYEE',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita role inválida', () => {
    const result = createUserSchema.safeParse({
      email: 'novo@example.com',
      password: 'senha12345',
      first_name: 'João',
      last_name: 'Silva',
      role: 'OWNER',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('aceita payload válido', () => {
    const result = updateUserSchema.safeParse({
      first_name: 'Maria',
      last_name: 'Souza',
      status: 'active',
      role: 'SUPER_ADMIN',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const result = updateUserSchema.safeParse({
      first_name: '',
      last_name: 'Souza',
      status: 'active',
      role: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita status inválido', () => {
    const result = updateUserSchema.safeParse({
      first_name: 'Maria',
      last_name: 'Souza',
      status: 'banned',
      role: 'ADMIN',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita role inválida', () => {
    const result = updateUserSchema.safeParse({
      first_name: 'Maria',
      last_name: 'Souza',
      status: 'inactive',
      role: 'OWNER',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/schemas.test.ts`
Expected: FAIL — `SyntaxError: ... createUserSchema is not exported` (import resolution error).

- [ ] **Step 3: Implement the schemas**

Append to `src/lib/schemas.ts` (after `storedUserSchema`, line 85):

```ts
export const createUserSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN']),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  status: z.enum(['active', 'inactive']),
  role: z.enum(['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN']),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/schemas.test.ts`
Expected: PASS — all describes green (8 new tests + existing ones).

- [ ] **Step 5: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat(schemas): validação zod para criação e edição de usuário com role"
```

---

### Task 3: Migrate CreateUserForm to RHF + Zod with Role Field

**Files:**
- Modify: `src/pages/Users.tsx`

**Interfaces:**
- Consumes: `createUserSchema`, `CreateUserFormValues` (Task 2); `CreateUserPayload` with `role` (Task 1); `roleLabel` (existing); `isSuperAdmin` computed in `Users()`.
- Produces: `CreateUserForm({ open, showRole, isPending, onSubmit })` where `showRole: boolean` controls role Select visibility; `onSubmit(payload: CreateUserPayload)`.

- [ ] **Step 1: Update imports**

In `src/pages/Users.tsx`, replace line 1:

```ts
import { useEffect, useState } from 'react';
```

Replace the import on line 5 to add the schema imports:

```ts
import { usersApi, getFriendlyError } from '@/services/api';
import type { User, CreateUserPayload, UpdateUserPayload, GetUsersResponse, ChangePasswordPayload } from '@/types';
import { createUserSchema, updateUserSchema, type CreateUserFormValues, type UpdateUserFormValues } from '@/lib/schemas';
```

Add after line 15 (`import { Input } ...`):

```ts
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
```

- [ ] **Step 2: Remove the now-unused `Label` import**

Remove line 23 (`import { Label } from '@/components/ui/label';`).

- [ ] **Step 3: Replace `CreateUserForm` (lines 364-433)**

Replace the entire `CreateUserForm` function with:

```ts
const CREATE_DEFAULTS: CreateUserFormValues = {
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: 'EMPLOYEE',
};

function CreateUserForm({ open, showRole, onSubmit, isPending }: { open: boolean; showRole: boolean; onSubmit: (payload: CreateUserPayload) => void; isPending: boolean }) {
  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(CREATE_DEFAULTS);
    }
  }, [open, form]);

  function handleSubmit(values: CreateUserFormValues) {
    onSubmit({
      email: values.email.trim(),
      password: values.password,
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      role: values.role,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input placeholder="Sobrenome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {showRole && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de acesso</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'] as const).map((role) => (
                      <SelectItem key={role} value={role}>{roleLabel(role)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Criando...</> : 'Criar'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
```

- [ ] **Step 4: Wire `open` and `showRole` props at the call site**

Replace the create dialog block (lines 300-311) with:

```tsx
<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Novo Usuário</DialogTitle>
      <DialogDescription>Preencha os dados para criar um novo usuário</DialogDescription>
    </DialogHeader>
    <CreateUserForm
      open={createDialogOpen}
      showRole={isSuperAdmin}
      onSubmit={(payload) => createMutation.mutate(payload)}
      isPending={createMutation.isPending}
    />
  </DialogContent>
</Dialog>
```

- [ ] **Step 5: Verify lint, types and tests**

Run: `npm run lint && npx tsc --noEmit && npx vitest run src/lib/schemas.test.ts`
Expected: no ESLint errors, no type errors, all schema tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Users.tsx
git commit -m "feat(users): form de criação migrado para RHF+Zod com campo de nível de acesso"
```

---

### Task 4: Migrate EditUserForm to RHF + Zod with Role Field

**Files:**
- Modify: `src/pages/Users.tsx`

**Interfaces:**
- Consumes: `updateUserSchema`, `UpdateUserFormValues` (Task 2); `UpdateUserPayload` with optional `role` (Task 1); `roleLabel` (existing).
- Produces: `EditUserForm({ user, open, showRole, disableRole, isPending, onSubmit })` where `showRole` controls visibility, `disableRole` disables the Select, and `onSubmit(payload: UpdateUserPayload)`.

- [ ] **Step 1: Replace `EditUserForm` (lines 435-491)**

Replace the entire `EditUserForm` function with:

```ts
function EditUserForm({ user, open, showRole, disableRole, onSubmit, isPending }: { user: User; open: boolean; showRole: boolean; disableRole: boolean; onSubmit: (payload: UpdateUserPayload) => void; isPending: boolean }) {
  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      status: user.status ? 'active' : 'inactive',
      role: user.role,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        first_name: user.first_name,
        last_name: user.last_name,
        status: user.status ? 'active' : 'inactive',
        role: user.role,
      });
    }
  }, [open, user, form]);

  function handleSubmit(values: UpdateUserFormValues) {
    const payload: UpdateUserPayload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      status: values.status === 'active',
    };
    if (showRole && !disableRole) {
      payload.role = values.role;
    }
    onSubmit(payload);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sobrenome</FormLabel>
                <FormControl>
                  <Input placeholder="Sobrenome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {showRole && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de acesso</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disableRole}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'] as const).map((role) => (
                      <SelectItem key={role} value={role}>{roleLabel(role)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
```

- [ ] **Step 2: Wire `open`, `showRole` and `disableRole` props at the call site**

Replace the edit dialog block (lines 313-327) with:

```tsx
<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Editar Usuário</DialogTitle>
      <DialogDescription>Atualize os dados do usuário</DialogDescription>
    </DialogHeader>
    {editingUser && (
      <EditUserForm
        user={editingUser}
        open={editDialogOpen}
        showRole={isSuperAdmin}
        disableRole={editingUser.id === currentUser?.id}
        onSubmit={(payload) => updateMutation.mutate({ id: editingUser.id, payload })}
        isPending={updateMutation.isPending}
      />
    )}
  </DialogContent>
</Dialog>
```

- [ ] **Step 3: Verify lint, types and tests**

Run: `npm run lint && npx tsc --noEmit && npx vitest run src/lib/schemas.test.ts`
Expected: no ESLint errors, no type errors, all schema tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Users.tsx
git commit -m "feat(users): form de edição migrado para RHF+Zod com nível de acesso restrito a SUPER_ADMIN"
```

---

### Task 5: Full Verification

**Files:** none (read-only verification).

- [ ] **Step 1: Run all checks**

Run: `npm run lint && npx tsc --noEmit && npm test`
Expected: lint clean, no type errors, all tests pass.

- [ ] **Step 2: Manual end-to-end checklist (dev server `npm run dev`)**

Log in as SUPER_ADMIN:
1. Users page → "Novo Usuário" → field "Nível de acesso" visible; create a user with role `ADMIN` → row shows "Admin" badge.
2. Edit that user → role Select enabled; change to `EMPLOYEE` and save → badge updates.
3. Edit own (SUPER_ADMIN) account → role Select visible but disabled; save with other field changes → succeeds, role unchanged.

Log in as ADMIN:
1. Users page → "Novo Usuário" → "Nível de acesso" field absent; create user → new user appears with "Funcionário" badge.
2. Edit any non-SUPER_ADMIN user → no role field; saving works.
3. Edit a SUPER_ADMIN user → actions column absent (existing `canManageUser` behavior unchanged).

- [ ] **Step 3: Confirm no regressions in error states**

- Create with duplicate email → toast "Falha ao criar: ..." (existing `getFriendlyError`).
- Empty required fields → inline `FormMessage` errors (pt-BR), submit blocked.
- API down → existing loading/error/empty states preserved (toasts, skeleton rows).

- [ ] **Step 4: Final commit (only if any fix was needed in Steps 1-3)**

```bash
git add -A
git commit -m "fix(users): ajustes finais após verificação"
```

(If nothing was fixed, skip this step — do not create an empty commit.)

---

## Self-Review Notes

- Spec coverage: role in payloads (Task 1), schemas + tests (Task 2), role field create (Task 3), role field edit + self-disable + ADMIN hidden (Task 4), error/loading/empty states + E2E (Task 5). No spec requirement left unplanned.
- Placeholder scan: every step contains complete code or exact commands; no TBD/TODO.
- Type consistency: `CreateUserFormValues`/`UpdateUserFormValues` names match between Tasks 2-4; `showRole`/`disableRole` prop names consistent across Tasks 3-4; `role` union matches `storedUserSchema`/`RoleBadge` values.
