import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string
}

export function Select({ className, children, placeholder, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  )
}

export interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode
}

export function SelectItem({ children, ...props }: SelectItemProps) {
  return <option {...props}>{children}</option>
}

// Compatibility exports for different naming conventions
export const SelectTrigger = Select
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SelectValue = ({ placeholder: _placeholder }: { placeholder?: string }) => null
