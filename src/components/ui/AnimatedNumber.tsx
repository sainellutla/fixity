import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

export function AnimatedNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20 })
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      return
    }
    motionValue.set(value)
  }, [value, motionValue, reduceMotion])

  useEffect(() => {
    if (reduceMotion) return
    const unsubscribe = spring.on('change', (v) => setDisplay(Math.round(v)))
    return unsubscribe
  }, [spring, reduceMotion])

  return (
    <motion.span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {display}
    </motion.span>
  )
}
