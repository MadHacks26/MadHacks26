import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  /**
   * Time in milliseconds between revealing each subsequent real character.
   * Lower is faster. Defaults to 50ms per character.
   */
  revealDelayMs?: number;
  /** Optional custom character set to use for the gibberish effect. */
  charset?: string;
  /**
   * Time in milliseconds between gibberish flips for unrevealed characters.
   * Lower is more jittery. Defaults to 50ms.
   */
  flipDelayMs?: number;
  /** CSS class for styling the encrypted/scrambled characters */
  encryptedClassName?: string;
  /** CSS class for styling the revealed characters */
  revealedClassName?: string;

  /** If true, animation restarts after finishing. */
  loop?: boolean;
  /** Pause after fully revealed before restarting (ms). Defaults to 1200ms. */
  loopDelayMs?: number;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(original: string, charset: string): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];
    result += ch === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

export const EncryptedText: React.FC<EncryptedTextProps> = ({
  text,
  className,
  revealDelayMs = 50,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
  loop = false,
  loopDelayMs = 1200,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: !loop }); // if looping, don't lock to once

  const [revealCount, setRevealCount] = useState<number>(0);

  const animationFrameRef = useRef<number | null>(null);
  const restartTimeoutRef = useRef<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);

  const scrambleCharsRef = useRef<string[]>(
    text ? generateGibberishPreservingSpaces(text, charset).split("") : [],
  );

  useEffect(() => {
    if (!isInView) return;
    if (!text) return;

    const totalLength = text.length;
    let isCancelled = false;

    const resetAndStart = () => {
      const initial = generateGibberishPreservingSpaces(text, charset);
      scrambleCharsRef.current = initial.split("");
      startTimeRef.current = performance.now();
      lastFlipTimeRef.current = startTimeRef.current;
      setRevealCount(0);

      const update = (now: number) => {
        if (isCancelled) return;

        const elapsedMs = now - startTimeRef.current;
        const currentRevealCount = Math.min(
          totalLength,
          Math.floor(elapsedMs / Math.max(1, revealDelayMs)),
        );

        setRevealCount(currentRevealCount);

        // If done revealing...
        if (currentRevealCount >= totalLength) {
          if (loop) {
            // restart after a pause
            restartTimeoutRef.current = window.setTimeout(() => {
              if (!isCancelled) resetAndStart();
            }, Math.max(0, loopDelayMs));
          }
          return;
        }

        // Re-randomize unrevealed scramble characters on an interval
        const timeSinceLastFlip = now - lastFlipTimeRef.current;
        if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
          for (let index = 0; index < totalLength; index += 1) {
            if (index >= currentRevealCount) {
              scrambleCharsRef.current[index] =
                text[index] === " " ? " " : generateRandomCharacter(charset);
            }
          }
          lastFlipTimeRef.current = now;
        }

        animationFrameRef.current = requestAnimationFrame(update);
      };

      // cancel any previous RAF before starting fresh
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(update);
    };

    resetAndStart();

    return () => {
      isCancelled = true;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (restartTimeoutRef.current !== null) {
        window.clearTimeout(restartTimeoutRef.current);
      }
    };
  }, [isInView, text, revealDelayMs, charset, flipDelayMs, loop, loopDelayMs]);

  if (!text) return null;

  return (
    <motion.span ref={ref} className={cn(className)} aria-label={text} role="text">
      {text.split("").map((char, index) => {
        const isRevealed = index < revealCount;
        const displayChar = isRevealed
          ? char
          : char === " "
            ? " "
            : (scrambleCharsRef.current[index] ?? generateRandomCharacter(charset));

        return (
          <span
            key={index}
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
          >
            {displayChar}
          </span>
        );
      })}
    </motion.span>
  );
};