export type StaffRole = "owner" | "subadmin" | "member";
export type AdminAccount = {
  id: string; email: string; name: string; role: StaffRole;
  createdAt: string; lastSignInAt: string | null; confirmed: boolean; providers: string[];
};
export type AdminPost = {
  id: number; category: "notice" | "free" | "question"; title: string; content: string;
  authorName: string; authorId: string; createdAt: string; updatedAt: string | null;
};
export type AdminGuide = { key: string; content: string; updatedAt: string | null; customized: boolean };
export type AdminOverview = {
  totalUsers: number | null; totalPosts: number; notices: number; questions: number;
  staffCount: number; customizedGuides: number; recentPosts: AdminPost[];
};
