'use client'

import { X } from 'lucide-react'
import Image from 'next/image'

interface Founder {
  name: string
  role: string
  image: string | null
  linkedin: string | null
}

const founders: Founder[] = [
  {
    name: 'Mahmoud Mahran',
    role: 'AI Engineer',
    image: '/images/mahmoud-mahran.png',
    linkedin: 'https://www.linkedin.com/in/mahmoud-ahmed-mahran-b24162243',
  },
  {
    name: 'Ahmed Osama',
    role: 'Co-Founder',
    image: '/images/ahmed-osama.png',
    linkedin:
      'https://www.linkedin.com/in/eng-ahmed-osama?utm_source=share_via&utm_content=profile&utm_medium=member_ios',
  },
  {
    name: 'Asmaa Wajeah',
    role: 'Co-Founder',
    image: '/images/asmaa-wajeah.png',
    linkedin:
      'https://www.linkedin.com/in/asma-wajeah1410?utm_source=share_via&utm_content=profile&utm_medium=member_android',
  },
  {
    name: 'Mahmoud Alaa',
    role: 'Co-Founder',
    image: null,
    linkedin: 'http://linkedin.com/in/mkhairallah',
  },
  {
    name: 'Mohamed Nabil',
    role: 'Co-Founder',
    image: null,
    linkedin: null,
  },
]

export function FoundersModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-3xl rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Meet the Founders</h2>
              <p className="text-xs text-muted-foreground mt-0.5">The team behind Twinam</p>
            </div>
            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Founders grid */}
          <div className="p-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {founders.map((founder) => (
              <div
                key={founder.name}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 text-center transition-all hover:border-primary/40 hover:shadow-[0_0_20px_-5px_oklch(0.78_0.14_210/0.4)]"
              >
                {/* Avatar */}
                <div className="relative size-16 overflow-hidden rounded-full ring-2 ring-primary/30">
                  {founder.image ? (
                    <Image
                      src={founder.image}
                      alt={founder.name}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-primary/10 text-primary font-bold text-xl">
                      {founder.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  <p className="text-sm font-semibold leading-tight">{founder.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{founder.role}</p>
                </div>

                {/* LinkedIn */}
                {founder.linkedin ? (
                  <a
                    href={founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <svg className="size-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <svg className="size-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    Coming soon
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-3">
            <p className="text-center text-xs text-muted-foreground">
              © Twinam — Building the future of Digital Twins & Industry 4.0
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
