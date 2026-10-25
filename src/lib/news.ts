export type NewsItem = {
  id: string;
  image: string;
  alt: string;
  href?: string;
  aspectRatio?: string;
  objectFit?: "cover" | "contain";
  objectPosition?: string;
  backgroundClassName?: string;
  maxWidth?: number;
};

export const newsItems: NewsItem[] = [
  {
    id: "v3-2-community-governance",
    image: "/news-v-3-2.png",
    alt: "BERT V3.2 release with Admin-controlled 20/40/40 payments and the V3.2.1 correction hotfix on Arc Testnet",
    href: "https://bertdao-docs.vercel.app/#v3-tranche-authorizations",
    aspectRatio: "2103 / 748",
    objectFit: "contain",
    objectPosition: "center center",
    backgroundClassName: "bg-[#ffe36b]",
    maxWidth: 1600,
  },
  {
    id: "bert-console-beta",
    image: "/news-bert-console.png",
    alt: "BERT Console V0.1.0 Beta launch banner for Arc Testnet",
    href: "https://bertdao-console.vercel.app/",
    aspectRatio: "2172 / 724",
    objectFit: "contain",
    objectPosition: "center center",
    backgroundClassName: "bg-[#030900]",
    maxWidth: 1600,
  },
  {
    id: "v3-1-modular-community-layer",
    image: "/news-v-3-1.jpg",
    alt: "BERT V3.1 modular community layer release banner",
    href: "https://bertdao-docs.vercel.app/v3.html",
    aspectRatio: "640 / 213",
    objectFit: "cover",
    objectPosition: "center center",
    backgroundClassName: "bg-[#070b16]",
  },
  {
    id: "v2-3-backer-milestones",
    image: "/news-v2-3.png",
    alt: "BERT V2.3 backer-controlled milestone release banner",
    href: "https://bertdao-docs.vercel.app/whitepaper/BERTDAO-Protocol-Whitepaper.pdf",
    aspectRatio: "2172 / 724",
    objectFit: "cover",
    objectPosition: "center center",
    backgroundClassName: "bg-[#070b16]",
  },
  {
    id: "v2-2-conditional-pledges",
    image: "/news-v2-2.png",
    alt: "BERT V2.2 conditional pledge funding release banner",
    href: "https://bertdao-docs.vercel.app",
    aspectRatio: "2172 / 724",
    objectFit: "cover",
    objectPosition: "center center",
    backgroundClassName: "bg-[#070b16]",
  },
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
