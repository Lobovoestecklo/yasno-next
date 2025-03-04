'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true
      router.replace('/chat/new')
    }
  }, [router])

  return null
}