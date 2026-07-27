'use client';
import { useState } from "react";
import ContactUs from "@/components/landingPage/ContactUs/ContactUs";
import Doctors from "@/components/landingPage/Doctors";
import Hero from "@/components/landingPage/Hero";
import RatingForm from "@/components/landingPage/RatingForm";
import Services from "@/components/landingPage/Services";
import Testimonials from "@/components/landingPage/Testimonials";

export default function Home() {
  const [feedbackVersion, setFeedbackVersion] = useState(0);

  return (
    <>
      <Hero />
      <Services />
      <Doctors />
      <Testimonials refreshKey={feedbackVersion} />
      <RatingForm onSubmitted={() => setFeedbackVersion((version) => version + 1)} />
      {/* <OurTeam /> */}
      <ContactUs />
    </>
  );
}