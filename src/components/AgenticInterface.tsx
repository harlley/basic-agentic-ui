import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    InputGroup,
    InputGroupInput,
    InputGroupButton
} from "@/components/ui/input-group"
import { IconSend, IconArrowRight, IconUser, IconRobot, IconVolume } from "@tabler/icons-react"

export function AgenticInterface() {
    const [messages] = React.useState([
        { id: 1, text: "Hi, how can I help you?", sender: "bot" },
        { id: 2, text: "Change the square color to green", sender: "user" },
    ])

    return (
        <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Sidebar - Order 2 on mobile (bottom), Order 1 on desktop (left) */}
            <aside className="order-2 md:order-1 w-full md:w-80 lg:w-96 flex flex-col border-t md:border-t-0 md:border-r border-border/50 bg-sidebar/50 backdrop-blur-md shrink-0 h-[45vh] md:h-full transition-all duration-300">
                <header className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <IconVolume size={18} />
                        </div>
                        <div>
                            <h2 className="font-bold text-sm tracking-tight">ElevenLabs Agent</h2>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                        >
                            <div
                                className={`flex items-center gap-2 mb-1.5 px-1 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                            >
                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center border border-border/50 overflow-hidden">
                                    {msg.sender === "user" ? <IconUser size={12} /> : <IconRobot size={12} />}
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-tighter opacity-40">
                                    {msg.sender === "user" ? "You" : "Assistant"}
                                </span>
                            </div>
                            <div
                                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.sender === "user"
                                    ? "bg-primary text-primary-foreground rounded-tr-none shadow-lg shadow-primary/20"
                                    : "bg-muted/80 backdrop-blur-sm text-foreground rounded-tl-none border border-border/50"
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Input Area */}
                <footer className="p-6 border-t border-border/30">
                    <InputGroup className="bg-background/80 h-12 shadow-sm border-border/50 focus-within:ring-primary/20 transition-all">
                        <InputGroupInput
                            placeholder="Write your message..."
                            className="text-sm px-4"
                        />
                        <InputGroupButton size="xs" variant="ghost" className="mr-1 h-9 w-9 rounded-full hover:bg-primary hover:text-white transition-colors">
                            <IconSend size={18} />
                        </InputGroupButton>
                    </InputGroup>
                </footer>
            </aside>

            {/* Main Content - Order 1 on mobile (top), Order 2 on desktop (right) */}
            <main className="order-1 md:order-2 flex-1 flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden h-[55vh] md:h-full">
                {/* Decorative Grid/Orbs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
                </div>

                <div className="flex flex-col items-center gap-12 z-10 w-full max-w-[320px] md:max-w-sm">
                    {/* The Square Visualizer */}
                    <div className="relative group w-full">
                        <div className="absolute inset-0 bg-primary/30 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50" />
                        <div
                            className="relative w-full aspect-square rounded-[2.5rem] shadow-2xl transition-all duration-1000 bg-primary flex items-center justify-center overflow-hidden"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-primary) 0%, oklch(from var(--color-primary) calc(l - 0.1) c h) 100%)'
                            }}
                        >
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-1/2 h-1/2 bg-white/10 rounded-full blur-3xl animate-pulse" />
                        </div>
                    </div>

                    {/* Local Control Area */}
                    <div className="w-full space-y-3">
                        <p className="text-[10px] text-center font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">Manual Override</p>
                        <InputGroup className="bg-card/40 backdrop-blur-xl border-border/50 h-14 rounded-2xl shadow-xl shadow-black/5 ring-offset-background focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <InputGroupInput
                                placeholder="write color to update"
                                className="text-center text-lg font-medium placeholder:font-normal placeholder:opacity-50"
                            />
                            <InputGroupButton variant="ghost" className="mr-1 h-12 w-12 rounded-xl bg-primary/10 hover:bg-primary transition-all group/btn">
                                <IconArrowRight size={22} className="text-primary group-hover/btn:text-white transition-colors" />
                            </InputGroupButton>
                        </InputGroup>
                    </div>
                </div>
            </main>
        </div>
    )
}
