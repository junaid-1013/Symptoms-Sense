import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import React, { useRef } from "react";
import { Label } from "../ui/label";
import { Message } from "./chat";
import ChatBottombar from "./chat-bottombar";
import LoadingDots from "./LoadingDots";

interface ChatListProps {
  messages: Message[];
  sendMessage: () => void;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  message: string;
  loading: boolean;
}

export function ChatList({ messages, sendMessage, setMessage, message, loading }: ChatListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const formatPageName = (url: string) => {
    const pageName = url.split("/").pop();

    if (pageName) {
      const formattedName = pageName.split("-").join(" ");

      return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
    }
  };

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col"
      >
        <AnimatePresence>
          {messages?.map((message: Message, index: number) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
              transition={{
                opacity: { duration: 0.1 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration: messages.indexOf(message) * 0.05 + 0.2,
                },
              }}
              style={{
                originX: 0.5,
                originY: 0.5,
              }}
              className={cn(
                "flex flex-col gap-2 p-4 whitespace-pre-wrap",
                message.role !== "assistant" ? "items-end" : "items-start"
              )}
            >
              <div className="flex gap-3 items-center">
                {message.role === "assistant" && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage
                      src={"images/assistant-avatar.png"}
                      alt={message.role}
                      width={6}
                      height={6}
                    />
                  </Avatar>
                )}
                <span className=" bg-accent p-3 rounded-md max-w-xs">
                  {message.content}
                  {message.links && (
                    <div className="mt-4 flex flex-col gap-2">
                      <Label className="text-sm font-medium text-slate-500">
                        Sources:
                      </Label>

                      {message.links?.map((link: string) => {
                        return (
                          <a
                            href={link}
                            key={link}
                            className="block w-fit px-2 py-1 text-sm  text-[#192a56] bg-violet-100 rounded"
                          >
                            {formatPageName(link)}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </span>
                {message.role !== "assistant" && (
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage
                      src={"/user.png"}
                      alt={message.role}
                      width={6}
                      height={6}
                    />
                  </Avatar>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            key="loading"
            layout
            initial={{ opacity: 0, scale: 1, y: 50, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 1, y: 1, x: 0 }}
            transition={{
              opacity: { duration: 0.1 },
              layout: {
                type: "spring",
                bounce: 0.3,
                duration: 0.2,
              },
            }}
            style={{
              originX: 0.5,
              originY: 0.5,
            }}
            className="flex items-center gap-3 p-4"
          >
            <Avatar className="flex justify-center items-center">
              <AvatarImage
                src={"images/assistant-avatar.png"}
                alt="assistant"
                width={6}
                height={6}
              />
            </Avatar>
            <span className="bg-accent p-3 rounded-md max-w-xs">
              <LoadingDots />
            </span>
          </motion.div>
        )}
      </div>
      <ChatBottombar sendMessage={sendMessage} setMessage={setMessage} message={message} loading={loading} />
    </div>
  );
}
