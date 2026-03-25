import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../lib/utils'

export default function Setup({ session, onSaveProfile }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [bizName, setBizName] = useState('')
  const [lang, setLang] = useState('hh')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(session ? 'profile' : 'phone')

  const l = T[lang]

  async function sendOTP() {
    if (!phone || phone.length < 10) { setError('Valid phone number daalo'); return }
    setLoading(true); setError('')
    const formatted = phone.startsWith('+') ? phone : '+91' + phone.replace(/\D/g, '')
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (error) setError(error.message)
    else setOtpSent(true)
    setLoading(false)
  }

  async function verifyOTP() {
    if (!otp || otp.length < 6) { setError('6-digit OTP daalo'); return }
    setLoading(true); setError('')
    const formatted = phone.startsWith('+') ? phone : '+91' + phone.replace(/\D/g, '')
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    if (error) setError(error.message)
    else setStep('profile')
    setLoading(false)
  }

  async function saveProfile() {
    if (!bizName.trim()) { setError(l.fillAll); return }
    setLoading(true); setError('')
    await onSaveProfile(bizName.trim(), lang)
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100vh', background: '#fff', padding: '48px 24px 32px' }}>
      <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 14 }}>🧠</div>
      <div style={{ fontSize: 24, fontWeight: 600, textAlign: 'center', marginBottom: 6 }}>AI CFO</div>
      <div style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.6, marginBottom: 32 }}>
        {l.tagline}
      </div>

      {step === 'phone' && !otpSent && (
        <>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>{lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile number'}</label>
            <input
              style={inputStyle}
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={13}
            />
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>India number — +91 auto-add hoga</div>
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <button style={btnStyle} onClick={sendOTP} disabled={loading}>
            {loading ? 'Sending...' : (lang === 'hi' ? 'OTP भेजें' : 'Send OTP')}
          </button>
        </>
      )}

      {step === 'phone' && otpSent && (
        <>
          <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#065F46' }}>
            ✅ OTP sent to +91{phone} — check your SMS
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Enter OTP</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              maxLength={6}
            />
          </div>
          {error && <div style={errorStyle}>{error}</div>}
          <button style={btnStyle} onClick={verifyOTP} disabled={loading}>
            {loading ? 'Verifying...' : (lang === 'hi' ? 'Verify करें' : 'Verify OTP')}
          </button>
          <button style={ghostBtn} onClick={() => setOtpSent(false)}>← Back</button>
        </>
      )}

      {step === 'profile' && (
        <>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>{l.bizname}</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g. Sharma Textiles"
              value={bizName}
              onChange={e => setBizName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>{l.langLabel}</label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['en', 'hi', 'hh'].map(code => (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  flex: 1, padding: 10, borderRadius: 8, border: '1.5px solid',
                  borderColor: lang === code ? '#16A34A' : '#E5E7EB',
                  background: lang === code ? '#F0FDF4' : '#fff',
                  color: lang === code ? '#14532D' : '#6B7280',
                  fontWeight: lang === code ? 600 : 500,
                  fontSize: 13, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif"
                }}
              >
                {code === 'en' ? 'English' : code === 'hi' ? 'हिंदी' : 'Hinglish'}
              </button>
            ))}
          </div>

          {error && <div style={errorStyle}>{error}</div>}
          <button style={btnStyle} onClick={saveProfile} disabled={loading}>
            {loading ? 'Saving...' : l.start}
          </button>
        </>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 5 }
const inputStyle = { width: '100%', padding: '12px 14px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 15, fontFamily: "'DM Sans', sans-serif", color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const btnStyle = { width: '100%', padding: 13, borderRadius: 8, fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', border: 'none', background: '#16A34A', color: 'white', marginTop: 4 }
const ghostBtn = { width: '100%', padding: 11, borderRadius: 8, fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', border: '1.5px solid #E5E7EB', background: 'transparent', color: '#6B7280', marginTop: 8 }
const errorStyle = { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#991B1B', marginBottom: 12 }
