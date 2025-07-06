"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Crown, Medal, Star } from 'lucide-react';

interface LeaderboardUser {
    id: string;
    address: string;
    highestScore: number;
    username?: string;
}

const LeaderboardPage = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const usersRef = collection(db, 'users');
                const q = query(
                    usersRef,
                    orderBy('highestScore', 'desc'),
                    limit(100) // Limit to top 100 users
                );

                const querySnapshot = await getDocs(q);
                const leaderboardData: LeaderboardUser[] = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    leaderboardData.push({
                        id: doc.id,
                        address: data.address || doc.id,
                        highestScore: data.highestScore || 0,
                        username: data.username,
                    });
                });

                setUsers(leaderboardData);
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                setError('Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankIcon = (position: number) => {
        switch (position) {
            case 1:
                return <Crown className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Trophy className="w-6 h-6 text-amber-600" />;
            default:
                return <Star className="w-6 h-6 text-blue-500" />;
        }
    };

    const getRankBadgeColor = (position: number) => {
        switch (position) {
            case 1:
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 2:
                return 'bg-gray-500 hover:bg-gray-600';
            case 3:
                return 'bg-amber-600 hover:bg-amber-700';
            default:
                return 'bg-blue-600 hover:bg-blue-700';
        }
    };

    const truncateAddress = (address: string) => {
        if (address.length <= 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <Skeleton className="h-12 w-64 mx-auto mb-4 bg-gray-800" />
                        <Skeleton className="h-6 w-96 mx-auto bg-gray-800" />
                    </div>

                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <Card key={i} className="bg-gray-800 border-gray-700">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Skeleton className="w-12 h-12 rounded-full bg-gray-700" />
                                            <div>
                                                <Skeleton className="h-5 w-32 mb-2 bg-gray-700" />
                                                <Skeleton className="h-4 w-24 bg-gray-700" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-8 w-20 bg-gray-700" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
                <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
                        <p className="text-gray-300">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
                        <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
                        <Trophy className="w-8 h-8 text-yellow-500 ml-3" />
                    </div>
                    <p className="text-gray-400 text-lg">
                        Top players ranked by highest score
                    </p>
                </div>

                {/* Leaderboard */}
                <div className="space-y-4">
                    {users.length === 0 ? (
                        <Card className="bg-gray-800 border-gray-700">
                            <CardContent className="p-8 text-center">
                                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                <h2 className="text-2xl font-bold text-white mb-2">No Players Yet</h2>
                                <p className="text-gray-400">Be the first to set a high score!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        users.map((user, index) => {
                            const position = index + 1;
                            return (
                                <Card
                                    key={user.id}
                                    className={`bg-gray-800 border-gray-700 transition-all duration-200 hover:bg-gray-750 ${position <= 3 ? 'ring-2 ring-opacity-50' : ''
                                        } ${position === 1 ? 'ring-yellow-500' :
                                            position === 2 ? 'ring-gray-400' :
                                                position === 3 ? 'ring-amber-600' : ''
                                        }`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                {/* Rank */}
                                                <div className="flex items-center space-x-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${getRankBadgeColor(position)} text-white font-bold px-3 py-1`}
                                                    >
                                                        #{position}
                                                    </Badge>
                                                    {getRankIcon(position)}
                                                </div>

                                                {/* User Info */}
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-white text-lg">
                                                            {user.username || 'Anonymous Player'}
                                                        </h3>
                                                        {position <= 3 && (
                                                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                                                {position === 1 ? 'Champion' : position === 2 ? 'Runner-up' : 'Bronze'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-400 text-sm font-mono">
                                                        {truncateAddress(user.address)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Score */}
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-white">
                                                    {user.highestScore.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    points
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-gray-500">
                    <p>Showing top {users.length} players</p>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;