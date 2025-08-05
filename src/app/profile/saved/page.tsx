
import { Bookmark } from 'lucide-react';

export default function SavedPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Postingan Tersimpan</h1>
      </div>
       <div className="text-center py-10">
        <p className="text-muted-foreground">
          Fitur ini sedang dalam pengembangan.
        </p>
      </div>
    </div>
  );
}
