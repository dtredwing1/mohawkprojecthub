# Project Collaboration Hub ⚡

A lightweight, modern, and intuitive project collaboration cockpit built for small cross-functional teams and autonomous **Agentic AI partners**.

Designed to align your team on **strategy, brand identity, open items (backlog), architectural decisions (ADRs), Google Drive deliverables, and Slack updates**—hosted on **Google Cloud Run** using Google Cloud's permanent **Free Tier**.

---

## 🏛 Architecture & Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript, Tailwind CSS v4)
- **Deployment**: [Google Cloud Run](https://cloud.google.com/run) (containerized standalone, scale-to-zero, 2M free requests/mo)
- **Database**: [Google Cloud Firestore](https://cloud.google.com/firestore) Native Mode (1GB storage, 50k reads / 20k writes daily free tier) with automatic local JSON fallback for rapid offline development
- **File Repository**: Hybrid Google Drive integration (in-browser Drive Picker & previews for team members + Service Account API for AI agents)
- **Team Communications**: Bi-directional Slack webhooks (real-time notification cards for open items, ADRs, and agent deliverables)
- **Autonomous AI Partner API**: Secured REST API (`/api/v1/agent/*`) for external agents (Python, LangChain, AGY, AutoGen) to fetch project context, track tasks, and submit deliverables

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone <your-repo>
cd project-hub
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

> The hub runs immediately out-of-the-box with pre-seeded sample data (Strategy canvas, ADRs, open items, and deliverables) using the local fallback store. No GCP credentials are required for local testing!

---

## ☁️ Google Cloud Platform Deployment (Free Tier)

This app is containerized and optimized for **Google Cloud Run** with standalone Next.js tracing.

### Prerequisites
1. Install the [Google Cloud SDK (`gcloud`)](https://cloud.google.com/sdk).
2. Set your active GCP project:
   ```bash
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```
3. Enable Cloud Run and Firestore APIs:
   ```bash
   gcloud services enable run.googleapis.com firestore.googleapis.com
   ```
4. Create a Firestore database in **Native mode** (free tier includes 1GB and 50k daily reads):
   ```bash
   gcloud firestore databases create --location=us-central1 --type=firestore-native
   ```

### One-Command Deployment to Cloud Run
Run the following from the root directory of this repository:
```bash
gcloud run deploy project-hub \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLOUD_PROJECT=YOUR_GCP_PROJECT_ID,AGENT_API_KEY=your-secure-key,NEXTAUTH_SECRET=your-32-char-secret
```
Cloud Run will build the Docker container using Cloud Build and output a live HTTPS URL with custom domain support.

---

## 🤖 Agentic AI REST API (`/api/v1/agent/*`)

External AI agents authenticate via the `x-api-key: <AGENT_API_KEY>` header or `Authorization: Bearer <AGENT_API_KEY>`.

### 1. Absorb Project Context
Retrieve active strategic pillars, open items, and accepted ADRs:
```bash
curl -X GET "http://localhost:3000/api/v1/agent/context" \
  -H "x-api-key: hub-agent-dev-key-12345"
```

### 2. Query or Create Open Items
Query backlog items:
```bash
curl -X GET "http://localhost:3000/api/v1/agent/open-items?status=todo" \
  -H "x-api-key: hub-agent-dev-key-12345"
```
Create an item:
```bash
curl -X POST "http://localhost:3000/api/v1/agent/open-items" \
  -H "x-api-key: hub-agent-dev-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Analyze User Transcripts & Propose Feature Spec",
    "description": "Evaluate feedback from Q3 customer interviews.",
    "priority": "high",
    "owner": "AI Partner: Analyst",
    "dueDate": "2026-10-01",
    "tags": ["discovery", "ai-agent"]
  }'
```

### 3. Submit Deliverables & Specs
Publish a living specification or link a Google Drive document:
```bash
curl -X POST "http://localhost:3000/api/v1/agent/deliverables" \
  -H "x-api-key: hub-agent-dev-key-12345" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q4 Architecture Transition Plan",
    "summary": "Technical blueprint for scaling agent workflows with Firestore.",
    "type": "agent-report",
    "author": "AI Partner: Architect",
    "tags": ["architecture", "spec"],
    "markdownContent": "### Technical Plan\n1. Containerize microservices\n2. Stream events to Slack"
  }'
```

---

## 💬 Slack Integration

Add `SLACK_WEBHOOK_URL` to your environment variables:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/XXXX
```
The hub will automatically format and post Block Kit activity cards into your Slack channel whenever:
- An item is marked **Done** or **Blocked**
- A new **ADR** is accepted
- An AI agent publishes a new **Deliverable** or updates the backlog

---

## 📁 Google Drive Integration

1. **User Linking**: Team members can paste any Google Doc, Sheet, Slide, or Folder link into the Deliverables Hub for instant embedded previews and direct launch buttons.
2. **AI Agent Uploads**: For automated uploads, share your team's Google Drive folder with your GCP Service Account email (`service-account@your-project.iam.gserviceaccount.com`).
