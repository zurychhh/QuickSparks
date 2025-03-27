import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary-600')
  })
  
  it('applies different variants correctly', () => {
    render(
      <>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="danger">Danger</Button>
      </>
    )
    
    expect(screen.getByRole('button', { name: /primary/i })).toHaveClass('bg-primary-600')
    expect(screen.getByRole('button', { name: /secondary/i })).toHaveClass('bg-secondary-600')
    expect(screen.getByRole('button', { name: /outline/i })).toHaveClass('border-gray-300')
    expect(screen.getByRole('button', { name: /ghost/i })).toHaveClass('bg-transparent')
    expect(screen.getByRole('button', { name: /link/i })).toHaveClass('text-primary-600')
    expect(screen.getByRole('button', { name: /danger/i })).toHaveClass('bg-error-600')
  })
  
  it('applies different sizes correctly', () => {
    render(
      <>
        <Button size="xs">Extra Small</Button>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
        <Button size="xl">Extra Large</Button>
      </>
    )
    
    expect(screen.getByRole('button', { name: /extra small/i })).toHaveClass('text-xs')
    expect(screen.getByRole('button', { name: /small/i })).toHaveClass('text-sm')
    expect(screen.getByRole('button', { name: /medium/i })).toHaveClass('text-sm')
    expect(screen.getByRole('button', { name: /large/i })).toHaveClass('text-base')
    expect(screen.getByRole('button', { name: /extra large/i })).toHaveClass('text-lg')
  })
  
  it('shows loading state correctly', () => {
    render(<Button isLoading>Loading</Button>)
    
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.getByRole('button')).toContainElement(screen.getByRole('svg'))
  })
  
  it('applies fullWidth correctly', () => {
    render(<Button fullWidth>Full Width</Button>)
    
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })
})