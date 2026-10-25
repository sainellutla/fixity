import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'default' | 'primary' | 'ghost' | 'soft' | 'alert' | 'success' | 'paper'
type Size = 'default' | 'lg' | 'xl'

const VARIANT_CLASS: Record<Variant, string> = {
  default: 'cl-btn',
  primary: 'cl-btn cl-btn-primary',
  ghost: 'cl-btn cl-btn-ghost',
  soft: 'cl-btn cl-btn-soft',
  alert: 'cl-btn cl-btn-alert',
  success: 'cl-btn cl-btn-success',
  paper: 'cl-btn cl-btn-paper',
}

const SIZE_CLASS: Record<Size, string> = {
  default: '',
  lg: 'cl-btn-lg',
  xl: 'cl-btn-xl',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'default', size = 'default', full, icon, className = '', children, ...rest }: ButtonProps) {
  const classes = [VARIANT_CLASS[variant], SIZE_CLASS[size], full ? 'full' : '', className].filter(Boolean).join(' ')
  return (
    <button className={classes} {...rest}>
      {icon}
      {children}
    </button>
  )
}
