# AuraSync Frontend — Project Context & Standards (Harness)

> Reference document for the AI agent (Claude Code / Superpowers-style harness) working on this repository.
> This document defines the frontend architecture, conventions, coding standards and implementation workflow.
> It intentionally does **not** document backend endpoints or known bugs.

---

# 1. Project Domain

AuraSync Admin Portal is the frontend application for the AuraSync ecosystem.

Its purpose is to provide a secure administration interface for:

- Dashboard and business metrics
- Product catalog management
- Order management
- Inventory management
- User management

The frontend is a client of the AuraSync Backend API.

Business rules belong to the backend.

The frontend is responsible for:

- Presenting information
- Collecting user input
- Client-side validation
- Authentication state
- Route protection
- User experience

Never move business logic from the backend into the frontend.

---

# 2. Tech Stack

- React
- TypeScript
- Vite
- React Router
- TailwindCSS
- shadcn/ui
- Axios
- React Hook Form
- Zod

---

# 3. Architecture (MUST FOLLOW)

Separate responsibilities clearly.

Pages own the feature.

Components are reusable UI.

Hooks encapsulate reusable behavior.

Services communicate with the backend.

```
Page

↓

Components

↓

Hooks

↓

Service (API)

↓

Backend
```

Pages should never perform HTTP requests directly.

Pages should never contain reusable business logic.

---

# 4. Folder Responsibilities

## pages/

Represents complete application screens.

Responsible for:

- composing components
- loading data
- calling hooks
- page-level state

Avoid large files.

If logic grows, extract it.

---

## components/

Reusable UI components.

Components should:

- be reusable
- receive props
- avoid page-specific knowledge
- avoid API calls

---

## hooks/

Reusable application logic.

Examples:

- authentication
- websocket
- pagination
- filtering
- form behavior

If logic is used in more than one place, extract it into a hook.

---

## services/

The only layer allowed to communicate with the backend.

Responsibilities:

- Axios requests
- request configuration
- response typing
- error normalization

Services should not manipulate UI state.

---

## lib/

Shared helper functions.

Only create utilities after a second real use case appears.

Avoid premature abstractions.

---

## types/

Shared TypeScript types.

Avoid duplicated interfaces.

---

# 5. Code Principles

Follow SOLID whenever applicable.

Prefer composition over inheritance.

Keep components focused.

Single Responsibility Principle applies to:

- Components
- Hooks
- Services

Avoid duplicated logic.

Extract reusable behavior.

---

# 6. Component Guidelines

Prefer composition.

Components should be:

- predictable
- reusable
- stateless whenever possible

Prefer controlled components for forms.

Avoid deeply nested JSX.

Extract repeated UI.

---

# 7. Forms

Always use:

- React Hook Form
- Zod validation

Validation schemas should be the single source of truth.

Avoid manual validation.

Display backend validation errors whenever possible.

---

# 8. API Communication

Never call fetch() directly.

Always use the existing API service.

Authentication must automatically send the Bearer token.

Never duplicate endpoint URLs.

Centralize request configuration.

---

# 9. Authentication

Authentication state is centralized.

Protected pages must use the project's existing route protection mechanism.

Never duplicate authentication logic.

Never manually decode JWTs unless the existing architecture already does so.

---

# 10. State Management

Prefer local state.

Extract shared behavior into hooks.

Avoid unnecessary global state.

Server data should always come from the backend.

Do not duplicate backend state unnecessarily.

---

# 11. Error Handling

Display meaningful messages.

Never silently ignore API errors.

Handle:

- loading
- success
- empty state
- error state

Every asynchronous operation must provide user feedback.

---

# 12. Styling

Follow the existing design system.

Prefer shadcn/ui components.

Avoid custom styling when an existing component already solves the problem.

Reuse existing UI before creating new components.

---

# 13. Realtime

Use the existing websocket infrastructure.

Do not create additional websocket connections.

Reuse the existing hook.

---

# 14. Performance

Avoid unnecessary renders.

Memoize only when there is measurable benefit.

Lazy load pages when appropriate.

Avoid duplicated API requests.

---

# 15. Definition of Done

A frontend task is complete only when:

- Existing architecture is respected.
- No duplicated logic was introduced.
- Existing components were reused whenever possible.
- TypeScript has no errors.
- No ESLint errors remain.
- The feature works end-to-end with the backend.
- Loading, error and empty states were considered.
- The implementation remains consistent with the rest of the project.

---

# 16. General Rules

Before implementing a feature:

1. Understand the existing implementation.
2. Reuse existing components whenever possible.
3. Reuse existing hooks.
4. Reuse existing services.
5. Follow established naming conventions.
6. Keep changes minimal and consistent.

Never introduce a new pattern if an equivalent one already exists in the project.

Consistency is preferred over personal preference.