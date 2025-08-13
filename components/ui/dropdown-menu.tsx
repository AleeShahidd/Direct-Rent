import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === DropdownMenuTrigger) {
            const childProps = child.props as any
            return React.cloneElement(child, { 
              onClick: () => setIsOpen(!isOpen),
              isOpen,
              className: `${childProps.className || ''} ${isOpen ? 'dropdown-open' : ''}`.trim()
            } as any)
          }
          if (child.type === DropdownMenuContent) {
            return isOpen ? React.cloneElement(child, { 
              onClose: () => setIsOpen(false) 
            } as any) : null
          }
        }
        return child
      })}
    </div>
  )
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  onClick?: () => void
  isOpen?: boolean
}

export function DropdownMenuTrigger({ 
  children, 
  asChild = false,
  onClick,
  isOpen 
}: DropdownMenuTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        e.preventDefault()
        onClick?.()
        const childProps = children.props as any
        if (childProps.onClick && typeof childProps.onClick === 'function') {
          childProps.onClick(e)
        }
      },
      'aria-expanded': isOpen,
      'aria-haspopup': true
    } as any)
  }
  
  return (
    <button
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup={true}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  onClose?: () => void
}

export function DropdownMenuContent({ 
  children, 
  className,
  align = 'start',
  onClose
}: DropdownMenuContentProps) {
  const alignmentStyles = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  }
  
  return (
    <div
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 shadow-lg',
        alignmentStyles[align],
        'top-full mt-2',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
        className
      )}
      role="menu"
      aria-orientation="vertical"
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === DropdownMenuItem) {
          return React.cloneElement(child, { 
            onClose 
          } as any)
        }
        return child
      })}
    </div>
  )
}

export interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  onClose?: () => void
}

export function DropdownMenuItem({ 
  children, 
  className,
  onClick,
  onClose 
}: DropdownMenuItemProps) {
  const handleClick = () => {
    onClick?.()
    onClose?.()
  }

  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      onClick={handleClick}
      role="menuitem"
    >
      {children}
    </div>
  )
}

export interface DropdownMenuSeparatorProps {
  className?: string
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <div className={cn('-mx-1 my-1 h-px bg-gray-200', className)} role="separator" />
}
