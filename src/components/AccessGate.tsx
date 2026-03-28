import { useState, useRef, useEffect } from 'react'
import { submitSignup, validateAccessCode } from '../lib/supabase'
import { NoirHeading, NoirText, NoirButton, NoirInput } from './noir'

type GateView = 'signup' | 'code'

interface Props {
  onAccessGranted: () => void
}

const CODE_LENGTH = 14

export default function AccessGate({ onAccessGranted }: Props) {
  const savedEmail = localStorage.getItem('dancefloor_email')
  const [view, setView] = useState<GateView>(savedEmail ? 'code' : 'signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [shaking, setShaking] = useState(false)
  const codeInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (view === 'signup') nameInputRef.current?.focus()
    else codeInputRef.current?.focus()
  }, [view])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSubmitting(true)
    setError('')
    const result = await submitSignup(email.trim(), name.trim())
    setSubmitting(false)
    if (result.ok) {
      localStorage.setItem('dancefloor_email', email.trim())
      setView('code')
    } else {
      setError(result.error || 'Something went wrong.')
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const valid = await validateAccessCode(code.trim().toUpperCase())
      if (valid) {
        sessionStorage.setItem('dancefloor_access', 'true')
        onAccessGranted()
      } else {
        setShaking(true)
        setTimeout(() => { setShaking(false); setCode(''); codeInputRef.current?.focus() }, 600)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex flex-col items-center gap-6 px-5 md:px-8 max-w-[420px] mx-auto">
      {view === 'signup' ? (
        <>
          <NoirHeading size="md" className="text-center">Be the first to know</NoirHeading>
          <NoirText muted size="sm" className="text-center">
            Sign up to get notified and potentially get early access.
          </NoirText>

          <form onSubmit={handleSignup} className="w-full flex flex-col gap-4 mt-2">
            <NoirInput
              ref={nameInputRef}
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <NoirInput
              type="email"
              placeholder="Your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <NoirButton
              type="submit"
              fullWidth
              disabled={submitting || !name.trim() || !email.trim()}
            >
              {submitting ? 'Submitting...' : 'Notify Me'}
            </NoirButton>
          </form>

          {error && (
            <NoirText size="xs" className="text-red-400/80 tracking-wider">{error}</NoirText>
          )}

          <button
            onClick={() => setView('code')}
            className="font-body text-[11px] text-noir-text-muted/50 hover:text-noir-accent transition-colors duration-200 uppercase tracking-[0.15em] mt-2"
          >
            Already have an early access code?
          </button>
        </>
      ) : (
        <>
          <NoirHeading size="md" className="text-center">Enter Access Code</NoirHeading>
          <NoirText muted size="sm" className="text-center">
            Enter your early access code to unlock the globe.
          </NoirText>

          <form onSubmit={handleCodeSubmit} className={`w-full flex flex-col gap-4 mt-2 ${shaking ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}>
            <NoirInput
              ref={codeInputRef}
              type="text"
              placeholder="ACCESS CODE"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={CODE_LENGTH}
              className="text-center font-mono tracking-[0.3em] uppercase text-[16px] placeholder:tracking-[0.15em]"
            />
            <NoirButton
              type="submit"
              fullWidth
              disabled={submitting || !code.trim()}
            >
              {submitting ? 'Verifying...' : 'Unlock'}
            </NoirButton>
          </form>

          {error && (
            <NoirText size="xs" className="text-red-400/80 tracking-wider">{error}</NoirText>
          )}

          {!savedEmail && (
            <button
              onClick={() => setView('signup')}
              className="font-body text-[11px] text-noir-text-muted/50 hover:text-noir-accent transition-colors duration-200 uppercase tracking-[0.15em] mt-2"
            >
              Don&apos;t have a code? Sign up instead
            </button>
          )}

          <NoirText size="xs" className="text-noir-text-muted/30 text-center mt-2">
            No code yet? We&apos;ll be in touch.
          </NoirText>
        </>
      )}
    </div>
  )
}
