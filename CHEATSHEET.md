# Spec Kit — Workshop Cheatsheet

A quick-reference guide for running Spec-Driven Development (SDD) with **Spec Kit** and the **Gemini** integration in the DigAlert repository.

---

## 🚀 Installation & Initialization

### Install Spec Kit CLI
To install or update the `specify` command-line utility:
```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z
```

### Initialize a New Project
To bootstrap a project with Spec Kit using the **Gemini** integration:
```bash
specify init my-project --integration gemini
cd my-project
```
Then, launch your coding agent environment:
```bash
gemini
```

---

## 🔄 The 7-Step Workflow

Spec Kit provides a structured, multi-step process for translating product requirements into high-quality code. Run the following slash commands in your chat interface:

| Step | Command | Description |
| :--- | :--- | :--- |
| **Step 1** | `specify init` | Bootstrap and configure the Spec Kit project structure. |
| **Step 2** | `/speckit.constitution` | Set up or update the project principles, coding standards, and quality rules in `.specify/memory/constitution.md`. |
| **Step 3** | `/speckit.specify` | Define product requirements (**WHAT & WHY**). *Key rule: Do not specify a tech stack or architectural details at this stage!* |
| **Step 4** | `/speckit.clarify` | Fill specification gaps via a structured Q&A session with the AI. |
| **Step 5** | `/speckit.plan` | Create the technical blueprint. *Now* define the tech stack, API contracts, and architecture in `plan.md`. |
| **Step 6** | `/speckit.tasks` | Break down the technical blueprint into an ordered, parallelizable task list in `tasks.md`. |
| **Step 7** | `/speckit.implement` | Instruct the AI agent to execute tasks systematically and write the implementation code. |

---

## 🛠️ Optional & Utility Commands

Enhance your workflow with additional commands:

*   **/speckit.analyze** — Runs a cross-artifact consistency check (after task generation, before implementation) to verify everything aligns.
*   **/speckit.checklist** — Generates a quality checklist for requirements ("unit tests for English") to identify missing details.
*   **/speckit.taskstoissues** — Converts tasks in `tasks.md` into tracked GitHub Issues automatically.
*   **/speckit.agent-context.update** — Refreshes the managed section in `GEMINI.md` to point the AI agent to the current active specification plan path.

---

## 🔌 Extensions & Presets

Customize the Spec Kit workflow or add third-party integrations:

```bash
# Browse and manage extensions (adding new capabilities)
specify extension search
specify extension add <extension-name>
specify extension enable <extension-name>
specify extension disable <extension-name>

# Browse and manage presets (customizing existing workflows)
specify preset search
specify preset add <preset-name>
```

### Active Extensions in DigAlert:
1.  **git** — Automates repository initialization, automatic feature branch creation (`specs/00X-feature-name`), validation, and auto-committing after each workflow step.
2.  **agent-context** — Dynamically manages the managed section within `GEMINI.md` to keep the agent focused on the active specification.

---

## 📂 Project File Structure

After completing the full workflow, your project directory will structure like this:

```text
my-project/
├── .specify/
│   ├── memory/
│   │   └── constitution.md        ← Project principles & coding guidelines
│   ├── scripts/bash/              ← Lifecycle automation & Git hook scripts
│   ├── templates/                 ← Markdown templates for spec, plan, and tasks
│   └── integrations/              ← Enabled integration manifests (e.g., gemini)
├── specs/
│   └── 001-my-feature/
│       ├── spec.md                ← User stories, requirements, and scope
│       ├── plan.md                ← Technical design, architecture, and API contracts
│       ├── tasks.md               ← Step-by-step ordered checklist for implementation
│       └── checklists/
│           └── requirements.md    ← Automated spec requirement checklists
└── GEMINI.md                      ← Managed coding agent context instruction file
```

---

## 🎯 Key Rule
> 💡 **Write WHAT you want in `/speckit.specify`. Save the HOW (tech stack, file structure, API details) for `/speckit.plan`.**
