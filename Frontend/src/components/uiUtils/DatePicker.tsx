"use client"
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

export function DatePicker({ onChange }: { onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(undefined)
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" id="date-picker" className="justify-between font-normal col-span-1">
                    {date ? date.toLocaleDateString() : "Select date"}
                    <ChevronDownIcon  size={15}/>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                <Calendar
                    mode="single"
                    selected={date}
                    captionLayout="dropdown"
                    onSelect={(d) => {
                        setDate(d)
                        setOpen(false)
                        if (d) {
                            const iso = new Date(d.setHours(0, 0, 0, 0)).toISOString()
                            onChange(iso)
                        }
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}