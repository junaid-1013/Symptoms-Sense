import TeamAvatar from "@/components/landingPage/TeamAvatar";
import { TEAM_MEMBERS } from "@/config/constants";
import { ArrowUpRight, Github, Globe, Linkedin } from "lucide-react";

const tones = ["bg-[#dce9fa]", "bg-[#e2f1f2]", "bg-[#e9e5f6]", "bg-[#e7ecf6]"];

const socialClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function OurTeam() {
    return <section id="team" aria-labelledby="team-heading" className="bg-[#f5f8fc] py-16 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                <div className="lg:sticky lg:top-24 lg:self-start">
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">The people behind the platform</p>
                    <h2 id="team-heading" className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">Built by people who care about the details.</h2>
                    <p className="mt-6 max-w-md text-lg leading-relaxed text-slate-600">Meet the software engineers building Symptoms Sense and shaping a simpler way to navigate healthcare tools.</p>
                    <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-blue-700"><span className="h-px w-10 bg-blue-500" /> Meet the team <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></div>
                </div>
                <ul className="grid gap-5 sm:grid-cols-2">
                    {TEAM_MEMBERS.map((member, index) => <li key={member.id} className={index % 2 ? "sm:translate-y-8" : ""}>
                        <article className="group h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-transform duration-300 motion-safe:hover:-translate-y-1">
                            <div className={`relative m-3 aspect-square overflow-hidden rounded-[1.25rem] ${tones[index % tones.length]}`}>
                                <TeamAvatar name={member.name} github={member.github} fallbackSrc={member.imageSrc} />
                                <span className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">0{index + 1}</span>
                            </div>
                            <div className="px-6 pb-6 pt-2">
                                <div className="mb-4 h-0.5 w-8 rounded bg-blue-500" />
                                <h3 className="text-xl font-bold leading-snug text-slate-900">{member.name}</h3>
                                <p className="mt-1 text-sm font-medium text-blue-700">{member.title}</p>
                                {(member.linkedin || member.github || member.portfolio) && <div className="mt-4 flex items-center gap-2">
                                    {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`} className={`${socialClass} hover:border-blue-600 hover:bg-blue-600 hover:text-white`}><Linkedin className="h-4 w-4" aria-hidden="true" /></a>}
                                    {member.github && <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on GitHub`} className={`${socialClass} hover:border-slate-900 hover:bg-slate-900 hover:text-white`}><Github className="h-4 w-4" aria-hidden="true" /></a>}
                                    {member.portfolio && <a href={member.portfolio} target="_blank" rel="noopener noreferrer" aria-label={`${member.name}'s portfolio`} className={`${socialClass} hover:border-emerald-600 hover:bg-emerald-600 hover:text-white`}><Globe className="h-4 w-4" aria-hidden="true" /></a>}
                                </div>}
                            </div>
                        </article>
                    </li>)}
                </ul>
            </div>
        </div>
    </section>;
}
