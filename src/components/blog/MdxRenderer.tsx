'use client';

// next-contentlayer may not provide TS types in this environment — ignore
// @ts-expect-error next-contentlayer may not expose types in this build environment
import { useMDXComponent } from 'next-contentlayer/hooks';

import mdxComponents from '@/components/MDXContent';

export default function MdxRenderer({ code }: { code: string }) {
 const MDX = useMDXComponent(code);
 return <MDX components={mdxComponents as Record<string, unknown>} />;
}
