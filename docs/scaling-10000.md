## Scaling Plan for 10,000+ Users

This repo can now serve summary-first dashboards and paginated library lists, but 10,000+ users still needs staged infrastructure work.

### Implemented in this pass

- Dashboard payloads are now capped to preview slices instead of returning full students, attendance, payments, and documents tables on every refresh.
- Heavy list APIs are paginated:
  - `GET /api/auth/libraries/:libraryId/students`
  - `GET /api/auth/libraries/:libraryId/attendance`
  - `GET /api/auth/libraries/:libraryId/payments`
  - `GET /api/auth/libraries/:libraryId/documents`
  - `GET /api/auth/libraries/:libraryId/chat`
- Added MongoDB indexes for the main access patterns on students, attendance, payments, documents, chat messages, and librarians.
- Added basic request hardening:
  - JSON body limit
  - in-process rate limiting
- Added signed session tokens and route-level authorization for protected library APIs.
- Added storage abstraction for uploads:
  - local filesystem fallback
  - S3-compatible object storage path when `S3_BUCKET_NAME` and `S3_REGION` are configured
- Added optional Redis-ready Socket.IO adapter path when `REDIS_URL` is configured.

### Target architecture for 10,000+

1. Web and mobile
- Serve web via CDN.
- Point web and mobile at a dedicated API domain.

2. API tier
- Run multiple stateless Node instances behind a load balancer.
- Set `REDIS_URL` so Socket.IO fanout works across instances.
- Add structured logs, metrics, and tracing.

3. Data tier
- Use a managed MongoDB cluster.
- Keep dashboard endpoints summary-only.
- Add cursor pagination for chat and very large tables.
- Add background jobs for payment reminders, attendance rollups, and document processing.

4. Storage
- Set `S3_BUCKET_NAME`, `S3_REGION`, and optionally `S3_PUBLIC_BASE_URL` to move uploads from local disk to object storage.
- Serve uploads through signed URLs or a CDN.

5. Reliability
- Add auth rate limiting per route.
- Add health checks and rolling deploys.
- Add backups and restore drills.

### API shape guidance

- Dashboard endpoints should expose counts and small previews only.
- Full tables should always require explicit pagination.
- Chat fetch should stay page-based or cursor-based and never return the full room history.
- Any export/report endpoint should be async once records become large.

### Next code steps

1. Add route-level auth and role middleware.
2. Move uploads to object storage.
3. Add Redis-backed Socket.IO adapter.
4. Add integration tests for paginated endpoints.
5. Add cursor pagination for chat history.
6. Add background worker for monthly payment generation and reminders.
