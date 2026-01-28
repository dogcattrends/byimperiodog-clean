'use client'

import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button';

interface ErrorStateProps {
 title?: string
 description?: string
 message?: string
 actionLabel?: string
 retry?: () => void
 onAction?: () => void
}

export function ErrorState({ message, retry, title, description, actionLabel, onAction }: ErrorStateProps) {
 if (message) {
 title = title || "Erro"
 description = description || message
 actionLabel = actionLabel || (retry ? "Tentar novamente" : "")
 onAction = onAction || retry
 }

 return (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center"
 >
 <h2 className="text-xl font-semibold text-red-800">{title}</h2>
 {description && <p className="text-red-600">{description}</p>}
 {(onAction || retry) && (
 <Button
   onClick={onAction || retry}
   variant="danger"
   analyticsPayload={{ placement: 'dashboard-error', label: actionLabel }}
 >
   {actionLabel}
 </Button>
 )}
 </motion.div>
 )

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
 <Button
   onClick={onAction}
   variant="danger"
   analyticsPayload={{ placement: 'dashboard-error', label: actionLabel }}
 >
   {actionLabel}
 </Button>
 )}
 </motion.div>
 )
}
