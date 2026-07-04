"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, ShieldCheck, Stethoscope, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/*  Live counter that starts when the element enters the viewport  */
function useInViewCounter(end: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const [triggered, setTriggered] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTriggered(true);
                    setCount(0);
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!triggered) return;
        let start = 0;
        const increment = end / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                setTriggered(false);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [triggered, end, duration]);

    return { count, ref };
}

/*  Individual stat card  */
interface StatProps {
    end: number;
    suffix: string;
    label: string;
    isStatic?: boolean;
    staticValue?: string;
}

function StatCard({ end, suffix, label, isStatic = false, staticValue }: StatProps) {
    const { count, ref } = useInViewCounter(end);
    const display = isStatic
        ? staticValue
        : end >= 1000
        ? `${Math.floor(count / 1000)}K`
        : count;

    return (
        <div
            ref={isStatic ? undefined : ref}
            className="flex flex-col items-center justify-center min-w-[90px] px-5 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300 group"
        >
            <span className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums group-hover:scale-110 transition-transform duration-300">
                {display}{suffix}
            </span>
            <span className="text-[11px] text-white/50 mt-1 text-center leading-snug">{label}</span>
        </div>
    );
}

/*  Hero  */
export default function Hero() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(t);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b1530]">

            {/* Deep radial glow backgrounds */}
            <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="container mx-auto px-4 sm:px-6 py-20 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 xl:gap-24 items-center">

                    {/*  LEFT: Copy  */}
                    <div
                        className={`space-y-8 transition-all duration-1000 ${
                            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                        }`}
                    >
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-300 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            AI-Powered Healthcare Platform
                        </div>

                        {/* Headline */}
                        <div className="space-y-3">
                            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.1] text-white">
                                Your Health,{" "}
                                <span className="relative inline-block">
                                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                        Your Future
                                    </span>
                                    {/* Glow underline */}
                                    <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-60" />
                                </span>
                            </h1>
                            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-light text-white/40">
                                Predicting Wellness
                            </h2>
                        </div>

                        {/* Description */}
                        <p className="text-base sm:text-lg text-white/55 leading-relaxed max-w-lg">
                            A revolutionary platform enhancing healthcare decision-making through
                            AI-powered insights and personalized recommendations  available 24/7.
                        </p>

                        {/*  Live Stat Cards  */}
                        <div className="flex flex-wrap gap-3">
                            <StatCard end={10000} suffix="+" label="Patients Helped" />
                            <StatCard end={95} suffix="%" label="Accuracy Rate" />
                            <StatCard
                                end={0}
                                suffix=""
                                label="AI Support"
                                isStatic
                                staticValue="24/7"
                            />
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Button
                                size="lg"
                                className="bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-full px-8 group shadow-lg shadow-blue-500/30"
                                asChild
                            >
                                <Link href="/register">
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
                                className="text-white/70 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/5 rounded-full px-8"
                                asChild
                            >
                                <Link href="/#services">Explore Services</Link>
                            </Button>
                        </div>

                        {/* Trust pills */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {[
                                { icon: ShieldCheck, text: "HIPAA Compliant" },
                                { icon: ShieldCheck, text: "FDA Approved" },
                                { icon: ShieldCheck, text: "ISO 27001" },
                            ].map(({ icon: Icon, text }) => (
                                <span
                                    key={text}
                                    className="inline-flex items-center gap-1.5 text-xs text-white/40 border border-white/10 rounded-full px-3 py-1"
                                >
                                    <Icon className="w-3 h-3 text-blue-400/60" />
                                    {text}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/*  RIGHT: Image  */}
                    <div
                        className={`relative transition-all duration-1000 delay-300 ${
                            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                        }`}
                    >
                        {/* Glow ring behind image */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 blur-2xl scale-105" />

                        <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                            <Image
                                src="/hero.jpeg"
                                alt="Healthcare Technology"
                                width={600}
                                height={600}
                                className="w-full h-auto object-cover"
                                priority
                            />
                            {/* Inner overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1530]/60 via-transparent to-transparent" />
                        </div>

                        {/* Floating card  AI Diagnosis */}
                        <div
                            className="absolute -top-4 -left-4 sm:-top-5 sm:-left-6 bg-[#0f1d3a]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl"
                            style={{ animation: "float 4s ease-in-out infinite" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Brain className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white whitespace-nowrap">AI Diagnosis</div>
                                    <div className="text-[11px] text-white/40">Real-time analysis</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating card  Expert Doctors */}
                        <div
                            className="absolute -bottom-4 -right-4 sm:-bottom-5 sm:-right-6 bg-[#0f1d3a]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl"
                            style={{ animation: "float 4s ease-in-out infinite 1.5s" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white whitespace-nowrap">Expert Doctors</div>
                                    <div className="text-[11px] text-white/40">Available 24/7</div>
                                </div>
                            </div>
                        </div>

                        {/* Floating card  Verified */}
                        <div
                            className="absolute top-1/2 -right-4 sm:-right-6 -translate-y-1/2 bg-[#0f1d3a]/90 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 shadow-2xl"
                            style={{ animation: "float 5s ease-in-out infinite 0.75s" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <Stethoscope className="w-4 h-4 text-green-400" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white whitespace-nowrap">95% Accuracy</div>
                                    <div className="text-[11px] text-white/40">Clinically validated</div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </section>
    );
}
