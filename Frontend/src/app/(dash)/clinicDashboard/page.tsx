"use client";

import { useState } from "react";
import ClinicSidePanel from "@/components/dashComps/sidePanel/ClinicSidePanel";
import AddDoctor from "@/components/doctor/AddDoctor";

export default function ClinicDashboardPage() {
  const [panelName, setPanelName] = useState("Add Doctor");

  return (
    <div className="flex">
      <ClinicSidePanel setPanelName={setPanelName} />
      <div className="flex-1 h-screen bg-gray-50">
        <div className="p-4 border-b bg-white font-semibold text-gray-700">
          {panelName}
        </div>
        <div className="p-4">
          {panelName === "Add Doctor" && <AddDoctor />}
        </div>
      </div>
    </div>
  );
}