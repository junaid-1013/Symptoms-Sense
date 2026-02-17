export const allowOnlyNumbers = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ["Backspace", "ArrowLeft", "ArrowRight", "Delete", "Tab"];
  if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
    e.preventDefault();
  }
};

export const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  export const formatTime = (mins: number) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };