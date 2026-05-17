'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

import { AuthGuard } from '@/components/auth-guard'
import { apiFetch, type PublicUser } from '@/lib/frontend-api'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.user.id) return

    apiFetch<PublicUser>(`/api/users/${session.user.id}`)
      .then((response) => {
        setProfile(response.data)
        setUsername(response.data.username)
        setName(response.data.name ?? '')
        setBio(response.data.bio ?? '')
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load profile'))
  }, [session?.user.id])

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    try {
      const response = await apiFetch<PublicUser>('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          username,
          name: name.trim() || null,
          bio: bio.trim() || null,
        }),
      })
      setProfile(response.data)
      await update()
      setMessage('Profile updated')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update profile')
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)

    try {
      await apiFetch('/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setCurrentPassword('')
      setNewPassword('')
      setMessage('Password updated')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update password')
    }
  }

  return (
    <AuthGuard>
      <section className="page-shell two-column">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Settings</h1>
          {profile ? <p className="muted">Signed in as {profile.username}</p> : null}
          {message ? <p className="form-success">{message}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <div className="stack">
          <form className="editor-form surface" onSubmit={saveProfile}>
            <h2>Profile</h2>
            <label>
              Username
              <input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} />
            </label>
            <label>
              Display name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Bio
              <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={5} maxLength={500} />
            </label>
            <button type="submit" className="primary-button">
              Save profile
            </button>
          </form>

          <form className="editor-form surface" onSubmit={savePassword}>
            <h2>Password</h2>
            <label>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                maxLength={72}
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                maxLength={72}
              />
            </label>
            <button type="submit" className="primary-button">
              Change password
            </button>
          </form>
        </div>
      </section>
    </AuthGuard>
  )
}
