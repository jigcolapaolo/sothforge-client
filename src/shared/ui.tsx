'use client'

import type { ReactNode } from 'react'
import { Boxes, Shield } from 'lucide-react'
import { ApiError } from '@/lib/api'

export function ErrorMessage({ error }: { error: unknown }) {
  const message =
    error instanceof ApiError && error.status === 403
      ? 'No tienes permisos para consultar este recurso.'
      : error instanceof Error
        ? error.message
        : 'No se pudo cargar la información.'
  return (
    <div className="error">
      <Shield size={16} />
      {message}
    </div>
  )
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Boxes size={22} />
      <span>{text}</span>
    </div>
  )
}
export function formatLabel(value?: string) {
  return value?.replaceAll('_', ' ') ?? 'Sin estado'
}
export function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="metric">
      <span>{icon}</span>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}
