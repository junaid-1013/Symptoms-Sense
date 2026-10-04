import TeamAvatar from "@/components/landingPage/TeamAvatar";
import { TEAM_MEMBERS } from "@/config/constants";
import { Github, Linkedin } from "lucide-react";

const tones = ["bg-[#dce9fa]", "bg-[#e2f1f2]", "bg-[#e9e5f6]", "bg-[#e7ecf6]", "bg-[#e5f0e8]", "bg-[#f3e8e1]"];

const socialClass =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function OurTeam() {
    return <section id="team" aria-labelledby="team-heading" className="bg-[#f5f8fc] py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">The people behind the platform</p>
                <h2 id="team-heading" className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">Built by people who care about the details.</h2>
                <p className="mt-5 text-lg leading-relaxed text-slate-600">Meet the {TEAM_MEMBERS.length} software engineers building Symptoms Sense and shaping a simpler way to navigate healthcare tools.</p>
            </div>
            <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {TEAM_MEMBERS.map((member, index) => <li key={member.id}>
                    <article className="group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
                        <div className={`relative m-2.5 aspect-square overflow-hidden rounded-[1.25rem] sm:m-3 ${tones[index % tones.length]}`}>
                            <TeamAvatar name={member.name} github={member.github} fallbackSrc={member.imageSrc} />
                        </div>
                        <div className="px-4 pb-5 pt-2 sm:px-6 sm:pb-6">
                            <div className="mb-3 h-0.5 w-8 rounded bg-blue-500" />
                            <h3 className="text-base font-bold leading-snug text-slate-900 sm:text-xl">{member.name}</h3>
                            <p className="mt-1 text-sm font-medium text-blue-700">{member.title}</p>
                            {(member.linkedin || member.github) && <div className="mt-4 flex items-center gap-2">
                                {member.linkedin && <a href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`} className={`${socialClass} hover:border-blue-600 hover:bg-blue-600 hover:text-white`}><Linkedin className="h-4 w-4" aria-hidden="true" /></a>}
                                {member.github && <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on GitHub`} className={`${socialClass} hover:border-slate-900 hover:bg-slate-900 hover:text-white`}><Github className="h-4 w-4" aria-hidden="true" /></a>}
                            </div>}
                        </div>
                    </article>
                </li>)}
            </ul>
        </div>
    </section>;
}
