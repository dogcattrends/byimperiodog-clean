import { defineDocumentType, makeSource } from '@contentlayer/source-files';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

// Observação: os resolvers de computedFields usam cast interno para compatibilidade de tipos do Contentlayer.

export const Post = defineDocumentType(() => ({
 name: 'Post',
 filePathPattern: `posts/**/*.mdx`,
 contentType: 'mdx',
 fields: {
 title: { type: 'string', required: true },
 description: { type: 'string', required: true },
 date: { type: 'date', required: true },
 updated: { type: 'date', required: false },
 cover: { type: 'string', required: false },
 tags: { type: 'list', of: { type: 'string' }, required: false },
 category: { type: 'string', required: false },
 author: { type: 'string', required: false },
 },
 computedFields: {
 slug: {
 type: 'string',
 resolve: (doc) => {
 const d = doc as unknown as { _raw?: { sourceFileName?: string } };
 const name = d._raw?.sourceFileName || '';
 return name.replace(/\.mdx$/, '');
 },
 },
 url: {
 type: 'string',
 resolve: (doc) => {
 const d = doc as unknown as { _raw?: { sourceFileName?: string } };
 const name = d._raw?.sourceFileName || '';
 return `/blog/${name.replace(/\.mdx$/, '')}`;
 },
 },
 readingTime: {
 type: 'number',
 resolve: (doc) => {
 const d = doc as unknown as { body?: { raw?: string } };
 const text = (d.body?.raw || '') as string;
 const words = text.split(/\s+/).filter(Boolean).length;
 return Math.max(1, Math.round(words / 200));
 },
 },
 },
}));

export default makeSource({
 contentDirPath: 'content',
 // Disable noisy warning about path alias when TS paths are not configured
 disableImportAliasWarning: true,
 documentTypes: [Post],
 mdx: {
 remarkPlugins: [remarkGfm],
 rehypePlugins: [
 rehypeSlug,
 [rehypeAutolinkHeadings, { behavior: 'wrap' }],
 // Wrapper para evitar erro de tipo entre múltiplas versões de vfile
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 [rehypePrettyCode as unknown as any, { theme: 'github-dark' }],
 ],
 },
});
