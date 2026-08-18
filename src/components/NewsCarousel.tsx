"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

import { newsItems } from "@/lib/news";

export function NewsCarousel() {
  const trackRef = useRef<HTMLDivElement | null>(null);

  function scrollByCard(direction: "left" | "right") {
    const node = trackRef.current;
    if (!node) return;
    const amount = Math.round(node.clientWidth * 0.86);
    node.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative left-1/2 mt-16 w-screen -translate-x-1/2 sm:mt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-teal-600">News</p>
          <h2 className="mt-5 font-[var(--font-display)] text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
            Protocol updates, launches, and governance changes in one banner rail.
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollByCard("left")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5"
            aria-label="Scroll news left"
          >
            <FaArrowLeft className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard("right")}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-[0_16px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5"
            aria-label="Scroll news right"
          >
            <FaArrowRight className="text-sm" />
          </button>
        </div>
      </div>

      <div ref={trackRef} className="news-track mt-10 flex snap-x snap-mandatory overflow-x-auto">
        {newsItems.map((item) => (
          <article key={item.id} className="w-screen shrink-0 snap-start overflow-hidden">
            {item.href ? (
              <Link href={item.href} className="block">
                <div
                  className={`relative aspect-[16/6] w-full overflow-hidden ${item.backgroundClassName ?? "bg-transparent"}`}
                  style={{ aspectRatio: item.aspectRatio ?? "16 / 6" }}
                >
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    className={item.objectFit === "contain" ? "object-contain" : "object-cover"}
                    style={{ objectPosition: item.objectPosition ?? "center center" }}
                    sizes="100vw"
                    priority={item.id === newsItems[0]?.id}
                  />
                </div>
              </Link>
            ) : (
              <div
                className={`relative aspect-[16/6] w-full overflow-hidden ${item.backgroundClassName ?? "bg-transparent"}`}
                style={{ aspectRatio: item.aspectRatio ?? "16 / 6" }}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className={item.objectFit === "contain" ? "object-contain" : "object-cover"}
                  style={{ objectPosition: item.objectPosition ?? "center center" }}
                  sizes="100vw"
                  priority={item.id === newsItems[0]?.id}
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
