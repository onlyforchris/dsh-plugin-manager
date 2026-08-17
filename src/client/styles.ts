export const CLIENT_STYLES = `
.dpm-root { display: grid; gap: 16px; padding: 4px 0 24px; color: inherit; }
.dpm-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.dpm-heading h3 { margin: 0 0 4px; font-size: 18px; }
.dpm-heading p { margin: 0; opacity: .7; font-size: 13px; }
.dpm-refresh { border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: 8px; padding: 7px 12px; background: color-mix(in srgb, currentColor 5%, transparent); color: inherit; cursor: pointer; }
.dpm-refresh:hover { background: color-mix(in srgb, currentColor 9%, transparent); }
.dpm-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.dpm-badge { border-radius: 999px; padding: 4px 9px; font-size: 12px; background: color-mix(in srgb, currentColor 7%, transparent); }
.dpm-badge[data-status="pass"] { color: #20a66a; }
.dpm-badge[data-status="warning"] { color: #c78318; }
.dpm-badge[data-status="fail"] { color: #d54d4d; }
.dpm-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.dpm-check { display: grid; grid-template-columns: 10px minmax(120px, .38fr) 1fr; align-items: center; gap: 12px; border: 1px solid color-mix(in srgb, currentColor 12%, transparent); border-radius: 10px; padding: 11px 13px; background: color-mix(in srgb, currentColor 3%, transparent); }
.dpm-dot { width: 8px; height: 8px; border-radius: 50%; background: #8b8b8b; }
.dpm-dot[data-status="pass"] { background: #20a66a; }
.dpm-dot[data-status="warning"] { background: #c78318; }
.dpm-dot[data-status="fail"] { background: #d54d4d; }
.dpm-label { font-weight: 600; font-size: 13px; }
.dpm-message { opacity: .75; font-size: 13px; overflow-wrap: anywhere; }
.dpm-state { margin: 8px 0; opacity: .72; }
.dpm-error { color: #d54d4d; }
@media (max-width: 720px) { .dpm-check { grid-template-columns: 10px 1fr; } .dpm-message { grid-column: 2; } }
`
