# Ground Control

Ground Control is an enterprise-ready operations, task, and approval management platform designed for high-velocity teams. Built as a high-performance monorepo with real-time reactive data sync, multi-channel notifications, a dynamic form builder, and native mobile experiences.

---

## Key Features

### 1. Intelligent Task Management
- **Lifecycle & Priorities**: Track tasks through customized workflows, priorities (Urgent, High, Medium, Low), due dates, and specific times of day.
- **Recurrence Engine**: Automated recurring tasks (daily, weekly, bi-weekly, monthly, quarterly, yearly) with pause/resume capabilities.
- **Subtasks & Checklists**: Granular subtask items with real-time completion tracking.
- **Collaborative Ownership**: Assignees, collaborators, subscribers, and personal starred task lists.
- **Approval Gate**: Tasks can mandate sign-off before completion (`completedRequiresApproval`).
- **Form Attachment**: Bind custom structured forms and submitted responses directly to tasks.

### 2. Multi-Stage Approval Workflows
- **Decision Pipeline**: Streamlined approval flows supporting `Pending`, `Approved`, `Declined`, and `Rework` statuses.
- **Contextual Discussions**: Dedicated real-time discussion threads with file attachments for every approval item.
- **Audit Trails**: Immutable audit logs capturing all actions, state transitions, and actor metadata.
- **Form-Backed Approvals**: Require structured data submission alongside approval requests.

### 3. Dynamic Form Builder & Sharing
- **Flexible Field Types**: Rich inputs including text, textarea, select dropdowns, radio groups, checkboxes, dates, numbers, files, and image uploads.
- **Standalone & Embedded**: Deploy forms as standalone shareable links (`/shared-forms/[formId]`) or embed them inside task/approval workflows.
- **Structured Response Tracking**: Live validation and real-time response aggregation.

### 4. Real-Time Collaboration & Chat
- **Contextual Conversations**: Real-time chat integrated directly into tasks and approvals.
- **Rich Messaging**: File and image attachments stored via Cloudflare R2, message editing/deletion history, and emoji reactions.
- **Presence & Read Receipts**: Live read receipts (`lastReadTime`) per task and approval to ensure team alignment.

### 5. Multi-Channel Notification Engine
- **In-App Notification Center**: Unread indicators, real-time toast alerts, and interactive notification trays.
- **Omnichannel Dispatch**:
  - **Email**: Transactional emails powered by Resend and styled with React Email (Invitations, Password Resets, Task & Approval Notifications).
  - **Mobile Push**: Native push notifications via Expo Push Notification service.
  - **Messaging**: SMS, RCS, and WhatsApp messaging integrations powered by SentDM.
- **Granular Preferences**: User-configurable delivery channels per event type.
- **Custom Organization API Keys**: Organizations can bring their own Resend and SentDM API credentials and custom message templates.

