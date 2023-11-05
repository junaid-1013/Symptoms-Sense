import Hero from "@/components/Hero"
import { Testimonials } from "@/components/Testimonials"
import ContactUs from "@/components/ContactUs"
import RatingForm from "@/components/RatingForm";
import Chatbot from "@/components/Chatbot"

export default function Home() {
  return (
    <>
      <Hero />
      <Chatbot />
      <Testimonials />
      <RatingForm />
      <ContactUs  />
    </>
  )
}
