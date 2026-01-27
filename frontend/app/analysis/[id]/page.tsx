import AnalysisDetailClient from './AnalysisDetailClient';

// Cloudflare Pages Edge Runtime 설정
export const runtime = 'edge';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnalysisDetailPage({ params }: Props) {
  const { id } = await params;
  return <AnalysisDetailClient id={id} />;
}
