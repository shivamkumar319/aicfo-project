import { useState } from 'react'
import { tr, fmt, fdate, getDemoData } from '../lib/utils'
import { supabase } from '../lib/supabase'

export default function AddData({ rec, pay, profile, lang, onAddRec, onAddPay, onDeleteRec, onDeletePay }) {
  const [tab, setTab] = useState('rec')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [gstParsed, setGstParsed] = useState(null)
  const [gstImporting, setGstImporting] = useState(false)

  // Rec form state
  const [rName, setRName] = useState('')
  const [rAmt, setRAmt] = useState('')
  const [rDate, setRDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] })
  const [rRel, setRRel] = useState('regular')
  const [rPay, setRPay] = useState('ontime')
  const [rFreq, setRFreq] = useState('repeat')
  const [rAvgDays, setRAvgDays] = useState('')
  const [rOtp, setROtp] = useState('')
  const [rPaidInv, setRPaidInv] = useState('')
  const [rLastPay, setRLastPay] = useState('')

  // Pay form state
  const [pName, setPName] = useState('')
  const [pAmt, setPAmt] = useState('')
  const [pDate, setPDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] })
  const [pCat, setPCat] = useState('Raw material')
  const [pRel, setPRel] = useState('longterm')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  // ── GST FILE PARSER ──
  function parseGSTFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        // Try JSON first (GSTR-1 / GSTR-2A JSON export)
        const data = JSON.parse(ev.target.result)
        const parsed = extractFromGSTJSON(data)
        if (parsed.receivables.length > 0 || parsed.payables.length > 0) {
          setGstParsed(parsed)
          showToast(`✅ ${parsed.receivables.length} invoices found!`)
        } else {
          showToast('No invoices found in this file. Try GSTR-1 JSON.')
        }
      } catch {
        showToast('File format not supported. Please upload GST JSON file.')
      }
    }
    reader.readAsText(file)
  }

  function extractFromGSTJSON(data) {
    const receivables = []
    const payables = []
    const today = new Date()

    function parseDate(dateStr) {
      if (!dateStr) return new Date(today.getTime() + 30 * 86400000)
      // Format: DD-MM-YYYY
      const parts = dateStr.split('-')
      if (parts.length === 3) {
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
      }
      return new Date(today.getTime() + 30 * 86400000)
    }

    // ── GSTR-1: b2b array = outward sales = receivables ──
    const b2b = data?.b2b || []
    b2b.forEach(party => {
      const gstin = party?.ctin || 'Unknown'
      const invoices = party?.inv || []
      invoices.forEach(inv => {
        const amount = Number(inv?.val || inv?.txval || 0)
        const dateStr = inv?.idt || ''
        const date = parseDate(dateStr)
        if (amount > 0) {
          receivables.push({
            name: `GST: ${gstin}`,
            amount: Math.round(amount),
            date: date.toISOString().split('T')[0],
            rel: 'regular',
            pay_hist: 'ontime',
            freq: 'onetime',
          })
        }
      })
    })

    // ── GSTR-2A: b2b array = inward purchases = payables ──
    // GSTR-2A has same b2b structure but represents purchases
    // We detect GSTR-2A by presence of itcElg key
    if (data?.itcElg) {
      // Use itcElg for summary payables
      const items = data?.itcElg?.itm_det || []
      items.forEach(item => {
        const amount = Number(item?.txval || 0)
        const gstin = item?.ctin || 'Unknown Vendor'
        if (amount > 0) {
          payables.push({
            name: `GST: ${gstin}`,
            amount: Math.round(amount),
            date: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
            cat: 'Raw material',
            rel: 'longterm',
          })
        }
      })
    } else if (data?.b2b && receivables.length === 0) {
      // Fallback: if no receivables found and has b2b, treat as payables
      b2b.forEach(party => {
        const gstin = party?.ctin || 'Unknown'
        const invoices = party?.inv || []
        invoices.forEach(inv => {
          const amount = Number(inv?.val || inv?.txval || 0)
          if (amount > 0) {
            payables.push({
              name: `GST: ${gstin}`,
              amount: Math.round(amount),
              date: new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
              cat: 'Raw material',
              rel: 'longterm',
            })
          }
        })
      })
    }

    return { receivables, payables }
  }

  async function importGSTData() {
    if (!gstParsed) return
    setGstImporting(true)
    let count = 0
    for (const item of gstParsed.receivables) {
      const { error } = await onAddRec(item)
      if (!error) count++
    }
    for (const item of gstParsed.payables) {
      const { error } = await onAddPay(item)
      if (!error) count++
    }
    showToast(`✅ ${count} entries imported!`)
    setGstParsed(null)
    setGstImporting(false)
  }

  async function addRec() {
    if (!rName.trim() || !rAmt || !rDate) { showToast(tr(lang, 'fillAll')); return }
    setLoading(true)
    const item = {
      name: rName.trim(), amount: parseFloat(rAmt), date: rDate,
      rel: rRel, pay_hist: rPay, freq: rFreq,
      avg_days: rAvgDays !== '' ? parseFloat(rAvgDays) : null,
      on_time_pct: rOtp !== '' ? parseFloat(rOtp) : null,
      paid_inv: rPaidInv !== '' ? parseInt(rPaidInv) : null,
      last_pay: rLastPay || null,
    }
    const { error } = await onAddRec(item)
    if (!error) {
      setRName(''); setRAmt(''); setRAvgDays(''); setROtp(''); setRPaidInv(''); setRLastPay('')
      showToast(tr(lang, 'recAdded'))
    }
    setLoading(false)
  }

  async function addPay() {
    if (!pName.trim() || !pAmt || !pDate) { showToast(tr(lang, 'fillAll')); return }
    setLoading(true)
    const item = { name: pName.trim(), amount: parseFloat(pAmt), date: pDate, cat: pCat, rel: pRel }
    const { error } = await onAddPay(item)
    if (!error) { setPName(''); setPAmt(''); showToast(tr(lang, 'payAdded')) }
    setLoading(false)
  }

  async function loadDemo() {
    setLoading(true)
    const demo = getDemoData()
    const { data: { user } } = await supabase.auth.getUser()
    await Promise.all([
      supabase.from('receivables').insert(demo.rec.map(r => ({ ...r, user_id: user.id }))),
      supabase.from('payables').insert(demo.pay.map(p => ({ ...p, user_id: user.id }))),
    ])
    showToast('✅ Demo data loaded! Refresh the app.')
    setLoading(false)
  }

  const relLabels = { vip: '⭐ VIP', regular: lang === 'hi' ? '✅ नियमित' : '✅ Regular', newc: lang === 'hi' ? '🆕 New' : '🆕 New', atrisk: lang === 'hi' ? '⚠️ Risk' : '⚠️ Risk' }
  const payhLabels = { ontime: lang === 'hi' ? 'Always' : 'Always', late: 'Sometimes', 'often-late': 'Often late' }
  const freqLabels = { repeat: 'Repeat', onetime: 'One-time' }

  return (
    <div>
      <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>{tr(lang, 'addTitle')}</div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Receivables &amp; payables</div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', margin: '14px 16px 0', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
        {[
          { id: 'rec', label: '↓ ' + (lang === 'hi' ? 'पैसा आएगा' : lang === 'en' ? 'Money In' : 'Paisa Aayega') },
          { id: 'pay', label: '↑ ' + (lang === 'hi' ? 'पैसा जाएगा' : lang === 'en' ? 'Money Out' : 'Paisa Jaayega') },
          { id: 'gst', label: '🧾 GST' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: 11, textAlign: 'center', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif",
            background: tab === t.id ? (t.id === 'rec' ? '#16A34A' : t.id === 'pay' ? '#DC2626' : '#7C3AED') : '#F9FAFB',
            color: tab === t.id ? 'white' : '#6B7280',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Rec form */}
      {tab === 'rec' && (
        <div style={{ padding: '14px 16px' }}>
          <FG label={lang === 'hi' ? 'Customer का नाम' : lang === 'en' ? 'Customer name' : 'Customer naam'}>
            <input style={fi} type="text" placeholder="e.g. Mehta Stores" value={rName} onChange={e => setRName(e.target.value)} />
          </FG>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <FG label="Amount (₹)" mb={0}><input style={fi} type="number" placeholder="75000" value={rAmt} onChange={e => setRAmt(e.target.value)} /></FG>
            <FG label={lang === 'hi' ? 'अपेक्षित तारीख' : lang === 'en' ? 'Expected date' : 'Expected date'} mb={0}><input style={fi} type="date" value={rDate} onChange={e => setRDate(e.target.value)} /></FG>
          </div>
          <div style={{ height: 6 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <FG label={lang === 'hi' ? 'संबंध' : 'Relationship'} mb={0}>
              <select style={{ ...fi, padding: '9px 8px' }} value={rRel} onChange={e => setRRel(e.target.value)}>
                {Object.entries(relLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FG>
            <FG label={lang === 'hi' ? 'समय पर?' : 'Pays on time?'} mb={0}>
              <select style={{ ...fi, padding: '9px 8px' }} value={rPay} onChange={e => setRPay(e.target.value)}>
                {Object.entries(payhLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FG>
            <FG label="Type" mb={0}>
              <select style={{ ...fi, padding: '9px 8px' }} value={rFreq} onChange={e => setRFreq(e.target.value)}>
                {Object.entries(freqLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FG>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <FG label={lang === 'hi' ? 'औसत दिन (जल्दी/देर)' : 'Avg days early/late'} mb={0}><input style={fi} type="number" placeholder="-3 or +5" value={rAvgDays} onChange={e => setRAvgDays(e.target.value)} /></FG>
            <FG label="On-time %" mb={0}><input style={fi} type="number" placeholder="85" min="0" max="100" value={rOtp} onChange={e => setROtp(e.target.value)} /></FG>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <FG label={lang === 'hi' ? 'भुगतान किए गए' : 'Invoices paid'} mb={0}><input style={fi} type="number" placeholder="12" value={rPaidInv} onChange={e => setRPaidInv(e.target.value)} /></FG>
            <FG label={lang === 'hi' ? 'अंतिम payment' : 'Last payment date'} mb={0}><input style={fi} type="date" value={rLastPay} onChange={e => setRLastPay(e.target.value)} /></FG>
          </div>
          <button style={{ ...sbtn, background: '#16A34A' }} onClick={addRec} disabled={loading}>{loading ? '...' : '+ Add receivable'}</button>
        </div>
      )}

      {/* Pay form */}
      {tab === 'pay' && (
        <div style={{ padding: '14px 16px' }}>
          <FG label={lang === 'hi' ? 'Vendor का नाम' : lang === 'en' ? 'Vendor name' : 'Vendor naam'}>
            <input style={fi} type="text" placeholder="e.g. Rajesh Fabrics" value={pName} onChange={e => setPName(e.target.value)} />
          </FG>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <FG label="Amount (₹)" mb={0}><input style={fi} type="number" placeholder="50000" value={pAmt} onChange={e => setPAmt(e.target.value)} /></FG>
            <FG label={lang === 'hi' ? 'Due तारीख' : 'Due date'} mb={0}><input style={fi} type="date" value={pDate} onChange={e => setPDate(e.target.value)} /></FG>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <FG label={lang === 'hi' ? 'श्रेणी' : 'Category'} mb={0}>
              <select style={{ ...fi, padding: '9px 8px' }} value={pCat} onChange={e => setPCat(e.target.value)}>
                {['Raw material', 'Rent', 'Salary', 'Transport', 'Utilities', 'Loan EMI', 'Tax/GST', 'Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </FG>
            <FG label="Supplier" mb={0}>
              <select style={{ ...fi, padding: '9px 8px' }} value={pRel} onChange={e => setPRel(e.target.value)}>
                <option value="longterm">🤝 Long-term</option>
                <option value="news">🆕 New</option>
              </select>
            </FG>
          </div>
          <button style={{ ...sbtn, background: '#DC2626' }} onClick={addPay} disabled={loading}>{loading ? '...' : '+ Add payable'}</button>
        </div>
      )}

      {/* GST Import tab */}
      {tab === 'gst' && (
        <div style={{ padding: '14px 16px' }}>
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 10, padding: '14px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#5B21B6', marginBottom: 6 }}>🧾 GST Auto-Import</div>
            <div style={{ fontSize: 12, color: '#6D28D9', lineHeight: 1.6 }}>
              {lang === 'hi'
                ? 'GST portal से अपना GSTR-1 या GSTR-2A JSON file download करें और यहाँ upload करें। सभी invoices automatically add हो जाएंगे।'
                : lang === 'en'
                ? 'Download your GSTR-1 or GSTR-2A JSON file from the GST portal and upload it here. All invoices will be added automatically.'
                : 'GST portal se apna GSTR-1 ya GSTR-2A JSON file download karo aur yahan upload karo. Sab invoices automatically add ho jaayenge.'}
            </div>
          </div>

          {/* Step guide */}
          <div style={{ marginBottom: 16 }}>
            {[
              { n: '1', text: lang === 'hi' ? 'gstin.gov.in पर login करें' : 'Login to gstin.gov.in' },
              { n: '2', text: lang === 'hi' ? 'Returns → GSTR-1 → JSON download करें' : 'Returns → GSTR-1 → Download JSON' },
              { n: '3', text: lang === 'hi' ? 'नीचे file upload करें' : 'Upload the file below' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#7C3AED', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.n}</div>
                <div style={{ fontSize: 13, color: '#374151' }}>{s.text}</div>
              </div>
            ))}
          </div>

          {/* File upload */}
          <label style={{ display: 'block', width: '100%', padding: '20px', border: '2px dashed #DDD6FE', borderRadius: 10, textAlign: 'center', cursor: 'pointer', background: '#FAFAFA' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED', marginBottom: 3 }}>
              {lang === 'hi' ? 'JSON file choose करें' : lang === 'en' ? 'Choose JSON file' : 'JSON file choose karo'}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF' }}>GSTR-1 or GSTR-2A · .json format</div>
            <input type="file" accept=".json" onChange={parseGSTFile} style={{ display: 'none' }} />
          </label>

          {/* Parsed preview */}
          {gstParsed && (
            <div style={{ marginTop: 16 }}>
              <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#065F46', marginBottom: 8 }}>✅ Ready to import:</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{gstParsed.receivables.length}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{lang === 'hi' ? 'बिक्री (Receivables)' : 'Sales (Receivables)'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#DC2626' }}>{gstParsed.payables.length}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{lang === 'hi' ? 'खरीद (Payables)' : 'Purchases (Payables)'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
                      ₹{Math.round([...gstParsed.receivables, ...gstParsed.payables].reduce((s, i) => s + i.amount, 0) / 1000)}K
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>Total value</div>
                  </div>
                </div>
              </div>

              {/* Preview list */}
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                {[...gstParsed.receivables.slice(0, 5), ...gstParsed.payables.slice(0, 3)].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E5E7EB', fontSize: 12 }}>
                    <span style={{ color: '#374151' }}>{item.name}</span>
                    <span style={{ fontWeight: 600, color: item.rel === 'longterm' ? '#DC2626' : '#16A34A' }}>
                      {item.rel === 'longterm' ? '-' : '+'}{fmt(item.amount)}
                    </span>
                  </div>
                ))}
                {(gstParsed.receivables.length + gstParsed.payables.length) > 8 && (
                  <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', padding: '6px 0' }}>
                    +{gstParsed.receivables.length + gstParsed.payables.length - 8} more entries
                  </div>
                )}
              </div>

              <button
                onClick={importGSTData}
                disabled={gstImporting}
                style={{ width: '100%', padding: 13, borderRadius: 8, background: '#7C3AED', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                {gstImporting ? 'Importing...' : `🧾 Import ${gstParsed.receivables.length + gstParsed.payables.length} entries`}
              </button>
              <button
                onClick={() => setGstParsed(null)}
                style={{ width: '100%', padding: 10, borderRadius: 8, background: 'transparent', color: '#6B7280', fontSize: 13, border: '1px solid #E5E7EB', cursor: 'pointer', marginTop: 8, fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
      {(tab === 'rec' ? rec : pay).length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.4px', padding: '14px 0 8px', borderTop: '1px solid #E5E7EB' }}>
            {tab === 'rec' ? rec.length + ' receivables' : pay.length + ' payables'}
          </div>
          {(tab === 'rec' ? [...rec] : [...pay]).sort((a, b) => new Date(a.date) - new Date(b.date)).map((item, i) => (
            <div key={item.id || i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #E5E7EB' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                  {tab === 'rec' ? item.rel : item.cat} · {fdate(item.date, lang)}
                  {tab === 'rec' && item.on_time_pct != null && <span> · {Math.round(item.on_time_pct)}% on-time</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace", color: tab === 'rec' ? '#16A34A' : '#DC2626' }}>
                  {tab === 'rec' ? '' : '-'}{fmt(item.amount)}
                </span>
                <button onClick={() => tab === 'rec' ? onDeleteRec(item.id) : onDeletePay(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18, lineHeight: 1, padding: 2 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demo data */}
      <div style={{ padding: '0 16px 16px', borderTop: '1px solid #E5E7EB', marginTop: 8 }}>
        <button onClick={loadDemo} disabled={loading} style={{ width: '100%', padding: 11, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', marginTop: 14, fontFamily: "'DM Sans', sans-serif" }}>
          🎯 {tr(lang, 'demo')}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 82, left: '50%', transform: 'translateX(-50%)', background: '#111827', color: 'white', padding: '9px 18px', borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 200, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function FG({ label, children, mb }) {
  return (
    <div style={{ marginBottom: mb !== undefined ? mb : 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const fi = { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const sbtn = { width: '100%', padding: 13, borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', border: 'none', color: 'white' }
