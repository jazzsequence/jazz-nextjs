/**
 * WordPress Greeting Block Fetcher
 *
 * Fetches and parses personalized greeting variants from jazzsequence.com homepage.
 * Integrates with Altis Accelerate personalization system.
 */

import { decode } from 'html-entities';

export interface GreetingVariant {
  audienceId: number | null;
  isFallback: boolean;
  heading: string;
  content: string;
}

/**
 * Fetch greeting block variants from WordPress homepage.
 *
 * Parses `<template>` tags with data-parent-id="16738" (greeting block ID).
 * Returns all variants including fallback and audience-targeted versions.
 *
 * @returns Array of greeting variants
 */
export async function fetchGreetingVariants(): Promise<GreetingVariant[]> {
  try {
    const response = await fetch('https://jazzsequence.com/');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Parse all template tags with data-parent-id="16738"
    const templates = extractTemplates(html);

    return templates.map(template => parseTemplate(template));
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch greeting variants');
  }
}

/**
 * Extract template tags from HTML string.
 */
function extractTemplates(html: string): string[] {
  const templates: string[] = [];
  const regex = /<template[^>]*data-parent-id="16738"[^>]*>[\s\S]*?<\/template>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    templates.push(match[0]);
  }

  return templates;
}

/**
 * Parse a single template tag into a GreetingVariant.
 */
function parseTemplate(templateHtml: string): GreetingVariant {
  // Check if this is the fallback variant
  const isFallback = templateHtml.includes('data-fallback');

  // Extract audience ID if present
  const audienceMatch = templateHtml.match(/data-audience="(\d+)"/);
  const audienceId = audienceMatch ? parseInt(audienceMatch[1], 10) : null;

  // Extract heading (h2 tag)
  // Using [\s\S] instead of . with /s flag for ES5 compatibility
  const headingMatch = templateHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  const heading = headingMatch ? decode(headingMatch[1].trim(), { level: 'html5' }) : '';

  // Extract all paragraph content
  const paragraphs: string[] = [];
  // Using [\s\S] instead of . with /gs flags for ES5 compatibility
  const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let paragraphMatch;

  while ((paragraphMatch = paragraphRegex.exec(templateHtml)) !== null) {
    // Preserve HTML tags in content but decode entities
    const paragraphContent = paragraphMatch[1].trim();
    paragraphs.push(decode(paragraphContent, { level: 'html5' }));
  }

  const content = paragraphs.join('\n\n');

  return {
    audienceId,
    isFallback,
    heading,
    content,
  };
}
