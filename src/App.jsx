import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Setup from './components/Setup'
import Home from './components/Home'
import Details from './components/Details'
import AddData from './components/AddData'
import Nav from './components/Nav'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [screen, setScreen] = useState('home')
  const [rec, setRec] = useState([])
  const [pay, setPay] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadData(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadData(session.user.id)
      else { setLoading(false); setProfile(null); setRec([]); setPay([]) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadData(userId) {
    setLoading(true)
    try {
      const [{ data: profileData }, { data: recData }, { data: payData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('receivables').select('*').eq('user_id', userId).order('date'),
        supabase.from('payables').select('*').eq('user_id', userId).order('date'),
      ])
      setProfile(profileData)
      setRec(recData || [])
      setPay(payData || [])
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }

  async function saveProfile(bizName, lang) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, biz_name: bizName, lang, updated_at: new Date().toISOString() })
      .select().single()
    if (!error) setProfile(data)
  }

  async function addReceivable(item) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('receivables')
      .insert({ ...item, user_id: user.id })
      .select().single()
    if (!error) setRec(prev => [...prev, data])
    return { error }
  }

  async function deleteReceivable(id) {
    const { error } = await supabase.from('receivables').delete().eq('id', id)
    if (!error) setRec(prev => prev.filter(r => r.id !== id))
  }

  async function addPayable(item) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('payables')
      .insert({ ...item, user_id: user.id })
      .select().single()
    if (!error) setPay(prev => [...prev, data])
    return { error }
  }

  async function deletePayable(id) {
    const { error } = await supabase.from('payables').delete().eq('id', id)
    if (!error) setPay(prev => prev.filter(p => p.id !== id))
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null); setRec([]); setPay([])
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40 }}>🧠</div>
      <div style={{ fontSize: 14, color: '#6B7280' }}>Loading...</div>
    </div>
  )

  if (!session) return <Setup onSetupComplete={() => loadData(session?.user?.id)} />

  if (!profile?.biz_name) return (
    <Setup
      session={session}
      onSaveProfile={saveProfile}
    />
  )

  const lang = profile?.lang || 'hh'
  const sharedProps = { rec, pay, profile, lang, days, setDays }

  return (
    <div className="app">
      {screen === 'home' && (
        <Home {...sharedProps} onSignOut={signOut} />
      )}
      {screen === 'detail' && (
        <Details {...sharedProps} />
      )}
      {screen === 'add' && (
        <AddData
          {...sharedProps}
          onAddRec={addReceivable}
          onAddPay={addPayable}
          onDeleteRec={deleteReceivable}
          onDeletePay={deletePayable}
        />
      )}
      <Nav screen={screen} setScreen={setScreen} lang={lang} />
    </div>
  )
}
