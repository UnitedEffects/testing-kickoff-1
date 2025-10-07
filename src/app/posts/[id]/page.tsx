import { PostDetailPage } from '@/features/post-detail'

type Props = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return <PostDetailPage id={id} />
}
