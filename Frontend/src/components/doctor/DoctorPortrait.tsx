"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function DoctorPortrait({ src, name, className, sizes }: {
    src?: string | null;
    name?: string | null;
    className: string;
    sizes?: string;
}) {
    const [failed, setFailed] = useState(false);

    useEffect(() => setFailed(false), [src]);

    return (
        <Image
            src={src && !failed ? src : "/doctor-placeholder.svg"}
            alt={name ? `Portrait of ${name}` : "Doctor portrait"}
            fill
            sizes={sizes}
            unoptimized={Boolean(src && /^https?:\/\//.test(src))}
            onError={() => setFailed(true)}
            className={className}
        />
    );
}
