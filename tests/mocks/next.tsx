import React from 'react';

// Mock Next.js Image component
export const Image = ({
  src,
  alt,
  fill,
  priority,  // next/image prop — not a valid HTML attribute
  sizes,     // next/image prop — not a valid HTML attribute
  ...props
}: {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  [key: string]: unknown;
}) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-testid="next-image"
      data-fill={fill}
      {...props}
    />
  );
};

// Mock Next.js Link component
export const Link = ({
  children,
  href,
  ...props
}: {
  children: React.ReactNode;
  href: string;
  [key: string]: unknown;
}) => {
  return <a href={href} {...props}>{children}</a>;
};
