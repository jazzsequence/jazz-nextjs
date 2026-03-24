import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostBodyImage from '@/components/PostBodyImage';

describe('PostBodyImage', () => {
  it('renders the image with src and alt', () => {
    render(<PostBodyImage src="https://example.com/image.jpg" alt="Test image" />);
    expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument();
  });

  it('hides the image when it errors (returns null)', () => {
    render(<PostBodyImage src="https://example.com/broken.jpg" alt="Broken" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('passes className through to the img element', () => {
    render(<PostBodyImage src="https://example.com/image.jpg" alt="Image" className="aligncenter" />);
    expect(screen.getByRole('img')).toHaveClass('aligncenter');
  });

  it('passes width and height through to the img element', () => {
    render(<PostBodyImage src="https://example.com/image.jpg" alt="Image" width={500} height={661} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('width', '500');
    expect(img).toHaveAttribute('height', '661');
  });

  it('renders with empty alt when alt is not provided', () => {
    const { container } = render(<PostBodyImage src="https://example.com/image.jpg" />);
    // alt="" makes the img role "presentation" — query directly
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('does not render placeholder before any error', () => {
    const { container } = render(<PostBodyImage src="https://example.com/image.jpg" alt="Image" />);
    // Should only contain the img, nothing else
    expect(container.firstChild?.nodeName).toBe('IMG');
  });
});
