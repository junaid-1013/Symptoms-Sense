'use client';
import ContactUs from "@/components/ContactUs";
import Doctors from "@/components/Doctors";
import Hero from "@/components/Hero";
import OurTeam from "@/components/OurTeam";
import RatingForm from "@/components/RatingForm";
import Services from "@/components/Services";
import { Testimonials } from "@/components/Testimonials";
import { Chat } from "@/components/chat/chat";

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Chat />
      <Doctors />
      <Testimonials />
      <RatingForm />
      <OurTeam />
      <ContactUs />

    </>
  )
}
