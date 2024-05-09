import { Avatar, AvatarImage } from '@/components/ui/avatar';

export default function ChatTopbar() {
  return (
    <div className="w-full h-20 flex items-center gap-2 border-b p-4">
      <Avatar className="flex justify-center items-center">
        <AvatarImage
          src={"images/assistant-avatar.png"}
          alt={"AI assistant"}
          width={6}
          height={6}
          className="w-10 h-10 "
        />
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium">AI assistant</span>
        <span className="text-xs">Symptoms Sense AI Bot</span>
      </div>
    </div>
  )
}
