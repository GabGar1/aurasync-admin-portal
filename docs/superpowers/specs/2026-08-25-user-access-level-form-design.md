# Design: Access Level Field on User Create/Edit Forms

Date: 2026-08-25

## Problem

The user management form (`src/pages/Users.tsx`) does not allow assigning or changing a user's access level (`role`). The backend already supports `role` on `POST /users` and `PUT /users/:id`, but:

- `CreateUserPayload` and `UpdateUserPayload` have no `role` field.
- `CreateUserForm` and `EditUserForm` render no role input.
- Both forms use plain `useState` instead of the project standard React Hook Form + Zod (AGENTS.md §7).

## Goal

Allow the access level (`ADMIN | EMPLOYEE | SUPER_ADMIN`) to be set on user creation and changed on user edit, but only when the logged-in user is a SUPER_ADMIN.

## Requirements

1. The role field is rendered **only** for logged-in SUPER_ADMIN users.
2. For ADMIN (non-SUPER_ADMIN) users the field is hidden entirely:
   - New users default to `EMPLOYEE`.
   - Edits never send `role`.
3. When a SUPER_ADMIN creates a user, all three roles are selectable (default `EMPLOYEE`).
4. When a SUPER_ADMIN edits a user, the role is selectable among all three roles, except when editing their own account: the field is visible but **disabled**, and `role` is not sent.
5. Both user forms are migrated to React Hook Form + Zod.

## Non-Goals

- No new backend endpoints or backend changes.
- No changes to route protection, menu visibility, or `canManageUser` logic.
- No permission/access-level abstraction beyond the existing `role` string union.

## Approach

**A — Migrate forms in place (chosen):** Keep `CreateUserForm`/`EditUserForm` inside `Users.tsx`, migrate them to RHF + Zod, and add the role Select conditionally. Smallest focused diff; the page already holds the role gating logic.

## Changes

### 1. Types — `src/types/index.ts`

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

### 2. Schema — `src/lib/schemas.ts`

New `userFormSchema` (pt-BR messages, `costComponentSchema` style):

- `email`: required, valid email.
- `password`: required, min 8 chars (create only; not present on edit schema).
- `first_name`, `last_name`: required.
- `role`: `z.enum(['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'])`.

Follow existing naming: `type UserFormValues = z.infer<typeof userFormSchema>`.

### 3. Forms — `src/pages/Users.tsx`

Migrate `CreateUserForm` and `EditUserForm` to `useForm` + `zodResolver` + `FormField`/`FormControl`/`FormMessage` + shadcn `Select`, following the `CostComponentFormDialog.tsx` pattern.

- Role field rendered only when `isSuperAdmin` (`currentUser?.role === 'SUPER_ADMIN'`).
- Options labeled via `roleLabel()` from `src/lib/formatters.ts`.
- Create default role: `EMPLOYEE`.
- Edit: role Select disabled when `user.id === currentUser?.id`; when disabled (or hidden), `role` is omitted from the update payload.

### 4. Behavior Matrix

| Context | Role field |
|---|---|
| ADMIN, create/edit | hidden; new users default `EMPLOYEE`; no `role` sent on update |
| SUPER_ADMIN, create | selectable ADMIN/EMPLOYEE/SUPER_ADMIN; default `EMPLOYEE` |
| SUPER_ADMIN, edit other user | selectable; role change sent in payload |
| SUPER_ADMIN, edit self | visible but disabled; `role` not sent |

### 5. Error Handling

Existing `getFriendlyError` + toasts already handle backend 403s; the translations for SUPER_ADMIN protection already exist in `src/services/api.ts` (`Forbidden: cannot modify a SUPER_ADMIN account` etc.). No new error handling needed.

## Testing

The project has no component test framework; existing tests are schema-only (`src/lib/schemas.test.ts`). Add `userFormSchema` cases there:

- valid payload passes.
- invalid email fails.
- short password fails.
- invalid role value fails.

## Definition of Done

- TypeScript compiles without errors.
- ESLint passes.
- `userFormSchema` tests pass.
- Role field visible/editable only for SUPER_ADMIN.
- Create sends `role` (SUPER_ADMIN) or defaults to `EMPLOYEE` (ADMIN).
- Edit sends `role` only when SUPER_ADMIN editing another user.
- Loading/error/empty states preserved (toasts, mutation states).
