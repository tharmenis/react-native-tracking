# Tastes

## Workflow & communication
- Likes to understand how the current implementation works before making changes — asks the assistant to explain existing behavior (e.g., how the access token is obtained in screens/services) as a precursor to performing updates (also checks whether shared infrastructure like an API client wrapper already exists before adding new code). Frequently hands the assistant individual source files (e.g., `@.../tripHistory.service.ts`, `@.../TripDetailsScreen.tsx`) to review/cross-check against related code before any change is made. Confidence: 0.8
- Prefers focused, single-component changes — explicitly narrows a task's scope to one component (e.g., "I need us to focus on the scrubber component") rather than bundling broad refactors. Confidence: 0.5

## UI & implementation
- Prefers conservative, minimal UI positioning changes: when one element overlaps another (e.g., the fullscreen button overlapping the playback controls bar), keep the element in its original location and compute the offset needed to clear the overlapping content (measured dynamically via `onLayout`) rather than relocating it elsewhere or hardcoding a fixed value — rejected moving the fullscreen button to the top-right as "too aggressive". Confidence: 0.7
- Prefers minimal, overflow-proof UI structures: when rendering one element per data point (e.g., a `TouchableOpacity` per trip path point) can overflow the available width, replace them with a single interactive element whose position is computed as a percentage of the container width (e.g., a track + thumb scrubber) rather than capping/shrinking the rendered items. Confidence: 0.7
