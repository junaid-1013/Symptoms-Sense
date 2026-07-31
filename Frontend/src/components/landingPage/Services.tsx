import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SERVICES } from "@/config/constants";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Services() {
    return (
        <section id="services" className="bg-muted/30 py-20">
            <div className="container mx-auto px-4">
                <div className="mb-12 text-center">
                    <Badge variant="outline" className="mb-4">Our Services</Badge>
                    <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                        Helpful tools for <span className="text-primary">your next step</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Explore health information, find doctors, and keep track of medicines from one place.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {SERVICES.map((service) => (
                        <Card key={service.title} className="border-border bg-card transition-shadow hover:shadow-lg">
                            <CardContent className="flex h-full flex-col p-7">
                                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                                    <service.icon className={`h-7 w-7 ${service.color}`} aria-hidden="true" />
                                </div>
                                <Badge variant="secondary" className="mb-3 w-fit">{service.badge}</Badge>
                                <h3 className="text-xl font-semibold">{service.title}</h3>
                                <p className="mt-3 flex-1 leading-relaxed text-muted-foreground">{service.description}</p>
                                <Link href={service.href} className="mt-6 inline-flex w-fit items-center gap-2 font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
                                    Explore feature <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
