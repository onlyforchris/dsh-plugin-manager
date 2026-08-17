export const CLIENT_STYLES = `
.dpm-root { display: grid; gap: 16px; padding: 4px 0 28px; color: inherit; }
.dpm-heading, .dpm-section-heading, .dpm-plugin-main { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.dpm-heading h3 { margin: 0 0 5px; font-size: 20px; }
.dpm-heading p, .dpm-section-heading p { margin: 0; opacity: .68; font-size: 13px; line-height: 1.5; }
.dpm-panel, .dpm-operation, .dpm-diagnostics { border: 1px solid color-mix(in srgb, currentColor 12%, transparent); border-radius: 12px; background: color-mix(in srgb, currentColor 2.5%, transparent); }
.dpm-panel { display: grid; gap: 14px; padding: 16px; }
.dpm-section-heading { align-items: center; }
.dpm-section-heading h4 { margin: 0 0 3px; font-size: 15px; }
.dpm-button, .dpm-primary, .dpm-plugin-actions button { border: 1px solid color-mix(in srgb, currentColor 18%, transparent); border-radius: 8px; padding: 7px 13px; background: color-mix(in srgb, currentColor 5%, transparent); color: inherit; cursor: pointer; font: inherit; }
.dpm-button:hover, .dpm-plugin-actions button:hover { background: color-mix(in srgb, currentColor 9%, transparent); }
.dpm-button:disabled, .dpm-primary:disabled, .dpm-plugin-actions button:disabled { cursor: not-allowed; opacity: .45; }
.dpm-primary { background: #1f7a50; border-color: #1f7a50; color: white; min-width: 76px; }
.dpm-primary:hover { background: #176a43; }
.dpm-install-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; }
.dpm-install-row input { min-width: 0; border: 1px solid color-mix(in srgb, currentColor 16%, transparent); border-radius: 8px; padding: 9px 11px; background: color-mix(in srgb, currentColor 2%, transparent); color: inherit; font: inherit; outline: none; }
.dpm-install-row input:focus { border-color: #27865a; box-shadow: 0 0 0 2px color-mix(in srgb, #27865a 18%, transparent); }
.dpm-help { margin: -6px 0 0; opacity: .58; font-size: 12px; }
.dpm-health-summary { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }
.dpm-health-summary span, .dpm-kind, .dpm-version, .dpm-health-label { border-radius: 999px; padding: 3px 8px; font-size: 11px; background: color-mix(in srgb, currentColor 7%, transparent); white-space: nowrap; }
.dpm-health-summary span[data-health="healthy"], .dpm-health-label[data-health="healthy"] { color: #188a57; }
.dpm-health-summary span[data-health="warning"], .dpm-health-label[data-health="warning"] { color: #b8750d; }
.dpm-health-summary span[data-health="error"], .dpm-health-label[data-health="error"] { color: #c84444; }
.dpm-plugin-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.dpm-plugin { display: grid; gap: 10px; border: 1px solid color-mix(in srgb, currentColor 11%, transparent); border-radius: 10px; padding: 13px; background: color-mix(in srgb, currentColor 2.5%, transparent); }
.dpm-plugin[data-health="error"] { border-color: color-mix(in srgb, #c84444 35%, transparent); }
.dpm-plugin-main { align-items: center; }
.dpm-health-dot, .dpm-dot { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; background: #8c8c8c; }
.dpm-health-dot[data-health="healthy"], .dpm-dot[data-status="pass"] { background: #20a66a; }
.dpm-health-dot[data-health="warning"], .dpm-dot[data-status="warning"] { background: #c78318; }
.dpm-health-dot[data-health="error"], .dpm-dot[data-status="fail"] { background: #d54d4d; }
.dpm-plugin-copy { min-width: 0; flex: 1; display: grid; gap: 4px; }
.dpm-plugin-title { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
.dpm-plugin-title strong { font-size: 14px; overflow-wrap: anywhere; }
.dpm-kind, .dpm-version { opacity: .72; }
.dpm-update-badge { border-radius: 999px; padding: 3px 8px; font-size: 11px; color: #2563eb; background: #dbeafe; }
.dpm-update-copy { display: block; margin-top: 5px; font-size: 12px; opacity: .72; }
.dpm-update-copy[data-state='available'] { color: #2563eb; opacity: 1; font-weight: 600; }
.dpm-catalog-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.dpm-catalog-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px; border: 1px solid color-mix(in srgb, currentColor 14%, transparent); border-radius: 12px; }
.dpm-catalog-item strong { margin-right: 8px; }
.dpm-catalog-item p { margin: 6px 0; opacity: .72; }
.dpm-catalog-item a { font-size: 12px; color: #2563eb; }
.dpm-spec { display: block; opacity: .62; font-size: 11px; overflow-wrap: anywhere; white-space: normal; }
.dpm-healthy-copy { margin: 0 0 0 20px; color: #188a57; font-size: 12px; }
.dpm-issues { display: grid; gap: 5px; margin: 0 0 0 20px; padding: 0; list-style: none; font-size: 12px; }
.dpm-issues li::before { content: "•"; margin-right: 7px; }
.dpm-issues li[data-severity="warning"] { color: #a96b0b; }
.dpm-issues li[data-severity="error"] { color: #c84444; }
.dpm-plugin-actions { display: flex; justify-content: flex-end; gap: 8px; }
.dpm-plugin-actions button { padding: 5px 10px; font-size: 12px; }
.dpm-plugin-actions .dpm-danger { color: #c84444; }
.dpm-operation { display: grid; gap: 7px; padding: 13px 15px; font-size: 12px; }
.dpm-operation[data-status="success"] { border-color: color-mix(in srgb, #20a66a 35%, transparent); }
.dpm-operation[data-status="error"] { border-color: color-mix(in srgb, #d54d4d 35%, transparent); }
.dpm-operation code { overflow-wrap: anywhere; }
.dpm-operation pre { max-height: 180px; margin: 0; padding: 10px; overflow: auto; border-radius: 7px; background: color-mix(in srgb, currentColor 6%, transparent); white-space: pre-wrap; overflow-wrap: anywhere; }
.dpm-operation p { margin: 0; line-height: 1.5; }
.dpm-state, .dpm-empty { margin: 6px 0; opacity: .68; font-size: 13px; }
.dpm-error { color: #d54d4d; opacity: 1; }
.dpm-diagnostics { overflow: hidden; }
.dpm-diagnostics summary { display: flex; justify-content: space-between; gap: 14px; padding: 13px 15px; cursor: pointer; font-size: 13px; font-weight: 600; }
.dpm-summary-inline { opacity: .58; font-weight: 400; }
.dpm-check-list { display: grid; gap: 7px; margin: 0; padding: 0 14px 14px; list-style: none; }
.dpm-check { display: grid; grid-template-columns: 10px minmax(115px, .34fr) 1fr; align-items: center; gap: 11px; border: 1px solid color-mix(in srgb, currentColor 10%, transparent); border-radius: 9px; padding: 9px 11px; }
.dpm-label { font-weight: 600; font-size: 12px; }
.dpm-message { opacity: .7; font-size: 12px; overflow-wrap: anywhere; }
@media (max-width: 720px) {
  .dpm-heading, .dpm-section-heading { align-items: stretch; flex-direction: column; }
  .dpm-health-summary { justify-content: flex-start; }
  .dpm-install-row { grid-template-columns: 1fr; }
  .dpm-plugin-main { align-items: flex-start; }
  .dpm-check { grid-template-columns: 10px 1fr; }
  .dpm-message { grid-column: 2; }
  .dpm-diagnostics summary { flex-direction: column; }
}
`
