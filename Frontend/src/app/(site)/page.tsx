'use client';
import { Chat } from "@/components/chat/chat";
import ContactUs from "@/components/landingPage/ContactUs/ContactUs";
import Doctors from "@/components/landingPage/Doctors";
import Hero from "@/components/landingPage/Hero";
import OurTeam from "@/components/landingPage/OurTeam";
import RatingForm from "@/components/landingPage/RatingForm";
import Services from "@/components/landingPage/Services";
import Testimonials from "@/components/landingPage/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      {/* <Chat /> */}
      <Doctors />
      <Testimonials />
      <RatingForm />
      {/* <OurTeam /> */}
      <ContactUs />
    </>
  )
}