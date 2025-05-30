# gcm-resolvers/lib/

This folder contains adapter-level helpers, utilities, and pure functions shared by all GCM resolvers.

- Use for logic that is generic to the GCM resolver layer (e.g., resolver wrappers, error transformers).
- Do not use for domain-specific or business logic (those go in the relevant domain-service or domain-models folders). 