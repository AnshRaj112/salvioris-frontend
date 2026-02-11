import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Forum | SALVIORIS",
  description: "Join public groups and chat with others in a safe, supportive community",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

