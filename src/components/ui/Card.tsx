import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  onLight?: boolean
}

export function Card({ onLight, className = '', ...rest }: CardProps) {
  const classes = ['cl-card', onLight ? 'on-light' : '', className].filter(Boolean).join(' ')
  return <div className={classes} {...rest} />
}
