"use client";
import { useState } from "react";

/** GitHub serves the member's current avatar at github.com/<user>.png, so photos stay up to date. */
export const githubAvatarUrl = (githubUrl?: string, size = 480) => {
    const user = githubUrl?.match(/github\.com\/([^/?#]+)/i)?.[1];
    return user ? `https://github.com/${user}.png?size=${size}` : undefined;
};

const initialsOf = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function TeamAvatar({ name, github, fallbackSrc }: { name: string; github?: string; fallbackSrc?: string }) {
    const [failed, setFailed] = useState(false);
    const src = !failed ? githubAvatarUrl(github) ?? fallbackSrc : fallbackSrc;
    if (!src || (failed && !fallbackSrc)) {
        return (
            <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-slate-500" aria-label={`Initials of ${name}`}>
                {initialsOf(name)}
            </span>
        );
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={`Portrait of ${name}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="h-full w-full object-cover object-center transition-transform duration-500 motion-safe:group-hover:scale-[1.035]"
        />
    );
}
