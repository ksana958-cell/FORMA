/* FORMA 2.1 — Dark Edition. Inspired by a black/graphite/burgundy/magenta palette.
   Palette: #1A1A1D / #4E4E50 / #6F2232 / #950740 / #C3073F.
   Visual-only layer; the original application logic and data model remain unchanged. */
:root {
  color-scheme: dark;
  --bg: #1A1A1D;
  --surface: #26262C;
  --surface-2: #303037;
  --ink: #F7F2F5;
  --muted: #aaa0ab;
  --line: #434048;
  --lime: #C3073F;
  --green: #fa8caa;
  --pale: #34242e;
  --radius: 20px;
  --shadow: 0 20px 55px #0005;
  --red: #C3073F;
  --magenta: #950740;
  --burgundy: #6F2232;
  --neutral: #4E4E50;
  --accent-hi: #ff4b7a;
  --border: #444149;
}
html { scroll-behavior: smooth; }
html, body { background:#101013; color:var(--ink); }
body { font-family: Manrope, 'Segoe UI', system-ui, sans-serif; }
body::before { content:""; position:fixed; inset:0; z-index:-1; pointer-events:none;
  background:radial-gradient(ellipse 50% 45% at 20% 0%,rgba(149,7,64,.16),transparent 70%),radial-gradient(ellipse 34% 30% at 85% 100%,rgba(111,34,50,.11),transparent 80%),#101013; }
button { transition: background-color .15s,border-color .15s,transform .15s,filter .15s; }
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible { outline:2px solid #ff5a8a; outline-offset:3px; }
button:active { transform:scale(.985); }
.app-shell { background:var(--bg); box-shadow:0 28px 100px rgba(0,0,0,.5); border-left:1px solid #ffffff06; border-right:1px solid #ffffff06; }
.topbar { background:rgba(26,26,29,.95); border-bottom:1px solid #ffffff0b; padding:calc(13px + env(safe-area-inset-top,0px)) 23px 12px; }
.brand { font-size:23px; font-weight:800; letter-spacing:-1.6px; gap:10px; }
.brand-symbol { width:35px; height:35px; transform:none; border-radius:9px; font-size:22px; color:#fff; background:linear-gradient(145deg,#ef1255,#870530); box-shadow:0 5px 25px rgba(195,7,63,.26); clip-path:polygon(0 0,100% 0,100% 86%,84% 100%,0 100%); }
.brand-dot { color:var(--accent-hi); }
.edition-tag { font-size:8px; letter-spacing:1.2px; font-weight:800; color:#d18aa1; background:#6F22322f; border:1px solid #9c345347; padding:6px 8px; border-radius:6px; align-self:center; margin-left:2px; }
.icon-button { color:#ece6ea; background:#303036; border:1px solid #49434c; border-radius:11px; }
.icon-button:hover { background:#424048; }
.demo-tag { color:#f49eb5; background:#482534; border:1px solid #703144; }
.main-scroll { padding:23px 22px calc(115px + env(safe-area-inset-bottom,0px)); }
.eyebrow { color:#a99da5; font-size:9px; font-weight:800; letter-spacing:.23em; }
.eyebrow-line { width:29px; background:var(--red); height:2px; }
.page-heading { margin:16px 0 24px; }
.overline { color:#e86a94; font-size:10px; letter-spacing:.18em; margin-bottom:10px; }
.page-heading h1 { color:#fff; font-size:clamp(35px,9vw,49px); letter-spacing:-2.5px; line-height:1.02; text-transform:uppercase; font-weight:800; }
.punct { color:#ed1657; }
.subhead { font-size:12px; color:#ad9ea8; margin-top:10px; }
.header-orbit { border:1px solid #8b2b4b7d; border-radius:18px; color:#f33c75; background:linear-gradient(150deg,#46232f,#2d222b); width:57px; height:57px; transform:rotate(-9deg); font-size:35px; box-shadow:inset 0 0 0 1px #ffffff08; }
.hero-card { background:radial-gradient(ellipse at 93% 12%,#8b123d 0%,#5e1a35 30%,transparent 62%),linear-gradient(145deg,#35252e 0%,#251d27 58%,#1d1c21 100%); border:1px solid #81394f; border-radius:24px; box-shadow:0 20px 55px #0004,0 0 38px rgba(149,7,64,.12); padding:24px 22px 22px; min-height:258px; isolation:isolate; }
.hero-card::before { width:260px; height:260px; top:-100px; right:-87px; border:1px solid #f3337438; transform:rotate(25deg); border-radius:0; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.hero-card::after { width:145px; height:145px; top:-15px; right:-46px; border:1px solid #fc4c8566; border-radius:0; transform:rotate(30deg); clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.hero-illust { right:2px; top:81px; color:transparent; font-size:0; width:96px; height:125px; transform:rotate(-9deg); opacity:.36;
  background:linear-gradient(138deg,#fe2265,#90012f); clip-path:polygon(44% 0%,69% 19%,50% 19%,100% 51%,56% 48%,72% 73%,33% 63%,8% 98%,17% 53%,0% 31%,34% 37%); filter:drop-shadow(0 0 20px #C3073F88); }
.hero-label { position:relative; z-index:2; color:#ffacc6; letter-spacing:.16em; font-size:10px; }
.hero-dot { background:var(--accent-hi); box-shadow:0 0 0 4px #c3073f22; }
.hero-card h2 { margin:22px 0 9px; max-width:270px; position:relative; z-index:2; color:#fff; font-size:29px; line-height:1.13; font-weight:800; letter-spacing:-1px; }
.hero-card p { color:#d6b5c2; font-size:12px; position:relative; z-index:2; }
.hero-button, .primary, .v2-primary { background:linear-gradient(135deg,#D50947,#A2083C); color:#fff; border:1px solid #e83a6b55; box-shadow:0 8px 21px #85062d48; border-radius:12px; font-weight:800; }
.hero-button { padding:12px 14px; }
.hero-button:hover,.primary:hover,.v2-primary:hover { filter:brightness(1.13); }
.hero-meta { color:#e3b4c5; }
.section-row { margin-top:29px; margin-bottom:13px; }
.section-row h2 { font-size:18px; letter-spacing:-.55px; }
.text-button, .manual-link, .source-link, a { color:#fa7499; }
.small-muted { color:#9d939c; }
.week-card { background:#25252a; border:1px solid #3c3840; border-radius:19px; padding:16px 10px; }
.week-day-name { color:#ac9eaa; }
.week-day-circle { border-radius:12px; background:#343238; color:#f1e5e9; }
.week-day-circle.today { outline:2px solid #C3073F; outline-offset:2px; }
.week-day-circle.scheduled::after { background:#ee3a70; }
.week-day-circle.done { background:#ac124a; color:white; }
.week-day-circle.done::after { background:#f85083; color:#1b1219; }
.plan-card { border:1px solid #403b42; border-radius:18px; background:linear-gradient(110deg,#28272c,#222126); padding:15px; }
.plan-card:hover { border-color:#8b2b4b; background:#2d2730; }
.plan-number { color:#fff; background:linear-gradient(145deg,#9e0a3a,#562134) !important; border:1px solid #b83a5a55; border-radius:11px; font-size:16px; }
.plan-info strong { color:#f8f3f6; font-size:13px; }
.plan-info small,.plan-arrow { color:#a99aa5; }
.note-card { background:#2b242b; border:1px solid #533241; border-left:3px solid #B70841; border-radius:15px; }
.note-icon { color:#fb5387; }
.note-card p { color:#bbaaaf; }
.tabbar { background:rgba(24,23,27,.97); border-top:1px solid #4e2a3b; box-shadow:0 -12px 25px #0003; backdrop-filter:blur(24px); }
.tab { color:#b2a3ad; border-radius:13px; }
.tab.active { background:linear-gradient(125deg,#A8093B,#78072D); color:#fff; box-shadow:0 7px 24px #96083945; }
.tab:not(.active):hover { color:#fff; background:#302830; }
.date-arrow { background:#302d33; border:1px solid #514550; color:#fff; }
.date-switch strong { font-size:13px; }
.nutrition-card { background:radial-gradient(ellipse at 100% 0%,#87213f,transparent 68%),linear-gradient(145deg,#38202d,#211d25); border:1px solid #713045; border-radius:23px; }
.nutrition-total small,.nutrition-total span { color:#d7b2c2; }
.nutrition-total strong { color:#fff; }
.nutrition-total strong em { color:#d9a0b4; }
.calorie-ring { background:conic-gradient(#fc3472 var(--progress,0%),#ffffff28 0); box-shadow:0 0 0 1px #ffffff12; }
.calorie-ring::before { background:#32212d; }
.ring-inner { color:#fff; }
.ring-inner span { color:#ddbdc8; }
.macro { background:#29272d; border:1px solid #443c45; border-radius:16px; }
.macro .macro-label,.macro .macro-value span { color:#b2a3ad; }
.macro .macro-value { color:#fff; }
.track { background:#4d404c; }
.meal-row { background:#29272d; border:1px solid #433b43; }
.meal-ico { background:#492436; color:#f26c96; }
.meal-label small,.meal-kcal small { color:#a99aa4; }
.del-btn { color:#ba8c9c; }
.empty-meals { background:#262329; border:1px dashed #6a4051; }
.big-add { background:linear-gradient(130deg,#ba0c43,#7c0c35); color:#fff; border:1px solid #d43c6b; box-shadow:0 12px 35px #87092b48; border-radius:18px; }
.big-add-icon { color:#fff; background:#ffffff21; border-radius:12px; }
.big-add small { color:#f2bfd0; }
.big-add-arrow { color:#ffe4ed; }
.footer-disclaimer { color:#9b909a; }
.overlay { background:rgba(7,5,9,.79); backdrop-filter:blur(6px); }
.sheet { background:#1d1b20; color:#faf6f8; border:1px solid #644053; border-bottom:0; box-shadow:0 -30px 80px #0008; border-radius:24px 24px 0 0; }
.sheet-grip { background:#644451; }
.sheet-head h2 { color:#fff; }
.close-btn { color:#f3d7e1; background:#40323e; }
.sheet-sub { color:#aea0a9; }
.secondary { border:1px solid #584350; background:#312b33; color:#f5e8ed; border-radius:12px; }
.label { color:#ccbac4; }
.field, .set-row input { background:#302d33; color:#fff; border:1px solid #5b4c59; border-radius:11px; }
.field::placeholder, .set-row input::placeholder { color:#9e909a; }
.field:focus, .set-row input:focus { border-color:#f64d80; }
.field option { background:#262329; color:#fff; }
.progress-line { background:#463443; }
.progress-line div { background:linear-gradient(90deg,#950740,#ed2060); }
.exercise-hero { background:linear-gradient(125deg,#50203a,#2b232e 75%); border:1px solid #80324c; border-radius:19px; }
.exercise-hero:before { border-color:#ed437740; }
.exercise-hero .exercise-icon { color:#ff4a84; }
.exercise-hero span { color:#f7a6c0; }
.exercise-hero h3 { color:#fff; }
.exercise-hero p { color:#cdb5c1; }
.coach-box { background:#28262b; border:1px solid #51404c; }
.coach-title { color:#f3ccda; }
.coach-index { background:#67253d; color:#ffd0df; }
.cue { background:#26332e; color:#bfe0cf; border:1px solid #3d5546; }
.cue.warn { background:#39262e; color:#f0b4c7; border:1px solid #6a3649; }
.breath { border-color:#604252; background:#2b232c; color:#ddafc2; }
.sets-title { color:#fff; }
.set-row { background:#2a272e; border:1px solid #51434f; }
.set-number, .set-row label { color:#b6a6b2; }
.set-check { background:#493b47; color:#c9aab7; }
.set-check.checked { background:#b90b46; color:#fff; }
.rest-pill { background:#472438; color:#f5c3d4; border:1px solid #79304e; }
.sheet-footer { background:linear-gradient(to bottom,transparent,#1d1b20 18%); }
.cal-weekday { color:#ae99a8; }
.cal-day { background:#302b33; color:#fff; }
.cal-day.done { background:#a5073f; }
.cal-day.today { outline-color:#ea4c7d; }
.cal-day.scheduled:not(.done)::after { background:#f54c80; }
.cal-day.selected { outline-color:#ff9abb; }
.calendar-legend { color:#baaab5; }
.calendar-month-nav button { background:#3a2d39; color:#f8dce6; }
.calendar-day-info { background:#302832; color:#e2c5d1; }
.counter { background:#362633; }
.settings-divider { border-color:#4d3b49; }
.toggle input { accent-color:#C3073F; }
.photo-preview { background:#29272c; }
.analysis-loading { color:#d7b7c6; }
.spinner { border-color:#5b3b4a; border-top-color:#fd4180; }
.toast { background:#7d0b35; border:1px solid #cb4470; color:white; }
.item-line { color:#cbb5c1; border-color:#43333f; }
.small-outline { background:#362b35; border:1px solid #78425a; color:#ffc3d6; }
.finish-mark { background:#b70945; color:#fff; }
.finish-state p { color:#c4abba; }
.finish-stat { background:#312b33; }
.finish-stat span { color:#baa6b4; }
.inline-error { color:#ff8ea8; }
/* 2.0 progress and meal-plan surfaces */
.v2-feature,.v2-chart-card,.v2-meal-card,.v2-fave { background:#28252b; border:1px solid #483a45; border-radius:17px; }
.v2-feature h3,.v2-chart-card strong,.v2-meal-top strong { color:#fff; }
.v2-eyebrow { color:#f3729b; letter-spacing:.15em; }
.v2-feature p,.v2-muted,.v2-text-note,.v2-meal-detail,.v2-chart-card .empty { color:#ae9da9; }
.v2-primary { font-size:11px; padding:10px 12px; white-space:nowrap; }
.v2-link { color:#ff85a5; }
.v2-action { background:#352b34; border:1px solid #674358; border-radius:13px; color:#f4ccd9; }
.v2-action span { color:#ff6392; }
.v2-stat { background:#392b36; border:1px solid #523749; }
.v2-stat span { color:#baa6b4; }
.v2-stat b { color:#fff; }
.v2-daytab { background:#312a33; color:#deafc2; border:1px solid #624153; }
.v2-daytab.on { background:#a8073d; color:#fff; border-color:#ed4b7c; }
.v2-pill { color:#f9bfd1; background:#57283d; }
.v2-meal-macros { color:#eeb9cc; }
.v2-daytotal { background:linear-gradient(115deg,#70213f,#38202f); color:#fff; border:1px solid #8f3a58; }
.v2-photo { background:#362c35; }
.v2-photo small { background:#472a39; color:#fff; }
.v2-photo-delete { background:#6c2140; color:#fff; }
.v2-grams { background:#352934; }
.v2-indicator { color:#d8b8c8; }
.v2-fave button { color:#ffcad9; background:#602841; }
.v2-fave .v2-del { background:#422b35; color:#f4a6bd; }
.v2-badge { background:#57273c; color:#f4bed1; }
.motion-card,.motion-video { background:#2b252e; border:1px solid #664254; }
.motion-label { color:#ffb1cb; }
.motion-pulse { background:#f83b77; box-shadow:0 0 0 3px #6f223270; }
.motion-card small,.motion-video small { color:#bda5b2; }
.motion-video video { background:#1a151b; }
/* inline SVG figures: recolor only generic shapes, retaining movement animation */
.motion-svg { border-radius:10px; filter:saturate(.9); }
.tread-belt { fill:#552e42; stroke:#a65b76; }
/* make inline graphics on progress charts readable over dark cards */
.v2-chart-card svg path { opacity:.35; }
/* accessibility: improved contrast for all secondary text */
.v2-feature p,.macro .macro-label,.small-muted,.footer-disclaimer { opacity:1; }
@media(min-width:700px) {
  body { background:#101013; }
  .app-shell { margin:22px auto; min-height:calc(100vh - 44px); border-radius:28px; overflow:clip; }
  .tabbar { bottom:22px; width:min(525px,100%); border-radius:0 0 28px 28px; }
}
@media(max-width:355px) {
  .edition-tag { display:none; }
  .hero-illust { opacity:.45; }
  .hero-card h2 { max-width:230px; }
  .v2-feature-header { align-items:flex-start; }
}
@media(prefers-reduced-motion:reduce) {
  *,*::before,*::after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
}
