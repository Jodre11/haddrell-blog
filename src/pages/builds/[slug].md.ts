import type { APIRoute } from 'astro';
import { buildMarkdownResponse, getPostStaticPaths, type Post } from '../../lib/posts';

export const getStaticPaths = () => getPostStaticPaths('builds');

export const GET: APIRoute = ({ props }) => buildMarkdownResponse(props as Post);
