'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
  race: string;
  [key: string]: string | number;
}

interface Props {
  data: ChartDataPoint[];
  players: { id: string; name: string; color: string }[];
}

export default function LeaderboardTrendChart({ data, players }: Props) {
  return (
    <div className="h-[400px] w-full bg-track-gray/50 rounded-xl border border-gray-800 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="race" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
            itemStyle={{ color: '#F3F4F6' }}
          />
          <Legend />
          {players.map((player) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.name}
              stroke={player.color}
              strokeWidth={3}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
