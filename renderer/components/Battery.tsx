import { Liquid } from '@ant-design/plots'

export const BatteryVisual = ({ battery }: { battery: number }) => {
  const config = {
    width: 100,
    percent: battery / 100,
    outline: {
      border: 4,
      distance: 8
    },
    wave: {
      length: 20
    },
    style: {
      color: 'black',
      width: '200px'
    }
  }
  return <Liquid {...config} />
}
