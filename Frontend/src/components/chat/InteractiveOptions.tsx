import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InteractiveOption, DoctorInfo } from "@/types/medicalChat";

interface InteractiveOptionsProps {
  options?: InteractiveOption[];
  doctors?: DoctorInfo[];
  onOptionClick: (option: InteractiveOption) => void;
  onDoctorSelect: (doctor: DoctorInfo) => void;
}

export function InteractiveOptions({
  options = [],
  doctors = [],
  onOptionClick,
  onDoctorSelect
}: InteractiveOptionsProps) {
  if (options.length === 0 && doctors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Interactive Options */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onOptionClick(option)}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}

      {/* Doctor List */}
      {doctors.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Available Doctors:</h4>
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="p-3" onClick={() => onDoctorSelect(doctor)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{doctor.name}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {doctor.specialization}
                        </Badge>
                        {doctor.experience_years && (
                          <span className="text-xs text-muted-foreground">
                            {doctor.experience_years} years exp.
                          </span>
                        )}
                      </div>
                      {doctor.clinic_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {doctor.clinic_name}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
