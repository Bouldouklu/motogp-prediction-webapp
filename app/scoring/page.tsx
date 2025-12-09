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
                                        <th className="px-4 py-3 font-medium text-right">Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    <tr>
                                        <td className="px-4 py-3">Correct 1st Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-600">250 pts</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3">Correct 2nd Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">100 pts</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3">Correct 3rd Place</td>
                                        <td className="px-4 py-3 text-right font-bold text-blue-600">100 pts</td>
                                    </tr>
                                    <tr className="bg-muted/20">
                                        <td className="px-4 py-3 font-medium">Total Maximum</td>
                                        <td className="px-4 py-3 text-right font-bold">450 pts</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            (Equivalent to 2 perfect race weekends)
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
                            For every race weekend, you predict the <strong>Top 3</strong> for the Sprint, the Main Race, and the "Glorious 7" mini-league.
                        </p>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold mb-3">Points Per Rider</h3>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Accuracy</th>
                                                <th className="px-4 py-2 font-medium text-right">Points</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            <tr className="bg-green-50/50 dark:bg-green-900/10">
                                                <td className="px-4 py-2 flex items-center gap-2">
                                                    <span className="text-green-600 font-bold">🎯 Exact</span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-bold text-green-600">25</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2">Off by 1 position</td>
                                                <td className="px-4 py-2 text-right font-medium">18</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2">Off by 2 positions</td>
                                                <td className="px-4 py-2 text-right font-medium">15</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2">Off by 3 positions</td>
                                                <td className="px-4 py-2 text-right text-muted-foreground">10</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2">Off by 4 positions</td>
                                                <td className="px-4 py-2 text-right text-muted-foreground">6</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-2">Off by 5 positions</td>
                                                <td className="px-4 py-2 text-right text-muted-foreground">2</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-3">Example Scenarios</h3>
                                <ul className="space-y-4 text-sm text-muted-foreground">
                                    <li className="bg-muted/30 p-3 rounded-md">
                                        <div className="font-medium text-foreground mb-1">Perfect Prediction</div>
                                        You predict Pecco for 1st, he finishes 1st.
                                        <div className="text-green-600 font-bold mt-1">25 Points</div>
                                    </li>
                                    <li className="bg-muted/30 p-3 rounded-md">
                                        <div className="font-medium text-foreground mb-1">Right Rider, Wrong Order</div>
                                        You predict Pecco for 1st, he finishes 2nd.
                                        <div className="mt-1">Off by 1 = <span className="font-bold text-foreground">18 Points</span></div>
                                    </li>
                                    <li className="bg-muted/30 p-3 rounded-md">
                                        <div className="font-medium text-foreground mb-1">Still on Podium</div>
                                        You predict Pecco for 1st, he finishes 3rd.
                                        <div className="mt-1">Off by 2 = <span className="font-bold text-foreground">15 Points</span></div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg mt-4 text-center">
                            <div className="text-sm font-medium mb-1">Maximum Weekend Score</div>
                            <div className="text-3xl font-bold tracking-tight text-primary">225 pts</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                75 Sprint + 75 Race + 75 Glorious 7
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
                                <div className="text-xl font-bold text-red-600">-10 pts</div>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <div className="text-sm font-medium mb-1">2nd Offense</div>
                                <div className="text-xl font-bold text-red-600">-25 pts</div>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <div className="text-sm font-medium mb-1">3rd+ Offense</div>
                                <div className="text-xl font-bold text-red-600">-50 pts</div>
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
