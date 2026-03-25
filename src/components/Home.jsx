import { useState } from 'react'
import { tr, fmt, fdate, daysTo } from '../lib/utils'

export default function Home({ rec, pay, profile, lang, days, setDays, onSignOut }) {
  const biz = profile?.biz_name || 'My Business'
  const h = new Date().getHours()
  const gi = h < 12 ? 0 : h < 17 ? 1 : 2
  const greet = tr(lang, 'greet').split(',')[gi] || tr(lang, 'greet')

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cut = new Date(today); cut.setDate(today.getDate() + days)

  const fRec = rec.filter(r => { const d = new Date(r.date); return d >= today && d <= cut })
  const fPay = pay.filter(p => { const d = new Date(p.date); return d >= today && d <= cut })
  const tIn = fRec.reduce((s, r) => s + Number(r.amount), 0)
  const tOut = fPay.reduce((s, p) => s + Number(p.amount), 0)
  const net = tIn - tOut

  const netColor = net > 0 ? '#16A34A' : net < 0 ? '#DC2626' : '#D97706'
  const netSub = net > 0 ? tr(lang, 'positive') : net < 0 ? tr(lang, 'gap') : tr(lang, 'even')

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>
            {Array.isArray(tr(lang, 'greet')) ? tr(lang, 'greet')[gi] : tr(lang, 'greet').split(',')[gi] || 'Namaskar 🙏'}
          </div>
          <div style={{ fontSize: 21, fontWeight: 600 }}>{biz}</div>
        </div>
        <button onClick={onSignOut} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#6B7280', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>

      {/* 3 Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '16px 16px 0' }}>
        <NumCard label={tr(lang, 'incoming')} value={fmt(tIn)} valueColor="#16A34A"
          sub={[...new Set(fRec.map(r => r.name))].length + ' ' + tr(lang, 'customers')} />
        <NumCard label={tr(lang, 'outgoing')} value={fmt(tOut)} valueColor="#DC2626"
          sub={fPay.length + ' ' + tr(lang, 'payments')} />
        <div style={{ gridColumn: '1/-1', background: '#111827', borderRadius: 14, padding: '14px 15px', border: '1px solid #111827' }}>
          <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6, color: 'rgba(255,255,255,.5)' }}>
            {tr(lang, 'netdays', { d: days })}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: '#fff', lineHeight: 1 }}>
            {(net >= 0 ? '+' : '') + fmt(net)}
          </div>
          <div style={{ fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,.45)' }}>{netSub}</div>
        </div>
      </div>

      {/* Forecast tabs */}
      <div style={{ display: 'flex', gap: 5, padding: '12px 16px 0' }}>
        {[30, 60, 90].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            flex: 1, padding: '6px', textAlign: 'center', fontSize: 12, fontWeight: 500,
            borderRadius: 20, border: '1px solid', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            borderColor: days === d ? '#16A34A' : '#E5E7EB',
            background: days === d ? '#16A34A' : '#F9FAFB',
            color: days === d ? 'white' : '#6B7280',
          }}>
            {d}d
          </button>
        ))}
      </div>

      {/* Do This Now */}
      <div style={{ padding: '14px 16px 4px' }}>
        <ActionCard rec={rec} pay={pay} lang={lang} days={days} />
      </div>

      {/* Alert */}
      <div style={{ padding: '0 16px' }}>
        <AlertLine rec={rec} pay={pay} lang={lang} />
      </div>

      <div style={{ height: 16 }} />
    </div>
  )
}

function NumCard({ label, value, valueColor, sub }) {
  return (
    <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '14px 15px' }}>
      <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6, color: '#6B7280' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: '#6B7280' }}>{sub}</div>
    </div>
  )
}

