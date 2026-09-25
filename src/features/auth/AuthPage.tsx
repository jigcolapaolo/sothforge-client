'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { Field } from '@/shared/ui'

export function AuthPage({ register = false }: { register?: boolean }) {
  const { login, register: signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    setBusy(true)
    try {
      if (register) await signUp(form.username, form.email, form.password)
      else await login(form.email, form.password)
      navigate('/app')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo completar la operación.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-panel">
        <div className="brand">
          <Image className="brand-icon" src="/SothForgeIcon.webp" alt="" width={29} height={29} />
          <span>SothForge</span>
        </div>
        <div className="eyebrow">Organiza el trabajo de tu equipo</div>
        <h1>{register ? 'Crea tu espacio de trabajo.' : 'Tu trabajo, en movimiento.'}</h1>
        <p className="muted">
          Gestiona organizaciones, proyectos y tareas desde un solo espacio de trabajo.
        </p>
        <form onSubmit={submit} className="form">
          {register && (
            <Field
              label="Nombre de usuario"
              value={form.username}
              onChange={(value) => setForm({ ...form, username: value })}
              placeholder="tu_usuario"
            />
          )}
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => setForm({ ...form, email: value })}
            placeholder="tu@equipo.com"
          />
          <Field
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={(value) => setForm({ ...form, password: value })}
            placeholder="Mínimo 8 caracteres"
          />
          {error && <div className="form-error">{error}</div>}
          <button className="primary wide" disabled={busy}>
            {busy ? 'Conectando...' : register ? 'Crear cuenta' : 'Entrar'} <ArrowRight size={16} />
          </button>
        </form>
        <p className="switch">
          {register ? '¿Ya tienes cuenta?' : '¿Primera vez en SothForge?'}{' '}
          <Link to={register ? '/login' : '/register'}>
            {register ? 'Inicia sesión' : 'Regístrate'}
          </Link>
        </p>
      </div>
      <div className="auth-visual">
        <div className="visual-grid" />
        <div className="visual-copy">
          <span className="pill">Trabajo en equipo</span>
          <h2>Del contexto a la acción sin perder el hilo.</h2>
          <p>Todo lo que tu equipo necesita para avanzar con claridad y ritmo.</p>
        </div>
      </div>
    </main>
  )
}
