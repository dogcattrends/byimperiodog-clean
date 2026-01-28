
"use client";
import * as React from 'react';

import * as track from '../../lib/track';

export interface TrackedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  analyticsEvent?: string; // nome do evento analytics (default: 'cta_click')
  analyticsPayload?: Record<string, unknown>; // payload customizado
  analytics?: boolean; // se false, não dispara analytics
}

export const TrackedLink = React.forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  function TrackedLink({
    analyticsEvent = 'cta_click',
    analyticsPayload,
    analytics = true,
    onClick,
    children,
    ...props
  }, ref) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | React.KeyboardEvent<HTMLAnchorElement>) => {
      if (analytics) {
        track.event?.(analyticsEvent, {
          label: typeof children === 'string' ? children : undefined,
          ...analyticsPayload
        });
      }
      if (onClick) onClick(e as any);
    };
    const { href, ...rest } = props as React.AnchorHTMLAttributes<HTMLAnchorElement>;
      if (href) {
        return (
          <a ref={ref} href={href} {...rest} onClick={handleClick}>
            {children}
          </a>
        );
      }

      // When there's no href, render a native button to satisfy accessibility rules
      return (
        <button ref={ref as any} type="button" onClick={handleClick} {...(rest as any)}>
          {children}
        </button>
      );
  }
);

export default TrackedLink;
