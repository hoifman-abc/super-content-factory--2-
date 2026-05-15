# Material To Work Conversion Design

## Goal

Add a toolbar button in the material detail view that converts the current material into a work item, keeps the original material type, prevents duplicates, and leaves the user on the same material page.

## Approved Behavior

1. The new action appears in the right side of the material preview toolbar.
2. Clicking it creates one new work from the currently opened material.
3. The created work preserves the source material type and reusable fields such as title, content, image, source URL, media URL, and image list.
4. If the same material has already been converted, the app does not create a second work.
5. The UI stays on the current material instead of navigating to the new work.

## Recommended Approach

Use a dedicated conversion helper so the duplicate rule and work payload shaping are easy to test without rendering React. Store a `sourceMaterialId` on generated works and use that field for duplicate detection.

Also extend `WorkPreviewView` so generated works with source-like types still render meaningfully:

1. `pdf` uses embedded preview when possible.
2. `video` uses video playback or the existing media URL.
3. `image` renders image-first preview.
4. link-like and article-like works show source metadata, cover image, and body content.

## Out Of Scope

1. Converting one material into multiple works.
2. AI rewriting during conversion.
3. Cross-project duplicate detection beyond the existing shared works list.
