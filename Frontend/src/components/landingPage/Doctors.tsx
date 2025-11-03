"use client"
import { DoctorCardSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, ArrowRight, Star, Shield, Clock, Award } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import DoctorCard from "./DoctorCard";
import { GetAllDoctorsApi } from "@/endPoints/public.endPoints";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Link from "next/link";
import { DoctorBasicInfo } from "@/types/doctors";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import {ArrowLeft} from "lucide-react";
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
        const fetchData = async () => {
            try {
                const res = await GetAllDoctorsApi({ page: 1, page_size: 8 });
                const data = res?.data?.data;
                const items: DoctorBasicInfo[] = data?.doctors ?? [];
                const total = data?.total ?? items.length;
                setDoctors(items);
                setTotalDoctors(total);
            } catch (error) {
                console.error('Error fetching doctors:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    // Stats for credibility
    const stats = [
        { icon: Star, label: "4.9 Average Rating", value: "4.9/5" },
        { icon: Shield, label: "All Verified", value: "100%" },
        { icon: Clock, label: "Avg Response Time", value: "< 2hrs" },
        { icon: Award, label: "Board Certified", value: "98%" }
    ];

    // Calculate number of pages based on items per view
    const itemsPerView = 3; // Adjust based on your carousel settings
    const totalPages = Math.ceil(doctors.length / itemsPerView);

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
                        Our network of {totalDoctors > 0 ? `${totalDoctors}+` : ''} certified doctors and specialists are here to provide 
                        personalized care and expert medical guidance, available 24/7 for your health needs.
                    </p>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap justify-center gap-6 mt-8">
                        {stats.map((stat, index) => (
                            <div 
                                key={index} 
                                className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
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

                            
                            {/* Progress indicator Numbered Pages  For U Junaid Sir*/}
                            {/* <div className="flex justify-center items-center mt-6 gap-4">
                                <button
                                    onClick={() => api?.scrollPrev()}
                                    className="p-2 rounded-full border hover:bg-secondary transition-colors"
                                    disabled={current === 1}
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                
                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => scrollTo(index)}
                                            className={cn(
                                                "w-8 h-8 rounded-full transition-all duration-300 text-sm font-medium",
                                                current === index + 1
                                                    ? "bg-primary text-primary-foreground scale-110"
                                                    : "bg-secondary hover:bg-secondary/80"
                                            )}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                                
                                <button
                                    onClick={() => api?.scrollNext()}
                                    className="p-2 rounded-full border hover:bg-secondary transition-colors"
                                    disabled={current === count}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div> */}
                        </>
                    )}
                </div>

                {/* View All Doctors Button Section */}
                <div className="mt-16 text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                    {/* Additional info with animated counter */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span>{Math.floor(totalDoctors * 0.7)} doctors online now</span>
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="hidden sm:inline">Available 24/7</span>
                        </div>
                        
                        <p className="text-base text-muted-foreground max-w-md mx-auto">
                            Browse our complete directory of{" "}
                            <span className="font-semibold text-foreground">
                                {totalDoctors > 0 ? `${totalDoctors}+` : 'expert'}
                            </span>{" "}
                            healthcare professionals across{" "}
                            <span className="font-semibold text-foreground">25+ specialties</span>
                        </p>
                    </div>

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
                            <span className="relative flex h-2 w-2 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            Need urgent care?
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