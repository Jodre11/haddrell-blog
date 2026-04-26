import type { BlogPosting, Person, PersonLeaf, WebSite, WithContext } from 'schema-dts';
import { AUTHOR_NAME, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '../consts';

// PersonLeaf (not Person) so the `Person | string` union doesn't break ...AUTHOR spreads (TS2698).
const AUTHOR: PersonLeaf = {
    '@type': 'Person',
    name: AUTHOR_NAME,
    url: SITE_URL,
    sameAs: ['https://www.linkedin.com/in/christian-haddrell/'],
};

export function websiteSchema(): WithContext<WebSite> {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        author: AUTHOR,
    };
}

export function personSchema(): WithContext<Person> {
    return {
        '@context': 'https://schema.org',
        ...AUTHOR,
    };
}

interface BlogPostingInput {
    title: string;
    description: string;
    url: string;
    pubDate: Date;
    updatedDate?: Date;
    tags: string[];
    imageUrl?: string;
}

export function blogPostingSchema(input: BlogPostingInput): WithContext<BlogPosting> {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: input.title,
        description: input.description,
        datePublished: input.pubDate.toISOString(),
        dateModified: (input.updatedDate ?? input.pubDate).toISOString(),
        author: AUTHOR,
        keywords: input.tags.join(', '),
        mainEntityOfPage: input.url,
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
    };
}

export function serializeJsonLd(schema: object): string {
    return JSON.stringify(schema).replace(/</g, '\\u003c').replace(/\//g, '\\/');
}
