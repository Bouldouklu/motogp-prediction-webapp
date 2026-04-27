import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScoringPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Scoring System</h1>
                    <p className="text-lg text-muted-foreground">
                        How points are calculated for the MotoGP Prediction League
                    </p>
                </div>

                {/* Championship Scoring */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🏆 Championship Predictions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            These predictions are made at the start of the season and are locked in.
                            They act as a massive "season anchor", worth heavily enough to counterbalance individual race swings.
                        </p>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Prediction</th>
                                        <th className="px-4 py-3 font-medium text-right text-green-500">✓ Correct</th>
                                        <th className="px-4 py-3 font-medium text-center text-yellow-500">Off by 1</th>
                                        <th className="px-4 py-3 font-medium text-center text-orange-500">Off by 2</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <th className="px-4 py-2 font-medium bg-muted/30 text-left" colSpan={4}>Correct prediction</th>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥇 1st Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-500">130 pts</td>
                                        <td className="px-4 py-3 text-center font-medium text-yellow-500">104 pts</td>
                                        <td className="px-4 py-3 text-center font-medium text-orange-500">78 pts</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥈 2nd Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-500">120 pts</td>
                                        <td className="px-4 py-3 text-center font-medium text-yellow-500">96 pts</td>
                                        <td className="px-4 py-3 text-center font-medium text-orange-500">72 pts</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥉 3rd Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-500">100 pts</td>
                                        <td className="px-4 py-3 text-center font-medium text-yellow-500">80 pts</td>
                                        <td className="px-4 py-3 text-center font-medium text-orange-500">60 pts</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-muted p-4 rounded-lg text-center">
                            <div className="text-sm font-medium mb-1">Maximum Championship Score</div>
                            <div className="text-3xl font-bold tracking-tight text-green-500">350 pts</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                130 + 120 + 100 — perfect prediction of top 3
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Race Weekend Scoring */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            🏍️ Race Weekend Scoring
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-muted-foreground">
                            For every race weekend, you predict the <strong>Top 3</strong> for the Sprint, the Main Race, and the "Glorious 7" mini-league. Points depend on which slot you predicted — winning predictions pay more.
                        </p>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Predicted slot</th>
                                        <th className="px-4 py-3 font-medium text-center text-green-500">🎯 Exact</th>
                                        <th className="px-4 py-3 font-medium text-center text-yellow-500">Off by 1</th>
                                        <th className="px-4 py-3 font-medium text-center text-orange-500">Off by 2</th>
                                        <th className="px-4 py-3 font-medium text-center text-muted-foreground">Off by 3+</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥇 1st Place</td>
                                        <td className="px-4 py-3 text-center font-bold text-green-500">20</td>
                                        <td className="px-4 py-3 text-center font-medium text-yellow-500">16</td>
                                        <td className="px-4 py-3 text-center font-medium text-orange-500">12</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">0</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥈 2nd Place</td>
                                        <td className="px-4 py-3 text-center font-bold text-green-500">16</td>
                                        <td className="px-4 py-3 text-center font-medium text-yellow-500">12</td>
                                        <td className="px-4 py-3 text-center font-medium text-orange-500">8</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">0</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥉 3rd Place</td>
                                        <td className="px-4 py-3 text-center font-bold text-green-500">14</td>
                                        <td className="px-4 py-3 text-center font-medium text-yellow-500">10</td>
                                        <td className="px-4 py-3 text-center font-medium text-orange-500">6</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">0</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Only the top 5 finishers are considered — if your pick finishes outside P5, it scores 0. Same table applies to Sprint, Race, and Glorious 7.
                        </p>

                        <div className="bg-muted p-4 rounded-lg mt-4 text-center">
                            <div className="text-sm font-medium mb-1">Maximum Weekend Score</div>
                            <div className="text-3xl font-bold tracking-tight text-primary">150 pts</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                50 Sprint + 50 Race + 50 Glorious 7
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Penalties */}
                <Card className="border-red-200 dark:border-red-900/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            🚫 Late Penalties
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-3 text-center text-sm">
                            <div className="p-3 bg-green-950/30 border border-green-800/50 rounded-lg">
                                <div className="text-green-400 font-bold uppercase tracking-wider text-xs mb-1">✓ On Time</div>
                                <div className="text-green-300 font-semibold">No penalty</div>
                                <div className="text-xs text-muted-foreground mt-1">Before FP1 starts</div>
                            </div>
                            <div className="p-3 bg-amber-950/30 border border-amber-700/50 rounded-lg">
                                <div className="text-amber-400 font-bold uppercase tracking-wider text-xs mb-1">⚠ Late</div>
                                <div className="text-amber-300 font-semibold">Penalty applies</div>
                                <div className="text-xs text-muted-foreground mt-1">During FP1 (45 min window)</div>
                            </div>
                            <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
                                <div className="text-red-400 font-bold uppercase tracking-wider text-xs mb-1">🔒 Locked</div>
                                <div className="text-red-300 font-semibold">No submission</div>
                                <div className="text-xs text-muted-foreground mt-1">After FP1 ends</div>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-muted-foreground mb-3 text-center">Penalties are cumulative across the season:</p>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg">
                                    <div className="text-sm font-bold text-red-300 mb-1">1st Offense</div>
                                    <div className="text-xl font-bold text-red-500">-25 pts</div>
                                </div>
                                <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg">
                                    <div className="text-sm font-bold text-red-300 mb-1">2nd Offense</div>
                                    <div className="text-xl font-bold text-red-500">-45 pts</div>
                                </div>
                                <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-lg">
                                    <div className="text-sm font-bold text-red-300 mb-1">3rd+ Offense</div>
                                    <div className="text-xl font-bold text-red-500">-60 pts</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-center pt-4">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-10 px-8 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
