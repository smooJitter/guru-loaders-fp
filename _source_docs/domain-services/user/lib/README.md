# user/lib/

This folder contains helpers, pure functions, and business rules shared by all user domain services.

- Use for logic reused across multiple user services (e.g., validation, business rules).
- Do not use for cross-domain utilities (those go in the root lib/).

**Note:**
- This per-domain `lib/` pattern is intentional and documented in `docs/architecture/CONVENTIONS.md`. 