import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { AxisDomain } from 'recharts/types/util/types'

export const BasicLine = ({
  data,
  measurement,
  unit,
  datakey,
  domain
}: {
  data
  measurement: string
  datakey: string
  unit: string
  domain?: AxisDomain
}) => {
  console.log(data, datakey)
  return (
    <>
      <h3>
        {measurement}({unit})
      </h3>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data}>
          <Line type="linear" dataKey={datakey} stroke="#448ef7" />
          <CartesianGrid stroke="#ccc" />
          <Tooltip labelFormatter={(value) => new Date(value).toLocaleString()} />
          <Legend />
          <XAxis dataKey="ts" tickFormatter={(ts) => new Date(ts).toLocaleString()} />
          <YAxis domain={domain} />
        </LineChart>
      </ResponsiveContainer>
    </>
  )
}
