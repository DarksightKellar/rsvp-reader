export const CSS = `
.rsvp{--rsvp-orp:#ff4d4d;--rsvp-fg:var(--text-primary,#e8e6e1);--rsvp-mute:var(--text-secondary,#8a8f98);
  --rsvp-line:var(--border-strong,#2a2e36);--rsvp-card:var(--surface-1,#171a20);--rsvp-acc:var(--text-accent,#6aa8ff);
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--rsvp-fg);max-width:820px;margin:0 auto;-webkit-tap-highlight-color:transparent}
.rsvp *{box-sizing:border-box}
.rsvp button,.rsvp input,.rsvp textarea{font:inherit;color:inherit}
.rsvp .rsvp-stage{position:relative;height:150px;background:var(--rsvp-card);border:1px solid var(--rsvp-line);border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;cursor:pointer;user-select:none}
.rsvp .rsvp-stage::before,.rsvp .rsvp-stage::after{content:"";position:absolute;left:50%;width:2px;height:16px;background:var(--rsvp-line)}
.rsvp .rsvp-stage::before{top:18px}.rsvp .rsvp-stage::after{bottom:18px}
.rsvp .rsvp-word{display:grid;grid-template-columns:1fr auto 1fr;width:100%;font-weight:500;white-space:pre;line-height:1.1}
.rsvp .rsvp-l{text-align:right}.rsvp .rsvp-r{text-align:left}
.rsvp .rsvp-c.hl{color:var(--rsvp-orp)}
.rsvp .rsvp-hint{position:absolute;bottom:6px;right:10px;font-size:11px;color:var(--rsvp-mute)}
.rsvp .rsvp-prow{display:flex;align-items:center;gap:10px;margin-top:10px}
.rsvp .rsvp-bar{display:flex;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap}
.rsvp .rsvp-btn{background:var(--rsvp-card);border:1px solid var(--rsvp-line);border-radius:10px;padding:9px 13px;cursor:pointer;min-width:44px;line-height:1.2}
.rsvp .rsvp-btn.primary{min-width:84px}
.rsvp .rsvp-btn.primary,.rsvp .rsvp-btn[aria-pressed=true]{border-color:var(--rsvp-acc);color:var(--rsvp-acc)}
.rsvp .rsvp-grow{flex:1}
.rsvp .rsvp-meta{font-size:12px;color:var(--rsvp-mute);font-variant-numeric:tabular-nums;white-space:nowrap}
.rsvp input[type=range]{width:100%;accent-color:var(--rsvp-acc)}
.rsvp .rsvp-panel{margin-top:12px;background:var(--rsvp-card);border:1px solid var(--rsvp-line);border-radius:12px;padding:12px}
.rsvp [hidden]{display:none!important}
.rsvp .rsvp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px 18px}
.rsvp label.f{display:flex;flex-direction:column;gap:4px;font-size:13px}
.rsvp label.f span{display:flex;justify-content:space-between;color:var(--rsvp-mute)}
.rsvp label.f b{color:var(--rsvp-fg);font-weight:500}
.rsvp label.t{display:flex;align-items:center;gap:8px;font-size:13px}
.rsvp .rsvp-sub{font-size:12px;color:var(--rsvp-mute);margin:14px 0 6px}
.rsvp .rsvp-text{line-height:1.7;font-size:15px}
.rsvp .rsvp-text p{margin:0 0 .9em}
.rsvp .rsvp-w{cursor:pointer;border-radius:4px;padding:0 1px}
.rsvp .rsvp-w.on{background:var(--rsvp-acc);color:#fff}
.rsvp textarea{width:100%;min-height:180px;background:transparent;border:1px solid var(--rsvp-line);border-radius:8px;padding:10px;resize:vertical}
.rsvp .rsvp-row{display:flex;gap:8px;margin-top:8px;justify-content:flex-end}
`;
