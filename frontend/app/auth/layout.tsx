"use client"

import { usePathname } from "next/navigation"
import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Brand/Image */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-950 border-r border-zinc-800 p-12 relative overflow-hidden">
        {/* Ambient Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <div className="relative z-10 text-center space-y-8 max-w-lg">
          {/* Logo with Glow */}
          <div className="flex justify-center relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 blur-3xl rounded-full" />
            <Image
              src="/assets/erp.png"
              alt="NexCore ERP"
              width={320}
              height={320}
              className="relative drop-shadow-2xl"
              priority
              unoptimized
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white">
              NexCore ERP
            </h1>
            <p className="text-lg text-zinc-400">
              The complete solution for modern enterprise management.
            </p>
          </div>
          
          {/* Feature Pills */}
           <div className="flex flex-wrap justify-center gap-2 pt-4">
              {['HR', 'Finance', 'Inventory', 'Sales', 'Procurement'].map((item) => (
                <span key={item} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400">
                  {item}
                </span>
              ))}
           </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
