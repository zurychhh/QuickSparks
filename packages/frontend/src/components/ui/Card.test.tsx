import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from './Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div data-testid="card-content">Test Content</div>
      </Card>
    );
    
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies className correctly', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Content</div>
      </Card>
    );
    
    const cardElement = container.firstChild;
    expect(cardElement).toHaveClass('custom-class');
  });

  it('applies bordered prop correctly', () => {
    const { container: borderedContainer } = render(
      <Card bordered>
        <div>Content</div>
      </Card>
    );
    
    const { container: nonBorderedContainer } = render(
      <Card bordered={false}>
        <div>Content</div>
      </Card>
    );
    
    expect(borderedContainer.firstChild).toHaveClass('border');
    expect(borderedContainer.firstChild).toHaveClass('border-gray-200');
    expect(nonBorderedContainer.firstChild).not.toHaveClass('border');
    expect(nonBorderedContainer.firstChild).not.toHaveClass('border-gray-200');
  });

  it('applies shadowed prop correctly', () => {
    const { container: shadowedContainer } = render(
      <Card shadowed>
        <div>Content</div>
      </Card>
    );
    
    const { container: nonShadowedContainer } = render(
      <Card shadowed={false}>
        <div>Content</div>
      </Card>
    );
    
    expect(shadowedContainer.firstChild).toHaveClass('shadow-md');
    expect(nonShadowedContainer.firstChild).not.toHaveClass('shadow-md');
  });

  it('applies hoverable prop correctly', () => {
    const { container: hoverableContainer } = render(
      <Card hoverable>
        <div>Content</div>
      </Card>
    );
    
    const { container: nonHoverableContainer } = render(
      <Card hoverable={false}>
        <div>Content</div>
      </Card>
    );
    
    expect(hoverableContainer.firstChild).toHaveClass('transition-all');
    expect(hoverableContainer.firstChild).toHaveClass('hover:shadow-lg');
    expect(nonHoverableContainer.firstChild).not.toHaveClass('transition-all');
    expect(nonHoverableContainer.firstChild).not.toHaveClass('hover:shadow-lg');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    
    render(
      <Card onClick={handleClick}>
        <div>Clickable Content</div>
      </Card>
    );
    
    fireEvent.click(screen.getByText('Clickable Content'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies the cursor-pointer class when onClick is provided', () => {
    const handleClick = vi.fn();
    
    const { container: clickableContainer } = render(
      <Card onClick={handleClick}>
        <div>Clickable Content</div>
      </Card>
    );
    
    const { container: nonClickableContainer } = render(
      <Card>
        <div>Non-Clickable Content</div>
      </Card>
    );
    
    expect(clickableContainer.firstChild).toHaveClass('cursor-pointer');
    expect(nonClickableContainer.firstChild).not.toHaveClass('cursor-pointer');
  });

  describe('Card.Header', () => {
    it('renders children correctly', () => {
      render(
        <Card.Header>
          <div data-testid="header-content">Header Content</div>
        </Card.Header>
      );
      
      expect(screen.getByTestId('header-content')).toBeInTheDocument();
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies className correctly', () => {
      const { container } = render(
        <Card.Header className="custom-header-class">
          <div>Header Content</div>
        </Card.Header>
      );
      
      const headerElement = container.firstChild;
      expect(headerElement).toHaveClass('custom-header-class');
    });
  });

  describe('Card.Body', () => {
    it('renders children correctly', () => {
      render(
        <Card.Body>
          <div data-testid="body-content">Body Content</div>
        </Card.Body>
      );
      
      expect(screen.getByTestId('body-content')).toBeInTheDocument();
      expect(screen.getByText('Body Content')).toBeInTheDocument();
    });

    it('applies className correctly', () => {
      const { container } = render(
        <Card.Body className="custom-body-class">
          <div>Body Content</div>
        </Card.Body>
      );
      
      const bodyElement = container.firstChild;
      expect(bodyElement).toHaveClass('custom-body-class');
    });
  });

  describe('Card.Footer', () => {
    it('renders children correctly', () => {
      render(
        <Card.Footer>
          <div data-testid="footer-content">Footer Content</div>
        </Card.Footer>
      );
      
      expect(screen.getByTestId('footer-content')).toBeInTheDocument();
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('applies className correctly', () => {
      const { container } = render(
        <Card.Footer className="custom-footer-class">
          <div>Footer Content</div>
        </Card.Footer>
      );
      
      const footerElement = container.firstChild;
      expect(footerElement).toHaveClass('custom-footer-class');
    });
  });

  describe('Card.Title', () => {
    it('renders children correctly', () => {
      render(
        <Card.Title>
          Card Title
        </Card.Title>
      );
      
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('applies className correctly', () => {
      const { container } = render(
        <Card.Title className="custom-title-class">
          Card Title
        </Card.Title>
      );
      
      const titleElement = container.firstChild;
      expect(titleElement).toHaveClass('custom-title-class');
    });

    it('renders as different heading elements', () => {
      const { container: h1Container } = render(
        <Card.Title as="h1">H1 Title</Card.Title>
      );
      
      const { container: h4Container } = render(
        <Card.Title as="h4">H4 Title</Card.Title>
      );
      
      expect(h1Container.querySelector('h1')).toBeInTheDocument();
      expect(h4Container.querySelector('h4')).toBeInTheDocument();
    });

    it('defaults to h3 when no as prop is provided', () => {
      const { container } = render(
        <Card.Title>Default Title</Card.Title>
      );
      
      expect(container.querySelector('h3')).toBeInTheDocument();
    });
  });

  it('renders a full card with nested components correctly', () => {
    render(
      <Card className="full-card-test">
        <Card.Header>
          <Card.Title>Test Card</Card.Title>
        </Card.Header>
        <Card.Body>
          <p data-testid="card-paragraph">Card Content</p>
        </Card.Body>
        <Card.Footer>
          <button data-testid="card-button">Action</button>
        </Card.Footer>
      </Card>
    );
    
    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByTestId('card-paragraph')).toBeInTheDocument();
    expect(screen.getByTestId('card-button')).toBeInTheDocument();
  });
});