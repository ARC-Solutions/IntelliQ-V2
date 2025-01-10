"use client"

import * as React from "react"

export function useCopyToClipboard({
  timeout = 2000,
  onCopy,
  onError,
}: {
  timeout?: number;
  onCopy?: () => void;
  onError?: () => void;
} = {}) {
  const [isCopied, setIsCopied] = React.useState(false)

  const copyToClipboard = (value: string) => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      if (onError) onError();
      return;
    }

    if (!value) {
      if (onError) onError();
      return;
    }

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)
      if (onCopy) onCopy();
      setTimeout(() => {
        setIsCopied(false)
      }, timeout)
    }).catch(() => {
      if (onError) onError();
    });
  }

  return { isCopied, copyToClipboard }
}
