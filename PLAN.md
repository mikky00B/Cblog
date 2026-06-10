# Custom Blog Backend and Admin Checklist

## Phase 1: Foundation

- [x] Decide architecture: React admin/editor, FastAPI API, Postgres database.
- [x] Add backend project structure.
- [x] Add environment variable template.
- [x] Add database connection and models.
- [x] Add public post/category endpoints.
- [x] Add protected admin post endpoints.
- [x] Add frontend API client and shared post types.
- [x] Add admin routes and shell.
- [x] Add Tiptap post editor page.

## Phase 2: Publishing Workflow

- [x] Add admin authentication.
- [x] Add draft/published/archive status transitions.
- [x] Add slug generation and uniqueness validation.
- [x] Add category and tag management.
- [x] Add preview mode for drafts.
- [x] Replace hardcoded public article lists with API data.

## Phase 3: Media and Rendering

- [x] Add image upload endpoint.
- [x] Add media library in admin.
- [x] Add cover image picker.
- [x] Sanitize and cache rendered HTML.
- [x] Add public article renderer for saved content.
- [x] Add SEO fields and Open Graph metadata.

## Phase 4: Production Readiness

- [x] Add migrations.
- [x] Add tests for API endpoints.
- [x] Add rate limits and upload validation.
- [x] Add CORS and cookie/security settings for deployment.
- [x] Add sitemap and RSS feed.
- [x] Add deployment docs.
