
'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, startAt, endAt, orderBy } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { BadgeCheck, Search, Users } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import Image from 'next/image';

function UserRow({ user, onDialogClose }: { user: User, onDialogClose: () => void }) {
    const { user: authUser } = useAuth();
    const profileLink = authUser && authUser.uid === user.id ? '/profile' : `/user?id=${user.id}`;
    
    return (
        <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-lg">
            <Link href={profileLink} className="flex items-center gap-4 w-full" onClick={onDialogClose}>
                <Avatar>
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <div className="flex items-center gap-1">
                        <p className="font-semibold">{user.name}</p>
                        {user.isVerified && <BadgeCheck className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.handle}</p>
                </div>
            </Link>
        </div>
    )
}

function UserRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
            </div>
        </div>
    )
}


export default function SearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [userCount, setUserCount] = useState<number | null>(null);

    const { user: authUser } = useAuth();
    const superUserId = "GFQXQNBxx6QcYRjWPMFeT3CuBai1";
    const isSuperUser = authUser?.uid === superUserId;

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (isSuperUser) {
            const fetchUserCount = async () => {
                const usersCollection = collection(db, 'users');
                const snapshot = await getDocs(usersCollection);
                setUserCount(snapshot.size);
            };
            fetchUserCount();
        }
    }, [isSuperUser]);

    const performSearch = useCallback(async (searchHandle: string) => {
        if (searchHandle.trim().length < 2) {
            setResults([]);
            setIsLoading(false);
            setHasSearched(true);
            return;
        }
        setIsLoading(true);
        setHasSearched(true);

        try {
            const usersCollection = collection(db, 'users');
            const q = query(
                usersCollection, 
                orderBy('handle'),
                startAt(searchHandle.toLowerCase()),
                endAt(searchHandle.toLowerCase() + '\uf8ff'),
                limit(15)
            );
            const querySnapshot = await getDocs(q);
            const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            setResults(usersData);
        } catch (error) {
            console.error("Error searching users: ", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        performSearch(debouncedSearchTerm);
    }, [debouncedSearchTerm, performSearch]);

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Cari pengguna dengan username..."
                        className="w-full pl-10 text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {isSuperUser && userCount !== null && (
                    <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-2 rounded-md">
                        <Users className="h-5 w-5" />
                        <span className="font-semibold text-sm">{userCount}</span>
                    </div>
                )}
            </div>

            <div>
                {isLoading ? (
                    <div className="space-y-2">
                        <UserRowSkeleton />
                        <UserRowSkeleton />
                        <UserRowSkeleton />
                    </div>
                ) : hasSearched && results.length > 0 ? (
                    <div className="space-y-1">
                        {results.map(user => (
                            <UserRow key={user.id} user={user} onDialogClose={() => {}} />
                        ))}
                    </div>
                ) : hasSearched && results.length === 0 && debouncedSearchTerm.length > 0 ? (
                     <div className="text-center py-10">
                        <p className="text-muted-foreground">Tidak ada pengguna ditemukan untuk "@{debouncedSearchTerm}"</p>
                    </div>
                ) : (
                    <div className="flex justify-center items-center py-10">
                        <Image 
                            src="/images/search.png" 
                            alt="Cari pengguna" 
                            width={256} 
                            height={256}
                            className="opacity-70"
                            unoptimized
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
