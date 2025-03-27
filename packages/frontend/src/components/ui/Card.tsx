import React from 'react'
import { cn } from '@utils/classnames'

export interface CardProps {
  className?: string
  children: React.ReactNode
  bordered?: boolean
  shadowed?: boolean
  hoverable?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  bordered = false,
  shadowed = true,
  hoverable = false,
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden'
  const borderedClass = bordered ? 'border border-gray-200' : ''
  const shadowedClass = shadowed ? 'shadow-md' : ''
  const hoverableClass = hoverable
    ? 'transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1'
    : ''
  const cursorClass = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={cn(
        baseClasses,
        borderedClass,
        shadowedClass,
        hoverableClass,
        cursorClass,
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardBodyProps {
  className?: string
  children: React.ReactNode
}

export const CardBody: React.FC<CardBodyProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export const CardFooter: React.FC<CardFooterProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4 border-t border-gray-200', className)} {...props}>
      {children}
    </div>
  )
}

export interface CardTitleProps {
  className?: string
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const CardTitle: React.FC<CardTitleProps> = ({
  className,
  children,
  as: Component = 'h3',
  ...props
}) => {
  return (
    <Component className={cn('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </Component>
  )
}

export default Object.assign(Card, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Title: CardTitle,
})