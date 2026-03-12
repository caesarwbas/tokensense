'use client'
import dynamic from 'next/dynamic'

const TokenSense = dynamic(() => import('@/components/TokenSense'), { ssr: false })

export default function Home() {
  return <TokenSense />
}