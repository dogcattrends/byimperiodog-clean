"use client";

import React from "react";

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
 constructor(props: Props) {
 super(props);
 this.state = { hasError: false };
 }

 static getDerivedStateFromError() {
 return { hasError: true };
 }

 componentDidCatch(error: Error, info: any) {
 // eslint-disable-next-line no-console
 console.error("ErrorBoundary caught:", error, info);
 }

 render() {
 if (this.state.hasError) {
 return <div role="alert" className="rounded-md bg-rose-50 p-3 text-rose-700">Erro ao abrir detalhes.</div>;
 }
 return this.props.children as React.ReactElement;
 }
}
