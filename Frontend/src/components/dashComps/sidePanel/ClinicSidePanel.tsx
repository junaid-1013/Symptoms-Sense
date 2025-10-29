"use client";

import { useState } from "react";
import { CLIINIC_SIDE_PANEL_ITEMS } from "@/config/constants";

export default function ClinicSidePanel({ setPanelName }: { setPanelName: (name: string) => void }) {
  const [activeTab, setActiveTab] = useState(CLIINIC_SIDE_PANEL_ITEMS[0].text);

  return (
    <aside className="h-screen w-60 bg-white border-r shadow-sm flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold text-gray-700">Clinic Dashboard</h1>
      </div>

      {/* Menu Items */}
      <ul className="flex-1 p-2">
        {CLIINIC_SIDE_PANEL_ITEMS.map((item) => (
          <li
            key={item.text}
            onClick={() => {
              setActiveTab(item.text);
              setPanelName(item.text);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${
              activeTab === item.text
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            {item.icon}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
