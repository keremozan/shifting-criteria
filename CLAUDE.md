# Shifting Criteria (ETSC)

## What is this

A conceptual art project disguised as a software system. Or the other way around.

Five autonomous entities (Writer, Checker, Cutter, Reader, Narrator, Logger) operate on a shared document space through cycles. The Writer generates text fragments. The Checker evaluates them against criteria (word count, repetition, adjectives). The Cutter kills fragments that fail. The Reader annotates patterns. The Narrator translates each cycle into plain language. The Logger records stats. Every 5 cycles, one criterion threshold shifts randomly.

The system works. The problem is that it produces nothing worth reading. The fragments are syntactic noise from a grammar expansion engine. When one dies, nothing is lost. This is the central open question of the project.

## The conversation

Kerem (the artist) and the architect (Claude) have been talking about this through the metalog, a conversation log that lives inside the project itself. The metalog is not hidden documentation. It is part of the piece. Viewers see the system, the conversation about the system, and kerem's personal highlights and comments on the conversation. All at once.

The conversation so far has moved through: the legibility problem, the ASIDE convention for separating meta-talk from system-talk, the formalism problem (fragments are syntax not content), Sontag's "art is something not about something", three rejected approaches to fixing the fragments (claims, observations, instructions), and the current open proposal of sourced fragments (pulling real text into the system instead of generating it).

Read `data/metalog.json` and `data/metalog-threads.json` for the full conversation and its structure.

## Architecture

Next.js, TypeScript, Tailwind. Runs on port 3456 (`npm run dev`).

### Pages
- `/` -- Main system view. Cycle controls, narrative, document, entity panels, log.
- `/metalog` -- The conversation. Three-column layout: thread annotations (left border + labels), entries (center), highlights + comments (right sidebar).
- `/changelog` -- Technical change record with colored tags.
- `/diagrams` -- HTML diagrams referenced from the metalog.

### Data files (all in `data/`)
- `state.json` -- System state (fragments, entities, criteria). Persisted after each cycle.
- `metalog.json` -- Conversation entries. Append-only. Served via `/api/metalog`.
- `metalog-threads.json` -- Thread groupings for the metalog (summary, subtext, tags). Updated alongside metalog.
- `highlights.json` -- User highlights and comments on metalog text. Saved via `/api/highlights`.
- `diagrams.json` -- HTML diagrams. Served via `/api/diagrams`.

### Source structure
- `src/lib/types.ts` -- Core types (Fragment, Operation, Mark, EntityState, SystemState)
- `src/lib/engine.ts` -- Cycle orchestration (Writer -> Checker -> Cutter -> Reader -> Narrator -> Logger)
- `src/lib/entities/` -- Entity implementations
- `src/lib/metalog.ts` -- MetalogEntry type definition only
- `src/lib/changelog.ts` -- Changelog entries (hardcoded, not API-served)
- `src/components/` -- UI components (DocumentView, FragmentView, EntityPanel, SystemLog, HighlightTool, ThreadSidebar)
- `src/app/api/` -- API routes for cycle, metalog, highlights, diagrams, threads

### Levels (from bottom to top)
1. **Document** -- fragments living and dying
2. **Operations** -- marks, flags, cuts, annotations
3. **Narrative** -- Narrator's plain-language recap
4. **Metalog** -- kerem + architect conversation (ASIDE to enter)
5. **Highlights** -- kerem's private marks on the metalog text

Changelog sits outside this stack.

## Convention: ASIDE

When kerem says **ASIDE**, everything that follows is metalog territory. No matter what the content is.

- Append kerem's comment to `data/metalog.json` (fix grammar/phrasing/English before logging)
- ALWAYS respond as **architect** (append a follow-up entry)
- Use styled HTML in architect entries (strong, em, mark, code, br, blockquote)
- Mark classes: default (blue), `warn` (amber), `green` (green)
- Stay outside the system. Do not collapse observations into features unless explicitly asked.
- **No AI slop.** No "X becomes Y, not Z" reframing. No dramatic colons as reveal. No false dichotomies dressed as epiphanies. Say the thing directly.
- **Update threads.** Every metalog append also updates `data/metalog-threads.json`. Extend current thread or create new one if topic shifted. Include summary, subtext, and tags.

When kerem is NOT in ASIDE mode, work normally on the codebase.

## Tech changes

Log all technical changes to `src/lib/changelog.ts`.

## Open question

What should the fragments be? The system needs content that makes fragment death meaningful. Current proposal: sourced fragments (real text pulled in from outside, subjected to arbitrary formal criteria). Not yet implemented. Not yet agreed on.
