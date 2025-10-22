'use client'

import { motion } from 'framer-motion'

interface ErrorStateProps {
  message?: string
  retry?: () => void
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function ErrorState({ message, retry, title, description, actionLabel, onAction }: ErrorStateProps) {
  // Versão legada com message/retry
  if (message) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center"
      >
        <h2 className="text-xl font-semibold text-red-800">{message}</h2>
        {retry && (
          <button
            onClick={retry}
            className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
          >
            Tentar novamente
          </button>
        )}
      </motion.div>
    )
  }

  // Nova versão com title/description/actionLabel
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center"
    >
      <h2 className="text-xl font-semibold text-red-800">{title}</h2>
      <p className="text-red-600">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}