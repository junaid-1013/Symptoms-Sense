import { TEAM_MEMBERS } from "@/config/constants";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

const tones = ["bg-[#dce9fa]", "bg-[#e2f1f2]", "bg-[#e9e5f6]", "bg-[#e7ecf6]"];

export default function OurTeam() {
    return <section id="team" aria-labelledby="team-heading" className="bg-[#f5f8fc] py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">The people behind the platform</p>
                    <h2 id="team-heading" className="mt-3 max-w-md text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">Built by people who care about the details.</h2>
                    <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-600">Meet the software engineers building Symptoms Sense and shaping a simpler way to navigate healthcare tools.</p>
                    <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-blue-700"><span className="h-px w-10 bg-blue-500" /> Meet the team <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                    {TEAM_MEMBERS.map((member, index) => <article key={member.id} className={`group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-transform duration-300 motion-safe:hover:-translate-y-1 ${index % 2 ? "sm:translate-y-8" : ""}`}>
                        <div className={`relative m-3 aspect-square overflow-hidden rounded-[1.25rem] ${tones[index]}`}>
                            <div className="absolute inset-4 rounded-full border border-white/50" aria-hidden="true" />
                            <Image src={member.imageSrc} alt={`Portrait of ${member.name}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 32vw" className="object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-[1.035]" />
                            <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">0{index + 1}</span>
                        </div>
                        <div className="px-6 pb-6 pt-2"><div className="mb-4 h-0.5 w-8 rounded bg-blue-500" /><h3 className="text-xl font-bold leading-snug text-slate-900">{member.name}</h3><p className="mt-1 text-sm font-medium text-blue-700">{member.title}</p></div>
                    </article>)}
                </div>
            </div>
        </div>
    </section>;
}
