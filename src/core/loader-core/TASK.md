# TASK.md — loader-core

## ✅ Completed
- [x] Scaffolded initial directory and file structure
- [x] Implement pure registry builders in `lib/registry-builders.js`
- [x] Refactor loader-async.js to use importAndApplyAll for import/context step
- [x] Update documentation to reflect new pipeline and import/context step
- [x] Implement sync loader (loader.js) using findFilesSync and importAndApplyAllSync
- [x] Both sync and async loader pipelines are now fully documented and have parity
- [x] Implement feature loader (loader-async-feature.js) for modular feature discovery (files + directories)
- [x] Feature loader pipeline is now documented and available in the public API

## 🚧 In Progress
- [ ] Document architectural decisions in PLANNING.md and README.md

## 🕵️ Discovered During Work
- [ ] Consider if/when to add legacy compatibility layer
- [ ] Evaluate need for additional validation utilities
- [ ] Write new tests for all core functions (deferred)
- [ ] Ensure README.md and PLANNING.md always reflect the latest pipeline and utility usage
- [ ] Periodically review sync/async loader parity as new features are added
- [ ] Periodically review feature loader needs as the codebase evolves

---

> Mark tasks as ✅ when done. Add new discoveries as you work.
