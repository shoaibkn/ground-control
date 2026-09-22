# Contributing to Ground Control

Thank you for contributing to Ground Control! This guide outlines the development environment setup, codebase conventions, and workflow standards required for contributing.

---

## 1. Prerequisites

Before setting up the repository, ensure your environment meets the following requirements:

- **Node.js**: `v20.0.0` or later
- **pnpm**: `v10.0.0` or later (`npm install -g pnpm`)
- **Convex Account**: [Convex Dashboard](https://dashboard.convex.dev/)
- **Expo CLI** (optional, for mobile development): `npm install -g expo-cli`
- **Git**

---

## 2. Getting Started

### 2.1 Clone and Install

```bash
git clone https://github.com/lumin8-labs/cobblerp.git ground-control
cd ground-control
pnpm install
```

### 2.2 Environment Configuration

#### Web Application (`apps/web/.env.local`)
Create `apps/web/.env.local` with the following variables:

```env
# Convex Backend
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://<your-convex-deployment>.convex.site

# Better Auth
BETTER_AUTH_SECRET=your-random-secret-key
BETTER_AUTH_URL=http://localhost:3000
```

#### Mobile Application (`apps/mobile/.env`)
Create `apps/mobile/.env` with the following variables:

```env
EXPO_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://<your-convex-deployment>.convex.site
```

#### Backend Services (`packages/backend/.env` or Convex Dashboard Environment Variables)
Set the following environment variables in your Convex deployment via the dashboard or Convex CLI:

```env
SITE_URL=http://localhost:3000
EMAIL_FROM=Ground Control <onboarding@resend.dev>

# Optional (for email & messaging delivery)
RESEND_API_KEY=re_xxxxxxxxx
SENTDM_API_KEY=sent_xxxxxxxxx
```

---

## 3. Running Locally

### 3.1 Start All Services Concurrently
Turborepo orchestrates the concurrent execution of web, mobile, and backend processes:

```bash
pnpm run dev
```

- **Web Application**: Accessible at `http://localhost:3000`
- **Convex Dashboard**: Accessible via `npx convex dashboard` in `packages/backend`
- **Expo Bundler**: Metro bundler launches for iOS/Android simulators or Expo Go

### 3.2 Running Individual Applications

If you only need to work on a specific part of the system:

```bash
# Run only Next.js Web
pnpm --filter web dev

# Run only Expo Mobile
pnpm --filter mobile dev

# Run only Convex Backend sync
pnpm --filter @workspace/backend dev
```

---

## 4. Development Standards & Conventions

### 4.1 Mandatory Optimistic UI Updates

> [!IMPORTANT]
> When implementing or modifying Convex mutations for state transitions (e.g., status changes, archiving, completion toggles, recurrence updates, emoji reactions), **always** define optimistic updates using `withOptimisticUpdate`.

```tsx
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/convex/_generated/api"

export function useUpdateTaskStatus() {
  return useMutation(api.tasks.updateStatus).withOptimisticUpdate(
    (localStore, { taskId, status }) => {
      const task = localStore.getQuery(api.tasks.getTask, { taskId })
      if (task) {
        localStore.setQuery(api.tasks.getTask, { taskId }, {
          ...task,
          status,
        })
      }
    }
  )
}
```

### 4.2 Adding UI Components (`@workspace/ui`)

Ground Control centralizes shared UI primitives inside `packages/ui` using shadcn/ui.

To add a new component from the official registry:
```bash
pnpm dlx shadcn@latest add <component-name> -c apps/web
```

- Components reside in `packages/ui/src/components/`.
- Export paths are managed in `packages/ui/package.json`.
- When importing in `apps/web`:
  ```tsx
  import { Button } from "@workspace/ui/components/button"
  ```

### 4.3 Backend Schema Changes

1. Modify `packages/backend/convex/schema.ts`.
2. Convex automatically updates `_generated/dataModel.d.ts` and `_generated/server.d.ts`.
3. Ensure all queries and mutations use strong type validators from `convex/values` (`v.string()`, `v.id("tasks")`, etc.).

---

## 5. Verification & Quality Assurance

Before opening a pull request, run the verification suite:

```bash
# Typecheck all workspaces
pnpm run typecheck

# Lint all files
pnpm run lint

# Check and fix formatting
pnpm run format

# Verify full production build
pnpm run build
```

---

## 6. Git & Pull Request Guidelines

1. **Branch Naming**:
   - `feat/feature-name` for new features
   - `fix/bug-description` for bug fixes
   - `refactor/scope` for refactoring without behavior change
   - `docs/doc-topic` for documentation updates
2. **Commit Messages**: Follow Conventional Commits format:
   - `feat(tasks): add recurring task pause/resume support`
   - `fix(auth): correct token refresh expiration in mobile app`
3. **Pull Requests**:
   - Provide a clear description of the problem and the proposed solution.
   - Include screenshots or screen recordings for UI/UX modifications.
   - Ensure all automated checks (typecheck, lint, build) pass cleanly.
