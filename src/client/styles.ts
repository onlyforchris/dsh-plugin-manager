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
.dpm-button,.dpm-primary,.dpm-plugin-actions button,.dpm-confirm-danger{transition:background-color .16s ease,border-color .16s ease,box-shadow .16s ease,transform .16s ease}
.dpm-button:active,.dpm-primary:active,.dpm-plugin-actions button:active,.dpm-confirm-danger:active{transform:translateY(1px)}
.dpm-panel,.dpm-recommend,.dpm-plugin,.dpm-operation,.dpm-notice,.dpm-diagnostics,.dpm-advanced,.dpm-about{box-shadow:0 1px 2px color-mix(in srgb,#000 5%,transparent)}
.dpm-notice{grid-template-columns:minmax(0,1fr) auto;align-items:center}
.dpm-notice[data-status=warning]{border-color:color-mix(in srgb,#c78318 42%,transparent);background:color-mix(in srgb,#c78318 8%,transparent)}
.dpm-recommend[data-state=unavailable]{border-color:color-mix(in srgb,#c78318 45%,transparent);background:color-mix(in srgb,#c78318 3%,transparent)}
.dpm-install-status[data-state=unavailable]{color:#8a5708;background:color-mix(in srgb,#c78318 14%,transparent)}
.dpm-dialog-layer,.dpm-restarting-layer{position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:rgba(13,18,25,.52);backdrop-filter:blur(3px)}
.dpm-dialog-layer{z-index:2200}
.dpm-dialog{width:min(540px,100%);max-height:calc(100dvh - 48px);overflow:auto;border:1px solid color-mix(in srgb,CanvasText 14%,transparent);border-radius:18px;padding:22px;background:Canvas;color:CanvasText;box-shadow:0 24px 80px rgba(0,0,0,.28)}
.dpm-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
.dpm-dialog-head h4{margin:4px 0 0;font-size:21px;line-height:1.3}
.dpm-dialog-eyebrow{display:block;color:#237a51;font-size:12px;font-weight:700;letter-spacing:.02em}
.dpm-dialog-close{display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border:0;border-radius:10px;background:color-mix(in srgb,CanvasText 6%,transparent);color:inherit;cursor:pointer;font-size:21px;line-height:1}
.dpm-dialog-close:hover{background:color-mix(in srgb,CanvasText 10%,transparent)}
.dpm-dialog-intro{margin:16px 0;color:color-mix(in srgb,CanvasText 72%,transparent);font-size:14px;line-height:1.65}
.dpm-dialog-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:12px}
.dpm-dialog-facts span{display:grid;gap:4px;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,CanvasText 5%,transparent)}
.dpm-dialog-facts small{font-size:11px;opacity:.58}
.dpm-dialog-facts strong{font-size:12px;overflow-wrap:anywhere}
.dpm-command-preview{display:grid;gap:7px;padding:12px;border:1px solid color-mix(in srgb,CanvasText 12%,transparent);border-radius:11px;background:color-mix(in srgb,CanvasText 2.5%,transparent)}
.dpm-command-preview span{font-size:11px;font-weight:700;opacity:.62}
.dpm-command-preview code{font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.dpm-dialog-impact{margin-top:12px;border:1px solid color-mix(in srgb,CanvasText 11%,transparent);border-radius:11px;padding:10px 12px;font-size:12px}
.dpm-dialog-impact summary{cursor:pointer;font-weight:700}
.dpm-dialog-impact ul{display:grid;gap:5px;margin:9px 0 0;padding-left:20px;line-height:1.5}
.dpm-dialog-warning{margin:12px 0 0;padding:11px 12px;border-radius:10px;color:#875508;background:color-mix(in srgb,#c78318 13%,Canvas);font-size:12px;line-height:1.55}
.dpm-dialog-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:16px;border-top:1px solid color-mix(in srgb,CanvasText 10%,transparent)}
.dpm-dialog-actions .dpm-button,.dpm-dialog-actions .dpm-primary,.dpm-confirm-danger{min-height:44px;padding:9px 16px}
.dpm-confirm-danger{border:1px solid #c84444;border-radius:8px;background:#c84444;color:#fff;cursor:pointer;font:inherit}
.dpm-confirm-danger:hover{background:#b23636}
.dpm-confirm-danger:focus-visible,.dpm-dialog-close:focus-visible{outline:3px solid color-mix(in srgb,#27865a 38%,transparent);outline-offset:2px}
.dpm-restarting-layer{z-index:2300;background:rgba(13,18,25,.62)}
.dpm-restarting-card{display:flex;align-items:center;gap:16px;width:min(440px,100%);padding:22px;border:1px solid color-mix(in srgb,CanvasText 13%,transparent);border-radius:16px;background:Canvas;color:CanvasText;box-shadow:0 24px 80px rgba(0,0,0,.3)}
.dpm-restarting-card strong{font-size:16px}
.dpm-restarting-card p{margin:5px 0 0;opacity:.66;font-size:13px;line-height:1.55}
.dpm-spinner{width:26px;height:26px;flex:0 0 26px;border:3px solid color-mix(in srgb,#27865a 22%,transparent);border-top-color:#27865a;border-radius:50%;animation:dpm-spin .8s linear infinite}
@keyframes dpm-spin{to{transform:rotate(360deg)}}
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
.dpm-notice{grid-template-columns:1fr}
.dpm-notice .dpm-button{width:100%}
.dpm-dialog-layer,.dpm-restarting-layer{padding:12px}
.dpm-dialog{max-height:calc(100dvh - 24px);padding:18px;border-radius:14px}
.dpm-dialog-facts{grid-template-columns:1fr}
.dpm-dialog-actions{flex-direction:column-reverse}
.dpm-dialog-actions button{width:100%}
}
@media (prefers-reduced-motion:reduce){.dpm-root *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}

/* v0.6 polished DSH-native visual layer */
.dpm-root{--dpm-accent:#167a57;--dpm-accent-hover:#106746;--dpm-blue:#2563eb;--dpm-danger:#c83b45;--dpm-muted:color-mix(in srgb,CanvasText 62%,transparent);--dpm-border:color-mix(in srgb,CanvasText 11%,transparent);--dpm-border-strong:color-mix(in srgb,CanvasText 17%,transparent);--dpm-surface:color-mix(in srgb,CanvasText 2.1%,Canvas);--dpm-raised:color-mix(in srgb,CanvasText .7%,Canvas);gap:18px;padding:6px 0 34px;font-size:14px;line-height:1.5}
.dpm-heading{align-items:center;padding:2px 2px 0}
.dpm-heading h3{font-size:24px;line-height:1.25;letter-spacing:-.025em}
.dpm-heading p,.dpm-section-heading p{color:var(--dpm-muted);opacity:1}
.dpm-panel,.dpm-operation,.dpm-notice,.dpm-diagnostics,.dpm-advanced,.dpm-about{border-color:var(--dpm-border);border-radius:16px;background:var(--dpm-raised);box-shadow:none}
.dpm-panel{gap:16px;padding:18px}
.dpm-section-heading h4{font-size:17px;letter-spacing:-.01em}
.dpm-button,.dpm-primary,.dpm-plugin-actions button,.dpm-confirm-danger{display:inline-flex;align-items:center;justify-content:center;min-height:42px;border-color:var(--dpm-border-strong);border-radius:10px;padding:9px 15px;background:var(--dpm-raised);font-weight:600;line-height:1;white-space:nowrap;box-shadow:0 1px 1px color-mix(in srgb,#000 5%,transparent);transition:background-color .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease,transform .12s ease}
.dpm-button:hover,.dpm-plugin-actions button:hover{border-color:color-mix(in srgb,CanvasText 25%,transparent);background:color-mix(in srgb,CanvasText 5%,Canvas);box-shadow:0 2px 6px color-mix(in srgb,#000 8%,transparent)}
.dpm-primary{min-width:96px;border-color:var(--dpm-accent);background:var(--dpm-accent);box-shadow:0 2px 5px color-mix(in srgb,var(--dpm-accent) 24%,transparent)}
.dpm-primary:hover{border-color:var(--dpm-accent-hover);background:var(--dpm-accent-hover);box-shadow:0 4px 10px color-mix(in srgb,var(--dpm-accent) 22%,transparent)}
.dpm-button:active,.dpm-primary:active,.dpm-plugin-actions button:active,.dpm-confirm-danger:active{transform:scale(.975)}
.dpm-button:focus-visible,.dpm-primary:focus-visible,.dpm-plugin-actions button:focus-visible,.dpm-install-row input:focus-visible,.dpm-root summary:focus-visible,.dpm-root a:focus-visible{outline:3px solid color-mix(in srgb,var(--dpm-accent) 36%,transparent);outline-offset:2px}
.dpm-notice,.dpm-operation{position:relative;grid-template-columns:38px minmax(0,1fr) auto;align-items:center;gap:12px;padding:14px 16px;overflow:hidden}
.dpm-notice:before,.dpm-operation:before{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:color-mix(in srgb,var(--dpm-blue) 12%,Canvas);color:var(--dpm-blue);content:"i";font-size:16px;font-weight:800}
.dpm-notice>span,.dpm-operation>span,.dpm-operation>strong,.dpm-operation>details{grid-column:2}
.dpm-notice>.dpm-button,.dpm-operation>.dpm-button{grid-column:3;grid-row:1 / span 2}
.dpm-restart-fallback{display:flex;flex-wrap:wrap;gap:8px;grid-column:3;grid-row:1 / span 2}
.dpm-notice[data-status=success],.dpm-operation[data-status=success]{border-color:color-mix(in srgb,#20a66a 30%,transparent);background:color-mix(in srgb,#20a66a 6%,Canvas)}
.dpm-notice[data-status=success]:before,.dpm-operation[data-status=success]:before{content:"\\2713";background:color-mix(in srgb,#20a66a 13%,Canvas);color:#178154}
.dpm-notice[data-status=warning]{border-color:color-mix(in srgb,#c78318 32%,transparent);background:color-mix(in srgb,#c78318 6%,Canvas)}
.dpm-notice[data-status=warning]:before{content:"!";background:color-mix(in srgb,#c78318 13%,Canvas);color:#9a5b08}
.dpm-notice[data-status=error],.dpm-operation[data-status=error]{border-color:color-mix(in srgb,#d54d4d 30%,transparent);background:color-mix(in srgb,#d54d4d 6%,Canvas)}
.dpm-notice[data-status=error]:before,.dpm-operation[data-status=error]:before{content:"!";background:color-mix(in srgb,#d54d4d 12%,Canvas);color:var(--dpm-danger)}
.dpm-operation[data-status=running]{background:color-mix(in srgb,var(--dpm-blue) 5%,Canvas)}
.dpm-operation pre{border:1px solid var(--dpm-border);border-radius:10px;background:var(--dpm-surface)}
.dpm-recommend-list{gap:14px}
.dpm-recommend{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px 16px;padding:20px;border-color:var(--dpm-border);border-radius:15px;background:var(--dpm-raised);box-shadow:0 2px 8px color-mix(in srgb,#000 5%,transparent);transition:border-color .18s ease,box-shadow .18s ease}
.dpm-recommend:hover{border-color:color-mix(in srgb,var(--dpm-accent) 28%,var(--dpm-border));box-shadow:0 5px 16px color-mix(in srgb,#000 7%,transparent)}
.dpm-recommend-head,.dpm-summary,.dpm-meta,.dpm-impact,.dpm-recommend-actions{grid-column:1/-1}
.dpm-recommend h5{font-size:18px;line-height:1.3;letter-spacing:-.015em}
.dpm-category,.dpm-trust,.dpm-install-status,.dpm-kind,.dpm-version,.dpm-health-label,.dpm-health-summary span{min-height:25px;padding:3px 9px;background:color-mix(in srgb,CanvasText 6%,Canvas);font-weight:600}
.dpm-category,.dpm-kind,.dpm-version{color:var(--dpm-muted);opacity:1;font-weight:500}
.dpm-trust[data-status=verified],.dpm-install-status[data-state=installed]{background:color-mix(in srgb,#20a66a 12%,Canvas)}
.dpm-summary{color:color-mix(in srgb,CanvasText 87%,transparent);line-height:1.65}
.dpm-why,.dpm-first-use{align-content:start;gap:8px;padding:14px 15px;border:1px solid color-mix(in srgb,CanvasText 8%,transparent);border-radius:12px;background:var(--dpm-surface);line-height:1.6}
.dpm-meta{grid-column:1/-1;color:var(--dpm-muted);opacity:1}
.dpm-impact{grid-column:1/-1;border-color:var(--dpm-border);border-radius:11px;background:var(--dpm-surface);overflow:hidden}
.dpm-impact summary{padding:11px 13px}.dpm-impact ul{margin:0;padding:0 18px 13px 34px}
.dpm-recommend-actions{grid-column:1/-1;padding-top:1px}.dpm-recommend-actions a{font-weight:600;text-underline-offset:3px}
.dpm-installed-summary{padding:17px 18px;list-style:none}.dpm-installed-summary::-webkit-details-marker{display:none}
.dpm-installed-summary:after{display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:color-mix(in srgb,CanvasText 5%,Canvas);content:"\\203A";font-size:20px;line-height:1;transform:rotate(90deg);transition:transform .18s ease}.dpm-installed-section:not([open]) .dpm-installed-summary:after{transform:rotate(0)}
.dpm-installed-summary small{color:var(--dpm-muted);opacity:1}.dpm-installed-body{padding:0 18px 18px;border-top:1px solid var(--dpm-border)}
.dpm-plugin-list{gap:10px;margin-top:14px}.dpm-plugin{grid-template-columns:minmax(0,1fr) auto;gap:10px 16px;padding:15px 16px;border-color:var(--dpm-border);border-radius:13px;background:var(--dpm-raised);transition:border-color .18s ease,background-color .18s ease}.dpm-plugin:hover{border-color:var(--dpm-border-strong);background:color-mix(in srgb,CanvasText 1.8%,Canvas)}
.dpm-plugin-main{grid-column:1/-1}.dpm-health-dot,.dpm-dot{width:9px;height:9px;flex-basis:9px;box-shadow:0 0 0 4px color-mix(in srgb,#8c8c8c 10%,transparent)}.dpm-health-dot[data-health=healthy],.dpm-dot[data-status=pass]{box-shadow:0 0 0 4px color-mix(in srgb,#20a66a 11%,transparent)}
.dpm-plugin-title strong{font-size:15px}.dpm-spec,.dpm-update-copy{color:var(--dpm-muted);opacity:1}.dpm-healthy-copy,.dpm-issues{align-self:center}.dpm-plugin-actions{align-self:center}.dpm-plugin-actions button{min-height:38px;padding:7px 13px;font-weight:600}
.dpm-plugin-actions .dpm-danger{border-color:color-mix(in srgb,var(--dpm-danger) 24%,var(--dpm-border));color:var(--dpm-danger);background:color-mix(in srgb,var(--dpm-danger) 4%,Canvas)}.dpm-plugin-actions .dpm-danger:hover{border-color:color-mix(in srgb,var(--dpm-danger) 45%,transparent);background:color-mix(in srgb,var(--dpm-danger) 9%,Canvas)}
.dpm-advanced,.dpm-about,.dpm-diagnostics{overflow:hidden}.dpm-advanced summary,.dpm-about summary,.dpm-diagnostics summary{position:relative;list-style:none}.dpm-advanced summary::-webkit-details-marker,.dpm-about summary::-webkit-details-marker,.dpm-diagnostics summary::-webkit-details-marker{display:none}
.dpm-advanced>summary,.dpm-about>summary{padding:16px 48px 16px 18px}.dpm-advanced>summary:after,.dpm-about>summary:after,.dpm-diagnostics summary:after{position:absolute;top:50%;right:18px;width:24px;height:24px;border-radius:7px;background:color-mix(in srgb,CanvasText 5%,Canvas);content:"\\203A";font-size:20px;font-weight:400;line-height:21px;text-align:center;transform:translateY(-50%) rotate(90deg);transition:transform .18s ease}.dpm-advanced:not([open])>summary:after,.dpm-about:not([open])>summary:after,.dpm-diagnostics:not([open]) summary:after{transform:translateY(-50%) rotate(0)}
.dpm-advanced p,.dpm-about p{margin:0;padding:0 18px 13px;color:var(--dpm-muted);opacity:1}.dpm-install-row{padding:0 18px 18px}.dpm-install-row input{min-height:44px;border-color:var(--dpm-border-strong);border-radius:10px;background:var(--dpm-raised)}.dpm-install-row input:focus{border-color:var(--dpm-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dpm-accent) 14%,transparent)}
.dpm-diagnostics summary{position:relative;align-items:center;padding:16px 48px 16px 18px}.dpm-check-list{padding:14px 16px 16px;border-top:1px solid var(--dpm-border)}.dpm-check{padding:11px 13px;border-color:var(--dpm-border);border-radius:10px;background:var(--dpm-raised)}.dpm-message{color:var(--dpm-muted);opacity:1}
.dpm-dialog{border-radius:18px;padding:24px}.dpm-dialog-head h4{letter-spacing:-.02em}.dpm-dialog-facts span,.dpm-command-preview{border:1px solid var(--dpm-border);background:var(--dpm-surface)}.dpm-dialog-actions{border-color:var(--dpm-border)}.dpm-restarting-card{border-radius:17px;padding:24px}
.dpm-progress-card{gap:12px;padding:15px 16px}.dpm-progress-head{display:flex;align-items:center;gap:11px}.dpm-progress-head>div{display:grid;gap:2px;min-width:0}.dpm-progress-head strong{font-size:14px}.dpm-progress-phase{color:var(--dpm-muted);opacity:1;font-size:12.5px}
.dpm-toast{position:fixed;right:22px;bottom:22px;z-index:2400;width:min(400px,calc(100vw - 44px));border:1px solid var(--dpm-border);border-radius:14px;background:Canvas;color:CanvasText;box-shadow:0 12px 40px rgba(0,0,0,.22);animation:dpm-rise .25s ease both}.dpm-progress-toast{display:grid;gap:10px;padding:14px 16px}
.dpm-progress-track{position:relative;height:7px;overflow:hidden;border-radius:99px;background:color-mix(in srgb,CanvasText 9%,transparent)}.dpm-progress-bar{position:absolute;inset-block:0;width:38%;border-radius:99px;background:var(--dpm-accent);animation:dpm-progress-slide 1.25s ease-in-out infinite}
@keyframes dpm-progress-slide{0%{left:-38%}55%{left:100%}100%{left:100%}}
.dpm-progress-log{max-height:110px;margin:0;padding:9px 11px;overflow:auto;border-radius:8px;background:color-mix(in srgb,CanvasText 5.5%,transparent);color:var(--dpm-muted);opacity:1;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.dpm-restart-prompt{display:grid;gap:10px;width:min(460px,100%);border:1px solid color-mix(in srgb,#20a66a 42%,transparent);border-radius:18px;padding:22px;background:Canvas;color:CanvasText;box-shadow:0 24px 80px rgba(0,0,0,.28)}.dpm-restart-prompt strong{font-size:15px}.dpm-restart-prompt>span{color:var(--dpm-muted);opacity:1;font-size:13px;line-height:1.6}.dpm-restart-prompt-actions{display:flex;gap:10px;flex-wrap:wrap}.dpm-restart-prompt-actions .dpm-button{min-height:38px;flex:1;min-width:120px}

/* ===== 独立菜单页视觉（0.9.0，克制原生风：无装饰色条、无渐变） ===== */
.dpm-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:17px 19px;border:1px solid var(--dpm-border);border-radius:16px;background:var(--dpm-raised)}
.dpm-hero-brand{display:flex;align-items:center;gap:13px;min-width:0}
.dpm-hero-icon{display:grid;place-items:center;width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,CanvasText 3%,Canvas);font-size:24px;line-height:1}
.dpm-hero-brand>div{display:grid;gap:3px;min-width:0}
.dpm-hero-brand strong{font-size:17px;letter-spacing:-.01em}
.dpm-hero-brand span{color:var(--dpm-muted);opacity:1;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpm-hero-stats{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.dpm-hero-stat{display:grid;gap:1px;min-width:62px;padding:7px 13px;border:1px solid var(--dpm-border);border-radius:11px;background:color-mix(in srgb,CanvasText 2.5%,Canvas);text-align:center}
.dpm-hero-stat dt{color:var(--dpm-muted);opacity:1;font-size:11px;font-weight:500}
.dpm-hero-stat dd{margin:0;font-size:18px;font-weight:750;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.dpm-hero-stat[data-tone=good] dd{color:#20a66a}
.dpm-hero-stat[data-tone=warn] dd{color:#c78318}
.dpm-hero-stat[data-tone=accent] dd{color:var(--dpm-accent)}
.dpm-hero-stat[data-tone=danger] dd{color:var(--dpm-danger)}
.dpm-trust[data-status=verified]{color:#1e9a5f;background:color-mix(in srgb,#20a66a 11%,Canvas)}
.dpm-trust[data-status=experimental]{color:#b8750d;background:color-mix(in srgb,#c78318 10%,Canvas)}
.dpm-trust[data-status=community]{color:#2563eb;background:color-mix(in srgb,#2563eb 9%,Canvas)}
.dpm-why{background:color-mix(in srgb,CanvasText 3%,transparent)}
.dpm-first-use ol{display:grid;gap:7px;margin:0;padding:0;list-style:none;counter-reset:dpm-step}
.dpm-first-use li{display:flex;align-items:flex-start;gap:9px}
.dpm-first-use li::before{display:grid;place-items:center;flex:none;width:19px;height:19px;margin-top:1px;border-radius:50%;background:color-mix(in srgb,CanvasText 8%,Canvas);color:var(--dpm-muted);font-size:11px;font-weight:700;counter-increment:dpm-step;content:counter(dpm-step)}
.dpm-meta span{display:inline-flex;align-items:center;min-height:21px;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,CanvasText 5%,Canvas);font-weight:500}
.dpm-recommend,.dpm-plugin{animation:dpm-rise .3s cubic-bezier(.22,.61,.36,1) both}
@keyframes dpm-rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.dpm-recommend{transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}
.dpm-recommend:hover{border-color:var(--dpm-border-strong);box-shadow:0 4px 16px color-mix(in srgb,#000 7%,transparent);transform:translateY(-1px)}
.dpm-plugin{transition:border-color .18s ease,background-color .18s ease,box-shadow .18s ease}
.dpm-plugin:hover{border-color:var(--dpm-border-strong);box-shadow:0 3px 12px color-mix(in srgb,#000 6%,transparent)}
.dpm-health-dot[data-health=healthy]{animation:dpm-breathe 2.6s ease-in-out infinite}
@keyframes dpm-breathe{0%,100%{box-shadow:0 0 0 4px color-mix(in srgb,#20a66a 11%,transparent)}50%{box-shadow:0 0 0 7px color-mix(in srgb,#20a66a 3%,transparent)}}
.dpm-update-badge{box-shadow:0 0 0 1px color-mix(in srgb,#2563eb 18%,transparent)}
.dpm-primary:hover:not(:disabled){filter:brightness(1.06)}
.dpm-category{text-transform:uppercase;letter-spacing:.05em;font-size:10.5px}
.dpm-progress-bar{background:var(--dpm-accent)}
@media(max-width:720px){.dpm-hero{flex-direction:column;align-items:stretch}.dpm-hero-stats{justify-content:flex-start}.dpm-hero-stat{flex:1}}
@media(max-width:900px){.dpm-recommend{grid-template-columns:1fr}.dpm-why,.dpm-first-use{grid-column:1}}
@media(max-width:720px){.dpm-heading .dpm-button{width:100%}.dpm-plugin{grid-template-columns:1fr}.dpm-healthy-copy,.dpm-issues{margin-left:0}.dpm-plugin-actions{justify-content:stretch}.dpm-plugin-actions button{flex:1}.dpm-notice,.dpm-operation{grid-template-columns:34px minmax(0,1fr)}.dpm-notice>.dpm-button,.dpm-operation>.dpm-button,.dpm-restart-fallback{grid-column:1/-1;grid-row:auto;width:100%}.dpm-restart-fallback{flex-direction:column}.dpm-restart-fallback .dpm-button{width:100%}}
`;
