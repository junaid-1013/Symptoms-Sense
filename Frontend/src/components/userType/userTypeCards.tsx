"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { USER_TYPES } from "@/config/constants";
import { useState } from "react";
import { motion } from "framer-motion";
import PatientRegForm from "@/components/userType/PatientRegForm";
import ClinicRegForm from "@/components/userType/ClinicRegForm";
import { ArrowLeft } from "lucide-react";

export default function UserTypeCard() {
  const [selected, setSelected] = useState<string | null>(null);

  const handleBack = () => setSelected(null);

  return (
    <section className="min-h-screen flex items-center justify-center bg-muted/30 px-4 relative">
      {selected && (
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      {selected === "patient" ? (
        <PatientRegForm />
      ) : selected === "clinic" ? (
        <ClinicRegForm />
      ) : (
        <div className="text-center space-y-10">
          <div>
            <Badge variant="outline" className="mb-4">
              Choose User Type
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Who are you signing in as?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Please select your role to continue. Your experience will be customized accordingly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {USER_TYPES.map((type) => (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(type.id)}
              >
                <Card className="cursor-pointer transition-all duration-300 bg-card hover:shadow-lg">
                  <CardContent className="p-8 flex flex-col items-center space-y-4 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <type.icon className={`w-8 h-8 ${type.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold">{type.title}</h3>
                    <p className="text-muted-foreground">{type.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
