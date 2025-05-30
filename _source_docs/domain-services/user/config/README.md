# user/config/

This folder contains constants, enums, and configuration shared by all user domain services.

- Use for values reused across multiple user services (e.g., error codes, feature flags).
- Do not use for cross-domain config (those go in the root config/).

**Note:**
- This per-domain `config/` pattern is intentional and documented in `docs/architecture/CONVENTIONS.md`. 