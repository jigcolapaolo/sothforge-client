'use client'

import { useState } from 'react'
import { Check, LogOut, Save } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ErrorMessage, Field, PageIntro } from '@/shared/ui'

export function ProfilePage() {
  const { user, updateUser, logoutAll } = useAuth()
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<unknown>()
  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    try {
      const updated = await usersApi.update({ username, email })
      updateUser(updated)
      setMessage('Tus datos se actualizaron correctamente.')
    } catch (cause) {
      setError(cause)
    }
  }
  async function changePassword(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    try {
      await usersApi.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setMessage('Tu contraseña se actualizó correctamente.')
    } catch (cause) {
      setError(cause)
    }
  }
  async function closeSessions() {
    if (!window.confirm('¿Cerrar todas las sesiones activas?')) return
    await logoutAll()
  }
  return (
    <>
      <PageIntro
        eyebrow="Tu cuenta"
        title="Perfil"
        description="Actualiza tus datos personales y protege el acceso a tu cuenta."
      />
      {error && <ErrorMessage error={error} />}
      {message && (
        <div className="success-message">
          <Check size={16} />
          {message}
        </div>
      )}
      <div className="section-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Datos personales</span>
              <h2>Tu información</h2>
            </div>
          </div>
          <form onSubmit={saveProfile} className="form-stack">
            <Field
              label="Nombre de usuario"
              value={username}
              onChange={setUsername}
              placeholder="Tu nombre"
            />
            <Field
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="tu@equipo.com"
            />
            <button className="primary">
              <Save size={16} />
              Guardar cambios
            </button>
          </form>
          <div className="danger-actions">
            <button className="secondary-action" onClick={closeSessions}>
              <LogOut size={15} />
              Cerrar todas las sesiones
            </button>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">Seguridad</span>
              <h2>Cambiar contraseña</h2>
            </div>
          </div>
          <form onSubmit={changePassword} className="form-stack">
            <Field
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Tu contraseña actual"
            />
            <Field
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Mínimo 8 caracteres"
            />
            <button className="primary">
              <Save size={16} />
              Actualizar contraseña
            </button>
          </form>
        </section>
      </div>
    </>
  )
}
