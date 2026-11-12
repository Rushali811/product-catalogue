import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from '../src/components/ProductCard';

const product = {
  id: 7,
  title: 'Red Backpack',
  description: 'desc',
  price: 55,
  category: "men's clothing",
  image: 'https://example.com/7.jpg',
  rating: { rate: 4.5, count: 10 },
};

describe('ProductCard', () => {
  it('shows a "Top rated" badge when featured', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} featured />
      </MemoryRouter>,
    );
    expect(screen.getByText(/top rated/i)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/7');
    expect(screen.getByText('$55.00')).toBeInTheDocument();
  });

  it('does not show the badge when not featured', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/top rated/i)).not.toBeInTheDocument();
  });
});
