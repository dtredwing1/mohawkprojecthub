# Project Collaboration Hub — User & Capabilities Guide ⚡

Welcome to the **Project Collaboration Hub**, a lightweight, high-performance cockpit designed for agile teams collaborating with **Google Drive**, **Slack**, and autonomous **Agentic AI partners**, hosted on **Google Cloud Run** within Google Cloud's permanent **Free Tier**.

---

## 🎯 What the Site Does (Capabilities Overview)

| Capability | Purpose | Key Features |
| :--- | :--- | :--- |
| **Multi-Project Workspaces** | Organize and isolate multiple projects while keeping all past projects preserved. | Project Switcher dropdown, unique 3-4 letter project keys, isolated backlogs, and separate ADR histories. |
| **Strategy & Brand Canvas** | Single source of truth for project vision, strategic execution pillars, and brand guidelines. | Editable mission/vision, OKR pillars with target metrics, color palette pickers, and direct Google Drive Brand Kit links. |
| **Open Items Tracker** | Lightweight, high-velocity backlog tracking tasks, blockers, and deliverables. | 1-click status toggling (Todo → In Progress → Done / Blocked), priority tagging, due dates, assignees, and instant Slack notifications. |
| **Architecture Decision Records (ADRs)** | Document technical choices, architectural standards, and trade-offs. | Structured record templates (Context, Decision, Consequences, Alternatives Considered), subsystem tagging, and status lifecycle. |
| **Deliverables & Drive Hub** | Centralized repository linking Google Docs, Sheets, Slides, Folders, and living specifications. | Embedded preview triggers, direct Drive links, file type badges, and author tags (human vs. AI agent). |
| **AI Agent Activity & Slack Pulse** | Real-time audit log of team milestones, agent deliverables, and Slack notifications. | Filter by actor type (AI Agents vs. Humans), event categories, and live Slack webhook status. |
| **Agentic AI Partner API** | Secured REST API for external autonomous coding and research agents. | Token-based endpoints (`/api/v1/agent/*`) to query context, create action items, and publish deliverables. |

---

## 🚀 How to Create a New Blank Project to Start With

Every project in the Hub has its own isolated Strategy Canvas, Open Items Backlog, Architecture Decisions (ADRs), and Deliverables Hub. Previous projects are never overwritten—they remain preserved and accessible at all times.

### Step 1: Open the New Project Dialog
* In the **top navigation bar**, click the **`+ Project`** button.
* *Or*, in the **left sidebar**, click the active workspace dropdown at the top and select **`+ Create New Project`**.

### Step 2: Fill in Project Details
1. **Project Name**: Give your project a clear name (e.g., `Customer Portal 2.0`, `Brand Refresh`, `Mobile App Engine`).
2. **Project Key**: Enter a 3 to 4-character identifier (e.g., `CP2`, `BRD`, `MOB`). This key will be used as a visual badge and in ADR numbering.
3. **Accent Theme Color**: Choose a distinct color swatch for your project badge so it stands out in the switcher.
4. **Description & Objectives**: Summarize the scope and goals of this project.

### Step 3: Launch Your Blank Workspace
* Click **"Create & Launch Workspace"**.
* The Hub will automatically:
  * Initialize a fresh, isolated workspace with 0 open items, 0 ADRs, and 0 deliverables.
  * Seed a clean **Strategy Canvas** ready for you to define mission, vision, and milestones.
  * Switch your active view to the new workspace immediately.

### Step 4: Switching Between Projects
* Click the **Project Switcher** at the top of the left sidebar at any time.
* Select any project to instantly jump between workspaces without reloading the page. All previous projects and their historical records are retained.

---

## 🧭 How to Use Each Core Module

### 1. Strategy & Brand Canvas (`/strategy`)
* **Mission & Vision**: Click into the text areas to edit your strategic mission and long-term vision. Click **"Save Canvas"** at the top right to broadcast changes to your team and Slack.
* **Execution Pillars**: Click **"+ Add Pillar"** to define strategic horizons, descriptions, and measurable success metrics.
* **Brand Design System**: Customize primary, secondary, and accent color swatches using the color pickers, set typography guidelines, and define your team's tone of voice.
* **Google Drive Brand Kit**: Paste the Google Drive folder link containing your vector logos, fonts, and presentation decks. Team members can click **"Open Brand Kit in Google Drive"** to jump straight to the files.

### 2. Open Items & Action Tracker (`/open-items`)
* **Creating an Item**: Click **"+ New Action Item"** in the top bar or header. Fill in the title, description, priority (Urgent, High, Medium, Low), owner, due date, and tags.
* **Advancing Status**: Click the circular icon next to any item to advance its status:
  * `Todo` (circle) ➔ `In Progress` (clock) ➔ `Done` (green checkmark).
