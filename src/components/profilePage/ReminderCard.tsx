import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ReminderCardProps } from "@/types/profile"
import { CalendarDays, Clock, X } from "lucide-react"

export const ReminderCard = ({
  data,
  onCancel
}: ReminderCardProps) => {
  const getMedicineIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tablet': return "💊"
      case 'syrup': return "🥤"
      case 'injection': return "💉"
      default: return "💊"
    }
  }

  return (
    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="h-1 bg-purple-500" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getMedicineIcon(data.medicineType)}</div>
            <div>
              <h4 className="font-semibold text-foreground capitalize">{data.medicineName}</h4>
              <Badge variant="secondary" className="mt-1 text-xs">
                {data.medicineType}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{data.reminderTime}</span>
          </div>
          <div className="flex items-start gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {data.selectedDays.map((day: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {day}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="w-4 h-4 mr-2" />
          Remove Reminder
        </Button>
      </CardContent>
    </Card>
  )
}