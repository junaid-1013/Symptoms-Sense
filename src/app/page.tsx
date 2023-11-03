import Hero from "@/components/Hero"
import { Testimonials } from "@/components/Testimonials"
import ContactUs from "@/components/ContactUs"
import RatingForm from "@/components/RatingForm";

export default function Home() {
  return (
    <>
      <Hero />
      <Testimonials />
      <RatingForm />
      <ContactUs />
    </>
  )
}
