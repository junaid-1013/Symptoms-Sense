"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff } from "react-feather";
import LoadingDots from "./components/LoadingDots";
import { Label } from "../ui/label";
type Message = {
  role: "user" | "assistant";
  content: string;
  links?: string[];
};
export default function Chat() {
  const [message, setMessage] = useState<string>("");
  const [history, setHistory] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello there! I am your AI medical assistant. Tell me how are you feeling?",
    },
  ]);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState(false);
  const startListening = () => {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setMessage(text);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
    setIsListening(true);
  };
  const stopListening = () => {
    setIsListening(false);
  };
  const handleClick = async () => {
    if (message === "") return;

    setHistory((oldHistory) => [
      ...oldHistory,
      { role: "user", content: message },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/chatapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: message, history: history }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from server");
      }

      const result = await response.json();
      console.log("result", result.data);

      setHistory((oldHistory: any) => [
        ...oldHistory,
        { role: "assistant", content: result.data },
      ]);
      setLoading(false);
    } catch (error) {
      console.error(error);
      alert("An error occurred while processing the request");
    }
  };
  console.log("this is the history", history);

  const formatPageName = (url: string) => {
    const pageName = url.split("/").pop();

    if (pageName) {
      const formattedName = pageName.split("-").join(" ");

      return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
    }
  };

  //scroll to bottom of chat
  { /*useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);*/}

  return (
    <main id="chat" className="h-screen bg-white py-6 flex flex-col container md:px-8 px-4">
      <div className="flex flex-col gap-8 w-full items-center flex-grow max-h-full">
        <h2 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Symptoms Sense AI Bot
        </h2>
        <form
          className="rounded-2xl border-[#192a56] border-opacity-5 border w-full flex-grow flex flex-col bg-[url('/images/bg.png')] bg-cover max-h-full overflow-clip "
          onSubmit={(e) => {
            e.preventDefault();
            handleClick();
          }}
        >
          <div className="scroll-auto flex flex-col gap-5 p-10 h-full">
            {history.map((message: Message, idx) => {
              const isLastMessage = idx === history.length - 1;
              switch (message.role) {
                case "assistant":
                  return (
                    <div
                      ref={isLastMessage ? lastMessageRef : null}
                      key={idx}
                      className="flex gap-2"
                    >
                      <img
                        src="images/assistant-avatar.png"
                        className="h-12 w-12 rounded-full"
                      />
                      <div className="w-auto max-w-xl break-words bg-white rounded-b-xl rounded-tr-xl text-black p-6 shadow-[0_10px_40px_0px_rgba(0,0,0,0.15)] flex flex-col">
                        <Label className="text-sm font-bold text-[#192a56] mb-2">
                          AI assistant
                        </Label>
                        {message.content}
                        {message.links && (
                          <div className="mt-4 flex flex-col gap-2">
                            <Label className="text-sm font-medium text-slate-500">
                              Sources:
                            </Label>

                            {message.links?.map((link) => {
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
                      </div>
                    </div>
                  );
                case "user":
                  return (
                    <div
                      className="w-auto max-w-xl break-words bg-white rounded-b-xl rounded-tl-xl text-black p-6 self-end shadow-[0_10px_40px_0px_rgba(0,0,0,0.15)]"
                      key={idx}
                      ref={isLastMessage ? lastMessageRef : null}
                    >
                      <Label className="text-sm font-medium text-[#192a56] mb-2">
                        You
                      </Label>
                      {message.content}
                    </div>
                  );
              }
            })}
            {loading && (
              <div ref={lastMessageRef} className="flex gap-2">
                <img
                  src="images/assistant-avatar.png"
                  className="h-12 w-12 rounded-full"
                />
                <div className="w-auto max-w-xl break-words bg-white rounded-b-xl rounded-tr-xl text-black p-6 shadow-[0_10px_40px_0px_rgba(0,0,0,0.15)]">
                  <Label className="text-sm font-bold text-[#192a56] mb-4">
                    AI assistant
                  </Label>
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>

          {/* input area */}
          <div className="flex bottom-0 w-full px-6 pb-6 h-24 ">
            <div className="w-full relative">
              <textarea
                aria-label="chat input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                className="w-full h-full resize-none rounded-full border border-slate-900/10 bg-white pl-6 pr-24 py-[25px] 
                text-base placeholder:text-slate-400 focus:border-[#192a56] focus:outline-none focus:ring-4
                 focus:ring-violet-500/10 shadow-[0_10px_40px_0px_rgba(0,0,0,0.15)] overflow-hidden"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleClick();

                  }
                }
                }
              />

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleClick();
                }}
                className="flex w-14 h-14 items-center justify-center rounded-full px-3 text-sm 
                 bg-[#192a56] font-semibold text-white hover:bg-[#192a56]/80 active:bg-[#192a56]/90 absolute right-2 bottom-2
                  disabled:bg-[#192a56]/10 disabled:text-[#192a56]/40"
                type="submit"
                aria-label="Send"
                disabled={!message || loading}
              >
                <Send />
              </button>
              {!message && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    startListening();
                  }}
                  className="flex w-14 h-14 items-center justify-center rounded-full px-3 text-sm 
                   bg-[#192a56] font-semibold text-white hover:bg-[#192a56]/80 active:bg-[#192a56]/90 absolute right-2 bottom-2
                    disabled:bg-[#192a56]/10 disabled:text-[#192a56]/40"
                >
                  <Mic />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
