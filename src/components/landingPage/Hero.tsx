import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Brain, Stethoscope, Users } from "lucide-react"
import Image from "next/image"

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-card to-muted">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />

            <div className="container mx-auto px-4 py-20 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Badge variant="secondary" className="text-sm font-medium">
                                <Stethoscope className="w-4 h-4 mr-2" />
                                AI-Powered Healthcare
                            </Badge>

                            <h1 className="text-4xl md:text-6xl font-bold text-balance leading-tight">
                                Your Health, Your <span className="text-primary">Future</span>
                                <br />
                                Predicting Wellness
                            </h1>

                            <p className="text-lg text-muted-foreground text-pretty max-w-2xl">
                                Welcome to our cutting-edge Disease Prediction System, a revolutionary platform dedicated to enhancing
                                healthcare decision-making through AI-powered insights and personalized recommendations.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-8">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">10K+</div>
                                <div className="text-sm text-muted-foreground">Patients Helped</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">95%</div>
                                <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">24/7</div>
                                <div className="text-sm text-muted-foreground">AI Support</div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="text-lg px-8">
                                Get Started
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                                Learn More
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="pt-8">
                            <p className="text-sm text-muted-foreground mb-4">Trusted by leading healthcare providers</p>
                            <div className="flex items-center gap-6 opacity-60">
                                <div className="text-xs font-medium">HIPAA Compliant</div>
                                <div className="text-xs font-medium">FDA Approved</div>
                                <div className="text-xs font-medium">ISO 27001</div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative">
                        <div className="relative">
                            <Image
                                src="/hero.jpeg"
                                alt="Healthcare Technology"
                                width={600}
                                height={600}
                                className="rounded-2xl shadow-2xl"
                                priority
                            />
                        </div>

                        {/* Floating Cards */}
                        <div className="absolute -top-4 -left-4 bg-card border border-border rounded-lg p-4 shadow-lg">
                            <div className="flex items-center gap-3">
                                <Brain className="w-8 h-8 text-primary" />
                                <div>
                                    <div className="font-semibold text-sm">AI Diagnosis</div>
                                    <div className="text-xs text-muted-foreground">Real-time analysis</div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-4 -right-4 bg-card border border-border rounded-lg p-4 shadow-lg">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary/70" />
                                <div>
                                    <div className="font-semibold text-sm">Expert Doctors</div>
                                    <div className="text-xs text-muted-foreground">Available 24/7</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
