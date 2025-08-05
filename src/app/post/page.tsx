import { PlusSquare } from 'lucide-react';
import PostEditor from '@/components/PostEditor';

export default function PostPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <PlusSquare className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Buat Catatan</h1>
      </div>
      <PostEditor />
    </div>
  );
}