### 6. Multi-Tenant Organization & Access Control
- **Organization Switcher**: Seamless switching across multiple workspaces and teams.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions per role and resource.
- **Member Profiles & Avatars**: Job titles, departments, phone numbers, integration settings, and customizable avatars (via DiceBear or custom image uploads).
- **Secure Authentication**: Better Auth integration supporting email/password, social logins, and multi-factor authentication.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | [Turborepo](https://turbo.build/), [pnpm workspaces](https://pnpm.io/workspaces) |
| **Web Application** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) |
| **Mobile Application** | [React Native](https://reactnative.dev/), [Expo SDK 56](https://expo.dev/) (Expo Router), [Uniwind](https://uniwind.dev/) |
| **Backend & Database** | [Convex](https://www.convex.dev/) (Reactive real-time database, serverless functions, crons) |
| **Authentication** | [Better Auth](https://www.better-auth.com/) (Next.js server/client, Expo plugin, Convex adapter) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) |
| **Email & Messaging** | [Resend](https://resend.com/), [React Email](https://react.email/), [SentDM](https://sentdm.com/) |
| **File Storage** | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via Convex storage |

---

## Monorepo Structure

```
ground-control/
├── apps/
│   ├── web/                     # Next.js 16 web application
│   │   ├── app/                 # App Router (routes, layouts, API endpoints)
│   │   ├── components/          # Web-specific UI & layout components
│   │   ├── hooks/               # Client-side React hooks
│   │   └── lib/                 # Auth client, utilities, and helper functions
│   │
│   └── mobile/                  # Expo / React Native mobile application
│       ├── src/
│       │   ├── app/             # Expo Router file-based screens
│       │   ├── components/      # Native UI components
│       │   └── hooks/           # Native hooks (push notifications, secure store)
│       └── assets/              # Mobile icons, splash screens, and images
│
├── packages/
│   ├── backend/                 # Convex backend services
│   │   └── convex/              # Schema, queries, mutations, actions, crons
│   │       ├── emails/          # React Email templates
│   │       ├── betterAuth/      # Better Auth adapter and schemas
│   │       └── _generated/      # Convex auto-generated API and data models
│   │
│   ├── ui/                      # Shared design system (shadcn/ui + Radix UI)
│   │   └── src/
│   │       ├── components/      # Shared accessible UI primitives
│   │       ├── hooks/           # Shared UI hooks (e.g. useIsMobile)
│   │       ├── lib/             # Styling utilities (cn, avatar helpers)
│   │       └── styles/          # Global design system CSS tokens
│   │
│   ├── typescript-config/       # Shared tsconfig bases (base, nextjs, react-library)
│   └── eslint-config/           # Shared ESLint configurations
│
├── ARCHITECTURE.md              # In-depth architectural specification
├── CONTRIBUTING.md              # Developer onboarding & contribution guide
├── turbo.json                   # Turborepo task pipeline configuration
└── pnpm-workspace.yaml          # pnpm workspace definition
```

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher
- **Package Manager**: `pnpm` (`>= 10.0.0`)
- **Convex Account**: [Sign up for Convex](https://dashboard.convex.dev/)
- **Expo Go / Development Build** (optional, for mobile testing)

### Quickstart

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/lumin8-labs/cobblerp.git ground-control
   cd ground-control
   pnpm install
   ```

2. **Set up environment variables:**
   - Follow instructions in [CONTRIBUTING.md](file:///Users/shoaibkn/Documents/Projects/ground-control/CONTRIBUTING.md) to configure environment variables for `apps/web`, `apps/mobile`, and `packages/backend`.

3. **Start the local development environment:**
   ```bash
   pnpm run dev
   ```
   This will launch:
   - Next.js Web: [http://localhost:3000](http://localhost:3000)
   - Convex Backend: Watches and syncs functions to your dev deployment
   - Expo Metro Bundler: Ready for iOS/Android simulator or Expo Go

### Common Commands

| Command | Description |
| :--- | :--- |
| `pnpm run dev` | Starts all apps and services concurrently via Turborepo |
| `pnpm run build` | Builds production bundles for web and mobile |
| `pnpm run typecheck` | Typechecks all packages (`web`, `mobile`, `backend`, `ui`) |
| `pnpm run lint` | Lints all packages with ESLint |
| `pnpm run format` | Formats all code with Prettier |
| `pnpm --filter web dev` | Runs only the Next.js web application |
| `pnpm --filter mobile dev` | Runs only the Expo mobile application |
| `pnpm --filter @workspace/backend dev` | Runs only the Convex backend sync |

---

## UI Component System

Ground Control uses a shared `@workspace/ui` package based on shadcn/ui.

### Adding Components

To add a new shadcn component to the shared package, run the following from the root:

```bash
pnpm dlx shadcn@latest add <component-name> -c apps/web
```

This places new UI components into `packages/ui/src/components/`.

### Using Components

Import shared components across `apps/web`:

```tsx
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs"
```

---

## AI & Developer Guidelines

### Optimistic UI Updates

> [!IMPORTANT]
> **Mandatory Practice**: Always use Convex optimistic UI updates (`withOptimisticUpdate`) when writing or modifying mutations for any state transitions (e.g., status changes, archiving, completion sign-off toggles, recurrence settings, reaction toggles, etc.) to ensure instant frontend responsiveness.

Example:

```tsx
const updateStatus = useMutation(api.tasks.updateStatus).withOptimisticUpdate(
  (localStore, { taskId, status }) => {
    const currentTask = localStore.getQuery(api.tasks.getTask, { taskId })
    if (currentTask) {
      localStore.setQuery(api.tasks.getTask, { taskId }, {
        ...currentTask,
        status,
      })
    }
  }
)
```

For more architectural details and contributing guides, refer to:
- [ARCHITECTURE.md](file:///Users/shoaibkn/Documents/Projects/ground-control/ARCHITECTURE.md)
- [CONTRIBUTING.md](file:///Users/shoaibkn/Documents/Projects/ground-control/CONTRIBUTING.md)
