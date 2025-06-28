'use client'

import { forwardRef, useEffect, useRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useKeyboard } from '@/lib/keyboard'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

let inputIdCounter = 0

interface KeyboardInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

export const KeyboardInput = forwardRef<HTMLInputElement, KeyboardInputProps>(
  ({ onFocus, onBlur, className, ...props }, ref) => {
    const inputId = useRef(`keyboard-input-${++inputIdCounter}`)
    const { requestPassthrough, releasePassthrough } = useKeyboard()

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      requestPassthrough(inputId.current)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      releasePassthrough(inputId.current)
      onBlur?.(e)
    }

    useEffect(() => {
      const id = inputId.current
      // Cleanup on unmount
      return () => {
        releasePassthrough(id)
      }
    }, [releasePassthrough])

    return (
      <input
        ref={ref}
        className={cn(className)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
KeyboardInput.displayName = 'KeyboardInput'

interface KeyboardTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
}

export const KeyboardTextarea = forwardRef<HTMLTextAreaElement, KeyboardTextareaProps>(
  ({ onFocus, onBlur, className, ...props }, ref) => {
    const inputId = useRef(`keyboard-textarea-${++inputIdCounter}`)
    const { requestPassthrough, releasePassthrough } = useKeyboard()

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      requestPassthrough(inputId.current)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      releasePassthrough(inputId.current)
      onBlur?.(e)
    }

    useEffect(() => {
      const id = inputId.current
      // Cleanup on unmount
      return () => {
        releasePassthrough(id)
      }
    }, [releasePassthrough])

    return (
      <Textarea
        ref={ref}
        className={className}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    )
  }
)
KeyboardTextarea.displayName = 'KeyboardTextarea'