window.__ModuleLoader__.load({ id: "dsh-plugin-manager", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, '__esModule', { value: true });
//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let react = require("react");
react = __toESM(react);
let react_jsx_runtime = require("react/jsx-runtime");
react_jsx_runtime = __toESM(react_jsx_runtime);

//#region src/shared.ts
const DIAGNOSTICS_PATH = "/dsh-plugin-manager/api/diagnostics";
const INVENTORY_PATH = "/dsh-plugin-manager/api/plugins";
const OPERATIONS_PATH = "/dsh-plugin-manager/api/operations";
const OPERATIONS_PROGRESS_PATH = "/dsh-plugin-manager/api/operations/progress";
const RESTART_PATH = "/dsh-plugin-manager/api/restart";
const UPDATES_PATH = "/dsh-plugin-manager/api/updates";
const CATALOG_PATH = "/dsh-plugin-manager/api/catalog";

//#endregion
//#region src/client/styles.ts
const CLIENT_STYLES = `
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
.dpm-progress-track{position:relative;height:7px;overflow:hidden;border-radius:99px;background:color-mix(in srgb,CanvasText 9%,transparent)}.dpm-progress-bar{position:absolute;inset-block:0;width:38%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#20a66a);animation:dpm-progress-slide 1.25s ease-in-out infinite}
@keyframes dpm-progress-slide{0%{left:-38%}55%{left:100%}100%{left:100%}}
.dpm-progress-log{max-height:110px;margin:0;padding:9px 11px;overflow:auto;border-radius:8px;background:color-mix(in srgb,CanvasText 5.5%,transparent);color:var(--dpm-muted);opacity:1;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.dpm-restart-prompt{border-color:color-mix(in srgb,#20a66a 42%,transparent);background:color-mix(in srgb,#20a66a 7%,transparent)}.dpm-restart-prompt strong{font-size:14.5px}.dpm-restart-prompt-actions{display:flex;gap:10px;flex-wrap:wrap}.dpm-restart-prompt-actions .dpm-button{min-height:38px}
@media(max-width:900px){.dpm-recommend{grid-template-columns:1fr}.dpm-why,.dpm-first-use{grid-column:1}}
@media(max-width:720px){.dpm-heading .dpm-button{width:100%}.dpm-plugin{grid-template-columns:1fr}.dpm-healthy-copy,.dpm-issues{margin-left:0}.dpm-plugin-actions{justify-content:stretch}.dpm-plugin-actions button{flex:1}.dpm-notice,.dpm-operation{grid-template-columns:34px minmax(0,1fr)}.dpm-notice>.dpm-button,.dpm-operation>.dpm-button,.dpm-restart-fallback{grid-column:1/-1;grid-row:auto;width:100%}.dpm-restart-fallback{flex-direction:column}.dpm-restart-fallback .dpm-button{width:100%}}
`;

//#endregion
//#region src/client/index.tsx
/** 稍后重启的持久化提醒（localStorage key）。 */
const PENDING_RESTART_KEY = "dpm-pending-restart";
function readPendingRestart() {
	try {
		const raw = window.localStorage.getItem(PENDING_RESTART_KEY);
		if (!raw) return null;
		const value = JSON.parse(raw);
		return value && typeof value.target === "string" ? value : null;
	} catch {
		return null;
	}
}
function writePendingRestart(value) {
	try {
		if (value === null) window.localStorage.removeItem(PENDING_RESTART_KEY);
		else window.localStorage.setItem(PENDING_RESTART_KEY, JSON.stringify(value));
	} catch {}
}
async function readJson(response, unavailable) {
	if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) throw Error(unavailable);
	try {
		return await response.json();
	} catch {
		throw Error(unavailable);
	}
}
async function get(path, signal) {
	const response = await fetch(path, {
		cache: "no-store",
		credentials: "same-origin",
		signal
	});
	if (!response.ok) throw Error(`插件管家服务暂不可用（HTTP ${response.status}）`);
	return readJson(response, "插件后端尚未就绪，请稍后刷新重试");
}
async function load(signal) {
	const [report, inventory, updates, catalog] = await Promise.all([
		get(DIAGNOSTICS_PATH, signal),
		get(INVENTORY_PATH, signal),
		get(UPDATES_PATH, signal),
		get(CATALOG_PATH, signal)
	]);
	return {
		report,
		inventory,
		updates,
		catalog
	};
}
async function operation(action, target) {
	const response = await fetch(OPERATIONS_PATH, {
		method: "POST",
		credentials: "same-origin",
		headers: {
			"content-type": "application/json",
			"x-dsh-plugin-manager": "1"
		},
		body: JSON.stringify({
			action,
			target
		})
	});
	const payload = await readJson(response, "插件后端尚未就绪，请稍后重试");
	if (!response.ok) throw Error("message" in payload && payload.message ? payload.message : "操作失败");
	return payload;
}
async function restartDsh() {
	const response = await fetch(RESTART_PATH, {
		method: "POST",
		credentials: "same-origin",
		headers: { "x-dsh-plugin-manager": "1" }
	});
	const payload = await readJson(response, "DSH 重启服务尚未就绪，请稍后重试");
	if (!response.ok || payload.accepted !== true) throw Error(payload.message ?? "无法安排 DSH 自动重启");
}
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function probeDiagnostics() {
	try {
		const response = await fetch(DIAGNOSTICS_PATH, {
			cache: "no-store",
			credentials: "same-origin",
			signal: AbortSignal.timeout(2500)
		});
		const contentType = response.headers.get("content-type") ?? "";
		if (!response.ok || !contentType.toLowerCase().includes("application/json")) return false;
		return (await response.json()).schemaVersion === 1;
	} catch {
		return false;
	}
}
async function waitForRestart(probe = probeDiagnostics, reload = () => window.location.reload()) {
	let sawOffline = false;
	let consecutiveReady = 0;
	const deadline = Date.now() + 6e4;
	const start = Date.now();
	await delay(250);
	while (Date.now() < deadline) {
		if (await probe()) {
			if (sawOffline) {
				consecutiveReady += 1;
				if (consecutiveReady >= 2) {
					await delay(900);
					reload();
					return;
				}
			} else if (Date.now() - start >= 1e4) {
				reload();
				return;
			}
		} else {
			sawOffline = true;
			consecutiveReady = 0;
		}
		await delay(300);
	}
	if (await probe()) {
		reload();
		return;
	}
	throw Error("DSH 重启超时，请检查重启日志后重试");
}
async function copyText(value) {
	if (!navigator.clipboard) throw Error("clipboard_unavailable");
	await navigator.clipboard.writeText(value);
}
function findControl(label) {
	const normalized = label.trim();
	return [...document.querySelectorAll("button, [role='button'], [role='tab']")].find((item) => item.textContent?.trim() === normalized || item.getAttribute("aria-label")?.trim() === normalized);
}
function openControl(label) {
	const control = findControl(label);
	if (!control) return false;
	control.click();
	return true;
}
function launchTargetAvailable(entry) {
	return entry.launch?.kind !== "settings" || Boolean(findControl(entry.launch.target));
}
const trust = (status) => status === "verified" ? "已验证" : status === "community" ? "社区插件" : "实验性";
const actionVerb = (action) => action === "add" ? "安装" : action === "update" ? "升级" : "卸载";
function cardState(entry, installed, op, launchReady = true) {
	const matches = op.status === "running" ? op.target === entry.installSpec || op.target === entry.packageName : op.status === "error" ? op.target === entry.installSpec || op.target === entry.packageName : op.status === "done" ? op.result.target === entry.installSpec || op.result.target === entry.packageName : false;
	if (op.status === "running" && op.action === "add" && matches) return "installing";
	if (op.status === "done" && matches && op.result.success && op.result.restartRequired) return "pending";
	if (op.status === "error" && op.action === "add" && matches || op.status === "done" && op.result.action === "add" && matches && !op.result.success) return "error";
	if (installed && !launchReady) return "unavailable";
	return installed ? "installed" : "available";
}
function ConfirmationDialog({ confirmation, profileName, onCancel, onConfirm }) {
	const dialogRef = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		const previous = document.activeElement;
		const returnFocusKey = confirmation.returnFocusKey;
		const frame = requestAnimationFrame(() => {
			dialogRef.current?.querySelector("[data-confirm]")?.focus();
		});
		return () => {
			cancelAnimationFrame(frame);
			requestAnimationFrame(() => {
				(returnFocusKey ? [...document.querySelectorAll("[data-dpm-focus]")].find((element) => element.dataset.dpmFocus === returnFocusKey) : previous)?.focus();
			});
		};
	}, []);
	const handleKeyDown = (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			onCancel();
			return;
		}
		if (event.key !== "Tab") return;
		const controls = [...dialogRef.current?.querySelectorAll("button:not([disabled]), a[href], summary, input:not([disabled])") ?? []];
		const first = controls[0];
		const last = controls.at(-1);
		if (!first || !last) return;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};
	const destructive = confirmation.action === "remove";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dpm-dialog-layer",
		onMouseDown: (event) => {
			if (event.target === event.currentTarget) onCancel();
		},
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			ref: dialogRef,
			className: "dpm-dialog",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "dpm-dialog-title",
			onKeyDown: handleKeyDown,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dpm-dialog-head",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: "dpm-dialog-eyebrow",
						children: [
							actionVerb(confirmation.action),
							"到 Profile · ",
							profileName
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h4", {
						id: "dpm-dialog-title",
						children: [
							actionVerb(confirmation.action),
							" ",
							confirmation.displayName
						]
					})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "dpm-dialog-close",
						"aria-label": "取消并关闭",
						onClick: onCancel,
						children: "×"
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dpm-dialog-intro",
					children: "管家将执行标准 DSH 插件命令。成功后自动安全重启 DSH，页面会自行恢复。"
				}),
				confirmation.entry ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dpm-dialog-facts",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: "版本" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: ["v", confirmation.entry.version] })] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: "可信状态" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: trust(confirmation.entry.verificationStatus) })] }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: "兼容范围" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: confirmation.entry.dshCompatibility })] })
					]
				}) : null,
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dpm-command-preview",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "安装来源" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: confirmation.target })]
				}),
				confirmation.entry?.permissions.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
					className: "dpm-dialog-impact",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [
						"安装后可能使用的权限（",
						confirmation.entry.permissions.length,
						"）"
					] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: confirmation.entry.permissions.map((permission) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: permission }, permission)) })]
				}) : null,
				confirmation.entry?.verificationStatus === "experimental" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "dpm-dialog-warning",
					children: "这是实验性插件。建议先确认来源与影响范围，再安装到常用 Profile。"
				}) : null,
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dpm-dialog-actions",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "dpm-button",
						onClick: onCancel,
						children: "取消"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						"data-confirm": true,
						className: destructive ? "dpm-confirm-danger" : "dpm-primary",
						onClick: onConfirm,
						children: destructive ? "确认卸载并重启" : actionVerb(confirmation.action) + "并重启"
					})]
				})
			]
		})
	});
}
function RestartOverlay({ action }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dpm-restarting-layer",
		role: "status",
		"aria-live": "assertive",
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dpm-restarting-card",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
				className: "dpm-spinner",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [actionVerb(action), "已完成，正在重启 DSH"] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "无需执行命令。服务恢复后本页面会自动刷新。" })] })]
		})
	});
}
/** 从 pnpm 实时输出推导当前阶段，驱动进度条与阶段文案。 */
function progressPhase(output) {
	if (!output) return {
		label: "准备中…",
		detail: ""
	};
	const lines = output.split("\n").filter((line) => line.trim().length > 0);
	const last = lines[lines.length - 1] ?? "";
	if (/Done in \d/.test(last)) return {
		label: "完成",
		detail: last.trim()
	};
	if (/Progress: resolved \d+/.test(last)) {
		const downloaded = /downloaded (\d+)/.exec(last)?.[1];
		const added = /added (\d+)/.exec(last)?.[1];
		if (added && added !== "0") return {
			label: "安装中…",
			detail: last.trim()
		};
		if (downloaded && downloaded !== "0") return {
			label: "下载中…",
			detail: last.trim()
		};
		return {
			label: "解析依赖…",
			detail: last.trim()
		};
	}
	if (/Packages: \+/.test(output)) return {
		label: "应用变更…",
		detail: last.trim()
	};
	return {
		label: "执行中…",
		detail: last.trim()
	};
}
function OperationProgressCard({ label, progress }) {
	const phase = progressPhase(progress?.output ?? "");
	const logLines = (progress?.output ?? "").split("\n").map((line) => line.trim()).filter((line) => line.length > 0).slice(-5);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		className: "dpm-operation dpm-progress-card",
		"data-status": "running",
		role: "status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-progress-head",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dpm-spinner",
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [label, "…"] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dpm-progress-phase",
					children: phase.label
				})] })]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dpm-progress-track",
				role: "progressbar",
				"aria-label": label,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dpm-progress-bar" })
			}),
			logLines.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
				className: "dpm-progress-log",
				children: logLines.join("\n")
			}) : null
		]
	});
}
function RestartPromptCard({ action, displayName, onNow, onLater }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		className: "dpm-operation dpm-restart-prompt",
		"data-status": "success",
		role: "status",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [actionVerb(action), "完成，需要重启 DSH 才能生效"] }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "新版本已写入 Profile，但正在运行的 DSH 仍在使用旧代码。重启后新版本才会加载，服务恢复后页面会自动刷新。" }),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-restart-prompt-actions",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "dpm-button",
					onClick: onNow,
					children: "立即重启"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "dpm-button",
					onClick: onLater,
					children: "稍后重启"
				})]
			})
		]
	});
}
function Installed({ plugin, update, busy, run }) {
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
		className: "dpm-plugin",
		"data-health": plugin.health,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-plugin-main",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dpm-health-dot",
						"data-health": plugin.health
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dpm-plugin-copy",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dpm-plugin-title",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: plugin.name }),
									plugin.version ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dpm-version",
										children: ["v", plugin.version]
									}) : null,
									plugin.bundle ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dpm-kind",
										children: "Bundle"
									}) : null,
									plugin.client ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dpm-kind",
										children: "Client"
									}) : null,
									update?.state === "available" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dpm-update-badge",
										children: ["可升级至 ", update.latestVersion]
									}) : null
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
								className: "dpm-spec",
								children: plugin.spec
							}),
							update ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dpm-update-copy",
								"data-state": update.state,
								children: update.message
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dpm-health-label",
						"data-health": plugin.health,
						children: plugin.health === "healthy" ? "正常" : plugin.health === "warning" ? "提醒" : "异常"
					})
				]
			}),
			plugin.issues.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
				className: "dpm-issues",
				children: plugin.issues.map((issue) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
					"data-severity": issue.severity,
					children: issue.message
				}, issue.code))
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dpm-healthy-copy",
				children: "结构检查通过。"
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-plugin-actions",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					"data-dpm-focus": "update-" + plugin.name,
					disabled: busy || !plugin.canUpdate,
					onClick: () => run("update", plugin.name, plugin.name),
					children: "升级"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "dpm-danger",
					"data-dpm-focus": "remove-" + plugin.name,
					disabled: busy || !plugin.canRemove,
					onClick: () => run("remove", plugin.name, plugin.name),
					children: "卸载"
				})]
			})
		]
	});
}
function Recommended({ entry, state, busy, install, launch }) {
	const stateLabel = state === "installing" ? "安装中" : state === "pending" ? "准备重启" : state === "installed" ? entry.launch ? "已启用" : "已安装" : state === "unavailable" ? "入口未加载" : state === "error" ? "安装失败" : "未安装", installed = state === "installed" || state === "unavailable", canLaunch = installed && entry.launch !== null, primaryLabel = state === "installing" ? "正在安装…" : state === "pending" ? "正在完成…" : state === "unavailable" ? "查看处理办法" : installed ? entry.launch?.label ?? "已安装" : state === "error" ? "重试安装" : "安装并重启";
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
		className: "dpm-recommend",
		"data-state": state,
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-recommend-head",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dpm-recommend-title",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dpm-category",
						children: entry.category
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h5", { children: entry.name })]
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dpm-badges",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dpm-trust",
						"data-status": entry.verificationStatus,
						children: trust(entry.verificationStatus)
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dpm-install-status",
						"data-state": state,
						children: stateLabel
					})]
				})]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dpm-summary",
				children: entry.summary
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-why",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "为什么推荐" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: entry.recommendation })]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-first-use",
				id: "dpm-first-use-" + entry.id,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "第一次怎么用" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", { children: entry.firstUse.map((step) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: step }, step)) })]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-meta",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["v", entry.version] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["DSH ", entry.dshCompatibility] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: entry.license }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: entry.verifiedAt ? "验证 " + entry.verifiedAt : "尚未验证" })
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
				className: "dpm-impact",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [
					"权限与影响（",
					entry.permissions.length,
					"）"
				] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: entry.permissions.map((permission) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: permission }, permission)) })]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dpm-recommend-actions",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
					href: entry.repository,
					target: "_blank",
					rel: "noreferrer",
					children: "查看源码"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "dpm-primary",
					"data-dpm-focus": "catalog-" + entry.id,
					"data-state": state,
					"aria-describedby": "dpm-first-use-" + entry.id,
					disabled: busy || state === "installing" || state === "pending" || installed && !canLaunch,
					onClick: () => canLaunch ? launch(entry) : install(entry),
					children: primaryLabel
				})]
			})
		]
	});
}
function PluginManagerTab() {
	const [revision, setRevision] = (0, react.useState)(0);
	const [page, setPage] = (0, react.useState)({ status: "loading" });
	const [target, setTarget] = (0, react.useState)("");
	const [op, setOp] = (0, react.useState)({ status: "idle" });
	const [progress, setProgress] = (0, react.useState)(null);
	const [guide, setGuide] = (0, react.useState)(null);
	const [confirmation, setConfirmation] = (0, react.useState)(null);
	const [restart, setRestart] = (0, react.useState)({ status: "idle" });
	const [restartPrompt, setRestartPrompt] = (0, react.useState)(null);
	const [pendingRestart, setPendingRestart] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		setPendingRestart(readPendingRestart());
	}, []);
	(0, react.useEffect)(() => {
		if (op.status !== "running") return;
		let cancelled = false;
		let timer = 0;
		const poll = async () => {
			try {
				const response = await fetch(OPERATIONS_PROGRESS_PATH, {
					cache: "no-store",
					credentials: "same-origin"
				});
				if (response.ok) setProgress(await response.json());
			} catch {}
			if (!cancelled) timer = window.setTimeout(poll, 500);
		};
		poll();
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
			setProgress(null);
		};
	}, [op.status, op.status === "running" ? op.target : ""]);
	(0, react.useEffect)(() => {
		const controller = new AbortController();
		setPage({ status: "loading" });
		load(controller.signal).then((value) => {
			if (!controller.signal.aborted) setPage({
				status: "ready",
				...value
			});
		}, () => {
			if (!controller.signal.aborted) setPage({
				status: "error",
				message: "无法读取插件目录或 Profile 状态。"
			});
		});
		return () => controller.abort();
	}, [revision]);
	const refresh = (0, react.useCallback)(() => setRevision((value) => value + 1), []);
	const busy = op.status === "running" || restart.status === "restarting";
	const requestOperation = (0, react.useCallback)((action, raw, displayName, entry) => {
		const value = raw.trim();
		if (!value) {
			setOp({
				status: "error",
				action,
				target: raw,
				message: "请输入 DSH 兼容插件地址。"
			});
			return;
		}
		setConfirmation({
			action,
			target: value,
			displayName: displayName ?? value,
			...entry ? { entry } : {},
			returnFocusKey: entry ? "catalog-" + entry.id : action === "add" ? "advanced-add" : action + "-" + value
		});
	}, []);
	const execute = (0, react.useCallback)(async (request) => {
		setConfirmation(null);
		setGuide(null);
		const label = actionVerb(request.action) + " " + request.displayName;
		setOp({
			status: "running",
			action: request.action,
			target: request.target,
			label
		});
		try {
			const result = await operation(request.action, request.target);
			setOp({
				status: "done",
				result
			});
			if (!result.success) return;
			setTarget("");
			if (!result.restartRequired) {
				refresh();
				return;
			}
			setRestartPrompt({
				action: request.action,
				target: request.target,
				displayName: request.displayName
			});
		} catch (error) {
			setOp({
				status: "error",
				action: request.action,
				target: request.target,
				message: error instanceof Error ? error.message : "操作失败"
			});
		}
	}, [refresh]);
	const runRestart = (0, react.useCallback)(async (action, target$1) => {
		setRestart({
			status: "restarting",
			action
		});
		try {
			await restartDsh();
			await waitForRestart();
		} catch (error) {
			setRestart({
				status: "failed",
				action,
				message: error instanceof Error ? error.message : "DSH 自动重启失败"
			});
			refresh();
		}
	}, [refresh]);
	const confirmRestart = (0, react.useCallback)(async (prompt) => {
		setRestartPrompt(null);
		setPendingRestart(null);
		writePendingRestart(null);
		await runRestart(prompt.action, prompt.target);
	}, [runRestart]);
	const deferRestart = (0, react.useCallback)((prompt) => {
		const pending = {
			action: prompt.action,
			target: prompt.target,
			displayName: prompt.displayName,
			at: (/* @__PURE__ */ new Date()).toISOString()
		};
		writePendingRestart(pending);
		setPendingRestart(pending);
		setRestartPrompt(null);
		refresh();
	}, [refresh]);
	const dismissPendingRestart = (0, react.useCallback)(() => {
		writePendingRestart(null);
		setPendingRestart(null);
	}, []);
	const launch = (0, react.useCallback)(async (entry) => {
		const action = entry.launch;
		if (!action) {
			setGuide({
				status: "warning",
				message: "该插件没有快捷入口，请按“第一次怎么用”操作。"
			});
			return;
		}
		if (action.kind === "settings") {
			if (!openControl(action.target)) setGuide({
				status: "warning",
				message: entry.name + "已经安装，但当前 DSH 没有注册“" + action.target + "”入口。它可能尚未兼容当前 DSH 版本，或客户端部分加载失败。",
				actionLabel: "打开插件列表",
				actionTarget: "插件列表"
			});
			return;
		}
		try {
			await copyText(action.target);
			setGuide({
				status: "success",
				message: "示例提示已复制。关闭设置后粘贴到新会话即可试用。"
			});
		} catch {
			setGuide({
				status: "error",
				message: "浏览器不允许写入剪贴板，请按“第一次怎么用”手动输入。"
			});
		}
	}, []);
	const copyRestart = (0, react.useCallback)(async () => {
		try {
			await copyText("dsh web");
			setGuide({
				status: "success",
				message: "已复制 dsh web。请在命令行停止旧进程后重新运行。"
			});
		} catch {
			setGuide({
				status: "error",
				message: "请在命令行停止旧进程后运行：dsh web"
			});
		}
	}, []);
	const retryRestart = (0, react.useCallback)(async (action) => {
		await runRestart(action, "");
	}, [runRestart]);
	const installed = page.status === "ready" ? new Set(page.inventory.plugins.map((plugin) => plugin.name)) : /* @__PURE__ */ new Set(), updates = page.status === "ready" ? new Map(page.updates.updates.map((update) => [update.name, update])) : /* @__PURE__ */ new Map(), plugins = page.status === "ready" ? page.inventory.plugins.filter((plugin) => !plugin.manager) : [], manager = page.status === "ready" ? page.inventory.plugins.find((plugin) => plugin.manager) : void 0;
	const summary = (0, react.useMemo)(() => plugins.reduce((current, plugin) => ({
		...current,
		[plugin.health]: current[plugin.health] + 1
	}), {
		healthy: 0,
		warning: 0,
		error: 0
	}), [plugins]);
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
		className: "dpm-root",
		"aria-busy": page.status === "loading" || busy,
		children: [
			confirmation && page.status === "ready" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmationDialog, {
				confirmation,
				profileName: page.inventory.profileName,
				onCancel: () => setConfirmation(null),
				onConfirm: () => void execute(confirmation)
			}) : null,
			restart.status === "restarting" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RestartOverlay, { action: restart.action }) : null,
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
				className: "dpm-heading",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: "插件推荐" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "从发现到第一次成功使用，再管理升级、卸载和结构健康。" })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "dpm-button",
					onClick: refresh,
					disabled: busy,
					children: "刷新目录"
				})]
			}),
			guide ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dpm-notice",
				"data-status": guide.status,
				role: guide.status === "error" ? "alert" : "status",
				"aria-live": "polite",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: guide.message }), guide.actionLabel && guide.actionTarget ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					className: "dpm-button",
					onClick: () => openControl(guide.actionTarget ?? ""),
					children: guide.actionLabel
				}) : null]
			}) : null,
			pendingRestart ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dpm-notice",
				"data-status": "warning",
				role: "status",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
						pendingRestart.displayName,
						" 已",
						actionVerb(pendingRestart.action),
						"，重启 DSH 后才会生效。"
					] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "dpm-button",
						onClick: () => void confirmRestart({
							action: pendingRestart.action,
							target: pendingRestart.target,
							displayName: pendingRestart.displayName
						}),
						children: "立即重启"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						className: "dpm-button",
						onClick: dismissPendingRestart,
						children: "知道了"
					})
				]
			}) : null,
			restartPrompt ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RestartPromptCard, {
				action: restartPrompt.action,
				displayName: restartPrompt.displayName,
				onNow: () => void confirmRestart(restartPrompt),
				onLater: () => deferRestart(restartPrompt)
			}) : null,
			restart.status === "failed" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dpm-operation",
				"data-status": "error",
				role: "alert",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "插件已更新，但自动重启没有完成" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: restart.message }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dpm-restart-fallback",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: "dpm-button",
							onClick: () => void retryRestart(restart.action),
							children: "重试自动重启"
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							className: "dpm-button",
							onClick: () => void copyRestart(),
							children: "复制备用重启命令"
						})]
					})
				]
			}) : null,
			op.status === "running" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OperationProgressCard, {
				label: op.label,
				progress
			}) : null,
			op.status === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dpm-operation",
				"data-status": "error",
				role: "alert",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "操作失败" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: op.message })]
			}) : null,
			op.status === "done" && (!op.result.success || restart.status === "failed") ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				className: "dpm-operation",
				"data-status": op.result.success ? "success" : "error",
				role: op.result.success ? "status" : "alert",
				"aria-live": "polite",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: op.result.success ? "Profile 已更新" : "命令失败" }), !op.result.success && op.result.output ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: "查看命令输出" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", { children: op.result.output })] }) : null]
			}) : null,
			page.status === "loading" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dpm-state",
				children: "正在加载推荐目录…"
			}) : null,
			page.status === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dpm-error",
				role: "alert",
				children: page.message
			}) : null,
			page.status === "ready" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					className: "dpm-panel",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dpm-section-heading",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h4", { children: "推荐插件" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
							page.catalog.message,
							" · 来源：",
							page.catalog.source === "remote" ? "远程目录" : page.catalog.source === "cache" ? "本地缓存" : "内置目录",
							page.catalog.stale ? "（已过期）" : ""
						] })] })
					}), page.catalog.entries.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "dpm-recommend-list",
						children: page.catalog.entries.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Recommended, {
							entry,
							state: cardState(entry, installed.has(entry.packageName), op, launchTargetAvailable(entry)),
							busy,
							install: (item) => requestOperation("add", item.installSpec, item.name, item),
							launch: (item) => void launch(item)
						}, entry.id))
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dpm-empty",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "首批推荐插件正在验证" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "目录不会使用普通 npm 包凑数。完成标准 CLI 安装、DSH 启动和结构体检后才会出现在这里。" })]
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
					className: "dpm-panel dpm-installed-section",
					open: summary.error > 0 || summary.warning > 0 ? true : void 0,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
						className: "dpm-installed-summary",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "已安装插件" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", { children: ["Profile：", page.inventory.profileName] })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							className: "dpm-health-summary",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									"data-health": "healthy",
									children: ["正常 ", summary.healthy]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									"data-health": "warning",
									children: ["提醒 ", summary.warning]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									"data-health": "error",
									children: ["异常 ", summary.error]
								})
							]
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dpm-installed-body",
						children: plugins.length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							className: "dpm-plugin-list",
							children: plugins.map((plugin) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Installed, {
								plugin,
								update: updates.get(plugin.name),
								busy,
								run: (action, value, displayName) => requestOperation(action, value, displayName)
							}, plugin.name))
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dpm-empty",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "还没有业务插件" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "从上方推荐中心安装后，会在这里进行升级、卸载和体检。" })]
						})
					})]
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
					className: "dpm-advanced",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: "高级安装" }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "仅安装你信任的 DSH 兼容插件。支持 npm 固定版本、GitHub 仓库或本地 .tgz。" }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dpm-install-row",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								htmlFor: "dpm-install-target",
								children: "插件安装地址"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								id: "dpm-install-target",
								value: target,
								onChange: (event) => setTarget(event.target.value),
								placeholder: "例如 @scope/plugin@1.2.3 或 D:\\plugins\\plugin.tgz"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "dpm-primary",
								"data-dpm-focus": "advanced-add",
								disabled: busy || !target.trim(),
								onClick: () => requestOperation("add", target),
								children: "安装并重启"
							})] })]
						})
					]
				}),
				manager ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
					className: "dpm-about",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: "关于插件管家" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
						manager.name,
						" v",
						manager.version,
						" ·",
						" ",
						manager.health === "healthy" ? "运行正常" : "需要检查"
					] })]
				}) : null,
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
					className: "dpm-diagnostics",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "运行环境自检" }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
						"通过 ",
						page.report.summary.pass,
						" · 提醒",
						" ",
						page.report.summary.warning,
						" · 失败 ",
						page.report.summary.fail
					] })] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
						className: "dpm-check-list",
						children: page.report.checks.map((check) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
							className: "dpm-check",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dpm-dot",
									"data-status": check.status
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dpm-label",
									children: check.label
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dpm-message",
									children: check.message
								})
							]
						}, check.id))
					})]
				})
			] }) : null
		]
	});
}
const name = "dsh-plugin-manager-client";
const inject = ["slots"];
function apply(ctx) {
	ctx.effect(() => {
		const style = document.createElement("style");
		style.dataset.plugin = "dsh-plugin-manager";
		style.textContent = CLIENT_STYLES;
		document.head.append(style);
		return () => style.remove();
	}, "dsh-plugin-manager: styles");
	ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register({
		name: "settings.plugins.tab",
		id: "manager",
		order: 20,
		label: "插件推荐"
	}, PluginManagerTab));
}
var client_default = {
	name,
	inject,
	apply
};

//#endregion
exports.PluginManagerTab = PluginManagerTab;
exports.apply = apply;
exports.default = client_default;
exports.inject = inject;
exports.name = name;
exports.waitForRestart = waitForRestart;
return module.exports; } });
//# sourceMappingURL=client.js.map