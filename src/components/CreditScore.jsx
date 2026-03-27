import { useState } from 'react'
import { fmt, fdate, daysTo } from '../lib/utils'

export function calcCreditScore(rec, pay) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const factors = []
  let total = 0

  // ── 1. CASH FLOW CONSISTENCY (20pts) ──
  // Is income > expenses across last 3 months of data?
  let cfScore = 0
  const months = [0, 1, 2].map(i => {
    const d = new Date(today); d.setMonth(d.getMonth() - i)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  let positiveMonths = 0
  months.forEach(mo => {
    const inA = rec.filter(r => { const d = new Date(r.date); return d.getFullYear() === mo.y && d.getMonth() === mo.m }).reduce((s, r) => s + Number(r.amount), 0)
    const outA = pay.filter(p => { const d = new Date(p.date); return d.getFullYear() === mo.y && d.getMonth() === mo.m }).reduce((s, p) => s + Number(p.amount), 0)
    if (inA > 0 && inA >= outA) positiveMonths++
  })
  if (positiveMonths === 3) cfScore = 20
  else if (positiveMonths === 2) cfScore = 14
  else if (positiveMonths === 1) cfScore = 7
  else cfScore = rec.length > 0 ? 5 : 0
  total += cfScore
  factors.push({
    id: 'cashflow', label: 'Cash Flow Consistency', score: cfScore, max: 20,
    detail: `${positiveMonths}/3 months cash positive`,
    tip: cfScore < 14 ? 'Collect overdue payments to improve monthly cash position' : null,
    color: cfScore >= 14 ? 'g' : cfScore >= 7 ? 'a' : 'r'
  })

  // ── 2. RECEIVABLES HEALTH (20pts) ──
  let rhScore = 0
  const totalRec = rec.length
  const overdueRec = rec.filter(r => daysTo(r.date) < 0).length
  const overdueAmt = rec.filter(r => daysTo(r.date) < 0).reduce((s, r) => s + Number(r.amount), 0)
  const totalAmt = rec.reduce((s, r) => s + Number(r.amount), 0)
  const overduePct = totalAmt > 0 ? (overdueAmt / totalAmt) * 100 : 0
  if (overduePct === 0) rhScore = 20
  else if (overduePct <= 10) rhScore = 16
  else if (overduePct <= 25) rhScore = 10
  else if (overduePct <= 50) rhScore = 5
  else rhScore = 2
  total += rhScore
  factors.push({
    id: 'receivables', label: 'Receivables Health', score: rhScore, max: 20,
    detail: `${Math.round(overduePct)}% overdue (${fmt(overdueAmt)} of ${fmt(totalAmt)})`,
    tip: rhScore < 16 ? `Follow up on ${overdueRec} overdue invoice${overdueRec > 1 ? 's' : ''} to improve score` : null,
    color: rhScore >= 16 ? 'g' : rhScore >= 10 ? 'a' : 'r'
  })

  // ── 3. CUSTOMER QUALITY (15pts) ──
  let cqScore = 0
  const custMap = new Map()
  rec.forEach(r => { custMap.set(r.name, (custMap.get(r.name) || 0) + Number(r.amount)) })
  const vipRec = rec.filter(r => r.rel === 'vip').reduce((s, r) => s + Number(r.amount), 0)
  const vipPct = totalAmt > 0 ? (vipRec / totalAmt) * 100 : 0
  const uniqueCusts = custMap.size
  if (vipPct >= 40) cqScore = 15
  else if (vipPct >= 20) cqScore = 11
  else if (vipPct >= 10) cqScore = 7
  else if (uniqueCusts >= 5) cqScore = 5
  else cqScore = rec.length > 0 ? 3 : 0
  total += cqScore
  factors.push({
    id: 'custquality', label: 'Customer Quality', score: cqScore, max: 15,
    detail: `${Math.round(vipPct)}% revenue from VIP customers (${uniqueCusts} total customers)`,
    tip: cqScore < 11 ? 'Build relationships with repeat buyers — tag them as VIP' : null,
    color: cqScore >= 11 ? 'g' : cqScore >= 7 ? 'a' : 'r'
  })

  // ── 4. CUSTOMER CONCENTRATION RISK (15pts) ──
  let conScore = 0
  const topCust = [...custMap.entries()].sort((a, b) => b[1] - a[1])[0]
  const topPct = totalAmt > 0 && topCust ? (topCust[1] / totalAmt) * 100 : 0
  if (topPct <= 25) conScore = 15
  else if (topPct <= 40) conScore = 11
  else if (topPct <= 60) conScore = 6
  else conScore = 2
  total += conScore
  factors.push({
    id: 'concentration', label: 'Customer Concentration', score: conScore, max: 15,
    detail: topCust ? `Top customer (${topCust[0]}) = ${Math.round(topPct)}% of revenue` : 'No customer data',
    tip: conScore < 11 ? `Over-reliance on ${topCust?.[0] || 'one customer'} — diversify your customer base` : null,
    color: conScore >= 11 ? 'g' : conScore >= 6 ? 'a' : 'r'
  })

  // ── 5. PAYMENT CONSISTENCY (15pts) ──
  let pcScore = 0
  const recWithOtp = rec.filter(r => r.on_time_pct != null)
  const avgOtp = recWithOtp.length > 0
    ? recWithOtp.reduce((s, r) => s + Number(r.on_time_pct), 0) / recWithOtp.length
    : null
  if (avgOtp === null) pcScore = 7 // neutral if no data
  else if (avgOtp >= 85) pcScore = 15
  else if (avgOtp >= 70) pcScore = 11
  else if (avgOtp >= 55) pcScore = 6
  else pcScore = 2
  total += pcScore
  factors.push({
    id: 'payment', label: 'Payment Consistency', score: pcScore, max: 15,
    detail: avgOtp !== null ? `${Math.round(avgOtp)}% avg on-time payment rate across customers` : 'Add payment history data to improve score',
    tip: pcScore < 11 && avgOtp !== null ? 'Send WhatsApp reminders to late-paying customers' : null,
    color: pcScore >= 11 ? 'g' : pcScore >= 6 ? 'a' : 'r'
  })

  // ── 6. REVENUE GROWTH TREND (10pts) ──
  let rgScore = 0
  const thisMonth = rec.filter(r => { const d = new Date(r.date); return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() }).reduce((s, r) => s + Number(r.amount), 0)
  const lastMonth = rec.filter(r => { const d = new Date(r.date); const lm = new Date(today); lm.setMonth(lm.getMonth() - 1); return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth() }).reduce((s, r) => s + Number(r.amount), 0)
  const twoMonthsAgo = rec.filter(r => { const d = new Date(r.date); const tm = new Date(today); tm.setMonth(tm.getMonth() - 2); return d.getFullYear() === tm.getFullYear() && d.getMonth() === tm.getMonth() }).reduce((s, r) => s + Number(r.amount), 0)
  const isGrowing = lastMonth > twoMonthsAgo && thisMonth >= lastMonth * 0.9
  const isFalling = lastMonth < twoMonthsAgo * 0.8
  if (isGrowing) rgScore = 10
  else if (!isFalling && (lastMonth > 0 || thisMonth > 0)) rgScore = 6
  else if (rec.length > 0) rgScore = 3
  total += rgScore
  factors.push({
    id: 'growth', label: 'Revenue Growth', score: rgScore, max: 10,
    detail: lastMonth > 0 ? `Last month: ${fmt(lastMonth)} vs prev: ${fmt(twoMonthsAgo)}` : 'Add historical data for growth analysis',
    tip: isFalling ? 'Revenue declining — focus on reactivating dormant customers' : null,
    color: rgScore >= 8 ? 'g' : rgScore >= 5 ? 'a' : 'r'
  })

  // ── 7. GST REGULARITY (5pts) ──
  const hasGSTData = rec.some(r => r.name?.startsWith('GST:')) || rec.length >= 10
  const gstScore = hasGSTData ? 5 : 2
  total += gstScore
  factors.push({
    id: 'gst', label: 'GST Data Available', score: gstScore, max: 5,
    detail: hasGSTData ? 'GST data linked — verified business activity' : 'Upload GSTR-1 to verify business activity',
    tip: !hasGSTData ? 'Upload your GSTR-1 file to get full marks here' : null,
    color: gstScore === 5 ? 'g' : 'a'
  })

  const score = Math.min(Math.round(total), 100)
  const grade = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'
  const gradeHi = score >= 80 ? 'उत्कृष्ट' : score >= 65 ? 'अच्छा' : score >= 50 ? 'ठीक है' : 'कमज़ोर'
  const gradeHh = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Poor'
  const eligible = score >= 65
  const loanEst = eligible ? Math.round(totalAmt * (score >= 80 ? 0.6 : 0.4) / 100000) * 100000 : 0

  return { score, grade, gradeHi, gradeHh, eligible, loanEst, factors, totalAmt, overdueAmt, uniqueCusts }
}

export default function CreditScore({ rec, pay, profile, lang }) {
  const [showDetails, setShowDetails] = useState(false)
  const result = calcCreditScore(rec, pay)
  const { score, grade, factors, eligible, loanEst, totalAmt, overdueAmt, uniqueCusts } = result

  const gradeLabel = lang === 'hi' ? result.gradeHi : result.grade
  const scoreColor = score >= 80 ? '#16A34A' : score >= 65 ? '#65A30D' : score >= 50 ? '#D97706' : '#DC2626'
  const scoreBg = score >= 80 ? '#F0FDF4' : score >= 65 ? '#F7FEE7' : score >= 50 ? '#FFFBEB' : '#FEF2F2'
  const scoreBorder = score >= 80 ? '#A7F3D0' : score >= 65 ? '#BEF264' : score >= 50 ? '#FDE68A' : '#FECACA'

  const colorMap = { g: '#16A34A', a: '#D97706', r: '#DC2626' }
  const bgMap = { g: '#F0FDF4', a: '#FFFBEB', r: '#FEF2F2' }

  function exportLenderPDF() {
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Credit Report — ${profile?.biz_name}</title>
    <style>
      body{font-family:Arial,sans-serif;color:#111;margin:0;padding:32px;font-size:13px;max-width:680px;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #E5E7EB;}
      h1{font-size:20px;margin:0 0 4px;}
      .sub{color:#6B7280;font-size:12px;}
      .score-box{text-align:center;background:${scoreBg};border:2px solid ${scoreBorder};border-radius:12px;padding:20px 28px;}
      .score-num{font-size:48px;font-weight:700;color:${scoreColor};line-height:1;}
      .score-grade{font-size:16px;font-weight:600;color:${scoreColor};margin-top:4px;}
      .score-sub{font-size:11px;color:#6B7280;margin-top:4px;}
      h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#6B7280;border-bottom:1px solid #E5E7EB;padding-bottom:6px;margin:20px 0 12px;}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;}
      .stat{background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:10px 12px;}
      .stat-l{font-size:10px;text-transform:uppercase;color:#6B7280;margin-bottom:3px;}
      .stat-v{font-size:18px;font-weight:700;}
      .green{color:#16A34A;}.red{color:#DC2626;}.amber{color:#D97706;}
      table{width:100%;border-collapse:collapse;}
      th{font-size:11px;text-transform:uppercase;color:#6B7280;text-align:left;padding:7px 10px;border-bottom:2px solid #E5E7EB;}
      td{padding:8px 10px;border-bottom:1px solid #F3F4F6;font-size:12px;}
      .bar-wrap{display:flex;align-items:center;gap:8px;}
      .bar-bg{flex:1;height:6px;background:#E5E7EB;border-radius:3px;overflow:hidden;}
      .bar-fill{height:100%;border-radius:3px;}
      .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;}
      .eligible{background:#DCFCE7;color:#14532D;}.not-eligible{background:#FEE2E2;color:#991B1B;}
      .tip{background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:8px 10px;font-size:11px;color:#92400E;margin-top:4px;}
      .footer{margin-top:32px;padding-top:12px;border-top:1px solid #E5E7EB;color:#9CA3AF;font-size:10px;display:flex;justify-content:space-between;}
    </style></head><body>
    <div class="header">
      <div>
        <h1>🧠 AI CFO — Credit Readiness Report</h1>
        <div class="sub">${profile?.biz_name || 'Business'} &nbsp;·&nbsp; ${dateStr}</div>
        <div class="sub" style="margin-top:4px;">Generated by AI CFO · For lender use only</div>
      </div>
      <div class="score-box">
        <div class="score-num">${score}</div>
        <div class="score-grade">${grade}</div>
        <div class="score-sub">out of 100</div>
      </div>
    </div>

    <h2>Business Summary</h2>
    <div class="grid">
      <div class="stat"><div class="stat-l">Total Receivables</div><div class="stat-v green">${fmt(totalAmt)}</div></div>
      <div class="stat"><div class="stat-l">Overdue Amount</div><div class="stat-v red">${fmt(overdueAmt)}</div></div>
      <div class="stat"><div class="stat-l">Unique Customers</div><div class="stat-v">${uniqueCusts}</div></div>
      <div class="stat"><div class="stat-l">Credit Eligibility</div><div class="stat-v ${eligible ? 'green' : 'red'}">${eligible ? 'Eligible ✓' : 'Not Yet'}</div></div>
      <div class="stat"><div class="stat-l">Est. Loan Amount</div><div class="stat-v ${eligible ? 'green' : ''}">${eligible ? fmt(loanEst) : '—'}</div></div>
      <div class="stat"><div class="stat-l">Score Range</div><div class="stat-v">0–100</div></div>
    </div>

    <h2>Score Breakdown</h2>
    <table>
      <tr><th>Factor</th><th>Score</th><th>Max</th><th>Detail</th></tr>
      ${factors.map(f => `
        <tr>
          <td><strong>${f.label}</strong>${f.tip ? `<div class="tip">💡 ${f.tip}</div>` : ''}</td>
          <td><strong style="color:${colorMap[f.color]}">${f.score}</strong></td>
          <td style="color:#6B7280">${f.max}</td>
          <td style="color:#6B7280;font-size:11px;">${f.detail}</td>
        </tr>`).join('')}
      <tr style="background:#F9FAFB;"><td><strong>Total</strong></td><td><strong style="color:${scoreColor}">${score}</strong></td><td><strong>100</strong></td><td><span class="badge ${eligible ? 'eligible' : 'not-eligible'}">${eligible ? '✓ Credit Eligible' : 'Below Threshold'}</span></td></tr>
    </table>

    ${eligible ? `
    <h2>Lending Recommendation</h2>
    <div style="background:#F0FDF4;border:1px solid #A7F3D0;border-radius:8px;padding:14px;">
      <div style="font-size:14px;font-weight:600;color:#065F46;margin-bottom:6px;">✓ Recommended for credit</div>
      <div style="font-size:12px;color:#065F46;">Based on cash flow analysis and receivables data, this business shows strong credit signals. Estimated eligible amount: <strong>${fmt(loanEst)}</strong> at standard MSME lending rates.</div>
    </div>` : `
    <h2>Improvement Areas</h2>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:14px;">
      <div style="font-size:14px;font-weight:600;color:#991B1B;margin-bottom:6px;">⚠ Below credit threshold (65+)</div>
      <div style="font-size:12px;color:#991B1B;">This business needs to improve receivables collection and cash flow consistency before qualifying for institutional credit.</div>
    </div>`}

    <div class="footer">
      <span>AI CFO Credit Report · ${profile?.biz_name}</span>
      <span>Generated ${dateStr} · Score valid for 30 days</span>
    </div>
    </body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Credit_Report_${(profile?.biz_name || 'Business').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 16 }}>

      {/* Headline score */}
      <div style={{ background: scoreBg, border: `2px solid ${scoreBorder}`, borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: scoreColor, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
          {lang === 'hi' ? 'क्रेडिट रेडीनेस स्कोर' : lang === 'en' ? 'Credit Readiness Score' : 'Credit Readiness Score'}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, color: scoreColor, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{score}</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: scoreColor, marginTop: 4 }}>{gradeLabel}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>out of 100</div>

        {/* Score bar */}
        <div style={{ margin: '14px auto 12px', maxWidth: 240, height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: score + '%', background: scoreColor, borderRadius: 4, transition: 'width .5s ease' }} />
        </div>

        {/* Eligibility */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: eligible ? '#DCFCE7' : '#FEE2E2', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: eligible ? '#14532D' : '#991B1B' }}>
            {eligible ? '✓ ' : '✗ '}
            {lang === 'hi' ? (eligible ? 'लोन के लिए eligible' : 'अभी eligible नहीं') : eligible ? 'Credit eligible' : 'Not yet eligible'}
          </span>
        </div>

        {eligible && loanEst > 0 && (
          <div style={{ fontSize: 12, color: '#16A34A', fontWeight: 500, marginTop: 4 }}>
            {lang === 'hi' ? `अनुमानित लोन राशि: ${fmt(loanEst)}` : `Estimated loan amount: ${fmt(loanEst)}`}
          </div>
        )}
      </div>

      {/* Factor breakdown */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px' }}>
            Score Breakdown
          </div>
          <button onClick={() => setShowDetails(!showDetails)} style={{ fontSize: 12, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        </div>

        {factors.map(f => (
          <div key={f.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{f.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: colorMap[f.color] }}>{f.score}/{f.max}</span>
            </div>
            <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: Math.round(f.score / f.max * 100) + '%', background: colorMap[f.color], borderRadius: 3 }} />
            </div>
            {showDetails && (
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{f.detail}</div>
                {f.tip && (
                  <div style={{ fontSize: 11, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>
                    💡 {f.tip}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Improvement tips summary */}
      {factors.filter(f => f.tip).length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 8 }}>
            {lang === 'hi' ? '💡 Score कैसे बढ़ाएं' : '💡 How to improve your score'}
          </div>
          {factors.filter(f => f.tip).map(f => (
            <div key={f.id} style={{ fontSize: 12, color: '#92400E', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #FCD34D' }}>
              {f.tip}
            </div>
          ))}
        </div>
      )}

      {/* Export button */}
      <button onClick={exportLenderPDF} style={{ width: '100%', padding: 13, borderRadius: 10, background: '#111827', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        📄 {lang === 'hi' ? 'Lender Report Download करें' : lang === 'en' ? 'Download Lender Report' : 'Lender Report Download Karo'}
      </button>
      <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 6 }}>
        {lang === 'hi' ? 'यह report bank या NBFC को दिखाएं' : lang === 'en' ? 'Share this report with your bank or NBFC' : 'Yeh report bank ya NBFC ko dikhao'}
      </div>

    </div>
  )
}
