import { Magic } from "magic-sdk";

const createMagic = (key: string | undefined) => {
  // We make sure that the window object is available and keys are not empty/mocked
  return typeof window !== "undefined" && key && key !== "console"
    ? new Magic(key)
    : null;
};

// Pass in your publishable key from your environment
export const magic = createMagic(process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY);