function ActionCard({ rec, pay, lang, days }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const ovr = rec.filter(r => daysTo(r.date) < 0).sort((a, b) => b.amount - a.amount)
  if (ovr.length) {
    const o = ovr[0], d = Math.abs(daysTo(o.date))
    const extra = o.rel === 'atrisk' ? (lang === 'hi' ? ' ⚠️ यह एट-रिस्क कस्टमर है।' : lang === 'en' ? ' ⚠️ At-risk customer.' : ' ⚠️ At-risk customer hai.') :
      o.rel === 'vip' ? (lang === 'hi' ? ' VIP हैं — विनम्रता से बात करें।' : lang === 'en' ? ' VIP customer — be polite.' : ' VIP hai — politely follow up.') : ''
    return <Card type="urgent" eyebrow={tr(lang, 'doNow')}
      title={lang === 'hi' ? `${o.name} को आज call करें` : lang === 'en' ? `Call ${o.name} today` : `${o.name} ko aaj call karo`}
      body={`${fmt(o.amount)} — ${d} ${lang === 'hi' ? 'दिन से overdue' : lang === 'en' ? 'days overdue' : 'din se overdue'}.${extra}`} />
  }

  const urgP = pay.filter(p => daysTo(p.date) <= 3 && daysTo(p.date) >= 0).sort((a, b) => new Date(a.date) - new Date(b.date))
  if (urgP.length) {
    const u = urgP[0]
    const extra = u.rel === 'longterm' ? (lang === 'hi' ? ' Long-term vendor — देरी न करें।' : lang === 'en' ? ' Long-term vendor — don\'t delay.' : ' Long-term vendor — delay mat karo.') : ''
    return <Card type="urgent" eyebrow={tr(lang, 'doNow')}
      title={lang === 'hi' ? `${u.name} का payment करें` : lang === 'en' ? `Pay ${u.name}` : `${u.name} ka payment karo`}
      body={`${fmt(u.amount)} — ${daysTo(u.date) === 0 ? (lang === 'hi' ? 'आज due!' : 'due today!') : daysTo(u.date) + (lang === 'hi' ? ' दिन में due' : lang === 'en' ? ' days' : ' din mein due')}.${extra}`} />
  }

  const lateC = rec.filter(r => r.pay_hist === 'often-late' && daysTo(r.date) >= 0 && daysTo(r.date) <= 10).sort((a, b) => b.amount - a.amount)
  if (lateC.length) {
    const l2 = lateC[0]
    return <Card type="warn" eyebrow={tr(lang, 'thisWeek')}
      title={lang === 'hi' ? `${l2.name} को reminder भेजें` : lang === 'en' ? `Send reminder to ${l2.name}` : `${l2.name} ko reminder bhejo`}
      body={`${fmt(l2.amount)} — ${daysTo(l2.date)} ${lang === 'hi' ? 'दिन में due — यह often late pay करता है।' : lang === 'en' ? 'days — often pays late.' : 'din mein due — often late pay karta hai.'}`} />
  }

  const cut = new Date(today); cut.setDate(today.getDate() + days)
  const tIn = rec.filter(r => { const d2 = new Date(r.date); return d2 >= today && d2 <= cut }).reduce((s, r) => s + Number(r.amount), 0)
  const tOut = pay.filter(p => { const d2 = new Date(p.date); return d2 >= today && d2 <= cut }).reduce((s, p) => s + Number(p.amount), 0)
  if (tOut > tIn && tOut > 0) {
    return <Card type="warn" eyebrow={tr(lang, 'plan')}
      title={lang === 'hi' ? 'Cash gap आने वाला है' : lang === 'en' ? 'Upcoming cash gap' : 'Cash gap aane wala hai'}
      body={`${days}${lang === 'hi' ? ' दिन में ' : lang === 'en' ? ' days — ' : ' din mein '}${fmt(tOut - tIn)}${lang === 'hi' ? ' का shortfall।' : lang === 'en' ? ' shortfall.' : ' ka shortfall.'}`} />
  }

  const next = rec.filter(r => daysTo(r.date) >= 0).sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  if (next) {
    return <Card type="ok" eyebrow={tr(lang, 'allGood')}
      title={lang === 'hi' ? 'Cash position मज़बूत है' : lang === 'en' ? 'Cash position strong' : 'Cash position strong hai'}
      body={`${next.name} — ${fmt(next.amount)} ${daysTo(next.date) === 0 ? (lang === 'hi' ? 'आज' : 'today') : (daysTo(next.date) + (lang === 'hi' ? ' दिन में' : lang === 'en' ? ' days' : ' din mein'))}.`} />
  }
  return null
}

