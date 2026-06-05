/* eslint-disable prettier/prettier */
import { useState } from "react";
import { BookOpen } from "lucide-react";
interface BookCoverProps {
  coverImage?: string | null;
  coverPath?: string | null;
  title: string;
  className?: string;
}

export function BookCover({
  coverImage,
  coverPath,
  title,
  className = "",
}: BookCoverProps) {
  const [error, setError] =
    useState(false);
const imageSrc =

  coverPath?.trim()

  ||

  coverImage?.trim()

  ||

  "";
  if (!imageSrc || error) {
    return (
      <div
        className={`
          relative
          grid
          place-items-center
          bg-[var(--gradient-neon)]
          overflow-hidden
          ${className}
        `}
      >
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex flex-col items-center gap-2 px-2 text-center text-primary-foreground">
          <BookOpen className="h-7 w-7 opacity-90" />
          <span className="text-[10px] font-medium leading-tight line-clamp-3">
            {title}
          </span>
        </div>
      </div>
    );
  }
  return (
    <img
      src={imageSrc}
      alt={title}
      loading="lazy"
      onError={() => {
        console.warn(
          "BOOK COVER LOAD FAILED:",
          imageSrc
        );
        setError(true);
      }}
      className={`
        object-cover
        object-center
        ${className}
      `}
    />
  );
}
