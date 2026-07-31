"use client"
import { DoctorCardSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { DOCTOR_CAROUSEL_STATS } from "@/config/constants";
import { GetAllDoctorsApi } from "@/endPoints/public.endPoints";
import { cn } from "@/lib/utils";
import { DoctorBasicInfo } from "@/types/doctors";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import DoctorCard from "./DoctorCard";

export default function Doctors() {
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState<DoctorBasicInfo[]>([]);
    const [totalDoctors, setTotalDoctors] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [count, setCount] = useState(0);

    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    );

    useEffect(() => {
        GetAllDoctorsApi({ page: 1, page_size: 8 })
            .then((res) => {
                const data = res?.data?.data;
                const items: DoctorBasicInfo[] = data?.doctors ?? [];
                const total = data?.total ?? items.length;
                setDoctors(items);
                setTotalDoctors(total);
            })
            .catch((error) => {
                console.error('Error fetching doctors:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Handle carousel API and track current slide
    useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    // Function to scroll to specific slide
    const scrollTo = useCallback(
        (index: number) => {
            api?.scrollTo(index);
        },
        [api]
    );

    return (
        <section id="doctors" className="py-20 bg-gradient-to-b from-background via-background to-secondary/5 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Enhanced Header */}
                <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Badge
                        variant="outline"
                        className="mb-4 px-4 py-1.5 border-primary/20 bg-primary/5"
                    >
                        <UserCheck className="w-4 h-4 mr-2 text-primary" />
                        <span className="font-medium">Our Medical Experts</span>
                    </Badge>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance mb-4 leading-tight">
                        Connect with Expert{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                            Healthcare Professionals
                        </span>
                    </h2>

                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
                        Browse {totalDoctors > 0 ? `${totalDoctors} ` : ""}doctor profiles across specialties and compare their services, clinics, and availability.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 mt-8">
                        {DOCTOR_CAROUSEL_STATS.map((stat, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 100}ms` }}>
                                <stat.icon className="w-4 h-4 text-primary" />
                                <span className="text-muted-foreground">{stat.label}:</span>
                                <span className="font-semibold">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Doctors Carousel with enhanced styling */}
                <div className="relative px-0 md:px-12">
                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="animate-in fade-in duration-500"
                                    style={{ animationDelay: `${i * 100}ms` }}
                                >
                                    <DoctorCardSkeleton />
                                </div>
                            ))}
                        </div>
                    ) : doctors.length === 0 ? (
                        <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                            No doctors are listed yet. Check back later or explore another service.
                        </p>
                    ) : (
                        <>
                            <Carousel
                                setApi={setApi}
                                plugins={[plugin.current]}
                                className="w-full"
                                onMouseEnter={() => setIsHovered(true)}
                                onMouseLeave={() => setIsHovered(false)}
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                            >
                                <CarouselContent className="-ml-2 md:-ml-4">
                                    {doctors.map((doctor, index) => (
                                        <CarouselItem
                                            key={doctor.id}
                                            className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                                        >
                                            <div
                                                className="animate-in fade-in slide-in-from-right-4 duration-500"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <DoctorCard doctor={doctor} />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>

                                {/*  navigation buttons */}
                                <CarouselPrevious
                                    className={cn(
                                        "hidden md:flex -left-12 h-12 w-12 border-2",
                                        "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                                        "transition-all duration-300 shadow-lg",
                                        isHovered && "opacity-100"
                                    )}
                                />
                                <CarouselNext
                                    className={cn(
                                        "hidden md:flex -right-12 h-12 w-12 border-2",
                                        "hover:bg-primary hover:text-primary-foreground hover:border-primary",
                                        "transition-all duration-300 shadow-lg",
                                        isHovered && "opacity-100"
                                    )}
                                />
                            </Carousel>

                            {/* Progress indicator  Dots */}
                            <div className="flex justify-center mt-6 gap-2">
                                {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollTo(index)}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300",
                                            "hover:bg-primary/40",
                                            current === index + 1
                                                ? "w-8 bg-primary"
                                                : "w-2 bg-primary/20 hover:w-3"
                                        )}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* View All Doctors Button Section */}
                <div className="mt-16 text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    {/* Additional info with animated counter */}


                    {/* Main CTA Button */}
                    <Link href="/doctors">
                        <Button
                            size="lg"
                            className={cn(
                                "group relative px-8 py-6 text-base font-semibold",
                                "bg-gradient-to-r from-primary to-primary/90",
                                "shadow-lg hover:shadow-xl hover:shadow-primary/25",
                                "transition-all duration-300 transform hover:-translate-y-1",
                                "border border-primary/20"
                            )}
                        >
                            {/* Button background animation */}
                            <span className="absolute inset-0 bg-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            {/* Button content */}
                            <span className="relative flex items-center gap-3">
                                <span>Explore All Doctors</span>

                                {/* Animated arrows */}
                                <div className="flex items-center -space-x-2">
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300 opacity-60" />
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform duration-400 opacity-30" />
                                </div>
                            </span>

                            {/* Shimmer effect */}
                            <span className="absolute inset-0 rounded-md overflow-hidden">
                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </span>
                        </Button>
                    </Link>

                    {/* Secondary actions */}
                    <div className="flex items-center justify-center gap-6 text-sm">
                        <Link
                            href="/doctors"
                            className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                        >
                            Looking for a doctor?
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <span className="text-muted-foreground/50">|</span>

                        <Link
                            href="/doctors"
                            className="text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1 group"
                        >
                            Browse by specialty
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
