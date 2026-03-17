# CLAUDE.md

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Repository Overview

This is a new, empty repository. This CLAUDE.md will be updated as the project evolves with actual codebase details, conventions, and workflows.

## Current State

- **Status**: Newly initialized repository with no source code yet
- **Branch**: Development occurs on `claude/add-claude-documentation-npfmC`
- **Remote**: `hudsonvrtiskalike/Huddy2`

## Development Workflow

### Branch Strategy

- Never push directly to `main` or `master`
- Feature branches should follow the pattern: `claude/<feature-description>-<session-id>`
- Always use `git push -u origin <branch-name>` when pushing a new branch

### Commit Conventions

Use clear, descriptive commit messages:

```
<type>: <short summary>

<optional body>
```

Common types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Making Changes

1. Ensure you are on the correct feature branch before making changes
2. Read existing files before editing them
3. Run tests before committing (once a test suite is configured)
4. Keep commits focused and atomic

## Code Conventions

These will be updated once the project stack is established. General guidelines:

- Prefer editing existing files over creating new ones
- Avoid over-engineering — minimum complexity for the current task
- No unused imports, variables, or dead code
- No backwards-compatibility hacks for code that no longer exists

## Project Setup

*To be filled in once the project is initialized with a tech stack.*

Typical steps will include:

```bash
# Install dependencies
npm install   # or: pnpm install / yarn / pip install -r requirements.txt

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

*Document required environment variables here as the project grows.*

```
# Example:
# DATABASE_URL=...
# API_KEY=...
```

## Architecture Notes

*To be filled in as the codebase grows.*

Key areas to document:
- Directory structure and purpose of each folder
- Data flow and key abstractions
- External services and integrations
- Testing strategy

## AI Assistant Notes

- This file should be kept up to date as the project evolves
- When adding a new major feature or dependency, update the relevant sections above
- If conventions diverge from what is documented here, update this file
- Prefer making small, focused changes; avoid large sweeping refactors unless explicitly requested
