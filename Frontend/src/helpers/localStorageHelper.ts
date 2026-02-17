export function readStorage<T>(key: string): T | null {
    try {
      if (typeof window === "undefined") return null; 
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;     
    } catch {
      return null; 
    }
  }
  
  export function writeStorage<T>(key: string, value: T | null) {
    try {
      if (typeof window === "undefined") return; 
      if (value == null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(value)); 
    } catch {
        return null;
    }
  }
  