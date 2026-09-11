import {
  getSession, getConversationHistory, getProfile, getScenario, listStudents,
} from '@/lib/api'

function sevColor(s: number | null | undefined): string {
  if (s == null) return '#94a3b8'
  if (s <= 1) return '#22c55e'
  if (s <= 2) return '#eab308'
  if (s <= 3) return '#f97316'
  return '#ef4444'
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function fmtSev(s: number | null | undefined): string {
  if (s == null) return '—'
  const labels = ['Sin riesgo', 'Leve', 'Moderado', 'Significativo', 'Grave', 'Crítico']
  return `${s.toFixed(1)} — ${labels[Math.round(s)] ?? ''}`
}

export async function buildConversationHTML(sessionId: string): Promise<string> {
  const [session, history] = await Promise.all([
    getSession(sessionId),
    getConversationHistory(sessionId),
  ])
  const [profile, scenario, students] = await Promise.all([
    getProfile(session.profile_id).catch(() => null),
    getScenario(session.scenario_id).catch(() => null),
    listStudents().catch(() => []),
  ])
  const assignedTo = session.user_id
    ? (students.find(s => s.id === session.user_id) ?? null)
    : null

  const startedAt = new Date(session.started_at)
  const endedAt = session.ended_at ? new Date(session.ended_at) : null
  const durationMin = endedAt
    ? Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
    : null
  let turnIndex = 0
  const msgs = history.map(m => {
    if (m.role === 'trainee') turnIndex++
    return { ...m, turnIndex }
  })

  const bubbles = msgs.map(m => {
    const isStudent = m.role === 'trainee'
    const sev = m.severity ?? null
    const dot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${sevColor(sev)};margin-right:6px;flex-shrink:0;margin-top:5px"></span>`
    const meta = isStudent
      ? `<span style="font-size:11px;color:#64748b">Turno ${m.turnIndex}</span>`
      : `<span style="font-size:11px;color:#64748b">NPC · sev ${sev != null ? sev.toFixed(1) : '—'}</span>`
    const bubble = isStudent
      ? `<div style="background:#3b82f6;color:#fff;padding:12px 16px;border-radius:16px 16px 4px 16px;max-width:68%;line-height:1.55;font-size:14px;white-space:pre-wrap">${escHtml(m.content)}</div>`
      : `<div style="background:#f1f5f9;color:#1e293b;padding:12px 16px;border-radius:16px 16px 16px 4px;max-width:68%;line-height:1.55;font-size:14px;white-space:pre-wrap">${escHtml(m.content)}</div>`

    return isStudent
      ? `<div style="display:flex;flex-direction:column;align-items:flex-end;margin-bottom:14px">
           <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">${meta}${dot}</div>
           ${bubble}
         </div>`
      : `<div style="display:flex;flex-direction:column;align-items:flex-start;margin-bottom:14px">
           <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">${dot}${meta}</div>
           ${bubble}
         </div>`
  }).join('')

  const beh = profile?.behavior as Record<string, unknown> | null | undefined
  const behaviorStr = beh
    ? `Rango de severidad: ${Math.max(1, Number(beh.behavior_min ?? 1))} – ${beh.behavior_max ?? '?'}`
    : null

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Sesión ${session.id.slice(0, 8)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#1e293b;padding:32px 24px}
  @media print{
    body{background:#fff;padding:0}
    .no-print{display:none!important}
    @page{margin:18mm 15mm}
  }
  h1{font-size:20px;font-weight:700;color:#1e293b}
  h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:12px}
  .chip{display:inline-block;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600}
</style>
</head>
<body>

<!-- toolbar -->
<div class="no-print" style="display:flex;justify-content:flex-end;margin-bottom:24px">
  <button onclick="window.print()"
    style="padding:8px 20px;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">
    Guardar como PDF
  </button>
</div>

<!-- header -->
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
  <div>
    <p style="font-size:12px;color:#94a3b8;margin-bottom:2px">PsicoSim · Simulación conversacional</p>
    <h1>${escHtml(profile?.name ?? 'Sesión de simulación')}</h1>
    ${scenario ? `<p style="font-size:14px;color:#64748b;margin-top:2px">${escHtml(scenario.name)}</p>` : ''}
  </div>
  <div style="text-align:right">
    <p style="font-size:11px;color:#94a3b8">ID ${session.id.slice(0, 8)}</p>
    <span class="chip" style="background:${session.status === 'active' ? '#dcfce7' : '#f1f5f9'};color:${session.status === 'active' ? '#16a34a' : '#475569'}">
      ${session.status === 'active' ? 'Activa' : session.status === 'completed' ? 'Completada' : 'Terminada'}
    </span>
  </div>
</div>

<!-- metadata grid -->
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px">
  ${metaCell('Inicio', fmtDate(session.started_at))}
  ${metaCell('Fin', fmtDate(session.ended_at))}
  ${metaCell('Duración', durationMin != null ? `${durationMin} min` : '—')}
  ${metaCell('Turnos', String(turnIndex))}
  ${metaCell('Sev. inicial', fmtSev(session.current_severity))}
  ${metaCell('Sev. final', fmtSev(session.current_severity))}
  ${assignedTo ? metaCell('Estudiante', assignedTo.full_name ?? assignedTo.email) : ''}
  ${behaviorStr ? metaCell('Comportamiento', behaviorStr) : ''}
  ${profile?.description ? metaCell('Descripción del personaje', profile.description, true) : ''}
  ${scenario?.context ? metaCell('Situación', scenario.context, true) : ''}
</div>

<!-- messages -->
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
  <h2>Conversación</h2>
  ${bubbles}
</div>

<!-- footer -->
<p style="margin-top:20px;font-size:11px;color:#94a3b8;text-align:center">
  Exportado el ${fmtDate(new Date().toISOString())}
</p>

</body>
</html>`
}

function metaCell(label: string, value: string, wide = false): string {
  return `<div${wide ? ' style="grid-column:1/-1"' : ''}>
    <p style="font-size:11px;color:#94a3b8;margin-bottom:2px">${label}</p>
    <p style="font-size:13px;font-weight:500;color:#1e293b">${escHtml(value)}</p>
  </div>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
