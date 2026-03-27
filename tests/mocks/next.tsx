import React from 'react';

// Mock Next.js Image component
export const Image = ({
  src,
  alt,
  fill,
  priority,
  sizes: _sizes,        // next/image prop — destructured to prevent spreading non-HTML attribute to <img>
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
      // Expose priority as data-priority so tests can assert the prop is passed.
      // The real next/image translates priority=true → fetchpriority="high" + <link rel="preload">,
      // but that doesn't happen in the test environment.
      data-priority={priority ? 'true' : undefined}
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
