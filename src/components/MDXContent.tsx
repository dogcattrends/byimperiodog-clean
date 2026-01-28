/* eslint-disable jsx-a11y/heading-has-content */
import Image from "next/image";
import Link from "next/link";
import React from "react";

type MDXProps = { [key: string]: unknown; children?: React.ReactNode; className?: string };

const toHtmlAttrs = (p: MDXProps) => p as unknown as React.HTMLAttributes<HTMLElement>;

export const mdxComponents = {
 // Links use Next.js Link for internal routes; external fall back to <a>
 a: function A({ href = "", children, ...props }: MDXProps) {
 const p = props as MDXProps;
 const isInternal = String(href)?.startsWith("/") || String(href)?.startsWith(process.env.NEXT_PUBLIC_SITE_URL || "");
 if (isInternal) {
 const to = String(href).replace(process.env.NEXT_PUBLIC_SITE_URL || "", "");
 return (
 <Link href={to} {...(toHtmlAttrs(p))} className={`link-brand underline-always ${String(p.className || "")}`}>
 {children}
 </Link>
 );
 }
 return (
 // eslint-disable-next-line @next/next/no-html-link-for-pages
 <a href={String(href)} {...(toHtmlAttrs(p))} className={`link-brand underline-always ${String(p.className || "")}`} target="_blank" rel="noopener noreferrer">
 {children}
 </a>
 );
 },
 img: function Img(props: MDXProps) {
 const p = props as MDXProps;
 const src = String(p.src ?? "");
 const alt = String(p.alt ?? "");
 const width = p.width ?? 800;
 const height = p.height ?? 450;
 const rest = toHtmlAttrs(p);
 const isLocal = typeof src === "string" && src.startsWith("/");
 if (typeof src === "string" && (src.startsWith("blob:") || src.startsWith("data:"))) {
 // eslint-disable-next-line @next/next/no-img-element
 return <img src={src} alt={alt} {...rest} />;
 }
 if (!isLocal) {
 return <Image src={src} alt={alt} width={Number(width as number)} height={Number(height as number)} unoptimized className="h-auto w-full rounded-lg" {...rest} />;
 }
 return <Image src={src} alt={alt} width={Number(width as number)} height={Number(height as number)} className="h-auto w-full rounded-lg" {...rest} />;
 },
 h2: (props: MDXProps) => <h2 {...toHtmlAttrs(props)} className={`mt-8 text-2xl font-semibold text-zinc-900 ${String(props.className || "")}`} />,
 h3: (props: MDXProps) => <h3 {...toHtmlAttrs(props)} className={`mt-6 text-xl font-semibold text-zinc-900 ${String(props.className || "")}`} />,
 p: (props: MDXProps) => <p {...toHtmlAttrs(props)} className={`mt-4 text-zinc-800 leading-relaxed ${String(props.className || "")}`} />,
 ul: (props: MDXProps) => <ul {...toHtmlAttrs(props)} className={`mt-4 list-disc pl-6 space-y-1 ${String(props.className || "")}`} />,
 ol: (props: MDXProps) => <ol {...toHtmlAttrs(props)} className={`mt-4 list-decimal pl-6 space-y-1 ${String(props.className || "")}`} />,
 blockquote: (props: MDXProps) => (
 <blockquote {...toHtmlAttrs(props)} className={`my-6 border-l-4 border-zinc-300 pl-4 italic text-zinc-700 ${String(props.className || "")}`} />
 ),
 code: (props: MDXProps) => <code {...toHtmlAttrs(props)} className={`rounded bg-zinc-100 px-1 py-0.5 text-[0.95em] ${String(props.className || "")}`} />,
 pre: (props: MDXProps) => <pre {...toHtmlAttrs(props)} className={`mt-4 overflow-auto rounded-lg bg-zinc-950 p-4 text-zinc-100 ${String(props.className || "")}`} />,
};

export default mdxComponents;

