'use client';

import { useState } from 'react';
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
import { Bot, Loader, Tag, X } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';

const formSchema = z.object({
  content: z
    .string()
    .min(3, { message: 'Your note must be at least 3 characters long.' })
    .max(500, { message: 'Your note cannot be longer than 500 characters.' }),
});

export default function PostEditor() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  const { getValues } = form;

  const handleSuggestTags = async () => {
    const content = getValues('content');
    if (!content || content.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Content too short',
        description: 'Please write at least 10 characters to get tag suggestions.',
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
        description: 'Failed to suggest tags. Please try again.',
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not logged in',
        description: 'You must be logged in to post a note.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Fetch the user's profile to get their handle and avatar
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        throw new Error("User profile not found.");
      }
      const userProfile = userDocSnap.data();

      // Create a new post document
      await addDoc(collection(db, "posts"), {
        author: {
          id: user.uid,
          name: userProfile.name,
          handle: userProfile.handle,
          avatarUrl: userProfile.avatarUrl,
        },
        content: values.content,
        tags: selectedTags,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Note Posted!',
        description: 'Your new note is now live for others to see.',
      });
      form.reset();
      setSelectedTags([]);
      setSuggestedTags([]);
      router.push('/');

    } catch (error: any) {
       toast({
        variant: 'destructive',
        title: 'Error posting note',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Note</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts with the world..."
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
                disabled={isSuggesting}
              >
                {isSuggesting ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="mr-2 h-4 w-4" />
                )}
                Suggest Tags
              </Button>

              { (isSuggesting || suggestedTags.length > 0 || selectedTags.length > 0) &&
                <div className="space-y-2 p-3 rounded-md border bg-muted/50">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="h-4 w-4" />
                    <span>Tags</span>
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
                    {isSuggesting && <Badge variant="outline">Searching...</Badge>}
                  </div>
                </div>
              }
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Post Note
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
