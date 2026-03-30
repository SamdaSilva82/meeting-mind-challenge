# Meeting Mind - Backend Approach

## Pragmatic Storage Decision

For the technical challenge implementation, meeting persistence is currently in-memory (`Map` in the API service) instead of TypeORM-backed persistence.

Reason:
- The backend had persistent TypeORM setup/runtime issues that were blocking delivery.
- In-memory storage keeps the API deterministic and unblocks core product behavior (meeting analysis flow and retrieval endpoints) under time pressure.

Trade-offs:
- Data is lost on server restart.
- No cross-instance consistency.
- Not suitable for production persistence requirements.

Planned follow-up:
- Replace the in-memory store with repository-backed persistence once TypeORM stability issues are resolved.
- Keep controller/service contracts unchanged so storage can be swapped with minimal impact.

## OpenAI: `429 insufficient_quota` vs rate limits

**What went wrong:** OpenAI returns HTTP **429** for multiple reasons. One common case is **`insufficient_quota`** (`type` / `code` from the API): the key or org has **no usable credits** (free tier exhausted, billing not enabled, or hard spend cap hit). That is **not** a transient rate limit — **retrying does not help** until billing or the key is fixed.

**What we did in the API:** The analysis service **detects quota/billing errors** (including message heuristics like “exceeded your current quota”) and maps them to a **stable 429 JSON response** with a clear user message and `code: openai_insufficient_quota`. **True** rate-limit 429s still use **limited exponential backoff** retries. Default model is **`gpt-4o-mini`** (overridable via **`OPENAI_MODEL`**) as a cost- and quota-friendly default for structured outputs.

**With more time we would:** Persist meetings in a proper database (replacing in-memory storage); add observability (metrics/alerts on quota vs rate limit); optional queue + worker for analysis; billing/spend dashboards; and configurable retry/backoff policies per error class.

## Provider update: Gemini as real analysis backend

After stabilizing provider setup and keys, we switched back to a real Gemini-only analysis path (no mock fallback). The backend now uses Google Gemini (`@google/generative-ai`) with structured JSON output and schema validation for consistent extraction of:
- `summary`
- `actionItems` (`description`, `assignee`)
- `decisions`
- `openQuestions`

Error handling remains explicit for invalid keys, quota/rate limits, and safety/response-format failures, so clients receive clear API responses while keeping logs actionable.
