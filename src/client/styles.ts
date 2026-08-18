export const CLIENT_STYLES = `
.dpm-root{display:grid;gap:16px;padding:4px 0 28px;color:inherit}
.dpm-root *{box-sizing:border-box}
.dpm-heading,.dpm-section-heading,.dpm-plugin-main,.dpm-recommend-head,.dpm-recommend-actions,.dpm-restart{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.dpm-heading h3{margin:0 0 5px;font-size:20px}
.dpm-heading p,.dpm-section-heading p{margin:0;opacity:.68;font-size:13px;line-height:1.5}
.dpm-panel,.dpm-operation,.dpm-notice,.dpm-diagnostics,.dpm-advanced,.dpm-about{border:1px solid color-mix(in srgb,currentColor 12%,transparent);border-radius:12px;background:color-mix(in srgb,currentColor 2.5%,transparent)}
.dpm-panel{display:grid;gap:14px;padding:16px}
.dpm-section-heading{align-items:center}
.dpm-section-heading h4{margin:0 0 3px;font-size:15px}
.dpm-button,.dpm-primary,.dpm-plugin-actions button{min-height:40px;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;padding:8px 13px;background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;cursor:pointer;font:inherit}
.dpm-button:hover,.dpm-plugin-actions button:hover{background:color-mix(in srgb,currentColor 9%,transparent)}
.dpm-primary{min-width:88px;background:#1f7a50;border-color:#1f7a50;color:#fff}
.dpm-primary:hover{background:#176a43}
.dpm-primary[data-state=installed]{background:#2563eb;border-color:#2563eb}
.dpm-button:disabled,.dpm-primary:disabled,.dpm-plugin-actions button:disabled{cursor:not-allowed;opacity:.46}
.dpm-button:focus-visible,.dpm-primary:focus-visible,.dpm-plugin-actions button:focus-visible,.dpm-install-row input:focus-visible,.dpm-root summary:focus-visible,.dpm-root a:focus-visible{outline:3px solid color-mix(in srgb,#27865a 40%,transparent);outline-offset:2px}
.dpm-notice,.dpm-operation{display:grid;gap:8px;padding:13px 15px;font-size:13px;line-height:1.5}
.dpm-notice[data-status=success],.dpm-operation[data-status=success]{border-color:color-mix(in srgb,#20a66a 42%,transparent);background:color-mix(in srgb,#20a66a 8%,transparent)}
.dpm-notice[data-status=error],.dpm-operation[data-status=error]{border-color:color-mix(in srgb,#d54d4d 42%,transparent);background:color-mix(in srgb,#d54d4d 7%,transparent)}
.dpm-operation[data-status=running]{border-color:color-mix(in srgb,#2563eb 36%,transparent)}
.dpm-operation code{overflow-wrap:anywhere}
.dpm-operation pre{max-height:180px;margin:0;padding:10px;overflow:auto;border-radius:7px;background:color-mix(in srgb,currentColor 6%,transparent);white-space:pre-wrap;overflow-wrap:anywhere}
.dpm-restart{align-items:center}
.dpm-recommend-list{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin:0;padding:0;list-style:none}
.dpm-recommend{display:grid;gap:12px;padding:16px;border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:14px;background:color-mix(in srgb,currentColor 1.5%,transparent)}
.dpm-recommend[data-state=pending]{border-color:color-mix(in srgb,#b8750d 42%,transparent)}
.dpm-recommend[data-state=error]{border-color:color-mix(in srgb,#c84444 42%,transparent)}
.dpm-recommend-title{min-width:0}
.dpm-recommend h5{margin:5px 0 0;font-size:16px;overflow-wrap:anywhere}
.dpm-badges{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}
.dpm-category,.dpm-trust,.dpm-install-status,.dpm-kind,.dpm-version,.dpm-health-label,.dpm-health-summary span{display:inline-flex;align-items:center;min-height:24px;padding:3px 8px;border-radius:999px;background:color-mix(in srgb,currentColor 7%,transparent);font-size:11px;white-space:nowrap}
.dpm-category{opacity:.7}
.dpm-trust[data-status=verified],.dpm-install-status[data-state=installed]{color:#147a4d;background:color-mix(in srgb,#20a66a 13%,transparent)}
.dpm-trust[data-status=community]{color:#2563eb;background:color-mix(in srgb,#2563eb 11%,transparent)}
.dpm-trust[data-status=experimental],.dpm-install-status[data-state=pending]{color:#9a620d;background:color-mix(in srgb,#c78318 13%,transparent)}
.dpm-install-status[data-state=installing]{color:#2563eb;background:color-mix(in srgb,#2563eb 11%,transparent)}
.dpm-install-status[data-state=error]{color:#b63232;background:color-mix(in srgb,#d54d4d 12%,transparent)}
.dpm-summary{margin:0;font-size:14px;line-height:1.55}
.dpm-why,.dpm-first-use{display:grid;gap:6px;padding:11px 12px;border-radius:10px;background:color-mix(in srgb,currentColor 5%,transparent);font-size:12px;line-height:1.55}
.dpm-why strong,.dpm-first-use strong{font-size:12px}
.dpm-first-use ol{display:grid;gap:5px;margin:0;padding-left:20px}
.dpm-meta{display:flex;flex-wrap:wrap;gap:8px 14px;font-size:11px;opacity:.62}
.dpm-impact{padding:9px 11px;border:1px solid color-mix(in srgb,currentColor 10%,transparent);border-radius:9px;font-size:12px}
.dpm-impact summary{cursor:pointer;font-weight:600}
.dpm-impact ul{display:grid;gap:5px;margin:9px 0 0;padding-left:20px;line-height:1.5}
.dpm-recommend-actions{align-items:center}
.dpm-recommend-actions a{color:#2563eb;font-size:12px}
.dpm-installed-section{display:block;padding:0;overflow:hidden}
.dpm-installed-summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 16px;cursor:pointer;list-style-position:inside}
.dpm-installed-summary>span:first-child{display:inline-flex;align-items:baseline;gap:9px}
.dpm-installed-summary small{opacity:.58;font-weight:400}
.dpm-installed-body{padding:0 16px 16px}
.dpm-health-summary{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}
.dpm-health-summary span[data-health=healthy],.dpm-health-label[data-health=healthy]{color:#188a57}
.dpm-health-summary span[data-health=warning],.dpm-health-label[data-health=warning]{color:#b8750d}
.dpm-health-summary span[data-health=error],.dpm-health-label[data-health=error]{color:#c84444}
.dpm-plugin-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}
.dpm-plugin{display:grid;gap:10px;padding:13px;border:1px solid color-mix(in srgb,currentColor 11%,transparent);border-radius:10px;background:color-mix(in srgb,currentColor 2.5%,transparent)}
.dpm-plugin[data-health=error]{border-color:color-mix(in srgb,#c84444 35%,transparent)}
.dpm-plugin-main{align-items:center}
.dpm-health-dot,.dpm-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:#8c8c8c}
.dpm-health-dot[data-health=healthy],.dpm-dot[data-status=pass]{background:#20a66a}
.dpm-health-dot[data-health=warning],.dpm-dot[data-status=warning]{background:#c78318}
.dpm-health-dot[data-health=error],.dpm-dot[data-status=fail]{background:#d54d4d}
.dpm-plugin-copy{min-width:0;flex:1;display:grid;gap:4px}
.dpm-plugin-title{display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.dpm-plugin-title strong{font-size:14px;overflow-wrap:anywhere}
.dpm-kind,.dpm-version{opacity:.72}
.dpm-update-badge{padding:3px 8px;border-radius:999px;color:#2563eb;background:color-mix(in srgb,#2563eb 12%,transparent);font-size:11px}
.dpm-update-copy{display:block;margin-top:5px;font-size:12px;opacity:.72}
.dpm-update-copy[data-state=available]{color:#2563eb;opacity:1;font-weight:600}
.dpm-spec{display:block;opacity:.62;font-size:11px;overflow-wrap:anywhere;white-space:normal}
.dpm-healthy-copy{margin:0 0 0 20px;color:#188a57;font-size:12px}
.dpm-issues{display:grid;gap:5px;margin:0 0 0 20px;padding-left:18px;font-size:12px}
.dpm-issues li[data-severity=warning]{color:#a96b0b}
.dpm-issues li[data-severity=error]{color:#c84444}
.dpm-plugin-actions{display:flex;justify-content:flex-end;gap:8px}
.dpm-plugin-actions button{min-height:36px;padding:6px 11px;font-size:12px}
.dpm-plugin-actions .dpm-danger{color:#c84444}
.dpm-advanced,.dpm-about{padding:14px 16px}
.dpm-advanced summary,.dpm-about summary{cursor:pointer;font-weight:650}
.dpm-advanced p,.dpm-about p{margin:10px 0;font-size:12px;line-height:1.55;opacity:.7}
.dpm-install-row{display:grid;gap:7px}
.dpm-install-row label{font-size:12px;font-weight:600}
.dpm-install-row>div{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}
.dpm-install-row input{min-width:0;min-height:40px;padding:9px 11px;border:1px solid color-mix(in srgb,currentColor 16%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 2%,transparent);color:inherit;font:inherit;outline:none}
.dpm-install-row input:focus{border-color:#27865a;box-shadow:0 0 0 2px color-mix(in srgb,#27865a 18%,transparent)}
.dpm-state,.dpm-empty{margin:6px 0;font-size:13px;opacity:.68}
.dpm-empty{text-align:center;padding:28px 16px;border:1px dashed color-mix(in srgb,currentColor 18%,transparent);border-radius:12px}
.dpm-empty p{max-width:560px;margin:6px auto 0;opacity:.65}
.dpm-error{color:#d54d4d;opacity:1}
.dpm-diagnostics{overflow:hidden}
.dpm-diagnostics summary{display:flex;justify-content:space-between;gap:14px;padding:13px 15px;cursor:pointer;font-size:13px;font-weight:600}
.dpm-check-list{display:grid;gap:7px;margin:0;padding:0 14px 14px;list-style:none}
.dpm-check{display:grid;grid-template-columns:10px minmax(115px,.34fr) 1fr;align-items:center;gap:11px;padding:9px 11px;border:1px solid color-mix(in srgb,currentColor 10%,transparent);border-radius:9px}
.dpm-label{font-size:12px;font-weight:600}
.dpm-message{font-size:12px;opacity:.7;overflow-wrap:anywhere}
@media (max-width:720px){
.dpm-heading,.dpm-section-heading,.dpm-plugin-main,.dpm-recommend-head,.dpm-restart{align-items:stretch;flex-direction:column}
.dpm-badges,.dpm-health-summary{justify-content:flex-start}
.dpm-installed-summary{align-items:flex-start;flex-direction:column}
.dpm-installed-summary>span:first-child{align-items:flex-start;flex-direction:column;gap:3px}
.dpm-install-row>div{grid-template-columns:1fr}
.dpm-recommend-actions{align-items:stretch;flex-direction:column}
.dpm-recommend-actions .dpm-primary{width:100%}
.dpm-check{grid-template-columns:10px 1fr}
.dpm-message{grid-column:2}
.dpm-diagnostics summary{flex-direction:column}
}
@media (prefers-reduced-motion:reduce){.dpm-root *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
`;
