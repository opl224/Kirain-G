
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { suggestTags } from '@/ai/flows/suggest-tags';
import { Badge } from './ui/badge';
import { Bot, Loader, Tag, X, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Switch } from './ui/switch';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const formSchema = z.object({
  content: z
    .string()
    .max(500, { message: 'Catatan Anda tidak boleh lebih dari 500 karakter.' })
    .optional(),
});

type PostType = 'note' | 'story';

export default function PostEditor() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostType>('note');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  const { getValues, watch } = form;
  const contentValue = watch('content');

  const handleSuggestTags = async () => {
    const content = getValues('content');
    if (!content || content.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Konten terlalu pendek',
        description: 'Silakan tulis setidaknya 10 karakter untuk mendapatkan saran tag.',
      });
      return;
    }
    setIsSuggesting(true);
    setSuggestedTags([]);
    try {
      const result = await suggestTags({ postContent: content });
      setSuggestedTags(result.tags);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal menyarankan tag. Silakan coba lagi.',
      });
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    
    setMediaError(null);
    const isVideo = file.type.startsWith('video/');
    
    // Create a URL for preview
    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
    setMediaFile(file);

    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 25) {
          setMediaError('Video tidak boleh lebih dari 25 detik.');
          setMediaFile(null); // Invalidate file
          setMediaPreview(null);
        }
      };
      video.src = previewUrl;
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Belum masuk', description: 'Anda harus masuk untuk memposting.' });
      return;
    }

    if (postType === 'note' && (!values.content || values.content.length < 3)) {
        toast({ variant: 'destructive', title: 'Konten terlalu pendek', description: 'Catatan Anda harus setidaknya 3 karakter.' });
        return;
    }

    if (postType === 'story' && !mediaFile) {
        toast({ variant: 'destructive', title: 'Media Diperlukan', description: 'Silakan pilih gambar atau video untuk cerita Anda.'});
        return;
    }
    if (mediaError) {
        toast({ variant: 'destructive', title: 'Media tidak valid', description: mediaError});
        return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) throw new Error("Profil pengguna tidak ditemukan.");
      const userProfile = userDocSnap.data();

      const authorInfo = {
          id: user.uid,
          name: userProfile.name,
          handle: userProfile.handle,
          avatarUrl: userProfile.avatarUrl,
          isVerified: userProfile.isVerified || false,
      };

      if (postType === 'note') {
        await addDoc(collection(db, "posts"), {
          author: authorInfo,
          content: values.content,
          tags: selectedTags,
          likes: 0,
          comments: 0,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Catatan Diposting!', description: 'Catatan baru Anda sekarang dapat dilihat oleh orang lain.' });
      } else if (postType === 'story' && mediaFile) {
        // NOTE: In a real app, you would upload the file to a storage service (like Firebase Storage)
        // and get a URL. For this prototype, we'll simulate this by converting the file to a Data URL.
        const reader = new FileReader();
        reader.readAsDataURL(mediaFile);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
           await addDoc(collection(db, "stories"), {
                author: authorInfo,
                mediaUrl: base64data,
                mediaType: mediaFile.type.startsWith('image/') ? 'image' : 'video',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Cerita Diposting!', description: 'Cerita baru Anda telah ditambahkan.' });
            router.push('/');
        }
      }
      
      form.reset();
      setSelectedTags([]);
      setSuggestedTags([]);
      setMediaFile(null);
      setMediaPreview(null);
      if(postType === 'note') router.push('/');

    } catch (error: any) {
       toast({ variant: 'destructive', title: 'Error memposting', description: error.message });
    } finally {
      setIsLoading(false);
    }
  }

  const resetMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="flex items-center space-x-2">
              <FormLabel htmlFor="post-type">Catatan</FormLabel>
              <Switch
                id="post-type"
                checked={postType === 'story'}
                onCheckedChange={(checked) => setPostType(checked ? 'story' : 'note')}
              />
              <FormLabel htmlFor="post-type">Cerita</FormLabel>
            </div>
            
            {postType === 'note' ? (
              <>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan Anda</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Bagikan pemikiran Anda dengan dunia..."
                          className="min-h-[150px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSuggestTags}
                    disabled={isSuggesting || !contentValue}
                  >
                    {isSuggesting ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    Sarankan Tag
                  </Button>
                  {(isSuggesting || suggestedTags.length > 0 || selectedTags.length > 0) &&
                    <div className="space-y-2 p-3 rounded-md border bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Tag</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge key={tag} className="flex items-center gap-1 pr-1 cursor-pointer" onClick={() => toggleTag(tag)}>
                            {tag}
                            <X className="h-3 w-3"/>
                          </Badge>
                        ))}
                         {suggestedTags.filter(t => !selectedTags.includes(t)).map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => toggleTag(tag)}>
                            {tag}
                          </Badge>
                        ))}
                        {isSuggesting && <Badge variant="outline">Mencari...</Badge>}
                      </div>
                    </div>
                  }
                </div>
              </>
            ) : (
                <FormItem>
                    <FormLabel>Media Cerita</FormLabel>
                     <FormControl>
                        <div className="flex flex-col items-center justify-center w-full">
                           {!mediaPreview ? (
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Klik untuk mengunggah</span> atau seret dan lepas</p>
                                        <p className="text-xs text-muted-foreground">Gambar atau Video (Maks 25 detik)</p>
                                    </div>
                                    <input ref={fileInputRef} id="dropzone-file" type="file" className="hidden" accept="image/*,video/mp4,video/quicktime" onChange={handleFileChange} />
                                </label>
                            ) : (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                    {mediaFile?.type.startsWith('image/') ? (
                                        <img src={mediaPreview} alt="Pratinjau media" className="object-cover w-full h-full" />
                                    ) : (
                                        <video src={mediaPreview} controls autoPlay muted loop className="object-cover w-full h-full" />
                                    )}
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={resetMedia}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </FormControl>
                    {mediaError && (
                        <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{mediaError}</AlertDescription>
                        </Alert>
                    )}
                    <FormMessage />
                </FormItem>
            )}

            <Button type="submit" disabled={isLoading || (postType === 'story' && !!mediaError)} className="w-full">
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              {postType === 'note' ? 'Posting Catatan' : 'Posting Cerita'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
