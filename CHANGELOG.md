# Changelog

## 0.3.0

- Add npm Registry latest-version checks with timeout, caching, and per-plugin failure isolation.
- Show available updates beside installed plugin health without conflating the two.
- Add a trusted-source catalog with builtin and Profile-managed trust labels.
- Route catalog installs through the same guarded standard DSH CLI operation.
- Document network, trust, and non-vulnerability-scanning boundaries.
## 0.2.0

- Reposition the product as **插件管家**; plugin health is an auxiliary capability.
- Add the current Profile dependency inventory with per-plugin health issues.
- Validate installed package manifests, Bundle registration, patch files, and Client exports.
- Add guarded, serialized install, update, and remove operations through the standard DSH CLI.
- Pin pnpm 10.34.5 as a runtime dependency to match the supported DSH rc.6 Profile.
- Move environment diagnostics into a secondary collapsible section.
- Explicitly exclude vulnerability scanning from the current product boundary.

## 0.1.0

- Add the native DSH Bundle and Client package.
- Add a read-only environment diagnostics endpoint.
- Add the native **插件医生** proof-of-concept tab under DSH Plugins settings.
- Add isolated profile install, runtime, and UI smoke coverage.
