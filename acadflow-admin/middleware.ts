import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/auth'

// ── Maintenance cache (module-level, resets per cold-start — fine for this) ──
let maintenanceCache: { active: boolean; fetchedAt: number } = {
  active: false,
  fetchedAt: 0,
}
const CACHE_TTL_MS = 30_000 // re-check Supabase every 30 seconds

async function isMaintenanceActive(): Promise<boolean> {
  const now = Date.now()
  if (now - maintenanceCache.fetchedAt < CACHE_TTL_MS) {
    return maintenanceCache.active
  }

  try {
    const url    = process.env.MAINTENANCE_SUPABASE_URL!
    const anon   = process.env.MAINTENANCE_SUPABASE_ANON_KEY!
    const apiUrl = `${url}/rest/v1/site_config?key=eq.maintenance_mode&select=value`

    const res  = await fetch(apiUrl, {
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      },
      // Don't use Next.js cache — always fresh
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Supabase ${res.status}`)
    const data  = await res.json()
    const active = Array.isArray(data) && data[0]?.value === 'true'

    maintenanceCache = { active, fetchedAt: now }
    return active
  } catch (err) {
    console.error('[Middleware] Maintenance check failed:', err)
    // Fail open — if DB unreachable, don't block the site
    return maintenanceCache.active
  }
}

// ── Maintenance HTML page served directly from middleware ────────────────────
function maintenancePage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Maintenance — Ruk Bsdk 🚧</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:linear-gradient(135deg,#0a0a0f 0%,#0d0f1e 40%,#0a0a0f 100%);
      font-family:system-ui,sans-serif;color:#fff;text-align:center;padding:24px;position:relative;overflow:hidden}
    .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(99,102,241,.05) 1px,transparent 1px),
      linear-gradient(90deg,rgba(99,102,241,.05) 1px,transparent 1px);background-size:40px 40px;pointer-events:none}
    .blob{position:fixed;width:600px;height:600px;border-radius:50%;
      background:radial-gradient(circle,#7c3aed,#dc2626);filter:blur(130px);opacity:.18;
      top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse 3s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:.13;transform:translate(-50%,-50%) scale(1)}50%{opacity:.25;transform:translate(-50%,-50%) scale(1.08)}}
    .card{position:relative;z-index:1;background:rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(28px);
      border-radius:28px;padding:44px 36px;max-width:440px;width:100%;
      box-shadow:0 0 100px rgba(124,58,237,.2),0 25px 60px rgba(0,0,0,.6)}
    .emoji{font-size:88px;margin-bottom:20px;display:block;
      filter:drop-shadow(0 0 30px rgba(220,38,38,.5));animation:wiggle 1.8s infinite}
    @keyframes wiggle{0%,100%{transform:rotate(-6deg) scale(1)}50%{transform:rotate(6deg) scale(1.1)}}
    h1{font-size:26px;font-weight:900;margin-bottom:6px;letter-spacing:-.5px;color:#fff}
    .sub{font-size:13px;color:rgba(255,255,255,.35);margin-bottom:14px;font-style:italic}
    .badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;
      color:#f87171;background:rgba(248,113,113,.1);border:1px solid rgba(248,113,113,.3);
      border-radius:999px;padding:5px 14px;margin-bottom:22px;letter-spacing:.5px}
    .dot{width:7px;height:7px;border-radius:50%;background:#f87171;animation:ping 1s infinite}
    @keyframes ping{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.7)}}
    .msg{font-size:15px;color:rgba(255,255,255,.75);line-height:1.65;margin-bottom:22px;
      min-height:52px;font-weight:500;transition:opacity .3s}
    .foot{font-size:11px;color:rgba(255,255,255,.18);line-height:1.6}
    .counter{font-size:12px;color:rgba(255,255,255,.25);margin-top:6px;font-mono}
    .mkc{position:fixed;bottom:10px;left:50%;transform:translateX(-50%);
      font-size:9px;color:rgba(255,255,255,.04);cursor:default;user-select:none;letter-spacing:2px}
  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="blob"></div>
  <div class="card">
    <span class="emoji" id="emoji">🛠️</span>
    <h1>Maintenance Chal Raha Hai</h1>
    <p class="sub" id="sub">System ki gaasi fat chuki hai</p>
    <div class="badge"><span class="dot"></span>SAALA BAND HAI — RUK BSDK</div>
    <p class="msg" id="msg">Thoda wait kar chutiye, theek kar rahe hain.</p>
    <p class="foot">Kab aayega? Behenchod humein bhi nahi pata. 🙃<br><span class="counter" id="cnt"></span></p>
  </div>
  <span class="mkc" id="mkc">mkc</span>
  <script>
    const emojis=['🛠️','💀','🤡','💩','😵‍💫','🥲','😤','🙃','🫠','💔','🤬','😈','🫡','🤦','🤷'];
    const subs=[
      'System ki gaand fat chuki hai',
      'Intern ne phir se lund ka kaam kiya hai',
      'Server bhosadiwala ro raha hai kone mein',
      'Neeche se leke upar tak sab chud gaya hai',
      'Sab theek ho jaayega... maa chudaye',
      'Hamara dil aur server — dono ki aisi tesi ho gayi',
      'Koi bkl nahi fixed kar pa raha',
      'Jugaad bhi lund barabar kaam nahi kar raha',
    ];
    const msgs=[
      'Hamara server maa chuda raha hai, time lagega muh mein lele. ☕',
      'Abe lode ruk ja yaar, gaand mat mara apni idhar! 🤙',
      'BKL intern ne seedha production mein tatti kar di. BC kya karu iska. 😤',
      'Server ki behen chud gayi. HR se nayi randi lene ki baat chal rahi hai. 💼',
      'Bhai saab, system gaya apni maa chudane. Thoda wait kar gaandu. 🛢️',
      'Error 404: Developer k gaand k parche udd gaye. 💀',
      'Yeh sab teri wajah se hua hai madarchod. Haan, behenchod tujhe bol raha hoon. 😡',
      'Hum code fix kar rahe hain. Gandu shaant reh thoda warn gand mein danda de duga. 🔢',
      'Chal hat bkl, server ki gaand phati hai, aur mat maar uski. 😴',
      'Database ne bhi lund pakda diya yaar. Sabse bade chutiye aur mc nikle. 💔',
      'Bhai ek kaam kar — chai bana aur aa. Tab tak hum ye lund chudap theek karte hain. 🍵',
      'Tere baap ka lund hai jo 24/7 khada rahega chut ke patthe? Ruk ja thoda. 😂',
      'System ne gaand mar li hmari. Teri randi ex ki tarah. 🫠',
      'Production pe code push karte waqt tatte kaanp rahe the. Pata tha lawde lagenge. 🤡',
      'Saale chutiye maa k lode intern ko bataya tha test kar. BC seedha prod pe maa chod di. 🤦',
      'Server bolta hai: Gaand mara lo bhai, aaram chahiye aur nahi chudna mujhe. 🥲',
      'Maa chudi padi hai bc. Hum raat ke andhere mein lund dhoondh rahe hain. 🕯️',
      'Ek chut jaisa bug fix karo toh gaand se teen aur randwe nikal aate hain. 🐍',
      'Na lund khada hua na chudai mili... na idhar ka code chal raha na server chalu hai. 🎭',
      'Main seedha bata raha hu, mujhe lund kuch samjh nahi aa raha kya hua hai, bas button daba rha hoo. 😵',
    ];
    let i=0;
    setInterval(()=>{
      i=(i+1)%emojis.length;
      const el=document.getElementById('emoji');
      const ms=document.getElementById('msg');
      const sb=document.getElementById('sub');
      el.style.opacity='0';ms.style.opacity='0';
      setTimeout(()=>{
        el.textContent=emojis[i];
        ms.textContent=msgs[i%msgs.length];
        if(sb)sb.textContent=subs[i%subs.length];
        el.style.opacity='1';ms.style.opacity='1';
      },300);
    },3500);
    // Live 'time wasted' counter
    let secs=0;
    setInterval(()=>{
      secs++;
      const m=Math.floor(secs/60),s=secs%60;
      const cnt=document.getElementById('cnt');
      if(cnt)cnt.textContent='Tune '+m+'m '+s+'s barbaad kiye \u2014 proud of u \ud83d\udc4f';
    },1000);
    // Secret double-tap on mkc
    let taps=0,timer;
    document.getElementById('mkc').addEventListener('click',()=>{
      taps++;clearTimeout(timer);
      timer=setTimeout(()=>{taps=0},500);
      if(taps>=2){
        taps=0;
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.inset = '0';
        modal.style.zIndex = '99999';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.background = 'rgba(0,0,0,0.85)';
        modal.style.backdropFilter = 'blur(12px)';
        
        modal.innerHTML = \`<div style="background:#111827;border:1px solid rgba(139,92,246,0.4);border-radius:24px;padding:32px;width:340px;box-shadow:0 0 60px rgba(139,92,246,0.3);text-align:center;font-family:system-ui,sans-serif;color:white;animation:pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
          <div style="font-size:32px;margin-bottom:12px;">🔐</div>
          <h3 style="margin:0 0 4px 0;font-size:18px;font-weight:700;">Code Daal BSDK</h3>
          <p style="margin:0 0 24px 0;font-size:12px;color:rgba(255,255,255,0.5);">Muh me leni hai toh sahi daal</p>
          <input type="password" id="maint-code-input" placeholder="Secret code la bhadwe..." autocomplete="off" style="width:100%;padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:white;font-family:monospace;margin-bottom:16px;outline:none;font-size:14px;">
          <div id="modal-error" style="color:#ef4444;font-size:12px;margin-bottom:16px;height:14px;display:none;"></div>
          <div style="display:flex;gap:10px;">
            <button id="cancel-btn" style="flex:1;padding:12px;background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);border-radius:12px;cursor:pointer;font-weight:600;transition:0.2s;">Galti Se Daba Diya</button>
            <button id="unlock-btn" style="flex:1;padding:12px;background:linear-gradient(135deg,#7c3aed,#dc2626);border:none;color:white;border-radius:12px;cursor:pointer;font-weight:600;box-shadow:0 10px 20px rgba(220,38,38,0.3);transition:0.2s;">Khol De Bhai</button>
          </div>
        </div>
        <style>@keyframes pop{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}} #cancel-btn:hover{background:rgba(255,255,255,0.05)} #unlock-btn:hover{transform:translateY(-2px);box-shadow:0 15px 25px rgba(220,38,38,0.4)}</style>\`;
        document.body.appendChild(modal);
        
        const input = document.getElementById('maint-code-input');
        input.focus();
        
        const close = () => modal.remove();
        document.getElementById('cancel-btn').onclick = close;
        
        const submit = () => {
          const code = input.value;
          if(!code) return;
          fetch('/api/admin/maintenance-unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})})
          .then(r=>r.json()).then(d=>{
            const err = document.getElementById('modal-error');
            err.style.display = 'block';
            if(d.success){
              err.style.color = '#22c55e';
              err.textContent = '✅ Theek hai bhai khul gaya! Loading...';
              input.style.border = '1px solid #22c55e';
              setTimeout(() => location.reload(), 800);
            }
            else {
              err.style.color = '#ef4444';
              err.textContent = '❌ Galat code bkl! Maa chuda.';
              input.style.border = '1px solid #ef4444';
              input.style.background = 'rgba(239,68,68,0.1)';
              input.value = '';
              input.focus();
            }
          });
        };
        
        document.getElementById('unlock-btn').onclick = submit;
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') submit(); });
      }
    });
  </script>
</body>
</html>`
  return new NextResponse(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html', 'Retry-After': '3600' },
  })
}

// ── Main middleware ───────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow API routes to pass through (so /api/admin/maintenance-unlock works)
  // Allow the maintenance-unlock endpoint through even during maintenance
  if (
    pathname.startsWith('/api/admin/maintenance') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon')
  ) {
    return NextResponse.next()
  }

  // ── Check maintenance mode (server-side, works for ALL browsers) ──
  // If user *just* unlocked it via UI, they get a 45s bypass cookie to skip the 30s DB cache.
  if (request.cookies.get('acadflow_maintenance_bypass')?.value === 'true') {
    // Cache bypassed
  } else {
    const underMaintenance = await isMaintenanceActive()
    if (underMaintenance) {
      return maintenancePage()
    }
  }

  // ── Normal auth guards ───────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticatedFromRequest(request)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  if (pathname === '/login' || pathname === '/') {
    if (isAuthenticatedFromRequest(request)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
