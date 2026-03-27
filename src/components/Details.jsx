import { useState } from 'react'
import { tr, fmt, fdate, daysTo, calcHealthScore } from '../lib/utils'
import CreditScore from './CreditScore'

export default function Details({ rec, pay, profile, lang, days }) {
  const [tab, setTab] = useState('forecast')
  const [custFilter, setCustFilter] = useState('all')
  const [waModal, setWaModal] = useState(null)
  const [waTone, setWaTone] = useState('gentle')

  const tabs = [
    { id: 'forecast', label: '📊 ' + tr(lang, 'forecast') },
    { id: 'customers', label: '👥 ' + tr(lang, 'customers2') },
    { id: 'payables', label: '💸 ' + tr(lang, 'payables') },
    { id: 'credit', label: '🏦 Credit' },
  ]

  function sendWA(custName, amount) {
    const tones = {
      gentle: lang === 'hi' ? `नमस्ते! ${custName} जी, ${fmt(amount)} का भुगतान बाकी है। कृपया जल्द भेजें। 🙏` :
        lang === 'en' ? `Hi ${custName}, just a reminder — ${fmt(amount)} is due. Thanks 🙏` :
          `Hi ${custName}! ${fmt(amount)} ka payment pending hai. Please jaldi bhejo. 🙏`,
      firm: lang === 'hi' ? `${custName} जी, ${fmt(amount)} का भुगतान अभी तक नहीं मिला। आज payment करें।` :
        lang === 'en' ? `${custName}, your payment of ${fmt(amount)} is overdue. Please pay today.` :
          `${custName}, ${fmt(amount)} ab bhi pending hai. Aaj payment karo.`,
      final: lang === 'hi' ? `${custName} जी, ${fmt(amount)} बहुत समय से बाकी है। 48 घंटे में नहीं मिला तो कानूनी कार्रवाई होगी।` :
        lang === 'en' ? `${custName}, ${fmt(amount)} has been pending too long. Pay within 48 hours or legal action follows.` :
          `${custName}, ${fmt(amount)} bahut time se pending hai. 48 ghante mein nahi aaya toh legal action lenge.`,
    }
    const msg = encodeURIComponent(tones[waTone])
    window.open(`https://wa.me/?text=${msg}`, '_blank')
    setWaModal(null)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '18px 20px 0', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{tr(lang, 'details')}</div>
          <button onClick={() => exportPDF(rec, pay, lang)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#374151', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            📄 Export PDF
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              fontFamily: "'DM Sans', sans-serif",
              borderColor: tab === t.id ? '#111827' : '#E5E7EB',
              background: tab === t.id ? '#111827' : 'transparent',
              color: tab === t.id ? 'white' : '#6B7280',
            }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ height: 12 }} />
      </div>

      {tab === 'forecast' && <ForecastTab rec={rec} pay={pay} lang={lang} />}
      {tab === 'customers' && (
        <CustomersTab rec={rec} lang={lang} custFilter={custFilter} setCustFilter={setCustFilter}
          onOpenWA={(name, amt) => { setWaModal({ name, amt }); setWaTone('gentle') }} />
      )}
      {tab === 'payables' && <PayablesTab pay={pay} lang={lang} />}
      {tab === 'credit' && <CreditScore rec={rec} pay={pay} profile={profile} lang={lang} />}

      {/* WhatsApp Modal */}
      {waModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setWaModal(null)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', width: '100%', maxWidth: 390 }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>📲 {tr(lang, 'sendReminder')}</div>
            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{waModal.name} — {fmt(waModal.amt)}</div>
            {['gentle', 'firm', 'final'].map(tone => (
              <button key={tone} onClick={() => setWaTone(tone)} style={{
                width: '100%', padding: '12px 14px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                marginBottom: 8, fontFamily: "'DM Sans', sans-serif",
                border: `1.5px solid ${waTone === tone ? '#16A34A' : '#E5E7EB'}`,
                background: waTone === tone ? '#F0FDF4' : '#fff',
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{tr(lang, tone)}</div>
              </button>
            ))}
            <button onClick={() => sendWA(waModal.name, waModal.amt)} style={{ width: '100%', padding: 13, borderRadius: 8, background: '#25D366', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
              ✓ Send on WhatsApp
            </button>
            <button onClick={() => setWaModal(null)} style={{ width: '100%', padding: 11, borderRadius: 8, background: 'transparent', color: '#6B7280', fontSize: 14, border: '1px solid #E5E7EB', cursor: 'pointer', marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ForecastTab({ rec, pay, lang }) {
  if (!rec.length) return <div style={{ textAlign: 'center', padding: '32px 20px', color: '#6B7280' }}><p style={{ fontSize: 13 }}>Add receivables to see forecast</p></div>
  const today = new Date(); today.setHours(0, 0, 0, 0)

  return (
    <div style={{ padding: 16 }}>
      {[30, 60, 90].map(days => {
        const end = new Date(today); end.setDate(today.getDate() + days)
        const seen = new Set(); const months = []
        let cur = new Date(today)
        while (cur <= end) {
          const k = cur.getFullYear() + '-' + cur.getMonth()
          if (!seen.has(k)) { seen.add(k); months.push({ y: cur.getFullYear(), m: cur.getMonth(), lbl: cur.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' }) }) }
          cur.setDate(cur.getDate() + 1)
        }
        const data = months.map(mo => {
          const inA = rec.filter(r => { const d = new Date(r.date); return d.getFullYear() === mo.y && d.getMonth() === mo.m && d >= today && d <= end }).reduce((s, r) => s + Number(r.amount), 0)
          const outA = pay.filter(p => { const d = new Date(p.date); return d.getFullYear() === mo.y && d.getMonth() === mo.m && d >= today && d <= end }).reduce((s, p) => s + Number(p.amount), 0)
          return { ...mo, in: inA, out: outA, net: inA - outA }
        })
        const net = data.reduce((s, d) => s + d.net, 0)
        const mx = Math.max(...data.flatMap(d => [d.in, d.out]), 1)

        return (
          <div key={days} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                {lang === 'hi' ? `अगले ${days} दिन` : lang === 'en' ? `Next ${days} days` : `Agle ${days} din`}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: net >= 0 ? '#16A34A' : '#DC2626' }}>
                {net >= 0 ? '+' : ''}{fmt(net)}
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <LegDot color="#16A34A" label={tr(lang, 'incoming')} />
                <LegDot color="#DC2626" label={tr(lang, 'outgoing')} opacity=".6" />
              </div>
              {data.map(d => (
                <div key={d.lbl} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', width: 26, flexShrink: 0 }}>{d.lbl}</div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: Math.round(d.in / mx * 100) + '%', background: '#16A34A', borderRadius: 3 }} />
                    </div>
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: Math.round(d.out / mx * 100) + '%', background: '#DC2626', borderRadius: 3, opacity: .6 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, width: 56, textAlign: 'right', fontFamily: "'DM Mono', monospace", color: d.net >= 0 ? '#16A34A' : '#DC2626' }}>
                    {d.net >= 0 ? '+' : ''}{fmt(d.net)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function LegDot({ color, label, opacity }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, opacity: opacity || 1 }} />
      <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
    </div>
  )
}

function CustomersTab({ rec, lang, custFilter, setCustFilter, onOpenWA }) {
  const FILTERS = ['all', 'vip', 'regular', 'newc', 'atrisk', 'late', 'ontime']
  const fl = (id) => {
    const labels = { all: lang === 'hi' ? 'सब' : 'All', vip: '⭐ VIP', regular: lang === 'hi' ? '✅ नियमित' : '✅ Regular', newc: lang === 'hi' ? '🆕 नया' : '🆕 New', atrisk: lang === 'hi' ? '⚠️ जोखिम' : '⚠️ At-risk', late: lang === 'hi' ? 'अक्सर लेट' : 'Often late', ontime: lang === 'hi' ? 'समय पर' : 'On time' }
    return labels[id] || id
  }
  const filterColors = { vip: '#7C3AED', regular: '#16A34A', newc: '#2563EB', atrisk: '#DC2626', late: '#D97706', all: '#111827', ontime: '#16A34A' }

  let filtered = rec
  if (custFilter === 'vip') filtered = rec.filter(r => r.rel === 'vip')
  else if (custFilter === 'regular') filtered = rec.filter(r => r.rel === 'regular')
  else if (custFilter === 'newc') filtered = rec.filter(r => r.rel === 'newc')
  else if (custFilter === 'atrisk') filtered = rec.filter(r => r.rel === 'atrisk')
  else if (custFilter === 'late') filtered = rec.filter(r => r.pay_hist === 'often-late')
  else if (custFilter === 'ontime') filtered = rec.filter(r => r.pay_hist === 'ontime')

  const map = new Map()
  filtered.forEach(r => {
    if (!map.has(r.name)) map.set(r.name, { name: r.name, rel: r.rel, pay_hist: r.pay_hist, freq: r.freq, avg_days: r.avg_days, on_time_pct: r.on_time_pct, paid_inv: r.paid_inv, last_pay: r.last_pay, entries: [], total: 0 })
    const c = map.get(r.name); c.entries.push(r); c.total += Number(r.amount)
    if (r.avg_days != null) c.avg_days = r.avg_days
    if (r.on_time_pct != null) c.on_time_pct = r.on_time_pct
    if (r.paid_inv != null) c.paid_inv = r.paid_inv
    if (r.last_pay) c.last_pay = r.last_pay
  })
  const custs = [...map.values()].sort((a, b) => b.total - a.total)

  const relLabels = { vip: '⭐ VIP', regular: lang === 'hi' ? '✅ नियमित' : '✅ Regular', newc: lang === 'hi' ? '🆕 नया' : '🆕 New', atrisk: lang === 'hi' ? '⚠️ At-risk' : '⚠️ At-risk' }
  const payhLabels = { ontime: lang === 'hi' ? 'समय पर' : 'On time', late: lang === 'hi' ? 'कभी-कभी late' : 'Sometimes late', 'often-late': lang === 'hi' ? 'अक्सर late' : 'Often late' }
  const freqLabels = { repeat: 'Repeat', onetime: 'One-time' }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid #E5E7EB' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setCustFilter(f)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
            border: '1px solid', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
            borderColor: custFilter === f ? 'transparent' : '#E5E7EB',
            background: custFilter === f ? filterColors[f] : '#fff',
            color: custFilter === f ? 'white' : '#6B7280',
          }}>
            {fl(f)}
          </button>
        ))}
      </div>
      <div style={{ padding: '6px 16px 2px', fontSize: 11, color: '#6B7280' }}>
        {custs.length} customers · {filtered.length} invoices
      </div>
      <div style={{ padding: '10px 16px' }}>
        {custs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#6B7280' }}><p style={{ fontSize: 13 }}>No customers in this filter.</p></div>
        ) : custs.map(c => {
          const hs = calcHealthScore(c.entries, c.rel, c.on_time_pct, c.avg_days)
          const ovr = c.entries.filter(e => daysTo(e.date) < 0).length
          const next = c.entries.filter(e => daysTo(e.date) >= 0).sort((a, b) => new Date(a.date) - new Date(b.date))[0]
          const hasOverdue = c.entries.some(e => daysTo(e.date) < 0)
          const hsColor = hs.cls === 'excellent' ? '#16A34A' : hs.cls === 'good' ? '#65A30D' : hs.cls === 'fair' ? '#D97706' : '#DC2626'

          return (
            <div key={c.name} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '15px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{fmt(c.total)}</div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                <Tag cls={c.rel} label={relLabels[c.rel] || c.rel} />
                <Tag cls={c.pay_hist} label={payhLabels[c.pay_hist] || c.pay_hist} />
                <Tag cls={c.freq} label={freqLabels[c.freq] || c.freq} />
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: '#E5E7EB', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                {[
                  { v: c.entries.length, l: tr(lang, 'invoices') },
                  { v: ovr, l: tr(lang, 'overdue'), color: ovr > 0 ? '#DC2626' : '#111827' },
                  { v: next ? fdate(next.date, lang) : '—', l: tr(lang, 'nextDue') },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#F9FAFB', padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: s.color || '#111827' }}>{s.v}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Health score */}
              <div style={{ marginBottom: hasOverdue ? 10 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px' }}>{tr(lang, 'healthScore')}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: hsColor }}>{hs.score}/100 — {hs.grade}</span>
                </div>
                <div style={{ height: 7, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: hs.score + '%', background: hsColor, borderRadius: 4 }} />
                </div>
              </div>

              {/* Payment pattern */}
              {(c.on_time_pct != null || c.avg_days != null || c.paid_inv != null || c.last_pay) && (
                <div style={{ background: '#F9FAFB', borderRadius: 8, padding: 12, marginTop: 10, marginBottom: hasOverdue ? 10 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 10 }}>{tr(lang, 'payPattern')}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {c.avg_days != null && (
                      <div style={ppStat}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: c.avg_days <= -1 ? '#16A34A' : c.avg_days <= 3 ? '#111827' : '#DC2626' }}>
                          {c.avg_days < 0 ? Math.abs(c.avg_days) + 'd ' + tr(lang, 'early') : c.avg_days === 0 ? tr(lang, 'onTime') : c.avg_days + 'd ' + tr(lang, 'late_days')}
                        </div>
                        <div style={ppLbl}>{tr(lang, 'avgDays')}</div>
                      </div>
                    )}
                    {c.on_time_pct != null && (
                      <div style={ppStat}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: c.on_time_pct >= 85 ? '#16A34A' : c.on_time_pct >= 65 ? '#D97706' : '#DC2626' }}>
                          {Math.round(c.on_time_pct)}%
                        </div>
                        <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, overflow: 'hidden', marginTop: 5 }}>
                          <div style={{ height: '100%', width: Math.round(c.on_time_pct) + '%', background: c.on_time_pct >= 85 ? '#16A34A' : c.on_time_pct >= 65 ? '#D97706' : '#DC2626', borderRadius: 2 }} />
                        </div>
                        <div style={ppLbl}>{tr(lang, 'onTimePct')}</div>
                      </div>
                    )}
                    {c.paid_inv != null && (
                      <div style={ppStat}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{c.paid_inv}/{c.entries.length + c.paid_inv}</div>
                        <div style={ppLbl}>{tr(lang, 'invoicesPaid')}</div>
                      </div>
                    )}
                    {c.last_pay && (
                      <div style={ppStat}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{fdate(c.last_pay, lang)}</div>
                        <div style={ppLbl}>{tr(lang, 'lastPayment')}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* WhatsApp button */}
              {hasOverdue && (
                <button onClick={() => onOpenWA(c.name, c.entries.filter(e => daysTo(e.date) < 0).reduce((s, e) => s + Number(e.amount), 0))}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 14px', borderRadius: 20, background: '#25D366', color: 'white', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  📲 {tr(lang, 'sendReminder')}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tag({ cls, label }) {
  const styles = {
    vip: { bg: '#EDE9FE', color: '#7C3AED' },
    regular: { bg: '#DCFCE7', color: '#14532D' },
    newc: { bg: '#DBEAFE', color: '#1E40AF' },
    atrisk: { bg: '#FEE2E2', color: '#991B1B' },
    ontime: { bg: '#DCFCE7', color: '#14532D' },
    late: { bg: '#FEF3C7', color: '#92400E' },
    'often-late': { bg: '#FEE2E2', color: '#991B1B' },
    repeat: { bg: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' },
    onetime: { bg: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' },
  }
  const s = styles[cls] || styles.repeat
  return <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: s.border }}>{label}</span>
}

function PayablesTab({ pay, lang }) {
  const sorted = [...pay].sort((a, b) => new Date(a.date) - new Date(b.date))
  if (!sorted.length) return <div style={{ textAlign: 'center', padding: '32px 20px', color: '#6B7280' }}><p style={{ fontSize: 13 }}>No payables yet.</p></div>

  const total = sorted.reduce((s, p) => s + Number(p.amount), 0)
  const urg = sorted.filter(p => daysTo(p.date) <= 5).reduce((s, p) => s + Number(p.amount), 0)

  const supLabel = (r) => r === 'longterm' ? (lang === 'hi' ? '🤝 Long-term' : '🤝 Long-term') : '🆕 New'

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '12px 15px' }}>
          <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>{lang === 'hi' ? 'कुल payables' : 'Total payables'}</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: '#DC2626' }}>{fmt(total)}</div>
        </div>
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '12px 15px' }}>
          <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 3 }}>{lang === 'hi' ? 'अगले 5 दिन' : 'Next 5 days'}</div>
          <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: '#DC2626' }}>{fmt(urg)}</div>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '0 14px' }}>
        {sorted.map((p, i) => {
          const d = daysTo(p.date)
          const badge = d < 0 ? { l: lang === 'hi' ? 'ओवरड्यू!' : 'Overdue!', c: '#991B1B', bg: '#FEE2E2' } :
            d <= 5 ? { l: lang === 'hi' ? 'अर्जेंट' : 'Urgent', c: '#991B1B', bg: '#FEE2E2' } :
              d <= 14 ? { l: lang === 'hi' ? 'जल्दी भरें' : 'Pay soon', c: '#92400E', bg: '#FEF3C7' } :
                { l: lang === 'hi' ? 'रुक सकते' : 'Can wait', c: '#14532D', bg: '#DCFCE7' }
          return (
            <div key={p.id || i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '11px 0', borderBottom: i < sorted.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{supLabel(p.rel)} · {p.cat} · {fdate(p.date, lang)} · {d < 0 ? '⚠️ ' + Math.abs(d) + 'd' : d + 'd'}</div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 10, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{fmt(p.amount)}</div>
                <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginTop: 3, background: badge.bg, color: badge.c }}>{badge.l}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ppStat = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 10px' }
const ppLbl = { fontSize: 10, color: '#6B7280', marginTop: 3 }

function exportPDF(rec, pay, lang) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cut30 = new Date(today); cut30.setDate(today.getDate() + 30)
  const tIn = rec.filter(r => { const d = new Date(r.date); return d >= today && d <= cut30 }).reduce((s, r) => s + Number(r.amount), 0)
  const tOut = pay.filter(p => { const d = new Date(p.date); return d >= today && d <= cut30 }).reduce((s, p) => s + Number(p.amount), 0)
  const ovrA = rec.filter(r => daysTo(r.date) < 0).reduce((s, r) => s + Number(r.amount), 0)
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AI CFO Report</title>
  <style>body{font-family:Arial,sans-serif;color:#111;margin:0;padding:32px;font-size:13px;}h1{font-size:22px;margin-bottom:4px;}
  .sub{color:#6B7280;margin-bottom:28px;}.section{margin-bottom:24px;}h2{font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;border-bottom:1px solid #E5E7EB;padding-bottom:6px;margin-bottom:12px;}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;}.stat{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:12px;}
  .stat-l{font-size:10px;text-transform:uppercase;color:#6B7280;margin-bottom:4px;}.stat-v{font-size:20px;font-weight:700;font-family:monospace;}
  .green{color:#16A34A;}.red{color:#DC2626;}table{width:100%;border-collapse:collapse;}
  th{font-size:11px;text-transform:uppercase;color:#6B7280;text-align:left;padding:8px 10px;border-bottom:2px solid #E5E7EB;}
  td{padding:8px 10px;border-bottom:1px solid #F3F4F6;}</style></head><body>
  <h1>🧠 AI CFO Cash Flow Report</h1><div class="sub">${dateStr}</div>
  <div class="section"><h2>30-Day Summary</h2>
  <div class="grid">
  <div class="stat"><div class="stat-l">Incoming</div><div class="stat-v green">${fmt(tIn)}</div></div>
  <div class="stat"><div class="stat-l">Outgoing</div><div class="stat-v red">${fmt(tOut)}</div></div>
  <div class="stat"><div class="stat-l">Net</div><div class="stat-v ${tIn - tOut >= 0 ? 'green' : 'red'}">${tIn - tOut >= 0 ? '+' : ''}${fmt(tIn - tOut)}</div></div>
  <div class="stat"><div class="stat-l">Total receivables</div><div class="stat-v green">${fmt(rec.reduce((s, r) => s + Number(r.amount), 0))}</div></div>
  <div class="stat"><div class="stat-l">Overdue</div><div class="stat-v red">${fmt(ovrA)}</div></div>
  <div class="stat"><div class="stat-l">Total payables</div><div class="stat-v red">${fmt(pay.reduce((s, p) => s + Number(p.amount), 0))}</div></div>
  </div></div>
  <div class="section"><h2>Upcoming Payables (30 days)</h2>
  <table><tr><th>Vendor</th><th>Category</th><th>Due</th><th>Amount</th></tr>
  ${pay.filter(p => { const d = new Date(p.date); return d >= today && d <= cut30 }).sort((a, b) => new Date(a.date) - new Date(b.date)).map(p => `<tr><td>${p.name}</td><td>${p.cat}</td><td>${fdate(p.date, lang)}</td><td><strong>${fmt(p.amount)}</strong></td></tr>`).join('')}
  </table></div></body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `AI_CFO_Report_${new Date().toISOString().split('T')[0]}.html`
  a.click(); URL.revokeObjectURL(url)
}
