# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

## AI & Developer Guidelines

### Optimistic UI Updates
- **Mandatory Practice**: Always use Convex optimistic UI updates (`withOptimisticUpdate`) when writing/modifying mutations for any state transitions (e.g., status changes, archiving, completion sign-off toggles, recurrence settings, etc.) to ensure instant frontend responsiveness.
- **Cache Syncing**: Make sure to update both the individual item details query cache (`api.tasks.getTask`) and list query caches (`api.tasks.getTasks` for all filter variations).
