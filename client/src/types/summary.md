# Types Directory

## Purpose
This folder provides centralized type re-exports for domain types used across the application. The actual type definitions live in their respective feature folders following the feature-first pattern.

## Files

- **dashboard.ts** - Re-exports dashboard types from `features/project/dashboard/types.ts`
- **home.ts** - Re-exports home page types from `features/home/types.ts`

## Convention
Types are defined alongside the features that own them, but re-exported here for:
1. Backward compatibility with existing imports
2. Discoverability - developers can see all domain types in one place
3. Cross-feature type sharing when needed

## Adding New Types
1. Define types in the owning feature folder (e.g., `features/sprints/types.ts`)
2. Create a re-export file here if the types need to be shared across features
3. Update this summary.md to document the new type file
