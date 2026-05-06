# WeChat Official Image Upload Design

## Goal

Replace the current third-party image hosting step used by WeChat "greenbook" publishing with WeChat official server-side image upload, while keeping the current frontend publishing workflow unchanged for the user.

## Current Problem

The current flow converts local or generated images into public URLs by calling the local `/local-upload-image` endpoint. That endpoint depends on external anonymous file hosts. When those hosts fail, WeChat greenbook publishing fails before the publish request reaches the existing WeChat publish backend.

## Desired Outcome

When the user publishes a WeChat greenbook:

1. The frontend should no longer require third-party public image hosting.
2. The publish backend at `wx.limyai.com` should receive the original image payload.
3. The backend should upload images through WeChat official APIs.
4. The backend should publish using WeChat-hosted image URLs or official media results.
5. Failures should report WeChat upload errors rather than generic image-hosting failures.

## Recommended Approach

Use the existing `POST /wechat-publish` backend endpoint as the single integration point.

The frontend will stop pre-uploading data URLs through `/local-upload-image` for WeChat greenbook publishing. Instead, it will send raw image inputs to the existing backend payload in a backward-compatible extension field. The backend will then:

1. Detect WeChat greenbook publishing requests.
2. Identify raw image inputs that still need upload.
3. Upload those images using WeChat official server-side image upload APIs.
4. Replace raw image inputs with WeChat-generated image URLs.
5. Continue the existing publish flow.

This keeps the frontend simple and avoids requiring local WeChat credentials in the Vite dev server.

## Alternatives Considered

### Option 1: Frontend or local Vite server uploads directly to WeChat

Pros:
- Removes dependence on the remote publish backend for image upload.

Cons:
- Requires local access to each official account's credentials or authorizer tokens.
- Splits WeChat responsibilities across local and remote systems.
- Increases setup complexity and credential handling risk.

### Option 2: Remote backend handles WeChat official upload before publish

Pros:
- Minimal frontend change.
- Keeps credentialed WeChat operations on the backend.
- Aligns with WeChat's server-side API requirement.
- Preserves the current user-facing workflow.

Cons:
- Requires backend change on `wx.limyai.com`.

Recommendation: Option 2.

## Architecture Changes

### Frontend

The frontend changes are intentionally narrow:

1. Keep `postWechat('/wechat-publish', payload)` as the publish entrypoint.
2. Stop converting WeChat greenbook `data:image/...` inputs to public URLs before publishing.
3. Send original image data to the backend in a new payload field.
4. Preserve existing handling for already-public HTTP image URLs.
5. Update error messaging so failures point to backend or WeChat upload failures rather than third-party host failure.

### Backend

The remote WeChat publish backend should:

1. Accept raw image inputs in the publish payload.
2. For WeChat greenbook publishing, upload raw images through WeChat official image upload APIs.
3. Normalize uploaded results into the fields already expected by the publish implementation.
4. Return actionable errors when WeChat rejects image format, size, or permissions.

## Payload Design

The existing payload remains the base contract:

- `wechatAppid`
- `title`
- `content`
- `summary`
- `coverImage`
- `mainImages`
- `contentFormat`
- `articleType`

The frontend will add a backward-compatible raw image field for backend processing:

- `rawMainImages?: string[]`

Rules:

1. `mainImages` continues to carry already-publishable HTTP URLs when available.
2. `rawMainImages` carries images that still require official upload, especially `data:image/...` values.
3. For WeChat greenbook publishing, the backend prefers `rawMainImages` when present and uploads them before publish.
4. The backend may ignore `rawMainImages` for non-greenbook article types.

This keeps compatibility with existing consumers while allowing a staged rollout on the backend.

## Data Flow

### WeChat Greenbook Publish

1. User opens publish modal and chooses WeChat greenbook.
2. Frontend gathers title, body, and image list.
3. Frontend separates images into:
   - already-public HTTP URLs
   - raw `data:image/...` images
4. Frontend sends publish payload to `/wechat-publish`.
5. Backend uploads raw images via WeChat official API.
6. Backend obtains WeChat-hosted image URLs.
7. Backend composes final publish request with official image URLs.
8. Backend returns publish success or WeChat-specific failure.

## Error Handling

### Frontend

Replace current image-host-specific failure messages with messages derived from the backend response, for example:

- `WeChat official image upload failed: invalid file type`
- `WeChat official image upload failed: invalid image size`
- `WeChat official image upload failed: account permission denied`

### Backend

Backend responses should preserve enough detail for the frontend to display actionable errors:

- WeChat error code
- WeChat error message
- Which image failed if possible

## Constraints

1. WeChat official upload APIs must be called server-side.
2. Uploaded image format and size must comply with the WeChat official constraints for the selected API.
3. Existing ordinary article publishing behavior should not regress.
4. Existing publish modal workflow should remain unchanged from the user's perspective.

## Testing Strategy

### Frontend

1. Add a regression test proving WeChat greenbook publishing no longer depends on `/local-upload-image`.
2. Add coverage for payload shaping so `rawMainImages` is sent for `data:image/...` inputs.
3. Preserve existing tests for image normalization where still applicable.

### Integration

Backend verification should cover:

1. Receiving `rawMainImages`.
2. Uploading at least one `data:image/...` image through WeChat official API.
3. Returning a usable WeChat image URL.
4. Publishing a greenbook draft successfully with official-uploaded images.

## Rollout Plan

1. Ship backend support for `rawMainImages`.
2. Ship frontend payload change to stop depending on `/local-upload-image` for WeChat greenbook publishing.
3. Keep `/local-upload-image` only for unrelated local workflows, or remove it later if unused.

## Out of Scope

1. Replacing the entire `wx.limyai.com` WeChat publish backend.
2. Moving WeChat credential management into the local Vite server.
3. Refactoring non-WeChat publishing flows.
