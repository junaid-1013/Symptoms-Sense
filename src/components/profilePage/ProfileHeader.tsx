import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProfileHeaderProps } from "@/types"
import {
  Activity,
  Calendar,
  CheckCircle,
  FileEdit,
  Heart,
  Mail,
  Pill,
  Stethoscope
} from "lucide-react"
import Link from "next/link"

export const ProfileHeader = ({ user, stats }: ProfileHeaderProps) => {
  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-10deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>

        <Card className="mb-8 border-0 shadow-xl overflow-hidden bg-card/95 backdrop-blur">
          <div className="h-48 relative overflow-hidden" style={{
            background: 'linear-gradient(135deg, #192a56 0%, #273c75 100%)'
          }}>
          {/* Abstract Medical Wave Pattern */}
          <div className="absolute inset-0">
            {/* Floating medical elements */}
            <div className="absolute top-10 left-20 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-20 right-40 w-40 h-40 bg-white/25 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute bottom-10 left-1/3 w-36 h-36 bg-white/15 rounded-full blur-3xl animate-pulse delay-1000" />

            {/* Wave patterns */}
            <svg className="absolute bottom-0 left-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,56 C150,100 350,0 600,56 C850,112 1050,0 1200,56 L1200,120 L0,120 Z" fill="url(#gradient1)" opacity="0.3" />
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
            <svg className="absolute bottom-0 left-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,26 C200,80 400,20 600,40 C800,60 1000,10 1200,26 L1200,120 L0,120 Z" fill="url(#gradient2)" opacity="0.2" />
              <defs>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>

            {/* Heartbeat line */}
            <svg className="absolute top-1/2 left-0 w-full h-20 -translate-y-1/2">
              <polyline
                points="0,40 100,40 120,20 140,60 160,10 180,40 1200,40"
                fill="none"
                stroke="url(#heartbeat-gradient)"
                strokeWidth="1.5"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="heartbeat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Medical icons floating */}
            <div className="absolute top-8 right-32 text-white/30 animate-float">
              <Heart className="w-12 h-12" />
            </div>
            <div className="absolute bottom-12 right-1/4 text-white/25 animate-float-delayed">
              <Activity className="w-10 h-10" />
            </div>
            <div className="absolute top-16 left-1/4 text-white/20 animate-float">
              <Pill className="w-8 h-8 rotate-45" />
            </div>
            <div className="absolute bottom-8 left-16 text-white/25 animate-float-delayed">
              <Stethoscope className="w-12 h-12" />
            </div>
          </div>

          {/* Gradient mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          {/* Geometric pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(30deg, #ffffff 8%, transparent 8.5%, transparent 91%, #ffffff 91.5%, #ffffff),
                linear-gradient(150deg, #ffffff 8%, transparent 8.5%, transparent 91%, #ffffff 91.5%, #ffffff),
                linear-gradient(30deg, #ffffff 8%, transparent 8.5%, transparent 91%, #ffffff 91.5%, #ffffff),
                linear-gradient(150deg, #ffffff 8%, transparent 8.5%, transparent 91%, #ffffff 91.5%, #ffffff)
              `,
              backgroundSize: '60px 80px',
              backgroundPosition: '0 0, 0 0, 30px 40px, 30px 40px',
            }}
          />

          <div className="absolute top-4 right-4 z-10">
            <Link href="/editProfile">
              <Button variant="secondary" size="sm" className="gap-2 shadow-lg backdrop-blur bg-white/90 hover:bg-white/95 dark:bg-gray-900/90 dark:hover:bg-gray-900/95">
                <FileEdit className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>

        <CardContent className="relative -mt-24 pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative">
              <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-background shadow-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Profile"
                  src={user.image || "/user.png"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-green-500 rounded-full border-4 border-background">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h1 className="text-4xl font-bold text-foreground tracking-tight">
                  {user.username}
                </h1>
                <p className="text-muted-foreground mt-1">Healthcare Patient</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user.email}
                </Badge>
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Active Member
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 md:mt-0">
              <Link href="/doctors">
                <Button className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </Button>
              </Link>
              <Link href="/medicineReminder">
                <Button variant="outline" className="gap-2">
                  <Pill className="w-4 h-4" />
                  Add Reminder
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}