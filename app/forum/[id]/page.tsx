import { ArrowLeft } from "@/components/site-icons";
import { notFound } from 'next/navigation';
import { getPost } from '../../../db/forum';
import PostActions from './post-actions';
import PageFrame from '../../page-frame';
import { PlayerName } from '../../player-identity';
const labels={notice:'공지',free:'자유',question:'질문',development:'개발',gaming:'게임',daily:'일상'} as const;
export const dynamic='force-dynamic';
export default async function PostPage({params}:{params:Promise<{id:string}>}){
  const id=Number((await params).id);if(!Number.isInteger(id)||id<1)notFound();
  const post=await getPost(id);if(!post)notFound();
  return <PageFrame title={post.title} actions={<a className="text-link" href="/forum"><ArrowLeft size={16} />목록으로</a>} className="post-page"><article className="post-detail"><div className="detail-meta"><span className={`category category-${post.category}`}>{labels[post.category]}</span><PlayerName userId={post.authorId} name={post.authorName}/><time>{post.createdAt.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})}</time>{post.updatedAt&&<span>수정됨</span>}</div><div className="detail-content">{post.content}</div><PostActions id={post.id} authorId={post.authorId} initialCategory={post.category} initialTitle={post.title} initialContent={post.content}/></article></PageFrame>;
}
