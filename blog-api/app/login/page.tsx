'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setIsSubmitting(false)

    if (result?.error) {
      setError('Invalid email or password')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <span className="eyebrow">Welcome back</span>
        <h1>Log in</h1>
        <form className="editor-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              maxLength={72}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="auth-link">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </div>
    </section>
  )
}
