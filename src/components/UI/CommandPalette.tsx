 'use client'

import { useState, useEffect, useCallback } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, Users, Home, UserPlus, X } from 'lucide-react'

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false)
  const router = useRouter()

  // Toggle the menu when ⌘K / Ctrl+K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void): void => {
    setOpen(false)
    command()
  }, [])

  const pages = [
    { name: 'Home', icon: Home, path: '/', keywords: 'home landing main' },
    { name: 'Events', icon: Calendar, path: '/events', keywords: 'events workshops hackathon seminar' },
    { name: 'Team', icon: Users, path: '/team', keywords: 'team members core' },
    { name: 'Join CSI', icon: UserPlus, path: '/recruit', keywords: 'join recruit register membership' },
  ]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Command dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[20vh]"
          >
            <Command
              className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800
                         bg-white dark:bg-gray-900 shadow-2xl shadow-black/20 overflow-hidden"
              label="Command Palette"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800">
                <Search size={16} className="text-gray-400 shrink-0" />
                <Command.Input
                  placeholder="Search pages, events..."
                  className="w-full py-3.5 text-sm bg-transparent outline-none
                             text-gray-900 dark:text-white placeholder:text-gray-400"
                />
                <button
                  onClick={() => setOpen(false)}
                  className="shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                             hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Results */}
              <Command.List className="max-h-72 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Pages"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5
                             [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold
                             [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:uppercase
                             [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {pages.map(({ name, icon: Icon, path, keywords }) => (
                    <Command.Item
                      key={path}
                      value={`${name} ${keywords}`}
                      onSelect={() => runCommand(() => router.push(path))}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer
                                 text-gray-700 dark:text-gray-300
                                 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800
                                 aria-selected:text-gray-900 dark:aria-selected:text-white
                                 transition-colors"
                    >
                      <Icon size={16} className="text-gray-400" />
                      <span>{name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              {/* Footer hint */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-400">Navigate with ↑↓ · Select with ↵</span>
                <kbd className="text-[11px] text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-mono">
                  ESC
                </kbd>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CommandPalette
