import { useState } from 'react'
import { tr, fmt, fdate, getDemoData } from '../lib/utils'
import { supabase } from '../lib/supabase'

export default function AddData({ rec, pay, profile, lang, onAddRec, onAddPay, onDeleteRec, onDeletePay }) {
  const [tab, setTab] = useState('rec')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

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
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: 11, textAlign: 'center', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif",
            background: tab === t.id ? (t.id === 'rec' ? '#16A34A' : '#DC2626') : '#F9FAFB',
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

      {/* Entries list */}
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
