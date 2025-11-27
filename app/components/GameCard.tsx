"use client"

import { useState, useRef, useEffect } from "react"
import { RefreshCw, Link as LinkIcon, Hash, ExternalLink, HelpCircle, X, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Source {
  name: string;
  url: string;
}

interface GameCardProps {
  name: string;
  accentColor: string;
  version: string;
  lastUpdated: string;
  description: string;
  sources: Source[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// We map the string accentColor to CSS variable overrides for this component
const colorMap: Record<string, React.CSSProperties> = {
  purple: {
    "--primary": "oklch(0.65 0.25 270)", // Purple
    "--accent": "oklch(0.6 0.22 290)",   // Magenta-ish
  } as React.CSSProperties,
  blue: {
    "--primary": "oklch(0.65 0.2 240)",  // Blue
    "--accent": "oklch(0.6 0.2 220)",    // Cyan-ish
  } as React.CSSProperties,
  rose: {
    "--primary": "oklch(0.65 0.25 10)", // Rose
    "--accent": "oklch(0.6 0.22 340)",
  } as React.CSSProperties,
  orange: {
    "--primary": "oklch(0.65 0.25 45)", // Orange
    "--accent": "oklch(0.6 0.22 60)",
  } as React.CSSProperties,
  red: {
    "--primary": "oklch(0.6 0.25 25)",  // Red
    "--accent": "oklch(0.5 0.22 15)",
  } as React.CSSProperties,
};

export function GameCard({
  name,
  accentColor,
  version,
  lastUpdated,
  description,
  sources,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Map the incoming color prop to style overrides for this specific card
  const customStyles = colorMap[accentColor] || {};

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setMousePosition({ x, y })
    }

    const card = cardRef.current
    if (card) {
      card.addEventListener("mousemove", handleMouseMove)
    }

    return () => {
      if (card) {
        card.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [messages, isLoading])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          game: name,
          version: version,
          description: description,
          lastUpdated: lastUpdated
        })
      })

      const data = await response.json()

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
         setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't get a response at the moment." }])
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="relative w-full h-full"
      style={customStyles} // Apply CSS variable overrides here
    >
      {/* Animated glow background */}
      <div
        className={cn(
          "absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-0 blur-xl transition-all duration-700",
          isHovered && "opacity-70 animate-glow-pulse",
        )}
      />

      {/* Main card */}
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setIsChatOpen(false)
        }}
        className="relative group h-full"
      >
        <div
          className={cn(
            "absolute -inset-[2px] rounded-2xl opacity-0 transition-opacity duration-500",
            "bg-gradient-to-r from-primary via-accent via-primary to-accent bg-[length:300%_100%]",
            isHovered && "opacity-100 animate-shimmer",
          )}
        />
        <div
          className={cn(
            "absolute -inset-[3px] rounded-2xl opacity-0 transition-opacity duration-700 blur-sm",
            "bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_100%]",
            isHovered && "opacity-60 animate-shimmer",
          )}
        />

        {/* Card content */}
        <div
          className={cn(
            "relative bg-card rounded-2xl p-5 backdrop-blur-sm transition-all duration-500 overflow-hidden h-full flex flex-col",
            "border-2 border-border/50",
            (isHovered || isChatOpen) && "scale-[1.02] shadow-2xl shadow-primary/30",
          )}
        >
          {/* Chat Overlay */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                key="chat-overlay"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-md p-4 flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-normal">{name} {version}</span>
                  </h3>
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                  </button>
                </div>

                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 no-scrollbar"
                >
                  {messages.length === 0 && (
                    <div className="text-center text-zinc-500 text-sm mt-8">
                      <p>Ask me anything about the latest update!</p>
                      <p className="text-xs mt-2 opacity-70">"What's new in this patch?"</p>
                      <p className="text-xs opacity-70">"Any weapon changes?"</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-2 rounded-lg text-sm max-w-[85%]",
                        msg.role === 'user' 
                          ? "bg-primary/20 text-white ml-auto rounded-br-none border border-primary/30" 
                          : "bg-white/5 text-zinc-200 mr-auto rounded-bl-none border border-white/10"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 p-2 rounded-lg rounded-bl-none border border-white/10">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-primary/50 placeholder:text-zinc-600"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm" />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Mouse spotlight effect */}
          {isHovered && (
            <div
              className="absolute rounded-full pointer-events-none transition-opacity duration-300 z-10"
              style={{
                width: "400px",
                height: "400px",
                left: `${mousePosition.x}px`,
                top: `${mousePosition.y}px`,
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)", // Use var(--primary) here but with alpha handling if possible, or hardcoded fallback
                opacity: 0.15,
                filter: "blur(20px)",
              }}
            />
          )}

          <div className="flex items-center justify-between mb-5 relative z-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">{name}</h2>
            <button
              onClick={() => setIsChatOpen(true)}
              className={cn(
                "p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-300 cursor-pointer",
                "hover:scale-110 group/btn",
                isChatOpen && "opacity-0 pointer-events-none"
              )}
            >
              <HelpCircle className="h-4 w-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
            </button>
          </div>

          {/* Version info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5 h-24">
            {/* Current version */}
            <div
              className={cn(
                "relative overflow-hidden rounded-xl p-3 bg-secondary/30 border border-border/30 h-full flex flex-col justify-center",
                "transition-all duration-500",
                isHovered && "bg-secondary/50 border-primary/30",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 transition-opacity duration-500",
                  isHovered && "opacity-100",
                )}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Current Version
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-foreground font-mono break-words">{version}</p>
              </div>
            </div>

            {/* Last updated */}
            <div
              className={cn(
                "relative overflow-hidden rounded-xl p-3 bg-secondary/30 border border-border/30 h-full flex flex-col justify-center",
                "transition-all duration-500",
                isHovered && "bg-secondary/50 border-accent/30",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 transition-opacity duration-500",
                  isHovered && "opacity-100",
                )}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Last Updated
                  </span>
                </div>
                <p className="text-lg sm:text-xl font-bold text-foreground font-mono break-words">{lastUpdated}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div
            className={cn(
              "relative overflow-hidden rounded-xl p-3 mb-5 bg-secondary/20 border border-border/20 flex-grow",
              "transition-all duration-500",
              isHovered && "bg-secondary/30 border-border/40",
            )}
          >
            <p className="text-sm text-foreground/80 leading-relaxed">
             {description}
            </p>
          </div>

          {/* Verified sources */}
          <div className="mt-auto">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Verified Sources</h3>
            <div className="flex flex-wrap gap-2">
              {sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  className={cn(
                    "group/link flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg",
                    "bg-secondary/40 border border-border/30",
                    "hover:bg-secondary hover:border-primary/50",
                    "transition-all duration-300 hover:scale-105",
                  )}
                >
                  <span className="text-[10px] text-muted-foreground group-hover/link:text-foreground transition-colors">
                    {source.name}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5 text-muted-foreground group-hover/link:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
