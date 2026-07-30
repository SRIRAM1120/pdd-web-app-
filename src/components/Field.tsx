import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  error?: string
}

export function Field({ label, icon, error, type, ...props }: FieldProps) {
  const [visible, setVisible] = useState(false)
  const password = type === 'password'
  return <label className="field">
    <span className="field-label">{label}</span>
    <span className={`input-wrap ${error ? 'input-error' : ''}`}>
      {icon && <span className="input-icon">{icon}</span>}
      <input type={password && visible ? 'text' : type} aria-invalid={!!error} {...props} />
      {password && <button className="icon-button password-toggle" type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>}
    </span>
    {error && <span className="field-error" role="alert">{error}</span>}
  </label>
}
