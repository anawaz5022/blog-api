'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

import { apiFetch } from '@/lib/frontend-api'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          username,
          name: name.trim() || undefined,
          password,
        }),
      })

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        router.push('/login')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Unable to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <span className="eyebrow">Start writing</span>
        <h1>Create account</h1>
        <form className="editor-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase())}
              minLength={3}
              maxLength={30}
              required
            />
          </label>
          <label>
            Display name
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={72}
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="auth-link">
          Already registered? <Link href="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}
