'use client';
import Hero from "@/components/Hero"
import { Testimonials } from "@/components/Testimonials"
import ContactUs from "@/components/ContactUs"
import RatingForm from "@/components/RatingForm";
import Chatbot from "@/components/Chatbot"
import Services from "@/components/Services";
import OurTeam from "@/components/OurTeam";

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Chatbot />
      <Testimonials />
      <RatingForm />
      <OurTeam />
      <ContactUs />

    </>
  )
}
