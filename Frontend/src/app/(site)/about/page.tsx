import OurTeam from "@/components/landingPage/OurTeam";
import { ArrowRight, ArrowUpRight, Brain, CalendarDays, HeartPulse, Pill, Search, ShieldCheck, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "About Symptoms Sense",
    description: "Learn how Symptoms Sense helps people explore symptoms, find doctors, and remember medicines, and meet the team behind it.",
};

const steps = [
    { number: "01", icon: Brain, eyebrow: "Understand", title: "Start with a better question", text: "Use AI guidance to organize what you are experiencing and prepare questions for a clinician.", href: "/chat-agent", link: "Explore symptom guidance", color: "bg-blue-50 text-blue-700" },
    { number: "02", icon: Stethoscope, eyebrow: "Connect", title: "Find a path to care", text: "Browse doctors by specialty and review their profiles when you are ready for professional advice.", href: "/doctors", link: "Browse doctors", color: "bg-cyan-50 text-cyan-700" },
    { number: "03", icon: Pill, eyebrow: "Stay on track", title: "Make the everyday easier", text: "Keep your medicine schedule close with reminders designed to fit your routine.", href: "/medicineReminder", link: "See medicine reminders", color: "bg-indigo-50 text-indigo-700" },
];

export default function AboutPage() {
    return <main className="overflow-hidden">
        <section className="relative overflow-hidden bg-[#0b1530] text-white">
            <div className="pointer-events-none absolute -right-32 -top-52 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-[120px]" />
            <div className="pointer-events-none absolute -bottom-56 left-1/3 h-[460px] w-[460px] rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="container relative mx-auto grid items-center gap-16 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1fr_0.92fr] lg:gap-20 lg:py-32">
                <div className="max-w-2xl">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> About Symptoms Sense</div>
                    <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">Health feels clearer when <span className="text-cyan-300">the next step</span> is in sight.</h1>
                    <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-200">Symptoms Sense brings symptom guidance, doctor discovery, and medicine reminders into one connected experience.</p>
                    <div className="mt-9 flex flex-wrap gap-3">
                        <Link href="/chat-agent" className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Explore the app <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                        <Link href="#team" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Meet the team</Link>
                    </div>
                    <p className="mt-9 flex max-w-xl items-start gap-2 text-sm leading-relaxed text-slate-300"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" /> AI guidance helps you explore information; it does not replace a clinician&apos;s diagnosis or advice.</p>
                </div>
                <div aria-label="Preview of Symptoms Sense features" className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
                    <div className="absolute -inset-5 rounded-[2.5rem] border border-white/10 bg-white/[0.03] sm:-inset-7" />
                    <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white p-5 text-slate-900 shadow-2xl shadow-black/30 sm:p-7">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><HeartPulse className="h-5 w-5" aria-hidden="true" /></div><div><p className="text-sm font-bold">Symptoms Sense</p><p className="text-xs text-slate-500">Your health companion</p></div></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
                        <div className="py-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Where would you like to begin?</p><p className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">A little clarity can go a long way.</p></div>
                        <div className="space-y-3">
                            {[
                                { icon: Brain, title: "Explore symptoms", detail: "Organize your questions", style: "bg-[#edf4ff] text-blue-700" },
                                { icon: Search, title: "Find doctors", detail: "Browse specialties and profiles", style: "bg-cyan-50 text-cyan-700" },
                                { icon: CalendarDays, title: "Medicine reminders", detail: "Keep your routine in view", style: "bg-indigo-50 text-indigo-700" },
                            ].map(({ icon: Icon, title, detail, style }) => <div key={title} className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style}`}><Icon className="h-6 w-6" aria-hidden="true" /></span><div><p className="font-semibold">{title}</p><p className="text-sm text-slate-600">{detail}</p></div><ArrowUpRight className="ml-auto h-5 w-5 text-slate-400" aria-hidden="true" /></div>)}
                        </div>
                    </div>
                    <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-blue-100 bg-white px-5 py-4 text-slate-900 shadow-xl sm:block"><p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Made for real life</p><p className="mt-1 text-sm font-medium">Guidance, care, and routine in one place</p></div>
                </div>
            </div>
        </section>
        <section aria-labelledby="journey-heading" className="bg-white py-20 sm:py-28"><div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">One connected journey</p><h2 id="journey-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">Built around the moments that matter.</h2><p className="mt-5 text-lg leading-relaxed text-slate-600">From a question in your mind to a step you can take, each tool has a clear purpose.</p></div>
            <div className="mt-14 divide-y divide-slate-200 border-y border-slate-200">{steps.map(({ number, icon: Icon, eyebrow, title, text, href, link, color }) => <article key={number} className="grid gap-5 py-9 md:grid-cols-[100px_1fr_1.1fr] md:items-center md:gap-10 md:py-12"><span className="text-5xl font-light tracking-tight text-slate-300" aria-hidden="true">{number}</span><div className="flex items-start gap-4"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}><Icon className="h-6 w-6" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p><h3 className="mt-1 text-2xl font-semibold leading-tight text-slate-900">{title}</h3></div></div><div className="md:pl-4"><p className="max-w-md leading-relaxed text-slate-600">{text}</p><Link href={href} className="mt-4 inline-flex items-center gap-2 font-semibold text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">{link}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link></div></article>)}</div>
        </div></section>
        <OurTeam />
        <section className="bg-[#0b1530] px-4 py-20 text-center text-white sm:py-24"><div className="mx-auto max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Your next step</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Explore what Symptoms Sense can do for you.</h2><p className="mt-5 text-slate-200">Start with a question, browse available doctors, or set a medicine reminder.</p><Link href="/#services" className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-500 px-7 py-3 font-semibold text-white transition-colors hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Explore services <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
    </main>;
}
