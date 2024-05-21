"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CONTACT_INFO } from "@/config/constants";
import { ContactFormData, SubmitStatus } from "@/types";
import axios, { AxiosError } from "axios";
import {
  Building2,
  CheckCircle2,
  Headphones,
  Heart,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
  Star,
  Users
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ContactFormField from "./ContactFormField";
import ContactInfoItem from "./ContactInfoItem";
import FeatureItem from "./FeatureItem";
import { FORM_VALIDATION } from "./FormValidationHelper";

export default function ContactUs() {
  const { toast } = useToast();
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid }
  } = useForm<ContactFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: undefined,
      subject: '',
      message: ''
    }
  });

  const handleFormSubmit = async (formData: ContactFormData) => {
    setSubmitStatus("loading");

    try {
      await axios.post("/api/contactUs", formData);

      setSubmitStatus("success");
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for contacting us. We'll respond within 24 hours.",
        duration: 5000,
      });

      reset();

      // Reset status after delay
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);

    } catch (error) {
      setSubmitStatus("error");

      const errorMessage = error instanceof AxiosError && error.response?.data?.error
        ? error.response.data.error
        : "Failed to send message. Please try again later.";

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });

      // Reset status after delay
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    }
  };

  return (
    <section id="contact" className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="px-4 py-1.5">
            <MessageSquare className="w-4 h-4 mr-2" />
            Get In Touch
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Contact Our <span className="text-primary">Healthcare Team</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions about our services or need medical guidance?
            Our dedicated team is here to support your healthcare journey.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Information - Left Side */}
          <div className="space-y-5">
            {/* Main Contact Card */}
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80">
              <CardContent className="p-8 text-primary-foreground">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">We&apos;re Here to Help</h3>
                    <p className="text-primary-foreground/90 text-sm">
                      Reach out through any channel that works best for you
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <ContactInfoItem
                      icon={<Mail className="w-5 h-5" />}
                      label="Email Us"
                      value={CONTACT_INFO.email}
                      className="text-primary-foreground"
                    />

                    <ContactInfoItem
                      icon={<Phone className="w-5 h-5" />}
                      label="Call Us"
                      value={CONTACT_INFO.phone}
                      className="text-primary-foreground"
                    />

                    <ContactInfoItem
                      icon={<MapPin className="w-5 h-5" />}
                      label="Visit Us"
                      value={CONTACT_INFO.address.street}
                      subValue={CONTACT_INFO.address.area}
                      className="text-primary-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Choose Us Card */}
            <Card className="border-border/50 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-primary" />
                  Why Choose Us?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FeatureItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                  text="Quick response within 24 hours"
                />
                <FeatureItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                  text="Expert medical professionals"
                />
                <FeatureItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                  text="Personalized healthcare guidance"
                />
                <FeatureItem
                  icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                  text="100% Confidential consultation"
                />
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="text-center">
                <Shield className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xs font-medium">HIPAA</p>
                <p className="text-xs text-muted-foreground">Compliant</p>
              </div>
              <div className="text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xs font-medium">10,000+</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </div>
              <div className="text-center">
                <Heart className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xs font-medium">98%</p>
                <p className="text-xs text-muted-foreground">Satisfaction</p>
              </div>
            </div>
          </div>

          {/* Contact Form - Right Side */}
          <div>
            <Card className="shadow-xl border-border/50">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Send className="w-6 h-6 text-primary" />
                  Send Us a Message
                </CardTitle>
                <CardDescription className="text-base pt-4 pb-2">
                  Fill out the form below and we&apos;ll respond within 24 hours
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                  {/* Name and Email Row */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <ContactFormField
                      id="name"
                      label="Full Name"
                      placeholder="John Doe"
                      register={register("name", FORM_VALIDATION.name)}
                      error={errors.name}
                      icon={<Building2 className="w-4 h-4" />}
                    />

                    <ContactFormField
                      id="email"
                      label="Email Address"
                      type="email"
                      placeholder="john@example.com"
                      register={register("email", FORM_VALIDATION.email)}
                      error={errors.email}
                      icon={<Mail className="w-4 h-4" />}
                    />
                  </div>

                  {/* Phone and Subject Row */}
                  <div className="grid md:grid-cols-2 gap-5">
                    <ContactFormField
                      id="phone"
                      label="Phone Number"
                      type="tel"
                      placeholder="03XXXXXXXXX"
                      register={register("phone", FORM_VALIDATION.phone)}
                      error={errors.phone}
                      icon={<Phone className="w-4 h-4" />}
                    />

                    <ContactFormField
                      id="subject"
                      label="Subject"
                      placeholder="How can we help?"
                      register={register("subject", FORM_VALIDATION.subject)}
                      error={errors.subject}
                      icon={<MessageSquare className="w-4 h-4" />}
                    />
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      Message
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Please provide details about your inquiry..."
                      rows={6}
                      className={`resize-none transition-all duration-200 ${errors.message
                        ? 'border-destructive focus:ring-destructive'
                        : 'hover:border-primary/50 focus:border-primary'
                        }`}
                      {...register("message", FORM_VALIDATION.message)}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-destructive rounded-full" />
                        {errors.message.message}
                      </p>
                    )}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Required field</span>
                      <span>{errors.message ? "0" : "20"}-500 characters</span>
                    </div>
                  </div>

                  {/* Support Note */}
                  <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-start gap-2">
                      <Headphones className="w-4 h-4 text-primary mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Need immediate assistance?</p>
                        <p>Call our 24/7 emergency hotline at {CONTACT_INFO.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold transition-all duration-200"
                    disabled={isSubmitting || !isValid || submitStatus === "loading"}
                    variant={submitStatus === "success" ? "default" : "default"}
                  >
                    {submitStatus === "loading" ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending Message...
                      </>
                    ) : submitStatus === "success" ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Message Sent Successfully!
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}