* **Instant Slack Alerts**: Marking an item **Done** or **Urgent** automatically posts a rich Block Kit notification to your team's Slack channel.
* **Filtering**: Use the search bar, status tabs (All, Todo, In Progress, Blocked, Done), and priority filter to focus on what matters.

### 3. Architecture Decisions / ADRs (`/decisions`)
* **Why Record ADRs?**: For small teams collaborating with AI agents, ADRs provide clear technical guardrails so autonomous agents know which frameworks, databases, and architectural patterns to follow.
* **Creating an ADR**: Click **"+ ADR"** in the header or **"Record New ADR"**. Fill in:
  1. *Subsystem*: DevOps, Backend, Frontend, AI Agents, Strategy, or Brand.
  2. *Context*: The problem prompting this architectural choice.
  3. *Decision*: The exact rule or design pattern adopted.
  4. *Consequences*: Trade-offs and benefits.
  5. *Alternatives Considered*: Rejected options and reasons.
* **Lifecycle**: Expand any ADR card to read its full rationale or update its status (`Proposed`, `Accepted`, `Superseded`, `Rejected`).

### 4. Deliverables & Drive Asset Hub (`/deliverables`)
* **Linking Google Drive Files**: Click **"+ Drive Doc"** in the header. Paste any Google Doc, Sheet, Slide, or Drive Folder URL. The Hub automatically detects the file type.
* **Previewing & Editing**: Click the eye icon to view document summaries or click the external link button to launch and edit directly inside Google Drive.
* **Living Specs**: AI agents can submit living specifications with markdown content that render directly in the Hub.

### 5. AI Agent Activity & Slack Pulse (`/activity`)
* View a live, chronological stream of all actions across the workspace.
* Filter by **AI Agents Only** or **Team Members** to audit deliverables produced by external agents versus human updates.

---

## 🤖 How Autonomous AI Agents Work with the Hub

Your Hub exposes a dedicated REST API under `/api/v1/agent/*` secured by an API key (`x-api-key`). External AI agents (written in Python, LangChain, Antigravity, or AutoGen) can autonomously collaborate with your project:

### 1. Agent Authentication
Include the following header in all agent HTTP requests:
```http
x-api-key: hub-agent-dev-key-12345
x-project-id: proj-mohawk
```
*(Configure `AGENT_API_KEY` in your production environment variables to your private secret).*

### 2. Context Injection (How Agents "Read the Room")
External agents can query the current project's mission, strategic pillars, and accepted ADRs before generating deliverables:
```bash
curl -X GET "https://your-hub-url/api/v1/agent/context" \
  -H "x-api-key: your-agent-key" \
  -H "x-project-id: your-project-id"
```

### 3. Creating Backlog Items via Agent
When an AI agent analyzes customer feedback or identifies a technical task, it can log an open item:
```bash
curl -X POST "https://your-hub-url/api/v1/agent/open-items" \
  -H "x-api-key: your-agent-key" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-mohawk",
    "title": "Evaluate Vector Index Performance",
    "priority": "high",
    "owner": "AI Agent: Architect",
    "dueDate": "2026-10-05",
    "tags": ["database", "ai-agent"]
  }'
```

### 4. Publishing Deliverables & Specs via Agent
When an AI agent finishes drafting a specification, research memo, or Google Doc:
```bash
curl -X POST "https://your-hub-url/api/v1/agent/deliverables" \
  -H "x-api-key: your-agent-key" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-mohawk",
    "title": "Q4 AI Workstream Transition Blueprint",
    "summary": "Detailed technical blueprint for agent state persistence.",
    "type": "agent-report",
    "author": "AI Partner: Architect",
    "tags": ["architecture", "spec"],
    "markdownContent": "### Technical Blueprint\n1. Use Cloud Run with scale-to-zero\n2. Stream events to Slack"
  }'
```

---

## ☁️ Google Cloud Free Tier Deployment

The Hub is containerized with Next.js standalone tracing, allowing it to run within Google Cloud's **Free Tier**:
* **Google Cloud Run**: 2,000,000 requests/month free, scale-to-zero (zero server cost when idle).
* **Google Cloud Firestore**: 1 GB storage, 50,000 document reads/day, 20,000 writes/day free.
* **Google Cloud Build**: 120 build-minutes/month free.

### Deploy Command:
```bash
gcloud run deploy project-hub \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=mohawkprojecthub,AGENT_API_KEY=your-secure-key
```

---

## 💬 Slack Notifications Setup

To enable instant team alerts in Slack:
1. Create an **Incoming Webhook** in your Slack workspace (e.g., for channel `#project-pulse`).
2. Add the URL to your environment variables:
   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXXXX
   ```
3. The Hub will automatically format and send Block Kit cards whenever items are created, status changes to Done, ADRs are accepted, or AI agents publish deliverables.
