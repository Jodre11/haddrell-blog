// @ts-check
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
    site: 'https://www.haddrell.co.uk',
    integrations: [mdx(), sitemap()],
    fonts: [
        {
            provider: fontProviders.local(),
            name: 'IBM Plex Sans',
            cssVariable: '--font-sans',
            fallbacks: ['system-ui', 'sans-serif'],
            options: {
                variants: [
                    { src: ['./src/assets/fonts/IBMPlexSans-Regular.woff2'], weight: 400, style: 'normal', display: 'swap' },
                    { src: ['./src/assets/fonts/IBMPlexSans-Italic.woff2'], weight: 400, style: 'italic', display: 'swap' },
                    { src: ['./src/assets/fonts/IBMPlexSans-SemiBold.woff2'], weight: 600, style: 'normal', display: 'swap' },
                ],
            },
        },
        {
            provider: fontProviders.local(),
            name: 'IBM Plex Mono',
            cssVariable: '--font-mono',
            fallbacks: ['ui-monospace', 'monospace'],
            options: {
                variants: [
                    { src: ['./src/assets/fonts/IBMPlexMono-Regular.woff2'], weight: 400, style: 'normal', display: 'swap' },
                    { src: ['./src/assets/fonts/IBMPlexMono-SemiBold.woff2'], weight: 600, style: 'normal', display: 'swap' },
                ],
            },
        },
    ],
});
