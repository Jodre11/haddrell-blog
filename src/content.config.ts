import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const postFields = {
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().trim().toLowerCase()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
};

const essays = defineCollection({
    loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
    schema: z.object(postFields),
});

const builds = defineCollection({
    loader: glob({ base: './src/content/builds', pattern: '**/*.{md,mdx}' }),
    schema: z.object({
        ...postFields,
        number: z.number().int().positive(),
    }),
});

export const collections = { essays, builds };
