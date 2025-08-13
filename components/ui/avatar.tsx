import React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ className, size = 'md', children, ...props }: AvatarProps) {
  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  }
  
  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <img
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  )
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
