'use client';
import Hero from "@/components/Hero"
import { Testimonials } from "@/components/Testimonials"
import ContactUs from "@/components/ContactUs"
import RatingForm from "@/components/RatingForm";
import Chatbot from "@/components/Chatbot"
import Services from "@/components/Services";
import OurTeam from "@/components/OurTeam";
import Doctors from "@/components/Doctors";
import Chat from "@/components/chatbot/page";

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <Chat/>
      {/* <Chatbot /> */}
      <Doctors />
      <Testimonials />
      <RatingForm />
      <OurTeam />
      <ContactUs />

    </>
  )
}
