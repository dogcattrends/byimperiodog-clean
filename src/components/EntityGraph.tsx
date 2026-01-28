import React from 'react';

/**
 * Componente único para injetar o Entity Graph (Organization, WebSite, WebPage, Breadcrumb, Article, etc.)
 * Uso: passar um array de nodes já gerados pelas factories do projeto (ex: buildOrganizationLD,...)
 */
export default function EntityGraph({ nodes }: { nodes: Array<Record<string, unknown> | null | undefined> }) {
 const payload = nodes.filter(Boolean) as Record<string, unknown>[];
 if (!payload.length) return null;
 // eslint-disable-next-line react/no-danger
 return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />;
}
