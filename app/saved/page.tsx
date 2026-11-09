import type { Metadata } from "next";
import SavedClient from "./saved-client";
export const metadata: Metadata = { title: "내 보관함 | L.B ONLINE", robots: { index: false, follow: false } };
export default function SavedPage() { return <SavedClient/>; }
