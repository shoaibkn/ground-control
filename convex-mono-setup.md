## Setting Up Convex in a Monorepo

Here are the key approaches and best practices for using Convex in a monorepo:

### 1. Basic Structure

A common monorepo structure with Convex looks like this:

```
apps/
├── web/          # Next.js / React app
├── mobile/       # Expo app (optional)

packages/
└── backend/convex  # Convex backend (schema + functions)
```

The Convex backend lives in a shared `packages/` directory, and each app consumes it. [[Monorepo example](https://discord.com/channels/1019350475847499849/1403167543702589533)]

### 2. Sharing Generated Types Across Apps

Each frontend app imports from the `_generated/api` folder in your Convex package. In a monorepo, the recommended approach is to use **path-based imports** pointing to the generated code. You can also define a `package.json` `name` (e.g., `@repo/backend`) and export the `_generated` folder if you prefer named imports. [[Monorepo exports](https://discord.com/channels/1019350475847499849/1414283894307684422)]

### 3. Deploying Multiple Apps

When deploying multiple frontend apps that share one Convex backend, run `convex deploy` for each app. Since Convex won't redeploy unchanged files, this is safe and efficient. Each app gets the correct framework-prefixed environment variable (e.g., `NEXT_PUBLIC_CONVEX_URL`) injected:

```bash
# For app 1 (landing)
cd packages/backend && npx convex deploy --cmd 'cd ../../apps/landing && turbo run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL

# For app 2 (dashboard)
cd packages/backend && npx convex deploy --cmd 'cd ../../apps/dashboard && turbo run build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

[[Monorepo deploy](https://discord.com/channels/1019350475847499849/1403167543702589533)]

### 4. Seeding Data

- **Development:** Use `convex dev --run seed:seed` in your dev script.
- **Production/Preview:** Run the seed command in one of the deploy steps (since both apps share the same Convex backend, seeding once is sufficient for production). For preview deployments, run the seed for both projects to ensure each preview environment is seeded. [[Seeding advice](https://discord.com/channels/1019350475847499849/1403167543702589533)]

### 5. Using Convex Across Separate Repositories (Optional)

If you ever need to use Convex functions from a completely separate repo, you can generate a typed `api.ts` file using:

```bash
npx convex-helpers ts-api-spec
```

Then install `convex` in the other repo and import from the generated file. [[Multiple repos](https://docs.convex.dev/production/multiple-repos)]

### 6. Custom `convex/` Folder Location

If your Convex folder is not at the root, configure its path in `convex.json`:

```json
{
  "functions": "packages/backend/convex/"
}
```

[[convex.json config](https://docs.convex.dev/production/project-configuration#convexjson)]

---

A good reference implementation is the [turbo-expo-nextjs-clerk-convex-monorepo](https://github.com/get-convex/turbo-expo-nextjs-clerk-convex-monorepo) template from Convex. [[Monorepo exports](https://discord.com/channels/1019350475847499849/1414283894307684422)]
