import { CONTACT_INFO, NAV_LINKS } from "@/config/constants";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = () => {
    return (
        <footer className="bg-[#0f1d3a] text-white">

            {/*  CTA Banner  */}
            <div className="relative overflow-hidden border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-blue-800/20 pointer-events-none" />
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <p className="text-xs font-semibold uppercase tracking-widest text-blue-300/80">
                                AI-Powered Healthcare
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
                                Ready to take control of{" "}
                                <span className="text-blue-400">your health?</span>
                            </h2>
                            <p className="text-sm text-slate-200 max-w-md">
                                Join thousands of patients already benefiting from AI-powered diagnosis and personalized care.
                            </p>
                        </div>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 shrink-0 bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm px-7 py-3 rounded-full transition-all duration-200 shadow-lg shadow-blue-500/30"
                        >
                            Get Started Free
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/*  Main grid  */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="space-y-4">
                        <Image
                            src="/Group.png"
                            alt="Symptoms Sense"
                            width={160}
                            height={40}
                            className="h-9 w-auto opacity-90"
                        />
                        <p className="text-sm text-slate-200 leading-relaxed max-w-xs">
                            Empowering healthy lives through AI-powered disease prediction and personalized healthcare guidance.
                        </p>
                        <div className="flex gap-2 pt-1">
                            {["HIPAA", "FDA", "ISO"].map((badge) => (
                                <span key={badge} className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/20 text-slate-200">{badge}</span>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                            Navigation
                        </h3>
                        <ul className="space-y-3">
                            {NAV_LINKS.map(({ label, href }) => (
                                <li key={label}>
                                    <Link
                                        href={href}
                                        className="text-sm text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-blue-400/50 group-hover:bg-blue-400 transition-colors" />
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                            Contact
                        </h3>
                        <ul className="space-y-3.5">
                            <li>
                                <a
                                    href={`mailto:${CONTACT_INFO.email}`}
                                    className="flex items-start gap-3 text-sm text-white/60 hover:text-white transition-colors group"
                                >
                                    <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                                    </span>
                                    <span className="break-all">{CONTACT_INFO.email}</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`tel:${CONTACT_INFO.phone}`}
                                    className="flex items-start gap-3 text-sm text-white/60 hover:text-white transition-colors group"
                                >
                                    <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                                    </span>
                                    {CONTACT_INFO.phone}
                                </a>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-200">
                                <span className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
                                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                                </span>
                                <span>{CONTACT_INFO.address.area}, {CONTACT_INFO.address.country}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-300">
                            Support
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-200">Questions about using Symptoms Sense? Reach out through the contact form or email us.</p>
                        <Link href="/#contact-us" className="inline-flex text-sm font-medium text-blue-300 hover:text-white">Contact us</Link>
                    </div>
                </div>

                {/*  Bottom bar  */}
                <div className="mt-14 pt-6 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-white/30" suppressHydrationWarning>
                        &copy; {new Date().getFullYear()} Symptoms Sense. All rights reserved.
                    </p>
                    <p className="text-xs text-white/20">Built with care for better healthcare.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
