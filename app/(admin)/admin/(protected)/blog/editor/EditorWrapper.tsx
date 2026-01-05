"use client";

import type { Post } from "@/lib/db/types";

import ModernEditorWrapper from "../../../../../../src/components/blog/ModernEditorWrapper";

interface EditorWrapperProps {
  post: Post | null;
}

export default function EditorWrapper({ post }: EditorWrapperProps) {
  return <ModernEditorWrapper post={post} />;
}
