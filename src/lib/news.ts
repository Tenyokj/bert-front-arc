export type NewsItem = {
  id: string;
  image: string;
  alt: string;
  href?: string;
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
  backgroundClassName?: string;
};

export const newsItems: NewsItem[] = [
  {
    id: "v3-arc-testnet-release",
    image: "/news-v3-release.png",
    alt: "BERT V3 release on Arc Testnet banner",
    href: "https://bertdao-docs.vercel.app",
    aspectRatio: "2172 / 724",
    objectFit: "cover",
    objectPosition: "center center",
    backgroundClassName: "bg-[#070b16]",
  },
  {
    id: "verification-and-v2.1",
    image: "/news-verification-v2dot1.png",
    alt: "BERT verification and v2.1 update banner",
    href: "https://bertdao-docs.vercel.app",
    aspectRatio: "16 / 8",
    objectFit: "cover",
    objectPosition: "center center",
    backgroundClassName: "bg-[#070b16]",
  },
  {
    id: "bootstrap-list",
    image: "/news-bootstrap-list.png",
    alt: "BERT bootstrap list banner",
    href: "https://bertdao-docs.vercel.app",
    aspectRatio: "16 / 6",
    objectFit: "cover",
    objectPosition: "center center",
    backgroundClassName: "bg-[#070b16]",
  },
  {
    id: "milestones-and-v2",
    image: "/news-milestones-v2.png",
    alt: "BERT milestone grant flow banner",
    href: "https://bertdao-docs.vercel.app",
    aspectRatio: "16 / 8",
    objectFit: "contain",
    objectPosition: "center center",
    backgroundClassName: "bg-[#040801]",
  },
];