function Card({ type, eyebrow, title, body }) {
  const colors = {
    urgent: { bg: '#FEF2F2', border: '#DC2626', eye: '#DC2626', title: '#7F1D1D', body: '#991B1B' },
    warn: { bg: '#FFFBEB', border: '#D97706', eye: '#D97706', title: '#78350F', body: '#92400E' },
    ok: { bg: '#F0FDF4', border: '#16A34A', eye: '#16A34A', title: '#14532D', body: '#166534' },
  }
  const c = colors[type]
  return (
    <div style={{ background: c.bg, borderRadius: 14, padding: '15px 17px', borderLeft: `4px solid ${c.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.6px', textTransform: 'uppercase', marginBottom: 5, opacity: .65, color: c.eye }}>{eyebrow}</div>
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, color: c.title }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: c.body }}>{body}</div>
    </div>
  )
}

function AlertLine({ rec, pay, lang }) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cut30 = new Date(today); cut30.setDate(today.getDate() + 30)
  const in30 = rec.filter(r => { const d = new Date(r.date); return d >= today && d <= cut30 }).reduce((s, r) => s + Number(r.amount), 0)
  const out30 = pay.filter(p => { const d = new Date(p.date); return d >= today && d <= cut30 }).reduce((s, p) => s + Number(p.amount), 0)
  const ovrC = rec.filter(r => daysTo(r.date) < 0).length
  const ovrA = rec.filter(r => daysTo(r.date) < 0).reduce((s, r) => s + Number(r.amount), 0)

  let type, icon, text
  if (ovrC > 0 && out30 > in30) {
    type = 'r'; icon = '🚨'
    text = lang === 'hi' ? `${ovrC} overdue + cash gap: ₹${fmt(ovrA)} collect करना है और ${fmt(out30 - in30)} का shortfall।` :
      lang === 'en' ? `${ovrC} overdue + cash gap: ${fmt(ovrA)} to collect & ${fmt(out30 - in30)} shortfall.` :
        `${ovrC} overdue + cash gap: ${fmt(ovrA)} collect karna hai aur ${fmt(out30 - in30)} ka shortfall.`
  } else if (ovrC > 0) {
    type = 'r'; icon = '⏰'
    text = lang === 'hi' ? `${ovrC} payment overdue: ${fmt(ovrA)} — आज follow up करें।` :
      lang === 'en' ? `${ovrC} overdue: ${fmt(ovrA)} past due — follow up today.` :
        `${ovrC} payment overdue: ${fmt(ovrA)} — aaj follow up karo.`
  } else if (out30 > in30 && out30 > 0) {
    type = 'a'; icon = '⚠️'
    text = lang === 'hi' ? `30 दिन में cash gap: ${fmt(in30)} आएगा, ${fmt(out30)} जाएगा।` :
      lang === 'en' ? `30-day cash gap: ${fmt(in30)} in, ${fmt(out30)} out.` :
        `30 din mein cash gap: ${fmt(in30)} aayega, ${fmt(out30)} jaayega.`
  } else {
    const vipIn = rec.filter(r => { const d = new Date(r.date); return r.rel === 'vip' && d >= today && d <= cut30 }).reduce((s, r) => s + Number(r.amount), 0)
    if (vipIn > 0) {
      type = 'b'; icon = '⭐'
      text = lang === 'hi' ? `VIP collections: ${fmt(vipIn)} अगले 30 दिन में।` :
        lang === 'en' ? `VIP collections: ${fmt(vipIn)} in next 30 days.` :
          `VIP collections: ${fmt(vipIn)} agle 30 din mein.`
    } else return null
  }

  const colors = {
    r: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    a: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
    b: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
  }
  const c = colors[type]
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '11px 13px', display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 10 }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 12, lineHeight: 1.5, color: c.text }}>{text}</span>
    </div>
  )
}
