---
name: Imported Expo preview
description: Environment behavior seen when working with imported Expo artifacts and Replit preview registration.
---

Imported Expo projects can contain a valid `artifacts/<slug>/.replit-artifact/artifact.toml` and install/typecheck successfully while still returning no registered artifacts or workflows from the runtime. In that state, direct workflow restart and screenshot verification cannot run until preview provisioning/registration is completed.

**Why:** The code and artifact manifest can be present independently from the runtime registry after an import.

**How to apply:** Check `listArtifacts()` and `listWorkflows()` before attempting preview verification; if both are empty, do not invent a workflow or edit routing config just to force a screenshot. Propose preview provisioning as a separate follow-up.