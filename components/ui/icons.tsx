"use client";
import { Heart, Play, ShareNetwork, House } from "@phosphor-icons/react";

export const PlayIcon = ({ size=20 }: { size?: number }) => <Play size={size} weight="regular" />;
export const ShareIcon = ({ size=20 }: { size?: number }) => <ShareNetwork size={size} weight="regular" />;

// Example: filled when active
export const HeartIcon = ({ active=false, size=20 }: { active?: boolean; size?: number }) =>
  <Heart size={size} weight={active ? "fill" : "regular"} />;

// Example: nav outline icon
export const HomeIcon = ({ size=22 }: { size?: number }) => <House size={size} weight="regular" />;