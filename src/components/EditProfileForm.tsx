
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

const formSchema = z.object({
  name: z.string()
    .min(2, { message: 'Nama harus terdiri dari minimal 2 karakter.' })
    .max(15, { message: 'Nama tidak boleh lebih dari 15 karakter.' })
    .regex(/^[a-zA-Z0-9\s]+$/, 'Nama hanya boleh berisi huruf, angka, dan spasi.'),
  handle: z.string()
    .min(3, { message: 'Username harus terdiri dari minimal 3 karakter.' })
    .max(10, { message: 'Username tidak boleh lebih dari 10 karakter.'})
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh berisi huruf, angka, dan garis bawah.'),
  bio: z.string()
    .max(50, { message: 'Bio tidak boleh lebih dari 50 karakter.' })
    .refine(value => (value.match(/\n/g) || []).length <= 4, {
      message: 'Bio tidak boleh memiliki lebih dari 4 baris baru.',
    })
    .optional(),
});

interface EditProfileFormProps {
  currentUser: User;
  onProfileUpdate: (updatedData: Partial<User>) => void;
}

export default function EditProfileForm({ currentUser, onProfileUpdate }: EditProfileFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser.name || '',
      handle: currentUser.handle || '',
      bio: currentUser.bio || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      
      const updatedData = {
        name: values.name,
        handle: values.handle,
        bio: values.bio || '',
      };

      await updateDoc(userDocRef, updatedData);

      toast({
        title: 'Profil Diperbarui',
        description: "Informasi profil Anda telah disimpan.",
      });

      // Call the callback to update the parent component's state
      onProfileUpdate(updatedData);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Pembaruan Gagal',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input placeholder="Nama lengkap Anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username_anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ceritakan sedikit tentang diri Anda"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Perubahan
        </Button>
      </form>
    </Form>
  );
}
