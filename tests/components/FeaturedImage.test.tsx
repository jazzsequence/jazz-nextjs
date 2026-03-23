import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FeaturedImage from '@/components/FeaturedImage';

describe('FeaturedImage', () => {
  it('renders the image with the provided src and alt', () => {
    render(<FeaturedImage src="https://cdn.example.com/image.jpg" alt="A test image" />);
    expect(screen.getByRole('img', { name: 'A test image' })).toBeInTheDocument();
  });

  it('removes the image and shows fallback when image errors', () => {
    render(<FeaturedImage src="https://example.com/broken.jpg" alt="Broken image" />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('featured-image-placeholder')).toBeInTheDocument();
  });

  it('passes alt text through to the img element', () => {
    render(<FeaturedImage src="https://cdn.example.com/photo.jpg" alt="Custom alt text" />);
    expect(screen.getByAltText('Custom alt text')).toBeInTheDocument();
  });

  it('does not show the placeholder before any error', () => {
    render(<FeaturedImage src="https://cdn.example.com/image.jpg" alt="Image" />);
    expect(screen.queryByTestId('featured-image-placeholder')).not.toBeInTheDocument();
  });
});
