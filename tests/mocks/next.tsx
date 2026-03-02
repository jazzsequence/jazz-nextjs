import React from 'react';

// Mock Next.js Image component
export const Image = ({
  src,
  alt,
  fill,
  ...props
}: {
  src: string;
  alt: string;
  fill?: boolean;
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
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return <a href={href}>{children}</a>;
};
