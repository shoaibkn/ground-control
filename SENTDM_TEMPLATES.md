# Sent.dm Template Setup Guide for Ground Control

This guide provides instructions and copy-paste templates for setting up **Sent.dm** (SMS, WhatsApp, and RCS) with **Ground Control**.

---

## 1. Overview

Ground Control uses [Sent.dm](https://sentdm.com) as an omnichannel messaging router for task updates, approval requests, and form submissions. Because channels like WhatsApp and RCS require pre-approved message templates with variable parameters, you must create the **9 templates** below in your Sent.dm account.

Each template corresponds to a specific notification event in Ground Control.

---

## 2. The 9 Required Templates

| # | Template Key | Notification Event | Channel Support | Required Parameters |
|---|---|---|---|---|
| 1 | `task_assigned` | When a user is assigned to a task | SMS, WhatsApp, RCS | `taskTitle`, `assignerName`, `dueDate` |
| 2 | `task_status_changed` | When a task status changes | SMS, WhatsApp, RCS | `taskTitle`, `updaterName`, `newStatus` |
| 3 | `task_due_soon` | Reminder when a task is due in <24h | SMS, WhatsApp, RCS | `taskTitle`, `dueDate` |
| 4 | `task_overdue` | Alert when a task passes its due date | SMS, WhatsApp, RCS | `taskTitle`, `dueDate` |
| 5 | `task_comment` | New message in task discussion | SMS, WhatsApp, RCS | `taskTitle`, `authorName`, `commentPreview` |
| 6 | `approval_requested` | New approval request created | SMS, WhatsApp, RCS | `approvalTitle`, `requesterName`, `dueDate` |
| 7 | `approval_status_changed` | Decision made on an approval | SMS, WhatsApp, RCS | `approvalTitle`, `updaterName`, `newStatus`, `comment` |
| 8 | `approval_comment` | New message in approval discussion | SMS, WhatsApp, RCS | `approvalTitle`, `authorName`, `commentPreview` |
| 9 | `form_response_submitted` | New form response received | SMS, WhatsApp, RCS | `formTitle`, `submitterName` |

---

## 3. Template Specifications & Copy

### 1. `task_assigned`
- **Template Name / ID**: `task_assigned`
- **Category**: `UTILITY` (or `OPERATIONS`)
- **Parameters**: `{{taskTitle}}`, `{{assignerName}}`, `{{dueDate}}`
- **Message Body**:
  ```text
  Ground Control: You have been assigned to "{{taskTitle}}" by {{assignerName}}. Due date: {{dueDate}}. Check your dashboard for details.
  ```

---

### 2. `task_status_changed`
- **Template Name / ID**: `task_status_changed`
- **Category**: `UTILITY`
- **Parameters**: `{{taskTitle}}`, `{{updaterName}}`, `{{newStatus}}`
- **Message Body**:
  ```text
  Ground Control Task Update: "{{taskTitle}}" status changed to {{newStatus}} by {{updaterName}}. View updates in Ground Control.
  ```

---

### 3. `task_due_soon`
- **Template Name / ID**: `task_due_soon`
- **Category**: `UTILITY`
- **Parameters**: `{{taskTitle}}`, `{{dueDate}}`
- **Message Body**:
  ```text
  Ground Control Reminder: Your assigned task "{{taskTitle}}" is due soon on {{dueDate}}. Please review on your dashboard.
  ```

---

### 4. `task_overdue`
- **Template Name / ID**: `task_overdue`
- **Category**: `UTILITY`
- **Parameters**: `{{taskTitle}}`, `{{dueDate}}`
- **Message Body**:
  ```text
  Ground Control URGENT: Your assigned task "{{taskTitle}}" was due on {{dueDate}} and is now overdue. Please take action immediately.
  ```

---

### 5. `task_comment`
- **Template Name / ID**: `task_comment`
- **Category**: `UTILITY`
- **Parameters**: `{{taskTitle}}`, `{{authorName}}`, `{{commentPreview}}`
- **Message Body**:
  ```text
  Ground Control: {{authorName}} commented on "{{taskTitle}}": "{{commentPreview}}". Reply on Ground Control.
  ```

---

### 6. `approval_requested`
- **Template Name / ID**: `approval_requested`
- **Category**: `UTILITY`
- **Parameters**: `{{approvalTitle}}`, `{{requesterName}}`, `{{dueDate}}`
- **Message Body**:
  ```text
  Ground Control: {{requesterName}} requested your approval for "{{approvalTitle}}". Due date: {{dueDate}}. Review and decide on Ground Control.
  ```

---

### 7. `approval_status_changed`
- **Template Name / ID**: `approval_status_changed`
- **Category**: `UTILITY`
- **Parameters**: `{{approvalTitle}}`, `{{updaterName}}`, `{{newStatus}}`, `{{comment}}`
- **Message Body**:
  ```text
  Ground Control: Approval request "{{approvalTitle}}" was marked as {{newStatus}} by {{updaterName}}. Note: {{comment}}.
  ```

---

### 8. `approval_comment`
- **Template Name / ID**: `approval_comment`
- **Category**: `UTILITY`
- **Parameters**: `{{approvalTitle}}`, `{{authorName}}`, `{{commentPreview}}`
- **Message Body**:
  ```text
  Ground Control: {{authorName}} commented on approval "{{approvalTitle}}": "{{commentPreview}}". View conversation on Ground Control.
  ```

---

### 9. `form_response_submitted`
- **Template Name / ID**: `form_response_submitted`
- **Category**: `UTILITY`
- **Parameters**: `{{formTitle}}`, `{{submitterName}}`
- **Message Body**:
  ```text
  Ground Control: {{submitterName}} submitted a response for form "{{formTitle}}". Review submissions on Ground Control.
  ```

---

## 4. How to Create Templates in Sent.dm

1. **Log in to Sent.dm**:
   - Go to [https://app.sent.dm](https://app.sent.dm) (or [https://console.sent.dm](https://console.sent.dm)) and sign in to your account.
2. **Navigate to Templates**:
   - In the sidebar, click on **Templates** (or **Message Templates**).
3. **Create Each Template**:
   - Click **Create Template** or **New Template**.
   - **Name**: Enter the Template Key (e.g. `task_assigned`).
   - **Channels**: Select **SMS**, **WhatsApp**, and **RCS** (as enabled on your Sent.dm plan).
   - **Language**: `en_US` (English) or your primary language.
   - **Body**: Paste the corresponding Message Body from Section 3 above.
   - **Variables/Parameters**: Ensure the placeholder variable names match the required parameters (e.g., `taskTitle`, `assignerName`, `dueDate`).
   - Click **Submit for Approval** / **Save**.
4. **Copy the Template IDs**:
   - Once saved or approved, Sent.dm provides a unique **Template ID** for each template (e.g. `tmpl_9a8b7c...` or the template name depending on your Sent.dm account setup).

---

## 5. Adding Template IDs to Ground Control

You can configure your Template IDs in Ground Control using either of two methods:

### Option A: In the Ground Control Web Settings (Recommended)

1. Open Ground Control in your browser.
2. Navigate to **Settings** -> **Notifications**.
3. Under **Organization API Keys (BYOK)**:
   - Enter your **Sent.dm API Key**.
   - Expand the **Sent.dm Template IDs** section.
   - Paste the corresponding Template ID for each of the 9 events.
   - Click **Save Sent.dm Configuration**.
4. Use the **Interactive Test Tool** at the bottom of the page to send a test SMS, WhatsApp, or RCS message to your phone.

---

### Option B: Platform-Wide Environment Variables (Convex Backend)

If you are hosting Ground Control and want to configure default Template IDs across all organizations:

Set the following environment variables in your Convex deployment (via `npx convex env set` or in the [Convex Dashboard](https://dashboard.convex.dev/)):

```bash
npx convex env set SENT_DM_API_KEY="sent_your_api_key"
npx convex env set SENTDM_TASK_ASSIGNED_TEMPLATE_ID="tmpl_your_id_1"
npx convex env set SENTDM_TASK_STATUS_CHANGED_TEMPLATE_ID="tmpl_your_id_2"
npx convex env set SENTDM_TASK_DUE_SOON_TEMPLATE_ID="tmpl_your_id_3"
npx convex env set SENTDM_TASK_OVERDUE_TEMPLATE_ID="tmpl_your_id_4"
npx convex env set SENTDM_TASK_COMMENT_TEMPLATE_ID="tmpl_your_id_5"
npx convex env set SENTDM_APPROVAL_REQUESTED_TEMPLATE_ID="tmpl_your_id_6"
npx convex env set SENTDM_APPROVAL_STATUS_CHANGED_TEMPLATE_ID="tmpl_your_id_7"
npx convex env set SENTDM_APPROVAL_COMMENT_TEMPLATE_ID="tmpl_your_id_8"
npx convex env set SENTDM_FORM_RESPONSE_SUBMITTED_TEMPLATE_ID="tmpl_your_id_9"
```

---

## 6. Verifying Delivery

1. In **Settings** -> **Notifications**, ensure your member profile has a valid **Phone Number** (with country code, e.g. `+14155552671`).
2. Toggle on your preferred channels under **Delivery Channels** (SMS, WhatsApp, and/or RCS).
3. Under **Test Notification Dispatcher**, select **WhatsApp**, **SMS**, or **RCS** and click **Trigger Notification Test**.
4. Check the dispatch status logs in the test panel and in the Convex logs (`npx convex logs`).
