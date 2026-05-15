# Material To Work Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a material-detail toolbar action that converts the current material into a work without navigating away, while preventing duplicates and preserving useful previews.

**Architecture:** Extract conversion and duplicate detection into a small utility module with node tests first. Then wire the toolbar action inside `WorkspacePage.tsx`, add a lightweight notice for duplicate/success feedback, and extend `WorkPreviewView` to render generated source-like works with richer previews.

**Tech Stack:** React, TypeScript, Vite, node:test

---

### Task 1: Add conversion utility coverage

**Files:**
- Create: `utils/material-to-work.js`
- Create: `tests/material-to-work.test.mjs`

- [ ] Write failing tests for duplicate detection and work shaping from a material-like object.
- [ ] Run `node --test tests/material-to-work.test.mjs` and confirm the new tests fail because the helper does not exist yet.
- [ ] Implement the minimal conversion helper and duplicate predicate.
- [ ] Re-run `node --test tests/material-to-work.test.mjs` and confirm the tests pass.

### Task 2: Add metadata support and toolbar action

**Files:**
- Modify: `pages/WorkspacePage.tsx`
- Test: `tests/material-to-work.test.mjs`

- [ ] Extend the local `Work` shape with `sourceMaterialId`.
- [ ] Add a toolbar button in the material preview header action group.
- [ ] Create the work in-place from `selectedMaterial`, prepend it into the shared works list, and keep the current material selected.
- [ ] Show lightweight feedback for created and duplicate states without navigation.

### Task 3: Upgrade work preview behavior

**Files:**
- Modify: `pages/WorkspacePage.tsx`

- [ ] Extend `WorkPreviewView` to render source-style works by type instead of always falling back to plain text paragraphs.
- [ ] Reuse the existing source metadata and image/body rendering patterns where possible.
- [ ] Keep existing image-based and text-based work behavior intact.

### Task 4: Verify the full change

**Files:**
- Test: `tests/material-to-work.test.mjs`
- Test: `tests/*.test.mjs`

- [ ] Run the focused test file for the new helper.
- [ ] Run the full node test suite with `node --test tests/*.test.mjs`.
- [ ] Run `npm run build` to verify the React code compiles.
