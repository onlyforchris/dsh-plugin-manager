# Changelog

## 0.6.0

- Add a polished DSH-native visual system for recommendations, installed plugins, notices, actions, dialogs, and diagnostics.
- Replace raw JSON parsing failures with clear backend-readiness messages.
- Require consecutive valid diagnostics responses plus a startup grace period before restoring the page after restart.
- Improve responsive layouts, keyboard focus, reduced-motion support, and progressive disclosure styling.
- Remove the left accent bar from recommendation cards; card states now show through border and badge colors only.
- Harden restart recovery: per-probe fetch timeout, a deadline recovery check that reloads when the service is actually back, a longer restart-helper probe window, crash retry when the relaunched app exits immediately, and an in-place "retry auto restart" action on the failure banner.


## 0.5.4

- Replace browser-native confirmations with an accessible in-app install review dialog.
- Restart DSH automatically after successful plugin mutations and restore the page when the service returns.
- Preserve the active Web host, port, and other inner command-line arguments across restart.
- Treat a catalog launch target as available only when the corresponding DSH control is actually registered.
- Refine status, warning, restart, mobile, focus, and reduced-motion presentation.

## 0.5.0

- Turn recommendations into a first-use workflow with explicit install lifecycle states.
- Add catalog-owned first-use steps and constrained launch actions for settings or copyable prompts.
- Show available, installing, pending restart, installed, and failed states without relying on color alone.
- Keep permissions and installed-plugin management progressively disclosed.
- Improve keyboard focus, status announcements, narrow-screen layout, and reduced-motion behavior.

## 0.4.0

- Make plugin recommendations the primary settings experience.
- Add a repository-backed registry with strict runtime validation.
- Fetch the registry server-side with timeout, ETag caching, atomic writes, and builtin fallback.
- Show catalog source, freshness, compatibility, verification status, permissions, and recommendation rationale.
- Move manual installation into an advanced section and hide the manager itself from business plugins.
- Keep the initial catalog empty until real DSH plugins pass the documented admission checks.
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
