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
                                        <th className="px-4 py-3 font-medium text-right">Correct</th>
                                        <th className="px-4 py-3 font-medium text-center">Off by 1</th>
                                        <th className="px-4 py-3 font-medium text-center">Off by 2</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <th className="px-4 py-2 font-medium bg-muted/30 text-left" colSpan={4}>Correct prediction</th>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥇 1st Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">130 pts</td>
                                        <td className="px-4 py-3 text-center font-medium">104 pts</td>
                                        <td className="px-4 py-3 text-center font-medium">78 pts</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥈 2nd Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">120 pts</td>
                                        <td className="px-4 py-3 text-center font-medium">96 pts</td>
                                        <td className="px-4 py-3 text-center font-medium">72 pts</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥉 3rd Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">100 pts</td>
                                        <td className="px-4 py-3 text-center font-medium">80 pts</td>
                                        <td className="px-4 py-3 text-center font-medium">60 pts</td>
                                    </tr>
                                    <tr className="bg-muted/20">
                                        <td className="px-4 py-3 font-medium">Total Maximum</td>
                                        <td className="px-4 py-3 text-right font-bold" colSpan={3}>350 pts</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            350 pts total ≈ 2.3 perfect race weekends
                        </p>
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
                                        <th className="px-4 py-3 font-medium text-center">🎯 Exact</th>
                                        <th className="px-4 py-3 font-medium text-center">Off by 1</th>
                                        <th className="px-4 py-3 font-medium text-center">Off by 2</th>
                                        <th className="px-4 py-3 font-medium text-center text-muted-foreground">Off by 3+</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥇 1st Place</td>
                                        <td className="px-4 py-3 text-center font-bold text-green-600">20</td>
                                        <td className="px-4 py-3 text-center font-medium">16</td>
                                        <td className="px-4 py-3 text-center font-medium">12</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">0</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥈 2nd Place</td>
                                        <td className="px-4 py-3 text-center font-bold text-green-600">16</td>
                                        <td className="px-4 py-3 text-center font-medium">12</td>
                                        <td className="px-4 py-3 text-center font-medium">8</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">0</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-semibold">🥉 3rd Place</td>
                                        <td className="px-4 py-3 text-center font-bold text-green-600">14</td>
                                        <td className="px-4 py-3 text-center font-medium">10</td>
                                        <td className="px-4 py-3 text-center font-medium">6</td>
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
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Predictions must be submitted before FP1 starts. Late submissions are still accepted but incur penalties.
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <div className="text-sm font-medium mb-1">1st Offense</div>
                                <div className="text-xl font-bold text-red-600">-35 pts</div>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <div className="text-sm font-medium mb-1">2nd Offense</div>
                                <div className="text-xl font-bold text-red-600">-55 pts</div>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <div className="text-sm font-medium mb-1">3rd+ Offense</div>
                                <div className="text-xl font-bold text-red-600">-75 pts</div>
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
