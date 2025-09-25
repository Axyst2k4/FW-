import dynamic from 'next/dynamic'
const Gauge = dynamic(() => import('@ant-design/charts').then(({ Gauge }) => Gauge), { ssr: false })

export const SimpleGauge = ({
  name,
  target,
  total,
  thresholds
}: {
  target: number
  total: number
  thresholds: number[]
  name: string
}) => {
  const config: any = {
    height: 200,
    data: {
      target,
      total,
      name,
      thresholds
    },
    legend: false,
    scale: {
      color: {
        range: ['#F4664A', '#FAAD14', 'green']
      }
    },
    style: {
      textContent: (target, total) => `${name}: ${target}`,
      color: 'black'
    }
  }
  return <Gauge {...config} />
}
