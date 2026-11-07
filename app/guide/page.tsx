import { getGuideContent } from "../../db/guide";
import GuideClient from "./guide-client";
import PageFrame from "../page-frame";

export const dynamic = "force-dynamic";
export default async function GuidePage() {
  try {
    const content = await getGuideContent();
    return <GuideClient initialContent={content} />;
  } catch {
    return <PageFrame title="가이드"><p role="alert">가이드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p></PageFrame>;
  }
}
